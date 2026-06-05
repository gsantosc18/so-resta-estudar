# Glossário — Arquitetura Distribuída

Termos técnicos essenciais organizados alfabeticamente. Cada termo inclui definição, contexto de uso e referência ao tópico de estudo relacionado.

---

## A

### API Gateway
Ponto de entrada único para todas as requisições de clientes em uma arquitetura de microserviços. Responsável por roteamento, autenticação, rate limiting e agregação de respostas.
→ Ver: [API Gateway](07-orchestration/02-api-gateway.md)

### At-Least-Once Delivery
Garantia de entrega onde a mensagem é entregue pelo menos uma vez, podendo haver duplicatas. Exige que o consumidor seja **idempotente**.
→ Ver: [Message Brokers](02-communication/03-message-brokers.md)

### At-Most-Once Delivery
Garantia de entrega onde a mensagem é entregue no máximo uma vez. Pode haver perda de mensagens, mas nunca duplicatas.
→ Ver: [Message Brokers](02-communication/03-message-brokers.md)

### Availability (Disponibilidade)
No contexto do Teorema CAP, a garantia de que toda requisição recebe uma resposta (sucesso ou falha), sem garantia de que a resposta contém a versão mais recente dos dados.
→ Ver: [Teorema CAP](01-foundations/01-cap-theorem.md)

---

## B

### Backoff Exponencial
Estratégia de retry onde o intervalo entre tentativas cresce exponencialmente (ex: 1s, 2s, 4s, 8s), geralmente com jitter aleatório para evitar thundering herd.
→ Ver: [Retry e Backoff](04-resilience/02-retry-and-backoff.md)

### Bulkhead Pattern
Padrão de resiliência que isola componentes do sistema em compartimentos, impedindo que a falha de um afete os demais. Inspirado nos compartimentos de um navio.
→ Ver: [Bulkhead Pattern](04-resilience/03-bulkhead-pattern.md)

### Broker (Message Broker)
Sistema intermediário que recebe, armazena e encaminha mensagens entre produtores e consumidores. Exemplos: Kafka, RabbitMQ, NATS.
→ Ver: [Message Brokers](02-communication/03-message-brokers.md)

---

## C

### CAP Theorem
Teorema que afirma que um sistema distribuído pode garantir no máximo duas das três propriedades: **Consistency**, **Availability** e **Partition Tolerance**.
→ Ver: [Teorema CAP](01-foundations/01-cap-theorem.md)

### Causal Consistency
Modelo de consistência que garante que operações causalmente relacionadas são vistas na mesma ordem por todos os nós, sem exigir ordenação de operações concorrentes.
→ Ver: [Modelos de Consistência](01-foundations/02-consistency-models.md)

### CDC (Change Data Capture)
Técnica para capturar mudanças em um banco de dados e propagá-las como eventos. Fundamental para o **Outbox Pattern** e **Event Sourcing**.
→ Ver: [Outbox Pattern](03-data-patterns/03-outbox-pattern.md)

### Circuit Breaker
Padrão que monitora falhas em chamadas a serviços remotos e "abre o circuito" quando um limiar é atingido, evitando cascata de falhas.
→ Ver: [Circuit Breaker](04-resilience/01-circuit-breaker.md)

### Compensating Transaction
Transação que desfaz o efeito de uma transação anterior em um fluxo distribuído. Essencial no **Saga Pattern**.
→ Ver: [Saga Pattern](03-data-patterns/02-saga-pattern.md)

### Consensus (Consenso)
Processo pelo qual nós de um sistema distribuído concordam sobre um valor ou estado. Algoritmos: Paxos, Raft, Zab.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

### Consistency (Consistência)
No contexto do Teorema CAP, a garantia de que todos os nós veem os mesmos dados ao mesmo tempo.
→ Ver: [Teorema CAP](01-foundations/01-cap-theorem.md)

### Consumer Group
Grupo de consumidores que dividem o processamento de partições de um tópico em um message broker, permitindo paralelismo.
→ Ver: [Message Brokers](02-communication/03-message-brokers.md)

### CQRS (Command Query Responsibility Segregation)
Padrão que separa as operações de leitura (Query) e escrita (Command) em modelos distintos, cada um otimizado para seu propósito.
→ Ver: [CQRS](03-data-patterns/05-cqrs.md)

---

## D

### Deadline Propagation
Técnica de propagar o prazo máximo (deadline) de uma requisição através de toda a cadeia de serviços, garantindo que o timeout total seja respeitado.
→ Ver: [Timeout e Deadline Propagation](04-resilience/04-timeout-and-deadline-propagation.md)

### Distributed Tracing
Técnica para rastrear o fluxo de uma requisição através de múltiplos serviços, atribuindo um **trace ID** único a cada requisição.
→ Ver: [Distributed Tracing](06-observability/01-distributed-tracing.md)

---

## E

### Eventual Consistency
Modelo de consistência que garante que, na ausência de novas escritas, todos os nós eventualmente convergem para o mesmo estado. Trade-off comum para alta disponibilidade.
→ Ver: [Modelos de Consistência](01-foundations/02-consistency-models.md)

### Event Sourcing
Padrão onde o estado da aplicação é derivado de uma sequência imutável de eventos, em vez de armazenar apenas o estado atual.
→ Ver: [Event Sourcing](03-data-patterns/04-event-sourcing.md)

### Event-Driven Architecture (EDA)
Estilo arquitetural onde componentes se comunicam através da produção e consumo de eventos, promovendo baixo acoplamento.
→ Ver: [Event-Driven Architecture](02-communication/04-event-driven-architecture.md)

### Exactly-Once Delivery
Garantia (semântica) de que uma mensagem é processada exatamente uma vez. Na prática, geralmente implementada como at-least-once + idempotência.
→ Ver: [Idempotência](04-resilience/05-idempotency.md)

---

## F

### Failover
Processo automático de transferir a carga de um componente falho para um componente redundante.
→ Ver: [Horizontal vs Vertical Scaling](05-scalability/01-horizontal-vs-vertical-scaling.md)

### Fan-out
Padrão onde uma mensagem/evento é distribuída para múltiplos consumidores simultaneamente.
→ Ver: [Event-Driven Architecture](02-communication/04-event-driven-architecture.md)

---

## G

### gRPC
Framework de RPC (Remote Procedure Call) desenvolvido pelo Google, baseado em HTTP/2 e Protocol Buffers. Suporta streaming bidirecional.
→ Ver: [REST e gRPC](02-communication/02-rest-and-grpc.md)

---

## H

### Health Check
Endpoint que indica se um serviço está funcionando corretamente. Liveness (está vivo?) e Readiness (está pronto para receber tráfego?).
→ Ver: [Health Checks e Readiness](06-observability/04-health-checks-and-readiness.md)

### Horizontal Scaling (Scale Out)
Estratégia de adicionar mais instâncias/máquinas para distribuir a carga, em vez de aumentar a capacidade de uma única máquina.
→ Ver: [Horizontal vs Vertical Scaling](05-scalability/01-horizontal-vs-vertical-scaling.md)

---

## I

### Idempotência
Propriedade de uma operação que produz o mesmo resultado independentemente de quantas vezes é executada. Essencial em sistemas distribuídos para lidar com retentativas.
→ Ver: [Idempotência](04-resilience/05-idempotency.md)

### Idempotency Key
Chave única associada a uma operação que permite ao servidor identificar e deduplicar requisições repetidas.
→ Ver: [Idempotência](04-resilience/05-idempotency.md)

---

## J

### Jitter
Variação aleatória adicionada ao intervalo de retry para evitar que múltiplos clientes façam retry ao mesmo tempo (thundering herd).
→ Ver: [Retry e Backoff](04-resilience/02-retry-and-backoff.md)

---

## L

### Leader Election
Processo pelo qual os nós de um cluster elegem um líder responsável por coordenar operações. Fundamental em algoritmos de consenso.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

### Linearizability
O modelo de consistência mais forte: toda operação parece ocorrer instantaneamente em algum ponto entre sua invocação e resposta. Equivalente a ter uma única cópia dos dados.
→ Ver: [Modelos de Consistência](01-foundations/02-consistency-models.md)

### Load Balancing
Distribuição de requisições entre múltiplas instâncias de um serviço para otimizar utilização e minimizar latência.
→ Ver: [Load Balancing](05-scalability/02-load-balancing.md)

---

## M

### Materialized View
Visão pré-computada dos dados otimizada para consultas. Componente fundamental do lado de leitura no **CQRS**.
→ Ver: [CQRS](03-data-patterns/05-cqrs.md)

### Message Broker
→ Ver: **Broker**

---

## N

### Network Partition
Falha de rede que divide um sistema distribuído em dois ou mais grupos de nós que não conseguem se comunicar entre si.
→ Ver: [Teorema CAP](01-foundations/01-cap-theorem.md)

---

## O

### Observability
Capacidade de entender o estado interno de um sistema a partir de suas saídas externas (logs, métricas, traces).
→ Ver: [Distributed Tracing](06-observability/01-distributed-tracing.md)

### Outbox Pattern
Padrão que garante a publicação confiável de eventos usando uma tabela "outbox" no mesmo banco de dados da transação de negócio.
→ Ver: [Outbox Pattern](03-data-patterns/03-outbox-pattern.md)

---

## P

### Partition Tolerance
No contexto do Teorema CAP, a capacidade do sistema de continuar operando apesar de falhas na comunicação entre nós (partições de rede).
→ Ver: [Teorema CAP](01-foundations/01-cap-theorem.md)

### Partitioning (Particionamento)
Divisão dos dados em subconjuntos (partições) distribuídos entre diferentes nós para escalabilidade.
→ Ver: [Sharding e Particionamento](05-scalability/04-sharding-and-partitioning.md)

### Projection
No contexto de Event Sourcing, o processo de reconstruir o estado atual a partir da sequência de eventos armazenados.
→ Ver: [Event Sourcing](03-data-patterns/04-event-sourcing.md)

---

## Q

### Quorum
Número mínimo de nós que devem concordar para que uma operação (leitura ou escrita) seja considerada bem-sucedida. Fórmula: `W + R > N`.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

---

## R

### Raft
Algoritmo de consenso projetado para ser mais compreensível que o Paxos. Utilizado por etcd, CockroachDB, Consul.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

### Rate Limiting
Controle da taxa de requisições aceitas por um serviço em um período de tempo, protegendo contra sobrecarga e abuso.
→ Ver: [Rate Limiting](05-scalability/05-rate-limiting.md)

### Replication
Manutenção de cópias dos dados em múltiplos nós para disponibilidade e tolerância a falhas.
→ Ver: [Modelos de Consistência](01-foundations/02-consistency-models.md)

---

## S

### Saga
Sequência de transações locais onde cada transação publica um evento que aciona a próxima etapa. Em caso de falha, executa **compensating transactions**.
→ Ver: [Saga Pattern](03-data-patterns/02-saga-pattern.md)

### Service Discovery
Mecanismo pelo qual serviços localizam uns aos outros dinamicamente, sem configuração estática de endpoints.
→ Ver: [Service Discovery](07-orchestration/01-service-discovery.md)

### Service Mesh
Camada de infraestrutura dedicada para comunicação serviço-a-serviço, gerenciando tráfego, segurança e observabilidade via sidecar proxies.
→ Ver: [Service Mesh](07-orchestration/03-service-mesh.md)

### Sharding
Técnica de particionamento horizontal dos dados onde cada shard contém um subconjunto dos dados baseado em uma shard key.
→ Ver: [Sharding e Particionamento](05-scalability/04-sharding-and-partitioning.md)

### Sidecar
Padrão de deploy onde um container auxiliar é executado ao lado do container principal, adicionando funcionalidades (logging, proxy, segurança) sem modificar o serviço.
→ Ver: [Service Mesh](07-orchestration/03-service-mesh.md)

### Split-Brain
Cenário onde uma partição de rede faz com que dois subgrupos de nós acreditem ser o cluster ativo, levando a inconsistências.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

### Strong Consistency
→ Ver: **Linearizability**

---

## T

### Thundering Herd
Problema onde múltiplos clientes fazem retry simultaneamente após uma falha, sobrecarregando o serviço que acabou de se recuperar.
→ Ver: [Retry e Backoff](04-resilience/02-retry-and-backoff.md)

### Timeout
Limite de tempo para conclusão de uma operação. Em sistemas distribuídos, deve ser cuidadosamente configurado e propagado.
→ Ver: [Timeout e Deadline Propagation](04-resilience/04-timeout-and-deadline-propagation.md)

### Trace ID
Identificador único que acompanha uma requisição através de todos os serviços em um sistema distribuído.
→ Ver: [Distributed Tracing](06-observability/01-distributed-tracing.md)

### Two-Phase Commit (2PC)
Protocolo de consenso para transações distribuídas com fase de preparação e fase de commit. Bloqueante e com problemas de disponibilidade.
→ Ver: [Consenso Distribuído](01-foundations/03-distributed-consensus.md)

---

## V

### Vector Clock
Estrutura de dados para rastrear causalidade entre eventos em sistemas distribuídos. Cada nó mantém um vetor de contadores lógicos.
→ Ver: [Modelos de Consistência](01-foundations/02-consistency-models.md)

### Vertical Scaling (Scale Up)
Estratégia de aumentar a capacidade (CPU, RAM, disco) de uma única máquina. Tem limites físicos e não oferece redundância.
→ Ver: [Horizontal vs Vertical Scaling](05-scalability/01-horizontal-vs-vertical-scaling.md)

---

## W

### Write-Ahead Log (WAL)
Log persistente onde as operações são escritas antes de serem aplicadas ao estado. Garante durabilidade e recuperação após falhas.
→ Ver: [Event Sourcing](03-data-patterns/04-event-sourcing.md)
