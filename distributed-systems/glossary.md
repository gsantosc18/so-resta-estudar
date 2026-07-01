# Glossário de Sistemas Distribuídos

Este glossário fornece definições claras e resumidas dos conceitos e siglas mais comuns no estudo de Sistemas Distribuídos para referência rápida.

---

### A
* **ACID (Atomicity, Consistency, Isolation, Durability)**: Conjunto de propriedades que garantem que transações de banco de dados locais sejam processadas de forma confiável (Tudo ou Nada, Consistência de esquema, Isolamento de execução e Durabilidade pós-falha).
* **AMQP (Advanced Message Queuing Protocol)**: Um protocolo padrão aberto de camada de aplicação para mensageria assíncrona, que rege o funcionamento do RabbitMQ.
* **API (Application Programming Interface)**: Conjunto de definições e protocolos que permite que uma aplicação de software se integre e se comunique com outra.
* **Availability (Disponibilidade)**: Garantia de que todo nó funcional na rede responde com sucesso (sem erro) a qualquer requisição recebida.

---

### B
* **Byzantine Fault (Falha Bizantina)**: Uma falha caracterizada por comportamento arbitrário ou malicioso de um ou mais nós em uma rede distribuída (como mentir sobre valores de transações).

---

### C
* **CAP (Consistency, Availability, Partition Tolerance)**: Teorema físico que prova a impossibilidade de um sistema distribuído de dados garantir simultaneamente Consistência linearizável, Disponibilidade total e tolerância a partições de rede físicas.
* **CDC (Change Data Capture)**: Captura e propagação automatizada em tempo real de alterações em bancos de dados.
* **Circuit Breaker (Disjuntor)**: Padrão de resiliência que previne chamadas remotas de rede consecutivas para serviços lentos, falhando imediatamente para liberar recursos do cliente.
* **Consensus (Consenso)**: Concordância unânime entre múltiplos nós independentes e não confiáveis sobre um valor proposto (base do Raft e Paxos).
* **CQRS (Command Query Responsibility Segregation)**: Padrão que divide o modelo de escrita (comandos que alteram dados) do modelo de leitura (consultas rápidas otimizadas).

---

### D
* **DNS (Domain Name System)**: Sistema hierárquico distribuído que traduz nomes de domínios legíveis por humanos (ex: `google.com`) para endereços IP numéricos da máquina.
* **Drift (Deriva do Relógio)**: Desvio gradual do tempo medido por um relógio de quartzo em relação a um relógio padrão ideal, causado por variações físicas e de temperatura.

---

### E
* **Event Sourcing (Origem por Eventos)**: Padrão onde o estado atual da aplicação não é salvo diretamente, mas reconstruído reproduzindo uma sequência ordenada e imutável de eventos históricos de alteração.

---

### F
* **FLP (Fischer, Lynch, Paterson)**: Prova de impossibilidade teórica que demonstra que nenhum consenso determinístico e totalmente tolerante a falhas é possível em redes assíncronas puras.

---

### G
* **gRPC (Google Remote Procedure Call)**: Framework RPC de código aberto desenvolvido pelo Google que utiliza HTTP/2 para transporte e Protocol Buffers para serialização tipada de alta performance.

---

### L
* **Linearizability (Linearizabilidade)**: Garantia de consistência forte que faz o sistema distribuído parecer ter apenas uma única cópia dos dados, com atualizações instantâneas no tempo físico.

---

### O
* **Outbox Pattern (Padrão de Caixa de Saída)**: Padrão que garante a publicação atômica de eventos em message brokers escrevendo primeiramente em uma tabela local de Outbox na mesma transação de negócio ACID local.

---

### P
* **PACELC**: Extensão do Teorema CAP. Se houver partição (**P**artition), escolha entre Disponibilidade (**A**vailability) e Consistência (**C**onsistency); senão (**E**lse), escolha entre Latência (**L**atency) e Consistência (**C**onsistency).

---

### R
* **RPC (Remote Procedure Call)**: Tecnologia que permite chamar procedimentos ou funções em outro computador na rede como se fossem chamadas locais de memória.

---

### S
* **Saga**: Padrão de transação distribuída de longa duração executada como uma sequência de transações locais combinadas com transações compensatórias em caso de falha.
* **Sharding (Particionamento)**: Divisão horizontal de um banco de dados em múltiplos servidores físicos independentes baseada em chaves, visando escalabilidade de escrita.
* **Split-Brain (Cérebro Dividido)**: Anomalia onde uma partição de rede resulta na eleição indesejada de múltiplos líderes ativos concorrentes, corrompendo a consistência das informações.

---

### V
* **Vector Clocks (Relógios Vetoriais)**: Vetores inteiros mantidos pelas réplicas para rastrear e detectar a relação de causalidade e concorrência real entre eventos distribuídos.

---

### W
* **WAL (Write-Ahead Log)**: Log de append-only físico onde transações de bancos de dados são salvas em disco de forma sequencial rápida antes de atualizar as tabelas estruturadas na memória principal.
