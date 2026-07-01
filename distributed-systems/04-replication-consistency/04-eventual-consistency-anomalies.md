# 04. Consistência Eventual e Anomalias de Replicação

## Objetivo
Ao final deste capítulo, você será capaz de conceituar as garantias e limitações do modelo de Consistência Eventual, identificar e descrever detalhadamente três anomalias clássicas de replicação (*Read-After-Write*, *Monotonic Reads* e *Consistent Prefix Reads*), e projetar soluções arquiteturais na camada de aplicação para mitigar essas anomalias.

---

## Motivação
Nos capítulos anteriores, aprendemos que sob a lei física do Teorema PACELC, para obter baixa latência de escrita em sistemas estáveis, somos forçados a adotar a **Replicação Assíncrona**. Isso nos leva inevitavelmente ao modelo de **Consistência Eventual**: os dados serão eventualmente replicados em todos os nós, mas durante o período de trânsito físico dos logs, réplicas diferentes expõem saldos diferentes.

Se você assumir que "eventual" significa apenas alguns milissegundos e não proteger sua aplicação, seus usuários vivenciarão experiências bizarras:
* Um usuário faz um Pix e recarrega a página, mas seu saldo continua idêntico (Read-After-Write violado).
* Um usuário consulta seu saldo e vê USD 500.00; ele recarrega a página e o saldo cai para USD 300.00; ele recarrega novamente e o saldo volta para USD 500.00 (Monotonic Reads violado).
* Perguntas e respostas em um fórum aparecem invertidas, onde a resposta surge antes da pergunta ter sido comitada (Consistent Prefix violado).

Proteger o usuário dessas anomalias sem sacrificar a escalabilidade é o desafio de design que estudaremos neste capítulo.

---

## Pré-requisitos
* [Módulo 4, Capítulo 02: Replicação Baseada em Líder (Leader-Follower)](./02-leader-follower-replication.md).

---

## Conceitos Fundamentais

### 1. O que é Consistência Eventual?
A Consistência Eventual é o modelo mais fraco de consistência de dados. Ela garante apenas que, caso nenhuma nova atualização de escrita seja realizada, todas as réplicas eventualmente convergirão para o mesmo valor idêntico. 

* **Replication Lag (Atraso de Replicação)**: O tempo físico necessário para propagar o log de alteração. Sob condições normais, é de milissegundos. Mas sob sobrecarga de CPU de uma réplica ou engarrafamento de roteadores, o atraso pode subir para minutos ou horas, tornando as anomalias visíveis.

---

### 2. Três Anomalias Clássicas de Replicação

#### 2.1. Violação de Read-After-Write (Ler a Própria Escrita)
* **O Fenômeno**: O usuário envia uma alteração (escrita comitada no líder), mas ao tentar ler o dado modificado subsequente (leitura direcionada a um seguidor atrasado), o usuário não visualiza a sua própria alteração.
* **Mitigação**: 
  * Redirecionar leituras de dados alterados pelo próprio usuário estritamente para o líder. Leituras de dados de outros usuários podem ir para seguidores.
  * O cliente rastreia o timestamp lógico de sua última escrita de sucesso. O roteador de leitura apenas direciona a consulta do cliente para seguidores que já tenham replicado até aquele timestamp.

#### 2.2. Violação de Monotonic Reads (Leituras Monotônicas)
* **O Fenômeno**: O usuário faz consultas consecutivas a réplicas diferentes. A primeira consulta lê o dado em um seguidor atualizado; a segunda consulta (após o balanceador de carga alternar a conexão TCP para outro seguidor atrasado) lê o dado obsoleto, dando a ilusão de que o tempo correu para trás.
* **Garantia**: Leituras Monotônicas asseguram que, se um usuário visualizou o valor $V_2$ no tempo, ele nunca mais visualizará o valor anterior $V_1$ em consultas subsequentes.
* **Mitigação**: Garantir que as leituras de um mesmo usuário sejam roteadas sempre para a mesma réplica física (ex: sticky sessions no balanceador de carga mapeadas por hash do ID do usuário).

#### 2.3. Violação de Consistent Prefix Reads (Leituras de Prefixo Consistente)
* **O Fenômeno**: Ocorre em bancos de dados particionados (sharded). Se uma escrita $A$ causou a escrita $B$, mas a replicação de $A$ atrasar na partição 1 enquanto $B$ replicar rápido na partição 2, um leitor global visualizará a consequência antes da causa.
* **Garantia**: Leituras de Prefixo Consistente asseguram que, se uma sequência de escritas ocorrer em determinada ordem, qualquer leitor verá essas escritas na mesma ordem.
* **Mitigação**: Garantir que dados que possuam relação causal direta de dependência de negócios residam sempre na mesma partição física do banco.

---

## Funcionamento Interno
O roteador da camada de aplicação deve usar metadados lógicos (como carimbos de tempo, números de versão ou offsets do Kafka) associados ao cliente para decidir de qual réplica física é seguro ler no microssegundo atual.

---

## Exemplos

### Simulação em Kotlin da Violação de Monotonic Reads (Tempo correndo para trás)
O código abaixo demonstra um balanceador de carga ingênuo alternando consultas do usuário entre seguidores atualizados e atrasados, fazendo o saldo do usuário "flutuar". Em seguida, mostramos a correção usando roteamento por hash do ID do usuário (*Sticky Replica*).

```kotlin
// ARQUIVO: MonotonicReadsAnomalySimulator.kt
package com.distribuidos.consistencia

import java.util.concurrent.ConcurrentHashMap
import kotlin.random.Random

class DatabaseReplica(val name: String, var balance: Double)

class MonotonicReadsAnomalySimulator {
    private val replicas = listOf(
        DatabaseReplica("Replica-01-SP (Atualizada)", 500.0),
        DatabaseReplica("Replica-02-FRA (Atrasada)", 300.0) // Perdeu o último depósito de USD 200
    )

    // Simula balanceador de carga alternando conexões aleatoriamente
    fun naiveGetBalance(userId: String): Double {
        val selectedReplica = replicas[Random.nextInt(replicas.size)]
        println("[BALANCER] Roteando leitura de $userId para a réplica: ${selectedReplica.name}")
        return selectedReplica.balance
    }

    // Abordagem Correta: Roteamento Consistente (Sticky Replica)
    fun stickyGetBalance(userId: String): Double {
        // O hash do ID do usuário garante que ele leia sempre da mesma réplica
        val index = (userId.hashCode() and Int.MAX_VALUE) % replicas.size
        val selectedReplica = replicas[index]
        println("[STICKY-BALANCER] Roteando leitura de $userId deterministicamente para: ${selectedReplica.name}")
        return selectedReplica.balance
    }
}

fun main() {
    val simulator = MonotonicReadsAnomalySimulator()
    val userId = "user-10023"

    println("=== ANTIPADRÃO: ANOMALIA DE LEITURAS MONOTÔNICAS ===")
    // O usuário consulta seu saldo 3 vezes seguidas e vê o tempo flutuar de forma não monotônica
    for (i in 1..3) {
        val bal = simulator.naiveGetBalance(userId)
        println("Consulta $i: Saldo visualizado pelo usuário: USD $bal")
    }

    println("\n=== ABORDAGEM CORRETA: GARANTIA DE LEITURAS MONOTÔNICAS ===")
    // Utilizando Sticky replica, as consultas são consistentes localmente para o mesmo usuário
    for (i in 1..3) {
        val bal = simulator.stickyGetBalance(userId)
        println("Consulta $i: Saldo visualizado pelo usuário: USD $bal")
    }
}
```

---

## Casos de Uso
* **Facebook**: Quando você publica um comentário em uma postagem, a escrita é feita no seu datacenter local. Para mitigar a violação de *Read-Your-Own-Writes*, a aplicação exibe o seu próprio comentário instantaneamente na sua tela local a partir do cache do navegador ou do líder local, enquanto outros usuários em outros países receberão a postagem assincronamente em seus feeds apenas após o trânsito do log de replicação.
* **Nubank**: A visualização da fatura do cartão garante leituras monotônicas direcionando as consultas da sua fatura para réplicas persistentes de cache localizados no mesmo cluster de sessão.

---

## Quando Utilizar Consistência Eventual
* Aplicações web de larga escala com alto volume de tráfego de leitura (redes sociais, catálogos, streaming de vídeo).

---

## Quando Não Utilizar Consistência Eventual
* Fluxos transacionais que dependem de checagem imediata de saldos para liberar dinheiro ou autorizar ações irreversíveis. Leituras de auditoria financeira sensível **devem** ser direcionadas ao líder de consistência forte.

---

## Vantagens
* **Disponibilidade e Latência**: Gravações e leituras são imediatas, otimizando a vazão total do sistema.
* **Escalabilidade Horizontal de Leitura**: Permite adicionar réplicas baratas ilimitadamente.

---

## Desvantagens
* **Experiência do Usuário (Anomalias)**: Exige esforço de desenvolvimento na camada de aplicação para mascarar atrasos físicos de sincronização de rede.

---

## Comparações

### Garantias de Consistência de Replicação

| Garantia | O leitor vê dados antigos? | Garantia de Ordem Causal? | Roteamento necessário |
|---|---|---|---|
| **Consistência Forte** | Nunca | Sim | Sempre no Líder (CP) |
| **Read-After-Write** | Apenas para dados de outros | Sim | Próprios dados no Líder ou réplica atualizada |
| **Monotonic Reads** | Sim (mas nunca vê dados regredirem) | Parcial | Sticky replica por usuário |
| **Eventual** | Sim (leitura flutua no tempo) | Não | Qualquer réplica aleatória |

---

## Erros Comuns
1. **Confiar no Atraso Físico Curto**: Desenhar o sistema assumindo que "o lag de replicação é de apenas 10 milissegundos em média, então o usuário nunca notará". Sob incidentes de infraestrutura real, o lag sobe para minutos, gerando bugs graves e inconsistências funcionais.
2. **Ignorar Causalidade no Sharding**: Dividir conversas de chat ou fóruns em shards diferentes sem chave causal comum, fazendo com que respostas sejam exibidas antes das perguntas originais.

---

## Projeto Prático
No projeto **FinTech Ledger**, implementamos um roteador de leitura inteligente no gateway de pagamentos.
O cliente que realizou a transação recebe em metadados o timestamp da transação (`lastTransactionTimestamp`). Ao solicitar o extrato de saldos do Ledger, o roteador só selecionará réplicas que possuam seu log de sincronização atualizado até pelo menos aquele timestamp de segurança, garantindo a consistência de **Read-After-Write** de forma transparente.

```kotlin
// ARQUIVO: ReadYourOwnWritesRouter.kt
package com.distribuidos.projeto.consistencia

import com.distribuidos.projeto.TransactionResult

data class LedgerReplica(
    val id: String,
    val lastAppliedLogTimestamp: Long,
    val balances: Map<String, Double>
)

class ReadYourOwnWritesRouter(
    private val replicas: List<LedgerReplica>,
    private val leaderNodeBalance: Map<String, Double>
) {
    fun getBalanceResilient(
        accountId: String,
        clientLastTransactionTimestamp: Long?
    ): Double {
        // Se o cliente nunca fez transações, pode ler de qualquer réplica aleatória
        if (clientLastTransactionTimestamp == null) {
            return replicas.first().balances[accountId] ?: 0.0
        }

        // Busca réplica que já tenha replicado até o timestamp exigido pelo cliente
        val healthyReplica = replicas.find { replica ->
            replica.lastAppliedLogTimestamp >= clientLastTransactionTimestamp
        }

        return if (healthyReplica != null) {
            println("[ROUTER] Read-Your-Own-Writes garantido. Lendo da réplica: ${healthyReplica.id}")
            healthyReplica.balances[accountId] ?: 0.0
        } else {
            // Se nenhuma réplica seguidora alcançou o timestamp, força a leitura de segurança no líder
            println("[ROUTER] Réplicas atrasadas. Forçando leitura de segurança no LÍDER de consistência forte.")
            leaderNodeBalance[accountId] ?: 0.0
        }
    }
}
```

---

## Exercícios

### Básico
1. O que é o *Replication Lag* em sistemas com replicação assíncrona?
2. Explique a anomalia de *Monotonic Reads* (Leituras Monotônicas) sob a perspectiva da experiência do usuário final.

### Intermediário
3. Imagine um sistema de envio de mensagens instantâneas (chat). Se as mensagens forem salvas em um banco de dados replicado assincronamente, descreva o cenário em que a anomalia de *Consistent Prefix Reads* se manifestaria e sugira uma mitigação arquitetural.

### Avançado
4. Escreva um programa em Kotlin que implemente o fluxo completo de **Read-Your-Own-Writes** simulando latências de rede dinâmicas. O programa deve conter uma thread de escrita salvando dados e atualizando o timestamp lógico de escrita do cliente, e threads de leitura paralelas consultando o saldo. Mostre que leituras ingênuas falham ao ler dados antigos, e demonstre o sucesso do algoritmo de filtragem de réplicas baseadas no timestamp lógico mínimo.

---

## Perguntas de Entrevista
1. **O modelo de Consistência Eventual é compatível com transações ACID locais? Como lidamos com a consistência final de dados em nível de aplicação distribuída?**
   * *Resposta esperada*: Sim, a consistência eventual é compatível com transações ACID locais. Cada nó do banco de dados executa suas escritas locais de forma transacional ACID forte interna. O "eventual" se refere ao trânsito assíncrono de rede entre nós diferentes (replicação). Na camada distribuída da aplicação, lidamos com isso adotando a consistência final através de desduplicação (Receptores Idempotentes), padrões transacionais de longa duração (Sagas com ações compensatórias) e resolvendo possíveis conflitos lógicos (concorrência) utilizando algoritmos CRDTs (*Conflict-free Replicated Data Types*) ou regras de desempate determinísticas como LWW (*Last-Write-Wins*).

2. **Como a política de roteamento "Sticky Session" baseada em Cookie nos balanceadores de carga (Load Balancers) de produção garante a consistência de Leituras Monotônicas para o usuário final, e quais as limitações dessa abordagem se o usuário mudar de dispositivo móvel?**
   * *Resposta esperada*: Sticky Sessions garantem que todas as requisições HTTP consecutivas do mesmo cliente (identificado por um Cookie de sessão único) sejam direcionadas sempre para a mesma instância física de servidor ou réplica do banco. Como o usuário consulta sempre a mesma réplica, ele visualizará um estado que avança monotonicamente no tempo (sem flutuações de lag). A limitação física ocorre se o usuário mudar de dispositivo móvel (ex: sai do notebook para o celular), gerando um novo identificador/cookie de sessão, ou se a réplica cair e o balanceador redirecionar sua conexão para outra réplica atrasada, violando temporariamente a garantia de leituras monotônicas até que a nova réplica converja.

---

## Resumo
* A replicação assíncrona otimiza latência de gravação física, mas resulta no modelo de Consistência Eventual sujeito a anomalias de atraso de rede.
* As três anomalias clássicas de replicação são Read-After-Write (não visualizar a própria alteração), Monotonic Reads (tempo flutuando para trás) e Consistent Prefix Reads (inversão de causa e consequência causal).
* Arquiteturas distribuídas mitigam anomalias na camada de roteamento aplicando chaves consistentes (*Sticky replicas*) ou monitorando offsets e timestamps lógicos de transações do cliente.

---

## Próximo Módulo
No **Módulo 5: Tempo Lógico e Consenso Distribuído**, subiremos o nível de profundidade conceitual do curso. Estudaremos como a computação modela a ordenação causal com Relógios de Lamport e Relógios Vetoriais, analisaremos a Impossibilidade FLP do Consenso e iniciaremos o desenvolvimento do algoritmo de consenso **Raft** em Kotlin.

---

## Referências
* **Designing Data-Intensive Applications**, Martin Kleppmann. Capítulo 5: *Replication* (Seção sobre *Problems with Replication Lag*).
* **Replicated Data Consistency Explained Through Baseball**, Doug Terry (2013). Microsoft Research.
* **Distributed Systems: Concepts and Design**, George Coulouris et al. Capítulo 18: *Replication*.
