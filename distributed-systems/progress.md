# Progresso de Estudo — Sistemas Distribuídos

Rastreamento do progresso dos tópicos de estudo e projetos do módulo de sistemas distribuídos.

---

## Módulo 1: Fundamentos e Limitações Físicas
- [x] [01. Introdução aos Sistemas Distribuídos e Falácias da Rede](./01-foundations/01-introduction-and-fallacies.md)
- [x] [02. Modelos de Tempo e Modelos de Falha](./01-foundations/02-timing-and-failure-models.md)
- [x] *Checkpoint Módulo 1 concluído*

---

## Módulo 2: Concorrência e IPC (Inter-Process Communication)
- [x] [01. Comunicação Síncrona: Sockets e APIs RESTful](./02-concurrency-ipc/01-sockets-and-rest.md)
- [x] [02. Chamadas de Procedimento Remoto (gRPC) e Serialização com Protobuf](./02-concurrency-ipc/02-grpc-and-protobuf.md)
- [x] [03. Concorrência Concorrente na JVM com Virtual Threads](./02-concurrency-ipc/03-jvm-virtual-threads.md)
- [x] **Projeto Prático - Etapa 01**: Comunicação Síncrona gRPC/REST do Ledger

---

## Módulo 3: Mensageria e Comunicação Assíncrona
- [x] [01. Introdução à Mensageria Assíncrona e RabbitMQ (AMQP)](./03-messaging/01-rabbitmq-amqp.md)
- [x] [02. Apache Kafka e Logs de Commit Distribuídos](./03-messaging/02-apache-kafka.md)
- [x] [03. Atomicidade na Publicação com o Padrão Outbox](./03-messaging/03-outbox-pattern.md)
- [x] [04. Concorrência em Mensageria com Receptores Idempotentes](./03-messaging/04-idempotency-receiver.md)
- [x] **Projeto Prático - Etapa 02**: Fluxo Assíncrono com Outbox e Controle de Idempotência

---

## Módulo 4: Replicação de Dados e Consistência
- [x] [01. O Teorema CAP e PACELC na Tomada de Decisão Arquitetural](./04-replication-consistency/01-cap-pacelc-theorems.md)
- [x] [02. Replicação Baseada em Líder (Leader-Follower)](./04-replication-consistency/02-leader-follower-replication.md)
- [x] [03. Particionamento (Sharding) de Dados](./04-replication-consistency/03-data-sharding.md)
- [x] [04. Consistência Eventual e Anomalias de Replicação](./04-replication-consistency/04-eventual-consistency-anomalies.md)
- [x] **Projeto Prático - Etapa 03**: Simulação de Inconsistência Eventual e Atrasos de Rede em Leituras

---

## Módulo 5: Tempo Lógico e Consenso Distribuído
- [x] [01. Tempo Lógico e Ordenação Causal (Lamport & Vector Clocks)](./05-consensus/01-logical-clocks.md)
- [x] [02. Introdução ao Problema do Consenso e Impossibilidade FLP](./05-consensus/02-consensus-problem-flp.md)
- [x] [03. Algoritmo de Consenso Raft: Eleição de Líder](./05-consensus/03-raft-leader-election.md)
- [x] [04. Algoritmo de Consenso Raft: Replicação de Logs](./05-consensus/03-raft-log-replication.md)
- [x] **Projeto Prático - Etapa 04**: Implementação do Algoritmo Raft em Memória para o Ledger

---

## Módulo 6: Padrões de Transações Distribuídas
- [x] [01. O Padrão Saga: Coreografia](./06-distributed-patterns/01-saga-choreography.md)
- [x] [02. O Padrão Saga: Orquestração e Ações Compensatórias](./06-distributed-patterns/02-saga-orchestration.md)
- [x] [03. Introdução a Event Sourcing e CQRS](./06-distributed-patterns/03-event-sourcing-cqrs.md)
- [x] **Projeto Prático - Etapa 05**: Implementação de Saga Orquestrada com Compensação de Saldo

---

## Módulo 7: Resiliência, Observabilidade e Operação
- [x] [01. Padrões de Resiliência Distribuída (Circuit Breaker, Bulkhead, Retry)](./07-resilience-operations/01-resilience-patterns.md)
- [x] [02. Observabilidade Distribuída com OpenTelemetry](./07-resilience-operations/02-opentelemetry-observability.md)
- [x] [03. Orquestração e Deploy Resiliente no Kubernetes](./07-resilience-operations/03-kubernetes-orchestration.md)
- [x] [04. Testes de Robustez com Chaos Engineering](./07-resilience-operations/04-chaos-engineering.md)
- [x] **Projeto Prático - Etapa Final**: Empacotamento Docker, K8s, Grafana OTel e Injeção de Caos
