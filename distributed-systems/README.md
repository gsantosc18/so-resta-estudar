# Sistemas Distribuídos

## Visão Geral

Este módulo aborda os fundamentos, padrões e práticas de **Arquitetura Distribuída** para desenvolvedores que projetam e constroem sistemas escaláveis, resilientes e de alta disponibilidade.

O material é organizado em 7 fases progressivas, cobrindo desde os teoremas fundamentais até a orquestração de containers em produção.

---

## Por que Estudar Sistemas Distribuídos?

Todo software moderno é, em algum grau, distribuído. Desde uma aplicação que se conecta a um banco de dados remoto até microserviços que processam milhões de eventos por segundo — os desafios são os mesmos:

- **Falhas são inevitáveis**: Redes falham, discos corrompem, processos morrem.
- **Latência é imprevisível**: Uma chamada de rede pode levar 1ms ou 10s.
- **Consistência é custosa**: Garantir que todos vejam os mesmos dados ao mesmo tempo tem um preço.
- **Escalabilidade não é linear**: Duplicar recursos nem sempre dobra a capacidade.

Entender esses desafios é o que diferencia um desenvolvedor que "faz funcionar" de um engenheiro que **projeta para produção**.

---

## Estrutura do Módulo

### [Fase 1 — Fundamentos](01-foundations/)
Os princípios teóricos que governam todo sistema distribuído. Sem eles, tudo o que vem depois é construção sobre areia.

- [Teorema CAP](01-foundations/01-cap-theorem.md)
- [Modelos de Consistência](01-foundations/02-consistency-models.md)
- [Consenso Distribuído](01-foundations/03-distributed-consensus.md)
- [Falácias da Computação Distribuída](01-foundations/04-fallacies-of-distributed-computing.md)

### [Fase 2 — Comunicação](02-communication/)
Como serviços conversam entre si — e as consequências de cada escolha.

- [Síncrono vs Assíncrono](02-communication/01-synchronous-vs-asynchronous.md)
- [REST e gRPC](02-communication/02-rest-and-grpc.md)
- [Message Brokers](02-communication/03-message-brokers.md)
- [Event-Driven Architecture](02-communication/04-event-driven-architecture.md)

### [Fase 3 — Padrões de Dados](03-data-patterns/)
Gerenciamento de dados em um mundo onde transações ACID não cruzam fronteiras de serviço.

- [Database per Service](03-data-patterns/01-database-per-service.md)
- [Saga Pattern](03-data-patterns/02-saga-pattern.md)
- [Outbox Pattern](03-data-patterns/03-outbox-pattern.md)
- [Event Sourcing](03-data-patterns/04-event-sourcing.md)
- [CQRS](03-data-patterns/05-cqrs.md)

### [Fase 4 — Resiliência](04-resilience/)
Projetar para falhas — porque elas vão acontecer.

- [Circuit Breaker](04-resilience/01-circuit-breaker.md)
- [Retry e Backoff Exponencial](04-resilience/02-retry-and-backoff.md)
- [Bulkhead Pattern](04-resilience/03-bulkhead-pattern.md)
- [Timeout e Deadline Propagation](04-resilience/04-timeout-and-deadline-propagation.md)
- [Idempotência](04-resilience/05-idempotency.md)

### [Fase 5 — Escalabilidade](05-scalability/)
De centenas a milhões de requisições por segundo.

- [Horizontal vs Vertical Scaling](05-scalability/01-horizontal-vs-vertical-scaling.md)
- [Load Balancing](05-scalability/02-load-balancing.md)
- [Estratégias de Cache](05-scalability/03-caching-strategies.md)
- [Sharding e Particionamento](05-scalability/04-sharding-and-partitioning.md)
- [Rate Limiting](05-scalability/05-rate-limiting.md)

### [Fase 6 — Observabilidade](06-observability/)
Você não pode corrigir o que não pode ver.

- [Distributed Tracing](06-observability/01-distributed-tracing.md)
- [Structured Logging](06-observability/02-structured-logging.md)
- [Métricas e Monitoramento](06-observability/03-metrics-and-monitoring.md)
- [Health Checks e Readiness](06-observability/04-health-checks-and-readiness.md)

### [Fase 7 — Orquestração](07-orchestration/)
Gerenciando o ciclo de vida de serviços em produção.

- [Service Discovery](07-orchestration/01-service-discovery.md)
- [API Gateway](07-orchestration/02-api-gateway.md)
- [Service Mesh](07-orchestration/03-service-mesh.md)
- [Container Orchestration](07-orchestration/04-container-orchestration.md)

---

## Como Usar Este Material

1. **Siga a ordem das fases** — cada fase constrói sobre a anterior.
2. **Não pule os fundamentos** — eles aparecem em todas as entrevistas senior/staff.
3. **Implemente os projetos práticos** — ler sem implementar é memorizar sem aprender.
4. **Use o [glossário](glossary.md)** — termos técnicos são o vocabulário mínimo para discussões arquiteturais.
5. **Acompanhe no [progress.md](progress.md)** — marque o que já estudou e revise periodicamente.
6. **Consulte o [roadmap](roadmap.md)** — veja a ordem de estudo e dependências entre tópicos.

---

## Referências Gerais

| Recurso | Tipo | Nível |
|---------|------|-------|
| *Designing Data-Intensive Applications* — Martin Kleppmann | Livro | Intermediário-Avançado |
| *Building Microservices* — Sam Newman | Livro | Intermediário |
| *Release It!* — Michael Nygard | Livro | Avançado |
| *Distributed Systems* — Maarten van Steen & Andrew Tanenbaum | Livro | Acadêmico |
| [Martin Fowler — Microservices](https://martinfowler.com/microservices/) | Artigos | Intermediário |
| [AWS Architecture Center](https://aws.amazon.com/architecture/) | Documentação | Todos |
| [Microsoft — Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) | Documentação | Todos |
