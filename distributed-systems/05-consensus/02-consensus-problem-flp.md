# 02. Introdução ao Problema do Consenso e Impossibilidade FLP

## Objetivo
Ao final deste capítulo, você será capaz de formular matematicamente o problema do consenso distribuído em termos de suas três propriedades fundamentais (Acordo, Validade e Terminação), explicar o teorema de impossibilidade FLP (Fischer, Lynch e Paterson) e analisar as abordagens utilizadas por algoritmos reais para contornar esses limites físicos.

---

## Motivação
Em sistemas distribuídos replicados, os nós precisam constantemente concordar em decisões críticas de estado:
* "Quem é o líder legítimo do cluster no momento?"
* "Devemos comitar ou abortar a transação financeira ID 4402?"
* "Qual a ordem exata de escrita das transações no ledger?"

Se cada nó tomar sua decisão local isoladamente, a consistência de dados do cluster será destruída. O mecanismo para atingir esse acordo comum na rede é o **Consenso Distribuído**, considerado o problema mais difícil e importante da computação distribuída. 

Para projetar ou operar ferramentas de consenso (como etcd ou ZooKeeper), devemos primeiramente compreender as propriedades matemáticas que regem esse problema e a barreira teórica definitiva descrita pelo **Teorema FLP**.

---

## Pré-requisitos
* [Módulo 5, Capítulo 01: Tempo Lógico e Ordenação Causal (Lamport & Vector Clocks)](./01-logical-clocks.md).
* Modelos de tempo e falha ([Módulo 1, Capítulo 02](./../01-foundations/02-timing-and-failure-models.md)).

---

## Conceitos Fundamentais

### 1. Definição do Problema do Consenso
O problema do consenso exige que um conjunto de processos independentes proponham valores de dados e, através da troca de mensagens em rede, decidam de forma unificada por um único valor comum.
Para que um algoritmo de consenso seja considerado correto, ele deve garantir simultaneamente três propriedades matemáticas:

#### 1.1. Agreement (Acordo - Propriedade de Safety)
* **Definição**: Nenhum processo decide por um valor diferente de outro processo não faltoso. O valor final decidido deve ser único e comum a todos.

#### 1.2. Validity (Validade ou Integridade - Propriedade de Safety)
* **Definição**: O valor decidido pelo sistema deve ter sido proposto por pelo menos um dos processos do cluster. Isso impede que o sistema tome decisões triviais arbitrárias (ex: o algoritmo sempre decidir `0` independentemente do que foi solicitado).

#### 1.3. Termination (Terminação - Propriedade de Liveness)
* **Definição**: Todo processo não faltoso (saudável) eventualmente atinge uma decisão final (o algoritmo conclui a execução).

---

### 2. O Teorema de Impossibilidade FLP
Publicado em 1985 por Michael Fischer, Nancy Lynch e Michael Paterson (trabalho que recebeu o prêmio Dijkstra de computação distribuída em 2001), o teorema estabelece uma lei física definitiva:

> [!IMPORTANT]
> **Enunciado do Teorema FLP**: Em um modelo de **sistema assíncrono**, com canais de comunicação confiáveis (mensagens não são corrompidas), **não existe algoritmo de consenso determinístico que garanta simultaneamente segurança (Safety) e terminação (Liveness) em presença de pelo menos uma única falha de parada de processo (Crash-Stop)**.

#### Explicação Intuitiva do FLP (Estados Bivalentes vs. Univalentes)
A prova do FLP baseia-se em estados globais de configuração do sistema:
* **Estado Bivalente**: É uma configuração do sistema a partir da qual ambos os resultados de decisão (decidir `0` ou decidir `1`) ainda são possíveis. O sistema está em estado de indecisão.
* **Estado Univalente**: Configuração a partir da qual o resultado final é inevitável (ou decidirá estritamente `0` ou decidirá estritamente `1`).
* **O Dilema Assíncrono**: Como a rede assíncrona não tem limites de tempo, mensagens podem ser atrasadas infinitamente. Os autores provaram que existe sempre uma sequência de atrasos de mensagens físicos nos canais de rede que mantém o sistema eternamente preso em estados bivalentes (indecisão infinita). O sistema nunca consegue tomar uma decisão (violando a Terminação), ou, se forçado a decidir rápido por timeout, corre o risco de nós decidirem valores diferentes (violando o Acordo).

---

### 3. Como os Sistemas Reais Contornam o FLP?
Para construir sistemas práticos, somos forçados a quebrar pelo menos uma das premissas de impossibilidade do FLP:

#### Abordagem 1: Abandonar o Determinismo (Algoritmos Probabilísticos)
* **Mecanismo**: Utiliza geradores de números aleatórios ou probabilidade para quebrar a simetria de estados bivalentes (ex: o algoritmo de Ben-Or). O algoritmo garante segurança ($100\%$ de Acordo e Validade) e garante Terminação com probabilidade que converge para $1$ com o tempo.

#### Abordagem 2: Abandonar a Assincronia Pura (Uso de Timeouts / Sincronia Parcial)
* **Mecanismo**: Algoritmos clássicos da indústria (como Paxos, Raft, Zab do ZooKeeper) adotam timeouts baseados em **sincronia parcial** para detectar nós caídos.
* **Comportamento**: 
  * Se a rede estiver estável, o algoritmo garante segurança (Safety) e termina rápido (Liveness).
  * Se a rede sofrer partição física severa (período assíncrono), o algoritmo bloqueia as decisões impedindo a terminação (Liveness é suspensa), mas **nunca** comita dados conflitantes (Safety é preservada a qualquer custo).

---

## Funcionamento Interno
O escalonador da JVM ou do SO gerencia a ordem física de chegada de eventos de sockets, sendo o consenso o responsável por ordenar esses frames logicamente em logs replicados idênticos.

---

## Exemplos

### Simulação em Kotlin do Consenso Probabilístico de Ben-Or
O código abaixo demonstra uma simplificação conceitual do algoritmo de Ben-Or, onde nós propõem valores e usam "lançamentos de moedas" (aleatoriedade) para alcançar consenso probabilístico na rede assíncrona.

```kotlin
// ARQUIVO: BenOrConsensusSimulator.kt
package com.distribuidos.consenso

import kotlin.random.Random

class ConsensusParticipant(val id: String, var proposal: Int) {
    var step: Int = 1
    var decidedValue: Int? = null
}

class BenOrConsensusSimulator(private val participants: List<ConsensusParticipant>) {
    private val n = participants.size
    private val f = (n - 1) / 2 // Limite de falhas toleradas (minoria)

    fun executeConsensusRound(): Int {
        var decided = false
        var decidedVal = -1

        while (!decided) {
            println("\n--- Round/Step de Consenso ---")
            
            // Simula a coleta de propostas de todos os nós ativos
            val votes = participants.map { it.proposal }
            val count0 = votes.count { it == 0 }
            val count1 = votes.count { it == 1 }

            println("Votos: 0 = $count0, 1 = $count1")

            for (p in participants) {
                // Regra simplificada do algoritmo de Ben-Or
                if (count0 > n / 2) {
                    p.proposal = 0
                    p.decidedValue = 0
                    decidedVal = 0
                    decided = true
                } else if (count1 > n / 2) {
                    p.proposal = 1
                    p.decidedValue = 1
                    decidedVal = 1
                    decided = true
                } else {
                    // Sem maioria: lança uma moeda aleatória para decidir a próxima proposta
                    p.proposal = Random.nextInt(2)
                    println("[Nó ${p.id}] Sem quórum. Lançou moeda: proposta atualizada para ${p.proposal}")
                }
            }
        }
        
        return decidedVal
    }
}

fun main() {
    val nodes = listOf(
        ConsensusParticipant("Nó-1", 1),
        ConsensusParticipant("Nó-2", 0),
        ConsensusParticipant("Nó-3", 1)
    )

    val simulator = BenOrConsensusSimulator(nodes)
    val finalValue = simulator.executeConsensusRound()
    println("\n=== CONSENSO ALCANÇADO ===")
    println("Valor final decidido de forma unificada: $finalValue")
}
```

---

## Casos de Uso
* **etcd (Kubernetes)**: O banco etcd coordena todo o estado do cluster do Kubernetes (pods ativos, IPs, nós físicos). Ele utiliza o algoritmo Raft (baseado em timeouts e sincronia parcial) para garantir que apenas um líder edite o estado do cluster, prevenindo escritas conflitantes que quebrariam a infraestrutura do K8s.
* **Apache ZooKeeper**: Coordena o registro e rebalanceamento de brokers do Kafka de forma consistente.

---

## Quando Utilizar Motores de Consenso
* Coordenação e gerenciamento de configurações críticas de infraestrutura de rede.
* Processos de eleição de líderes de clusters.
* Gerenciamento de chaves de travas e exclusão mútua distribuída (Locks distribuídos).

---

## Quando Não Utilizar Motores de Consenso
* Gravação e leitura de dados operacionais do negócio de alta vazão (ex: salvar todas as compras e cliques de clientes diretamente no etcd). Consenso exige trocas de mensagens e handshakes constantes entre múltiplos nós, o que eleva drasticamente a latência e limita a performance de vazão física de escrita.

---

## Vantagens
* **Consistência Forte Nativa**: Garante que o estado distribuído é único e imutável.
* **Tolerância a Falhas**: O cluster continua operando normalmente mesmo se parte dos nós sofrer crash repentino (desde que mantido quórum de maioria).

---

## Desvantagens
* **Sensibilidade a Latência de Rede**: Oscilações severas de rede podem travar a liveness (terminação) do consenso.
* **Baixa Performance de Escrita**: Limitada pelo RTT de rede das mensagens de quórum.

---

## Comparações

### Propriedades de Safety vs. Liveness

| Característica | Safety (Segurança) | Liveness (Vivacidade) |
|---|---|---|
| **Definição Simples** | "Coisas ruins nunca acontecem" | "Coisas boas eventualmente acontecem" |
| **Garantia em Consenso**| Acordo e Validade (nós não divergem) | Terminação (nós chegam a uma decisão) |
| **Comportamento sob Partição**| Preservada (bloqueia mas não erra) | Suspensa (timeouts travam o progresso) |

---

## Erros Comuns
1. **Confiar em Algoritmos sem Quórum**: Tentar programar lógicas de consenso customizadas baseadas em confirmações do tipo "todos os nós devem confirmar". Se um único nó cair, a terminação (Liveness) é perdida para sempre. Algoritmos robustos de consenso exigem apenas quórum de maioria simples ($Q = \lfloor N/2 \rfloor + 1$).
2. **Subestimar os Efeitos de Partição no etcd/ZooKeeper**: Configurar clusters de consenso com número par de nós (ex: 4 nós). Um cluster de 4 nós exige maioria de 3 nós para operar. Se houver uma partição dividindo-o em 2 e 2, nenhum dos lados terá maioria e o cluster inteiro travará de forma indevida. O correto é sempre utilizar números ímpares de nós (3, 5, 7) para maximizar a tolerância a partições físicas.

---

## Projeto Prático
No projeto de **FinTech Ledger**, projetamos a interface lógica de Consenso.
As decisões de alteração do livro-razão (como comitar uma transferência) passarão pela assinatura do validador de consenso, abstraindo a eleição e o acordo que implementaremos via algoritmo Raft nos próximos capítulos.

```kotlin
// ARQUIVO: ConsensusEngine.kt
package com.distribuidos.projeto.consenso

import com.distribuidos.projeto.TransactionResult

interface ConsensusEngine {
    /**
     * Propõe um novo comando de transação financeira para o cluster.
     * Retorna o resultado após validação do quórum de consenso.
     */
    fun proposeTransaction(command: String): TransactionResult
}

class MockConsensusEngine(private val isNetworkHealthy: Boolean) : ConsensusEngine {
    override fun proposeTransaction(command: String): TransactionResult {
        return if (isNetworkHealthy) {
            TransactionResult.Success("tx-${System.nanoTime()}", System.currentTimeMillis())
        } else {
            TransactionResult.Failed("Consenso travado: Liveness suspensa por indisponibilidade de quórum de rede.")
        }
    }
}
```

---

## Exercícios

### Básico
1. O que afirma o Teorema de Impossibilidade FLP (Fischer, Lynch, Paterson)?
2. Explique a diferença entre propriedades de *Safety* e *Liveness* no contexto do consenso distribuído.

### Intermediário
3. Defina as três propriedades formais exigidas para que um algoritmo de consenso seja considerado correto (Acordo, Validade e Terminação).

### Avançado
4. Escreva um ensaio conceitual curto (1 página) descrevendo o dilema dos estados **Bivalentes** e **Univalentes** de acordo com a prova intuitiva do Teorema FLP, explicando por que um agendador de rede assíncrono fictício e malicioso consegue adiar indefinidamente a decisão de consenso do cluster.

---

## Perguntas de Entrevista
1. **Se o Teorema FLP prova que consenso determinístico é impossível em sistemas assíncronos, por que dizemos que o algoritmo Raft (utilizado em bancos como o CockroachDB) funciona perfeitamente em produção? Onde está a contradição física?**
   * *Resposta esperada*: Não há contradição física. O algoritmo Raft contorna a impossibilidade do FLP abrindo mão da assincronia pura do modelo matemático. O Raft assume **sincronia parcial** através do uso de **timeouts** e detectores de falhas. Ele utiliza timeouts de eleição e batimentos cardíacos para progredir e tomar decisões. Sob redes instáveis (período assíncrono), o Raft pode sofrer com eleições contínuas divididas sem conseguir eleger um líder (liveness/terminação suspensa temporariamente), mas ele **nunca** comitará dados conflitantes (safety/acordo é garantido). Uma vez que a rede se estabilize (pós-GST), o Raft retoma a terminação rápida instantaneamente. Portanto, o Raft garante segurança total sob qualquer condição, mas garante terminação apenas sob sincronia parcial estável.

2. **Por que um cluster do Apache ZooKeeper de 3 nós tolera o mesmo número de falhas físicas de nós do que um cluster de 4 nós? Qual a vantagem de usar números ímpares?**
   * *Resposta esperada*: A tolerância a falhas é ditada pela necessidade de manter um quórum de maioria simples ($Q = \lfloor N/2 \rfloor + 1$) de nós ativos.
     * Em um cluster de 3 nós, a maioria é 2. O sistema tolera a perda de até 1 nó ($3 - 2 = 1$).
     * Em um cluster de 4 nós, a maioria é 3. O sistema também tolera a perda de apenas 1 nó ($4 - 3 = 1$). Se 2 nós caírem, restam 2 nós, que não representam maioria de 4, travando o cluster.
     Portanto, um cluster de 4 nós não adiciona nenhuma tolerância a falhas extra em relação a um cluster de 3 nós, mas consome mais banda de rede com mensagens de sincronização e adiciona custo financeiro desnecessário. Por isso, motores de consenso sempre utilizam tamanhos ímpares.

---

## Resumo
* Consenso distribuído exige garantir simultaneamente Acordo, Validade e Terminação na rede.
* Teorema FLP prova a impossibilidade de consenso determinístico $100\%$ seguro e que conclui a execução em redes assíncronas com falhas.
* Sistemas práticos contornam o FLP adotando timeouts (sincronia parcial) ou algoritmos probabilísticos para quebrar a indecisão de estados bivalentes.

---

## Referências
* **Impossibility of Distributed Consensus with One Faulty Process**, Michael J. Fischer, Nancy A. Lynch, Michael S. Paterson (1985). Journal of the ACM.
* **Designing Data-Intensive Applications**, Martin Kleppmann. Capítulo 9: *Consistency and Consensus* (Seção sobre *The Impossibility of Consensus*).
* **Distributed Systems**, Maarten van Steen. Capítulo 8: *Fault Tolerance*.
