# 04. Concorrência em Mensageria com Receptores Idempotentes

## Objetivo
Ao final deste capítulo, você será capaz de conceituar idempotência sob as perspectivas matemática e de engenharia de software, explicar a inevitabilidade física da duplicação de mensagens em redes de entrega *at-least-once*, e projetar e implementar Receptores Idempotentes robustos utilizando restrições de banco de dados e tabelas de desduplicação em Kotlin.

---

## Motivação
No capítulo anterior, implementamos o padrão Transactional Outbox. Aprendemos que o trade-off aceito para garantir que nenhuma mensagem seja perdida na rede é a semântica de entrega **At-Least-Once (Pelo menos uma vez)**. Isso significa que, sob falhas físicas de rede ou reinicializações do Message Relay, a entrega de mensagens duplicadas ao consumidor é uma **certeza estatística**.

Considere o nosso `LedgerService`. Se o consumidor receber duas mensagens idênticas contendo `"debit USD 100.00 from conta-01"`, e simplesmente executar a operação duas vezes, o cliente será cobrado duplicadamente (USD 200.00). Para garantir a integridade financeira em ambientes assíncronos, precisamos assegurar que o processamento do evento seja **idempotente**: não importa quantas vezes a mensagem idêntica chegue, o efeito colateral no estado final do sistema deve ocorrer exatamente uma única vez.

---

## Pré-requisitos
* [Módulo 3, Capítulo 03: Atomicidade na Publicação com o Padrão Outbox](./03-outbox-pattern.md).

---

## Conceitos Fundamentais

### 1. Definição de Idempotência
Na matemática, uma operação $f$ é considerada idempotente se, quando aplicada múltiplas vezes, produz o mesmo resultado que produziria se aplicada apenas uma vez:
$$f(f(x)) = f(x)$$

Na engenharia de software distribuído, um receptor é considerado idempotente se ele consegue processar com segurança a mesma requisição/mensagem repetidas vezes sem alterar o estado do sistema além da primeira execução bem-sucedida, e sem gerar efeitos colaterais adicionais (como enviar múltiplos e-mails ou cobrar o cliente novamente).

---

### 2. A Inevitabilidade da Duplicação (O Problema dos Dois Generais)
Por que não podemos criar uma rede física perfeita que nunca duplique dados?
A computação distribuída prova isso através do **Problema dos Dois Generais**: dois exércitos precisam sincronizar um ataque à mesma hora através de um vale inimigo enviando mensageiros a pé. Se o General A envia um mensageiro confirmando o ataque, ele nunca saberá se o mensageiro foi capturado ou chegou ao destino, a menos que receba uma confirmação de volta. 

Mas se o General B enviar a confirmação de volta, o General B ficará com a mesma dúvida: "Será que minha confirmação chegou ao General A, ou meu mensageiro caiu no vale?". Para que o ataque seja seguro, eles entrariam em uma cadeia infinita de confirmações mútuas que nunca termina.

* **Conclusão Física**: Em canais de rede sujeitos a falhas e perdas de comunicação (como a Internet), **é impossível garantir simultaneamente a entrega de mensagens e a ausência absoluta de duplicações**. A desduplicação deve ser tratada ativamente na camada da aplicação consumidora.

---

### 3. Padrões de Desduplicação de Mensagens

#### 3.1. Restrição de Chave Única no Banco de Dados (Unique Constraint)
* **Mecanismo**: A aplicação define um ID de transação/mensagem único e o mapeia para uma coluna no banco de dados local com uma restrição de índice único (`UNIQUE INDEX`). 
* **Processamento**: Ao tentar salvar a transação, se o banco relacional local detectar que aquele ID já existe na tabela, ele rejeita a escrita lançando uma violação de chave única. A aplicação captura essa exceção e simplesmente descarta o evento duplicado com segurança.

#### 3.2. Tabela de Estado de Desduplicação (Deduplication State Table)
* **Mecanismo**: Cria-se uma tabela de controle auxiliar (ex: `processed_messages`) no banco de dados do consumidor.
* **Passos Transacionais (Atomic Check-and-Insert)**:
  1. O consumidor inicia a transação de banco de dados local.
  2. Tenta inserir o ID da mensagem na tabela `processed_messages`.
  3. Se a inserção falhar (duplicidade), faz o rollback e ignora.
  4. Se a inserção tiver sucesso, processa as regras de negócio de saldo, atualiza a tabela principal de negócios e comita a transação local.

#### 3.3. Controle de Concorrência Otimista (OCC - Optimistic Concurrency Control)
* **Mecanismo**: Mapeia-se um número de versão incremental no registro de dados (ex: `version`). O consumidor apenas executa a escrita se a versão atual no banco bater com a versão esperada contida na mensagem, incrementando o número de versão a cada gravação bem-sucedida.

---

## Funcionamento Interno
O maior erro no design de desduplicação é o padrão **TOCTOU (Time-of-Check to Time-of-Use)**, que gera falhas sob concorrência.
Se o consumidor fizer uma validação lógica simples em nível de aplicação (ex: `SELECT` na tabela para ver se o registro existe, e se não existir, faz o `INSERT`), duas threads rodando em paralelo processando a mesma mensagem duplicada lerão o `SELECT` simultaneamente, ambas acharão que o registro não existe e ambas farão a inserção concorrente, resultando em duplicidade física. 

A verificação e a inserção **devem acontecer em uma única transação atômica no banco de dados**.

---

## Exemplos

### Antipadrão: Verificação de Idempotência Frágil em Kotlin
O código abaixo sofre de concorrência TOCTOU: se a rede duplicar o evento rapidamente, as threads executarão em paralelo e o cliente sofrerá débito duplo.

```kotlin
// ARQUIVO: FragileConsumer.kt
package com.distribuidos.idempotency

import java.util.concurrent.ConcurrentHashMap

class FragileConsumer {
    private val processedIds = ConcurrentHashMap<String, Boolean>()
    private val accountsBalance = ConcurrentHashMap<String, Double>().apply { put("conta-01", 1000.0) }

    fun onMessage(messageId: String, accountId: String, amount: Double) {
        // TOCTOU: Verificação lógica fora do escopo de trava atômica do banco de dados
        if (!processedIds.containsKey(messageId)) {
            
            // Perigo: Se outra thread processando a mesma mensagem duplicada chegar aqui concorrentemente,
            // ela lerá que a chave ainda não está mapeada e executará o bloco abaixo também.
            
            val current = accountsBalance[accountId] ?: 0.0
            accountsBalance[accountId] = current - amount
            
            processedIds[messageId] = true
            println("[FRAGILE] Débito efetuado. Saldo atual: ${accountsBalance[accountId]}")
        }
    }
}
```

### Abordagem Correta: Receptor Idempotente com Unique Constraint no Banco de Dados
Abaixo, a desduplicação é garantida no nível físico do banco usando transações ACID e tratamento de restrição única.

```kotlin
// ARQUIVO: IdempotentConsumer.kt
package com.distribuidos.idempotency

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class TransactionRecord(
    val transactionId: UUID,
    val accountId: String,
    val amount: Double
)

@Component
class IdempotentConsumer(
    private val processedEventsRepo: FakeProcessedEventsRepository,
    private val accountRepository: FakeAccountRepository
) {

    // A transação ACID local garante que a escrita de controle e a regra de negócio sejam indissociáveis
    @Transactional
    fun processPaymentMessage(messageId: String, record: TransactionRecord) {
        try {
            // 1. Tenta inserir na tabela de controle de desduplicação (UNIQUE CONSTRAINT ativa na coluna message_id)
            processedEventsRepo.insertMessageControl(messageId)
            
            // Se chegou aqui, a mensagem é inédita na transação local.
            // 2. Executa a gravação da regra de negócio
            accountRepository.debit(record.accountId, record.amount)
            
            println("[CONSUMER] Transação processada e comitada com sucesso: ${record.transactionId}")
            
        } catch (e: DataIntegrityViolationException) {
            // Captura a violação de chave única lançada pelo banco de dados relacional
            println("[CONSUMER] Mensagem duplicada detectada no banco de dados: $messageId. Descartando silenciosamente.")
            // O Spring Boot executa o rollback automático da transação, mantendo a consistência física
        }
    }
}
```

---

## Casos de Uso
* **Gateways de Pagamento (Stripe/Adyen)**: Exigem um cabeçalho especial de chave de idempotência (`Idempotency-Key`) em todas as chamadas HTTP POST de criação de cobranças. Se a conexão cair antes da resposta, a app do cliente reenvia o cabeçalho idêntico; a API da Stripe reconhece a chave, não cobra novamente o cartão e retorna a resposta que havia sido cacheada na primeira execução bem-sucedida.
* **Nubank**: A reconciliação diária de faturamento roda pipelines idempotentes sobre o Kafka.

---

## Quando Utilizar
* Absolutamente obrigatório em qualquer consumidor assíncrono que realize operações que alterem estados lógicos cruciais de persistência (debitar saldos, enviar cobranças, disparar e-mails ao usuário).

---

## Quando Não Utilizar
* Operações naturalmente idempotentes e seguras de gravação que apenas definem estados fixos (ex: mensagens do tipo `SET_STATUS = 'ACTIVE'`). Rodar esse update uma ou dez vezes resulta no mesmo estado final sem efeitos colaterais indesejáveis.

---

## Vantagens
* **Integridade dos Dados**: Elimina erros de contabilidade causados por oscilações e duplicações físicas da infraestrutura de rede.
* **Segurança de Execução**: Permite que os produtores usem semânticas resilientes agressivas (acks = all com retries elevados) sem medo de duplicidade de negócios.

---

## Desvantagens
* **Custo de Escrita Extra**: Exige uma inserção adicional de controle a cada gravação de negócio.
* **Gerenciamento de Espaço**: A tabela de controle de desduplicação cresce infinitamente se não for configurada uma política de expiração periódica de chaves antigas (ex: limpar registros com mais de 30 dias).

---

## Comparações

### Desduplicação por DB Constraint vs. Deduplication State Table

| Dimensão | Restrição DB Direta | Tabela de Desduplicação Separada |
|---|---|---|
| **Complexidade** | Mínima (índice único na tabela principal) | Média (tabela auxiliar criada no banco) |
| **Garantia ACID** | Nativa e automática | Exige escopo de `@Transactional` explícito |
| **Gargalo de Escrita** | Baixo | Adiciona overhead de duas tabelas de gravação |
| **Uso Ideal** | Quando o ID da mensagem mapeia direto | Integrações heterogêneas ou chaves externas |

---

## Erros Comuns
1. **Deduplicar na Memória RAM**: Tentar rastrear IDs de mensagens processadas usando coleções em memória RAM do processo da JVM (como `HashSet` ou `ConcurrentHashMap`). Se o servidor sofrer crash ou reiniciar para atualização de versão, o histórico em memória é apagado, permitindo que mensagens antigas duplicadas sejam reprocessadas indevidamente após a volta do nó.
2. **Utilizar Chaves de Idempotência Fracas**: Gerar a chave de desduplicação baseada no timestamp da mensagem. Relógios de computadores diferentes podem oscilar, gerando chaves idênticas para transações diferentes ou chaves diferentes para a mesma transação. A chave deve ser derivada estritamente da identidade de negócio (UUID gerado no emissor).

---

## Projeto Prático
No projeto **FinTech Ledger**, integramos a tabela de controle de idempotência local em memória (simulando persistência persistente por persistência atômica no Ledger).
Quando o Ledger consome o evento de transferência assíncrono, ele valida a ID da transação usando um Map de controle com trava de exclusão mútua (`ReentrantLock`) para impedir que a mesma transferência seja executada duas vezes.

```kotlin
// ARQUIVO: IdempotentLedgerListener.kt
package com.distribuidos.projeto.idempotency

import com.distribuidos.projeto.TransactionResult
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

class IdempotentLedgerListener(
    private val accountsBalance: ConcurrentHashMap<String, Double>
) {
    private val processedTransactionIds = ConcurrentHashMap<String, Boolean>()
    private val lock = ReentrantLock()

    fun handleTransferEvent(
        messageId: String,
        from: String,
        to: String,
        amount: Double
    ): TransactionResult {
        // Atomic Check-and-Insert simulando a transação atômica do banco
        lock.withLock {
            if (processedTransactionIds.containsKey(messageId)) {
                println("[PROJETO-LEDGER] Evento duplicado detectado: $messageId. Abortando processamento.")
                return TransactionResult.Failed("Mensagem já processada anteriormente.")
            }
            
            // Marca como processada
            processedTransactionIds[messageId] = true
        }

        // Regra de negócio executada após a garantia de desduplicação
        var success = false
        accountsBalance.compute(from) { _, balance ->
            if (balance != null && balance >= amount) {
                accountsBalance.compute(to) { _, target -> (target ?: 0.0) + amount }
                success = true
                balance - amount
            } else {
                balance
            }
        }

        return if (success) {
            TransactionResult.Success(messageId, System.currentTimeMillis())
        } else {
            TransactionResult.Failed("Saldo insuficiente")
        }
    }
}
```

---

## Exercícios

### Básico
1. O que caracteriza uma chamada de API ou método como sendo **idempotente**?
2. Por que a checagem lógica de IDs de mensagens em memória RAM na aplicação do consumidor é ineficaz em sistemas distribuídos de produção?

### Intermediário
3. Imagine que o produtor e o consumidor do seu sistema se comunicam usando o Apache Kafka. Explique o cenário físico exato sob o qual o consumidor receberá uma mensagem duplicada contendo o mesmo offset.

### Avançado
4. Escreva um programa em Kotlin que simule **Múltiplas Threads Concorrentes** processando o mesmo evento duplicado de forma simultânea. Crie uma classe desduplicadora que tente simular o TOCTOU (usando pequenos delays artificiais de thread) e mostre que ela falha. Em seguida, implemente a correção utilizando exclusão mútua atômica (`ReentrantLock` ou blocos de transação simulados) para provar a corretude do sistema sob concorrência intensa.

---

## Perguntas de Entrevista
1. **Como a escolha do nível de isolamento de transação (Transaction Isolation Level) do banco de dados relacional (ex: Read Committed vs. Serializable) impacta o padrão Deduplication State Table sob concorrência intensa de mensagens duplicadas?**
   * *Resposta esperada*: Sob o nível de isolamento padrão da maioria dos bancos (Read Committed), se duas mensagens duplicadas forem recebidas simultaneamente por duas instâncias de consumidores diferentes, ambas tentarão inserir o ID de controle ao mesmo tempo em transações paralelas. A primeira inserção prosseguirá com sucesso; a segunda transação ficará temporariamente bloqueada na escrita aguardando a decisão (commit/rollback) da primeira. Quando a primeira transação comitar, a segunda transação acordará e falhará instantaneamente lançando a violação de chave única (`Unique Constraint Violation`), o que garante a segurança. No entanto, se tentarmos fazer desduplicação lógica complexa baseada em leituras (SELECT) sem UNIQUE CONSTRAINT, o isolamento Read Committed falhará, exigindo índices únicos físicos ou níveis de isolamento mais estritos (como Serializable ou repeatable reads) aliados a travas de leitura explícitas para garantir que transações concorrentes detectem a concorrência indevida.

2. **O gRPC possui suporte nativo para a garantia de processamento "Exactly-Once" (Exatamente Uma Vez) na rede física? Como as grandes empresas resolvem essa garantia na prática?**
   * *Resposta esperada*: Não. O gRPC opera sobre conexões de rede físicas normais e não pode garantir a entrega Exatamente Uma Vez (Exactly-Once) nativamente devido às limitações do Problema dos Dois Generais. Sob falhas de conexão no momento do ACK, o gRPC cliente disparará retries automáticos ou manuais (se configurado), resultando em entregas duplicadas ao servidor. Na prática, as empresas resolvem isso combinando a entrega *at-least-once* (garantida por retransmissões automáticas com acks/confirmações do gRPC) com a **desduplicação de mensagens no receptor** (Receptores Idempotentes). O exactly-once é uma propriedade lógica de negócio garantida pelo consumidor na camada de persistência local, e não uma propriedade física da rede de trânsito de dados.

---

## Resumo
* Duplicações de mensagens são inevitáveis na computação distribuída devido às falhas físicas dos canais de comunicação (Problema dos Dois Generais).
* Receptores Idempotentes garantem que o processamento do mesmo evento repetidas vezes produza exatamente o mesmo efeito colateral lógico inicial.
* A desduplicação correta exige transações atômicas locais integradas a restrições físicas no banco de dados (`Unique Constraints` ou `Deduplication State Tables`), evitando vulnerabilidades de TOCTOU sob concorrência.

---

## Próximo Módulo
No **Módulo 4: Replicação de Dados e Consistência**, avançaremos para o estudo do armazenamento distribuído. Discutiremos os limites físicos impostos pelo Teorema CAP e PACELC, estudaremos a Replicação Baseada em Líder e analisaremos as anomalias práticas de consistência eventual encontradas em sistemas reais da indústria.

---

## Referências
* **Designing Data-Intensive Applications**, Martin Kleppmann. Capítulo 11: *Stream Processing* (Seção sobre *Idempotence*).
* **Enterprise Integration Patterns**, Gregor Hohpe. Capítulo 5: *Integration Patterns: Idempotent Receiver*.
* **Stripe API Documentation**: [Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
