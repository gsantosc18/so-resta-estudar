# Referências Gerais

Este documento lista portais técnicos, blogs de engenharia e ferramentas de validação recomendados para aprofundamento contínuo em sistemas distribuídos de escala global.

---

## 1. Portais e Artigos de Engenharia

### 1.1. The Amazon Builders' Library
* **O que é**: Uma coleção de artigos técnicos detalhados escritos por engenheiros seniores e principais da Amazon, explicando como a AWS e a Amazon projetam, operam e escalam seus sistemas distribuídos.
* **Tópicos Recomendados**:
  * *Leader Election in Distributed Systems*
  * *Avoiding Fallback in Distributed Systems*
  * *Caching challenges and common patterns*
  * *Fairness in multi-tenant systems*
* **Link**: [The Amazon Builders' Library](https://aws.amazon.com/builders-library/)

### 1.2. Jepsen (Kyle Kingsbury)
* **O que é**: Um framework de testes de consistência de bancos de dados sob partições e falhas de rede severas. Kyle realiza auditorias independentes de consistência nos bancos mais famosos do mercado.
* **Importância**: O blog documenta anomalias de consistência encontradas em bancos como MongoDB, Cassandra, PostgreSQL, CockroachDB, Kafka, demonstrando falhas sutis nos algoritmos teóricos de consenso e isolamento de transações quando implementados fisicamente.
* **Link**: [Jepsen Blog and Analyses](https://jepsen.io/analyses)

### 1.3. Martin Fowler - Patterns of Distributed Systems
* **O que é**: Série de artigos focados em explicar detalhadamente os padrões de persistência e coordenação de dados compartilhados.
* **Link**: [Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/)

---

## 2. Blogs de Engenharia da Indústria
Excelente para encontrar estudos de caso práticos da indústria sobre decisões arquiteturais e incidentes reais (*post-mortems*):
* **Netflix Tech Blog**: Pioneiros em arquiteturas de microserviços na nuvem, Chaos Engineering (Chaos Monkey) e resiliência.
  * [Netflix Tech Blog on Medium](https://netflixtechblog.com/)
* **Uber Engineering Blog**: Detalhes sobre roteamento geo-distribuído, pipelines de processamento de dados e transações.
  * [Uber Engineering](https://www.uber.com/blog/engineering/)
* **Cloudflare Blog**: Foco em redes, segurança, Edge Computing e o protocolo HTTP/3 e gRPC em escala global.
  * [Cloudflare Blog](https://blog.cloudflare.com/)

---

## 3. RFCs Essenciais para Desenvolvedores
* **RFC 7230 / RFC 7231**: Protocolo HTTP/1.1 (Mensagens, Semânticas e Métodos).
* **RFC 7540**: Protocolo HTTP/2 (Multiplexação e compressão de cabeçalhos HPACK, base física do gRPC).
* **RFC 9110**: HTTP Semantics (Especificação de semânticas HTTP modernas unificadas).
