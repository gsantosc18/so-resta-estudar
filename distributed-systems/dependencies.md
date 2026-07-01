# Mapa de Dependências Conceituais

Este documento mapeia as dependências lógicas entre os diferentes tópicos do curso de Sistemas Distribuídos, auxiliando o estudante a entender quais bases teóricas são necessárias antes de avançar para conceitos complexos.

---

## 1. Grafo de Dependências (Mermaid)

```mermaid
flowchart TD
    %% Nós de Fundamentos
    F_intro[Fundamentos e Limitações] --> F_timing[Modelos de Tempo]
    F_intro --> F_failure[Modelos de Falha]
    
    %% Nós de Comunicação Síncrona
    F_timing --> C_sync[Comunicação Síncrona: REST/gRPC]
    F_failure --> C_sync
    C_sync --> C_jvm[Concorrência na JVM: Virtual Threads]
    
    %% Nós de Comunicação Assíncrona
    C_sync --> A_msg[Mensageria: RabbitMQ/Kafka]
    A_msg --> A_patterns[Padrões: Outbox e Idempotency]
    
    %% Nós de Consistência e Replicação
    F_timing --> D_clocks[Tempo Lógico e Causabilidade]
    F_failure --> D_cap[Teorema CAP e PACELC]
    D_cap --> D_rep[Replicação e Particionamento]
    
    %% Nós de Consenso e Bancos de Dados
    D_clocks --> D_consensus[Consenso Distribuído: Raft/Paxos]
    D_rep --> D_consensus
    D_consensus --> D_db[Bancos de Dados Distribuídos]
    
    %% Nós de Transações Avançadas e Sagas
    A_patterns --> T_saga[Padrões Transacionais: Sagas]
    D_cap --> T_saga
    
    %% Nós de Resiliência e Produção
    C_sync --> R_res[Resiliência: Circuit Breaker]
    A_msg --> R_res
    R_res --> P_ops[Operações: Kubernetes e Chaos Engineering]
    P_ops --> P_otel[Observabilidade: OpenTelemetry]
```

---

## 2. Detalhamento de Pré-requisitos Críticos

### Por que aprender Relógios Lógicos antes de Consenso Distribuído?
* **Razão**: Algoritmos de consenso (Raft, Paxos) dependem de noções de liderança ordenada por termos (*terms* ou *epochs*) e indexação incremental de logs para decidir se uma réplica tem dados mais atualizados do que outra. Sem entender o conceito de causabilidade lógica (relação Happened-Before de Lamport), o estudante terá dificuldades para compreender o processo de eleição e segurança do Raft.

### Por que aprender o Padrão Outbox antes de Sagas?
* **Razão**: O padrão Saga coordena múltiplos serviços via mensagens assíncronas (especialmente na Saga Coreografada ou Orquestrada baseada em eventos). Se um serviço falhar ao salvar seu estado local e publicar o evento da próxima etapa (quebra de atomicidade local), a Saga inteira trava ou perde a consistência de forma irrecuperável. O padrão Outbox garante a publicação confiável e atômica desses eventos de transição.

### Por que aprender CAP/PACELC antes de Bancos de Dados Distribuídos?
* **Razão**: Bancos de dados distribuídos (Cassandra, Spanner, CockroachDB) são implementações físicas que tomam decisões fundamentais baseadas no CAP/PACELC. Tentar entender o particionamento do Cassandra ou as garantias de isolamento do Spanner sem a base do CAP resultará em memorização mecânica das ferramentas, ao invés de compreensão arquitetural real.
