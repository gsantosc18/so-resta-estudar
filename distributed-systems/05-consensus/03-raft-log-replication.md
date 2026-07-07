# 04. Algoritmo de Consenso Raft: Replicação de Logs

## Objetivo
Ao final deste capítulo, você será capaz de detalhar a fase de replicação de logs do algoritmo Raft, explicar o funcionamento da chamada *AppendEntries RPC* e as regras de consistência de log, descrever o algoritmo de reconciliação de conflitos usando os ponteiros *nextIndex* e *matchIndex*, e programar a lógica de confirmação (*commit*) por quórum e sincronização de logs em Kotlin.

---

## Motivação
No capítulo anterior, implementamos a primeira fase do Raft: a Eleição de Líder. Uma vez que o cluster possui um único líder estável eleito, entramos na fase de **Replicação de Logs**. É aqui que o consenso de fato atua para processar transações de negócio de forma segura e distribuída.

Quando um cliente solicita um débito na nossa FinTech Ledger, a requisição é direcionada ao líder. O líder não pode simplesmente aplicar o débito localmente e responder "sucesso". Ele deve propagar essa gravação para as réplicas seguidores e aguardar que a maioria confirme que salvou a transação em disco antes de comitar a operação. 

Se um seguidor cair no meio do caminho e retornar com seu log corrompido ou desatualizado, o líder deve ser capaz de detectar o conflito de forma autônoma e sincronizar o seguidor de volta ao estado correto sem afetar o processamento dos clientes.

---

## Pré-requisitos
* [Módulo 5, Capítulo 03: Algoritmo de Consenso Raft: Eleição de Líder](./03-raft-leader-election.md).

---

## Conceitos Fundamentais

### 1. O Paradigma da Máquina de Estados Replicada (SMR)
O Raft baseia-se no paradigma **State Machine Replication (SMR)**. 
* **Abstração**: Um microserviço é modelado como uma máquina de estados determinística (dado um estado inicial *S*₀ e uma sequência de comandos ordenados *C*₁, *C*₂, ..., *C*ₙ, a máquina de estados sempre atingirá o mesmo estado final *S*ₙ).
* **O Consenso**: Garante que todos os nós do cluster tenham exatamente a **mesma sequência de comandos gravada no log**. Se os logs forem idênticos, as aplicações locais executarão os mesmos comandos e chegarão ao mesmo saldo final de conta de forma idêntica.

---

### 2. A Chamada RPC AppendEntries
O Líder envia mensagens de replicação (e heartbeats) utilizando a chamada `AppendEntries` contendo os seguintes argumentos:
* `term`: O termo atual do líder.
* `leaderId`: ID do líder (para os seguidores redirecionarem clientes).
* `prevLogIndex`: O índice do registro de log imediatamente anterior às novas entradas enviadas.
* `prevLogTerm`: O termo do registro `prevLogIndex`.
* `entries[]`: Vetor de registros de log a serem salvos (vazio para heartbeats).
* `leaderCommit`: O índice de commit atual do líder (`commitIndex`).

#### Regras de Validação no Seguidor (Follower)
Ao receber um `AppendEntries`, o seguidor:
1. **Verificação de Termo**: Se `term` for menor que seu termo atual, rejeita a requisição (`success = false`).
2. **Verificação de Consistência (Log Matching)**: Verifica se seu log contém um registro na posição `prevLogIndex` com o termo `prevLogTerm`. Se não contiver, rejeita a requisição (`success = false`). Isso sinaliza que o seguidor está atrasado ou tem dados conflitantes.
3. **Resolução de Conflitos**: Se um registro existente conflitar com uma nova entrada (mesmo índice, mas termos diferentes), o seguidor **deleta o registro existente e todos os registros subsequentes** no seu log.
4. **Append**: Adiciona as novas entradas ao final de seu log local.
5. **Commit**: Se `leaderCommit > commitIndex`, atualiza seu índice de commit local para:

$$
\text{commitIndex} = \min(\text{leaderCommit}, \text{índice do último log novo})
$$

E aplica as mensagens comitadas na sua máquina de estados de negócios local.

---

### 3. Algoritmo de Reconciliação do Líder (nextIndex e matchIndex)
O líder mantém dois ponteiros em memória para cada seguidor do cluster:
* `nextIndex[i]`: O índice do próximo registro de log que o líder enviará para o seguidor *i*. Inicializado como o índice do último log do líder + 1.
* `matchIndex[i]`: O índice do maior registro de log conhecido que já foi replicado com sucesso no seguidor *i*. Inicializado como 0.

#### O Processo de Busca do Ponto de Sincronia
* Se um seguidor rejeitar a chamada `AppendEntries` devido a falha de consistência, o líder decrementa o `nextIndex` daquele seguidor (ex: `nextIndex = nextIndex - 1`) e tenta enviar novamente.
* Esse processo se repete até que o seguidor responda sucesso. Nesse momento, o líder descobriu o ponto onde os logs de ambos coincidem. 
* A partir daí, o líder sobrescreve quaisquer logs conflitantes do seguidor com os dados corretos, avançando o `matchIndex` e `nextIndex` conforme o seguidor confirma os pacotes subsequentes.

```
   Líder:      [T:1, I:1] [T:1, I:2] [T:2, I:3] [T:2, I:4] (Ativo)
   Seguidor:   [T:1, I:1] [T:1, I:2] [T:1, I:3] (Conflito no índice 3!)
   
   1. Líder envia AppendEntries com prevLogIndex = 3, prevLogTerm = 2.
   2. Seguidor rejeita (não bate o termo no índice 3).
   3. Líder decrementa nextIndex para o seguidor e tenta prevLogIndex = 2, prevLogTerm = 1.
   4. Seguidor aceita (coincidem no índice 2). O seguidor deleta o índice 3 local e aceita a substituição.
```

---

### 4. A Regra de Commit de Termos Anteriores
Uma regra de segurança crítica do Raft estabelece que **um líder nunca comita um registro de um termo anterior simplesmente contando réplicas**. 
* Para comitar registros antigos que estavam pendentes, o líder deve comitar um registro de seu **termo atual** (gravando uma nova mensagem de escrita). Ao fazer o commit da mensagem nova por maioria de quórum, todos os registros anteriores do log são comitados automaticamente por transitividade da propriedade *Log Matching*.

---

## Funcionamento Interno
O log de commits no Raft funciona fisicamente como um log estruturado em disco do tipo *Segmented Log* associado a snapshots periódicos em disco (compactação de log) para evitar que o arquivo de dados consuma todo o espaço do servidor.

---

## Exemplos

### 1. Processamento e Validação de AppendEntries no Seguidor em Kotlin
O código a seguir implementa as regras físicas de consistência de log executadas pelo nó seguidor.

```kotlin
// ARQUIVO: RaftFollowerReplication.kt
package com.distribuidos.raft

data class LogEntry(
    val index: Long,
    val term: Long,
    val command: String
)

data class AppendEntriesArgs(
    val term: Long,
    val leaderId: String,
    val prevLogIndex: Long,
    val prevLogTerm: Long,
    val entries: List<LogEntry>,
    val leaderCommit: Long
)

data class AppendEntriesReply(
    val term: Long,
    val success: Boolean
)

class RaftFollower(val nodeId: String) {
    var currentTerm: Long = 0
    val log = mutableListOf<LogEntry>()
    var commitIndex: Long = 0

    init {
        // Log inicial básico fictício no índice 0
        log.add(LogEntry(0, 0, "NO_OP"))
    }

    @Synchronized
    fun handleAppendEntries(args: AppendEntriesArgs): AppendEntriesReply {
        // Regra 1: Rejeita se o termo do líder for menor
        if (args.term < currentTerm) {
            return AppendEntriesReply(currentTerm, false)
        }

        // Atualiza termo se receber algo mais novo
        if (args.term > currentTerm) {
            currentTerm = args.term
        }

        // Regra 2: Valida consistência do log (Log Matching)
        // O seguidor deve conter um log no índice prevLogIndex com termo idêntico a prevLogTerm
        if (args.prevLogIndex >= log.size || log[args.prevLogIndex.toInt()].term != args.prevLogTerm) {
            return AppendEntriesReply(currentTerm, false)
        }

        // Regra 3: Resolve conflitos deletando divergências
        var insertIndex = (args.prevLogIndex + 1).toInt()
        for (newEntry in args.entries) {
            if (insertIndex < log.size) {
                if (log[insertIndex].term != newEntry.term) {
                    // Detectou conflito de termos: deleta este registro e todos os subsequentes
                    while (log.size > insertIndex) {
                        log.removeAt(log.size - 1)
                    }
                    log.add(newEntry)
                }
            } else {
                // Fim do log local: apenas anexa
                log.add(newEntry)
            }
            insertIndex++
        }

        // Regra 4: Atualiza o commitIndex local
        if (args.leaderCommit > commitIndex) {
            val lastNewEntryIndex = log.last().index
            commitIndex = minOf(args.leaderCommit, lastNewEntryIndex)
            println("[$nodeId] CommitIndex atualizado para: $commitIndex. Aplicando na máquina de estados.")
        }

        return AppendEntriesReply(currentTerm, true)
    }
}
```

### 2. Algoritmo do Líder Ajustando nextIndex sob Falhas
Abaixo, simulamos a classe líder que gerencia a lista de seguidores e decrementa os ponteiros de envio em caso de erros de consistência.

```kotlin
// ARQUIVO: RaftLeaderReconciliation.kt
package com.distribuidos.raft

class RaftLeader(
    val nodeId: String,
    private val followers: List<RaftFollower>
) {
    private val nextIndex = mutableMapOf<String, Long>()
    private val matchIndex = mutableMapOf<String, Long>()
    private val log = mutableListOf<LogEntry>()

    init {
        log.add(LogEntry(0, 0, "NO_OP"))
        log.add(LogEntry(1, 1, "DEBIT conta-01 100"))
        log.add(LogEntry(2, 2, "DEBIT conta-02 200"))
        
        // Inicializa ponteiros para cada seguidor
        followers.forEach {
            nextIndex[it.nodeId] = (log.last().index + 1)
            matchIndex[it.nodeId] = 0
        }
    }

    fun replicateToFollower(follower: RaftFollower) {
        val fId = follower.nodeId
        var success = false

        while (!success) {
            val prevIndex = nextIndex[fId]!! - 1
            val prevTerm = log[prevIndex.toInt()].term
            val entriesToSend = log.subList(nextIndex[fId]!!.toInt(), log.size)

            val args = AppendEntriesArgs(
                term = 2,
                leaderId = nodeId,
                prevLogIndex = prevIndex,
                prevLogTerm = prevTerm,
                entries = entriesToSend,
                leaderCommit = log.last().index
            )

            val reply = follower.handleAppendEntries(args)
            
            if (reply.success) {
                // Sucesso: Atualiza ponteiros de progresso
                matchIndex[fId] = prevIndex + entriesToSend.size
                nextIndex[fId] = matchIndex[fId]!! + 1
                success = true
                println("[LÍDER] Sincronização concluída com seguidor $fId no índice ${matchIndex[fId]}")
            } else {
                // Rejeição por conflito: decrementa o nextIndex para buscar o ponto de sincronia
                val currentNext = nextIndex[fId]!!
                if (currentNext > 1) {
                    nextIndex[fId] = currentNext - 1
                    println("[LÍDER] Rejeição de consistência de $fId. Decrementando nextIndex para: ${nextIndex[fId]}")
                } else {
                    break // Evita loop abaixo de 1
                }
            }
        }
    }
}

fun main() {
    val follower = RaftFollower("Follower-01")
    // Força um log divergente no seguidor (Simula uma antiga eleição que falhou)
    follower.log.add(LogEntry(1, 1, "DEBIT conta-01 100"))
    follower.log.add(LogEntry(2, 1, "DEBIT conta-02 999")) // Conflito no índice 2 (termo 1 vs termo 2)

    val leader = RaftLeader("Leader-01", listOf(follower))
    
    println("=== Iniciando Reconciliação de Log ===")
    leader.replicateToFollower(follower)
}
```

---

## Casos de Uso
* **CockroachDB**: Utiliza o Multi-Raft para garantir consistência estrita transacional das linhas das tabelas SQL. Cada grupo de partições de dados (Range) possui seu próprio cluster Raft independente rodando eleições e replicação de logs de commits concorrentemente.
* **etcd**: O plano de controle do Kubernetes utiliza o Raft para replicar as alterações de recursos (pods/nodes) na rede de forma indissociável.

---

## Quando Utilizar Replicação de Logs do Raft
* Em infraestruturas distribuídas que exigem consistência forte absoluta (linearizabilidade) sob falhas parciais.
* Ao projetar bases de dados transacionais distribuídas personalizadas.

---

## Quando Não Utilizar Replicação de Logs do Raft
* Sistemas de alta vazão de dados que toleram consistência eventual simples (como contadores de acessos ou feeds sociais). O overhead de quórum de escrita em rede do Raft é desnecessário nesses casos.

---

## Vantagens
* **Linearizabilidade Garantida**: Segurança matemática provada contra divergências de logs.
* **Auto-Reconciliação**: O líder sobrescreve divergências nas réplicas de forma automática.

---

## Desvantagens
* **Performance Limitada**: Escritas síncronas de quórum dependem da velocidade física de rede do cluster.
* **Acumulo de Logs**: Exige implementação de logs segmentados e snapshots de disco periódicos (Log Compaction) para não estourar os discos do cluster.

---

## Comparações

### Status de Logs no Raft

| Tipo de Registro | Gravação no Disco | Executado na Aplicação? | Pode ser sobrescrito pelo líder? |
|---|---|---|---|
| **Log Não-Comitado** | Sim (WAL local) | Não | Sim (se houver conflito de termo) |
| **Log Comitado** | Sim (WAL local) | Sim (Máquina de Estados) | Não (garantia de consistência imutável) |

---

## Erros Comuns
1. **Comitar Entradas Antigas Contando Réplicas**: Tentar comitar um registro de termos anteriores simplesmente verificando se ele foi replicado na maioria dos nós. O Raft proíbe isso para evitar violações de segurança sutis em eleições concorrentes complexas. O correto é sempre escrever e comitar uma nova entrada no termo atual do líder.
2. **Ignorar Travas de Concorrência**: Não sincronizar acessos de escrita/leitura concorrente à coleção do log local, gerando exceções de concorrência ou dados corrompidos.

---

## Projeto Prático
No projeto **FinTech Ledger**, integramos a Replicação de Logs na nossa API do Ledger.
O nosso LedgerNode agirá sob as regras de validação do `AppendEntries`. Se o líder processar um débito, ele replicará o log do débito para as réplicas em memória do Ledger e atualizará o saldo de conta local (máquina de estados) apenas após receber confirmações de quórum da maioria.

```kotlin
// ARQUIVO: RaftLedgerReplicator.kt
package com.distribuidos.projeto.raft

import com.distribuidos.projeto.TransactionResult
import com.distribuidos.raft.LogEntry
import java.util.UUID

class RaftLedgerReplicator(
    private val nodes: List<RaftLedgerNodeSimulator>
) {
    private val leaderNode = nodes.first() // Assume o primeiro como líder

    fun processDebitConsensus(accountId: String, amount: Double): TransactionResult {
        val term = leaderNode.raftNode.currentTerm
        val index = (leaderNode.raftNode.log.size).toLong()
        
        // 1. Grava no log do líder localmente com status não-comitado
        val command = "DEBIT $accountId $amount"
        val newEntry = LogEntry(index, term, command)
        leaderNode.raftNode.log.add(newEntry)

        println("[RAFT-LEDGER] Líder gravou registro no log: $command (Index: $index, Term: $term)")

        // 2. Simula o envio de AppendEntries para as réplicas e conta os ACKs
        var successAcks = 1 // Conta o próprio líder
        
        val args = AppendEntriesArgs(
            term = term,
            leaderId = leaderNode.nodeId,
            prevLogIndex = index - 1,
            prevLogTerm = leaderNode.raftNode.log[(index - 1).toInt()].term,
            entries = listOf(newEntry),
            leaderCommit = leaderNode.raftNode.commitIndex
        )

        for (i in 1 until nodes.size) {
            val peer = nodes[i]
            val reply = peer.raftNode.handleAppendEntries(args)
            if (reply.success) {
                successAcks++
            }
        }

        // 3. Verifica quórum de maioria simples
        return if (successAcks > nodes.size / 2) {
            // Atualiza commitIndex do líder
            leaderNode.raftNode.commitIndex = index
            println("[RAFT-LEDGER] Consenso atingido! Quórum: $successAcks de ${nodes.size} nós confirmaram.")
            
            // Em uma app real, aqui aplicaríamos a regra de saldo na conta...
            TransactionResult.Success(UUID.randomUUID().toString(), System.currentTimeMillis())
        } else {
            // Falha de quórum: reverte o log localmente (ou marca como inválido)
            leaderNode.raftNode.log.removeAt(index.toInt())
            println("[RAFT-LEDGER] Falha de quórum! Apenas $successAcks confirmaram. Operação abortada.")
            TransactionResult.Failed("Consenso indisponível por falta de quórum.")
        }
    }
}
```

---

## Exercícios

### Básico
1. O que estabelece a propriedade *Log Matching* do algoritmo Raft?
2. Explique a diferença de papéis entre o `commitIndex` do líder e o `commitIndex` do seguidor.

### Intermediário
3. Considere que um seguidor esteve offline por muito tempo e perdeu os registros de logs de 10 transações financeiras. Descreva detalhadamente o fluxo de chamadas RPC de replicação executado pelo líder até que o seguidor consiga sincronizar seu log de volta ao estado atual.

### Avançado
4. Escreva uma classe em Kotlin que implemente o algoritmo de validação do `handleAppendEntries` do seguidor. Crie testes automatizados simulando cenários onde:
   * O seguidor rejeita a chamada por termo menor.
   * O seguidor rejeita a chamada por inconsistência de `prevLogIndex`/`prevLogTerm`.
   * O seguidor sobrescreve com sucesso logs divergentes antigos com os novos dados recebidos do líder.

---

## Perguntas de Entrevista
1. **Por que o líder do Raft não pode simplesmente comitar um registro de log de um termo anterior contando réplicas? Qual a vulnerabilidade de segurança física envolvida nesse cenário?**
   * *Resposta esperada*: O Raft proíbe que um líder comite diretamente registros de termos anteriores contando réplicas porque, em cenários de falhas físicas e reeleições cruzadas complexas de rede, um nó obsoleto com termo maior poderia ser eleito líder, reescrever os logs e fazer com que um registro considerado "comitado" por maioria no termo anterior seja sobrescrito indevidamente, violando a consistência imutável do log. Para contornar, o Raft determina que o líder só comita registros escrevendo e comitando um novo registro do seu **termo atual** por maioria de quórum. Quando o registro do termo atual é comitado, todos os registros anteriores do log são comitados automaticamente por transitividade física do alinhamento de logs (Log Matching Property), eliminando vulnerabilidades de eleições cruzadas.

2. **Como funciona o processo de compactação de logs (Log Compaction) e geração de Snapshots no Raft para evitar o estouro de espaço em disco dos servidores?**
   * *Resposta esperada*: Conforme a aplicação processa transações, o arquivo de log do Raft cresce infinitamente, consumindo espaço em disco e tornando a inicialização de nós lentos demorada (pois eles teriam que reprocessar milhões de logs históricos para reconstruir o estado em memória). Para resolver, o Raft adota a geração de **Snapshots**. Periodicamente, cada nó grava de forma independente o estado consolidado atual de sua máquina de estados de negócios no disco (ex: apenas o saldo atual das contas, descartando o histórico detalhado de como chegou a esse saldo) junto com os metadados do último índice e termo comitados incluídos no snapshot. Uma vez gravado o snapshot com sucesso no disco, todos os registros de logs em disco anteriores àquele índice de corte são permanentemente deletados do arquivo físico de log, economizando espaço. Se um seguidor atrasado necessitar de dados anteriores ao corte do líder, o líder envia o snapshot completo via chamada RPC `InstallSnapshot`.

---

## Resumo
* A Replicação de Logs baseia-se na Máquina de Estados Replicada (SMR) para garantir que todas as réplicas cheguem ao mesmo estado final.
* A chamada RPC AppendEntries valida a integridade de logs com base nas propriedades de prevLogIndex e prevLogTerm lógicas.
* O líder reconcilia divergências de réplicas decrementando o nextIndex até achar o ponto comum de logs, forçando a consistência de dados históricos.

---

## Próximo Módulo
No **Módulo 6: Padrões de Transações Distribuídas**, sairemos da camada interna de banco de dados e subiremos para a camada de aplicação de microserviços. Estudaremos como coordenar processos de negócio transacionais de longa duração que envolvem múltiplos bancos independentes usando o padrão Saga (Orquestrada e Coreografada) e os conceitos de Event Sourcing e CQRS.

---

## Referências
* **In Search of an Understandable Consensus Algorithm (Extended Version)**, Diego Ongaro e John Ousterhout (2014). Stanford University.
* **Designing Data-Intensive Applications**, Martin Kleppmann. Capítulo 9: *Consistency and Consensus* (Seção sobre *State Machine Replication*).
* **Raft Algorithm Specification**: [Summary of consensus rules](https://raft.github.io/raft.pdf).