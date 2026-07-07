# Livros de Referência em Sistemas Distribuídos

Este documento consolida a lista anotada de livros clássicos utilizados como base bibliográfica e de pesquisa para a elaboração deste curso.

---

## 1. Designing Data-Intensive Applications (DDIA)
* **Autor**: Martin Kleppmann
* **Editora/Ano**: O'Reilly, 2017
* **Foco Principal**: A ponte definitiva entre a teoria acadêmica de sistemas distribuídos e a aplicação prática na engenharia de software contemporânea.
* **Tópicos Chave de Influência neste Curso**:
  * Modelos de armazenamento em disco (SSTables, LSM-Trees vs. B-Trees).
  * Replicação (Single-leader, Multi-leader, Leaderless) e seus problemas (Read-after-write, Monotonic Reads).
  * Particionamento (Sharding) e rebalanceamento.
  * Consistência e Consenso (Linearizabilidade, Transações distribuídas, 2PC).
  * Sistemas orientados a eventos (Kafka, logs de commit distribuídos).
* **Relevância**: É considerado a "bíblia" prática para engenheiros que projetam sistemas distribuídos modernos em larga escala.

---

## 2. Distributed Systems: Principles and Paradigms
* **Autores**: Maarten van Steen e Andrew S. Tanenbaum
* **Editora/Ano**: Edição independente/Pearson (Edição atualizada constante)
* **Foco Principal**: Referência acadêmica clássica cobrindo os pilares teóricos fundamentais.
* **Tópicos Chave de Influência neste Curso**:
  * Arquiteturas de rede e RPC.
  * Modelos de comunicação (momento de envio, sincronia).
  * Sincronização lógica e física de relógios.
  * Algoritmos de eleição de líder (Bully Algorithm, Ring Algorithm).
  * Sistemas de arquivos distribuídos clássicos (NFS, DFS).
* **Relevância**: Ideal para formalização matemática e teórica dos conceitos de tolerância a falhas e arquiteturas de middleware.

---

## 3. Database Internals: A Deep Dive into How Distributed Data Systems Work
* **Autor**: Alex Petrov
* **Editora/Ano**: O'Reilly, 2019
* **Foco Principal**: Detalhamento do funcionamento interno de motores de banco de dados locais e distribuídos.
* **Tópicos Chave de Influência neste Curso**:
  * Diferença entre motores de leitura/escrita OLTP.
  * Replicação distribuída ativa/passiva.
  * Algoritmos de consenso detalhados na perspectiva de armazenamento (Paxos e Raft na prática).
  * Controle de concorrência distribuído (2PL, MVCC distribuído).
* **Relevância**: Fornece a base necessária para a seção avançada de Bancos de Dados Distribuídos.

---

## 4. Patterns of Distributed Systems
* **Autor**: Unmesh Joshi
* **Editora/Ano**: Addison-Wesley / Publicação online ativa (Martin Fowler)
* **Foco Principal**: Catálogo estruturado de padrões de design recorrentes na implementação de brokers de mensagens, bancos de dados e sistemas de consenso modernos.
* **Tópicos Chave de Influência neste Curso**:
  * *Write-Ahead Log (WAL)*.
  * *Segmented Log* (base do Kafka).
  * *High-Water Mark* (marcação de consistência em réplicas).
  * *Heartbeat* e *Lease* (gerenciamento de liderança e tempo de expiração).
  * *Quorum* e *Leader and Followers*.
* **Relevância**: Essencial para a implementação prática de código puro neste curso (simulação de algoritmos na memória).

---

## 5. Enterprise Integration Patterns
* **Autores**: Gregor Hohpe e Bobby Woolf
* **Editora/Ano**: Addison-Wesley, 2003
* **Foco Principal**: Padrões de integração de sistemas através de mensageria assíncrona.
* **Tópicos Chave de Influência neste Curso**:
  * Message Channels, Routers, Translators.
  * Idempotência (*Idempotent Receiver*).
  * Tratamento de falhas em mensageria (*Dead Letter Channel*).
* **Relevância**: Base para o módulo de Mensageria, APIs assíncronas e Padrão de Saga Orientado a Eventos.