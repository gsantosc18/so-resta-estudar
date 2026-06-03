# Roadmap de Estudos — Arquitetura Distribuída

## Visão Geral

Este roadmap organiza o estudo de **Arquitetura Distribuída** em 7 fases progressivas. Cada fase constrói sobre os conceitos da anterior, garantindo uma compreensão sólida e incremental.

---

## Mapa de Dependências

```
Fase 1: Fundamentos
    │
    ├──► Fase 2: Comunicação
    │       │
    │       ├──► Fase 3: Padrões de Dados
    │       │       │
    │       │       └──► Fase 5: Escalabilidade (parcial)
    │       │
    │       └──► Fase 4: Resiliência
    │
    ├──► Fase 5: Escalabilidade
    │
    ├──► Fase 6: Observabilidade (independente, pode ser estudada em paralelo)
    │
    └──► Fase 7: Orquestração (requer todas as fases anteriores)
```

---

## Fases

### Fase 1 — Fundamentos (`01-foundations/`)

**Objetivo**: Compreender os princípios teóricos que governam sistemas distribuídos.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 1.1 | Teorema CAP | [01-cap-theorem.md](distributed-systems/01-foundations/01-cap-theorem.md) | Nenhum |
| 1.2 | Modelos de Consistência | [02-consistency-models.md](distributed-systems/01-foundations/02-consistency-models.md) | 1.1 |
| 1.3 | Consenso Distribuído | [03-distributed-consensus.md](distributed-systems/01-foundations/03-distributed-consensus.md) | 1.2 |
| 1.4 | Falácias da Computação Distribuída | [04-fallacies-of-distributed-computing.md](distributed-systems/01-foundations/04-fallacies-of-distributed-computing.md) | Nenhum |

**Tempo estimado**: 2-3 semanas

---

### Fase 2 — Comunicação (`02-communication/`)

**Objetivo**: Dominar os padrões de comunicação entre serviços distribuídos.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 2.1 | Síncrono vs Assíncrono | [01-synchronous-vs-asynchronous.md](distributed-systems/02-communication/01-synchronous-vs-asynchronous.md) | 1.4 |
| 2.2 | REST e gRPC | [02-rest-and-grpc.md](distributed-systems/02-communication/02-rest-and-grpc.md) | 2.1 |
| 2.3 | Message Brokers | [03-message-brokers.md](distributed-systems/02-communication/03-message-brokers.md) | 2.1 |
| 2.4 | Event-Driven Architecture | [04-event-driven-architecture.md](distributed-systems/02-communication/04-event-driven-architecture.md) | 2.3 |

**Tempo estimado**: 2-3 semanas

---

### Fase 3 — Padrões de Dados (`03-data-patterns/`)

**Objetivo**: Entender como gerenciar dados de forma consistente em ambientes distribuídos.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 3.1 | Database per Service | [01-database-per-service.md](distributed-systems/03-data-patterns/01-database-per-service.md) | 1.2 |
| 3.2 | Saga Pattern | [02-saga-pattern.md](distributed-systems/03-data-patterns/02-saga-pattern.md) | 3.1, 2.3 |
| 3.3 | Outbox Pattern | [03-outbox-pattern.md](distributed-systems/03-data-patterns/03-outbox-pattern.md) | 3.2, 2.3 |
| 3.4 | Event Sourcing | [04-event-sourcing.md](distributed-systems/03-data-patterns/04-event-sourcing.md) | 2.4 |
| 3.5 | CQRS | [05-cqrs.md](distributed-systems/03-data-patterns/05-cqrs.md) | 3.4 |

**Tempo estimado**: 3-4 semanas

---

### Fase 4 — Resiliência (`04-resilience/`)

**Objetivo**: Aprender a projetar sistemas que sobrevivem a falhas parciais.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 4.1 | Circuit Breaker | [01-circuit-breaker.md](distributed-systems/04-resilience/01-circuit-breaker.md) | 2.1, 2.2 |
| 4.2 | Retry e Backoff Exponencial | [02-retry-and-backoff.md](distributed-systems/04-resilience/02-retry-and-backoff.md) | 4.1 |
| 4.3 | Bulkhead Pattern | [03-bulkhead-pattern.md](distributed-systems/04-resilience/03-bulkhead-pattern.md) | 4.1 |
| 4.4 | Timeout e Deadline Propagation | [04-timeout-and-deadline-propagation.md](distributed-systems/04-resilience/04-timeout-and-deadline-propagation.md) | 2.1, 2.2 |
| 4.5 | Idempotência | [05-idempotency.md](distributed-systems/04-resilience/05-idempotency.md) | 3.2, 4.2 |

**Tempo estimado**: 2-3 semanas

---

### Fase 5 — Escalabilidade (`05-scalability/`)

**Objetivo**: Projetar sistemas que escalam para milhões de usuários.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 5.1 | Horizontal vs Vertical Scaling | [01-horizontal-vs-vertical-scaling.md](distributed-systems/05-scalability/01-horizontal-vs-vertical-scaling.md) | Fase 1 |
| 5.2 | Load Balancing | [02-load-balancing.md](distributed-systems/05-scalability/02-load-balancing.md) | 5.1 |
| 5.3 | Estratégias de Cache | [03-caching-strategies.md](distributed-systems/05-scalability/03-caching-strategies.md) | 1.2 |
| 5.4 | Sharding e Particionamento | [04-sharding-and-partitioning.md](distributed-systems/05-scalability/04-sharding-and-partitioning.md) | 3.1 |
| 5.5 | Rate Limiting | [05-rate-limiting.md](distributed-systems/05-scalability/05-rate-limiting.md) | 5.2 |

**Tempo estimado**: 2-3 semanas

---

### Fase 6 — Observabilidade (`06-observability/`)

**Objetivo**: Monitorar, rastrear e debugar sistemas distribuídos em produção.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 6.1 | Distributed Tracing | [01-distributed-tracing.md](distributed-systems/06-observability/01-distributed-tracing.md) | Fase 2 |
| 6.2 | Structured Logging | [02-structured-logging.md](distributed-systems/06-observability/02-structured-logging.md) | Nenhum |
| 6.3 | Métricas e Monitoramento | [03-metrics-and-monitoring.md](distributed-systems/06-observability/03-metrics-and-monitoring.md) | Nenhum |
| 6.4 | Health Checks e Readiness | [04-health-checks-and-readiness.md](distributed-systems/06-observability/04-health-checks-and-readiness.md) | Nenhum |

**Tempo estimado**: 1-2 semanas

---

### Fase 7 — Orquestração (`07-orchestration/`)

**Objetivo**: Gerenciar o ciclo de vida, descoberta e roteamento de serviços.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 7.1 | Service Discovery | [01-service-discovery.md](distributed-systems/07-orchestration/01-service-discovery.md) | 5.2 |
| 7.2 | API Gateway | [02-api-gateway.md](distributed-systems/07-orchestration/02-api-gateway.md) | 7.1 |
| 7.3 | Service Mesh | [03-service-mesh.md](distributed-systems/07-orchestration/03-service-mesh.md) | 7.1 |
| 7.4 | Container Orchestration | [04-container-orchestration.md](distributed-systems/07-orchestration/04-container-orchestration.md) | Todas |

**Tempo estimado**: 2-3 semanas

---

## Tempo Total Estimado

| Fase | Semanas |
|------|---------|
| 1 — Fundamentos | 2-3 |
| 2 — Comunicação | 2-3 |
| 3 — Padrões de Dados | 3-4 |
| 4 — Resiliência | 2-3 |
| 5 — Escalabilidade | 2-3 |
| 6 — Observabilidade | 1-2 |
| 7 — Orquestração | 2-3 |
| **Total** | **14-21 semanas** |

---

## Recursos Complementares

### Livros Recomendados
- *Designing Data-Intensive Applications* — Martin Kleppmann
- *Building Microservices* — Sam Newman
- *Release It!* — Michael Nygard
- *Distributed Systems* — Maarten van Steen & Andrew Tanenbaum
- *Database Internals* — Alex Petrov

### Papers Essenciais
- [The CAP Theorem](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf) — Gilbert & Lynch
- [In Search of an Understandable Consensus Algorithm (Raft)](https://raft.github.io/raft.pdf) — Ongaro & Ousterhout
- [Life beyond Distributed Transactions](https://queue.acm.org/detail.cfm?id=3025012) — Pat Helland
- [The Log: What every software engineer should know](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying) — Jay Kreps
