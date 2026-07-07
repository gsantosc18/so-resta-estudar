# Artigos Científicos (Papers) Clássicos de Sistemas Distribuídos

Este documento reúne a pesquisa sobre os artigos científicos que moldaram os conceitos e as implementações práticas de sistemas distribuídos na indústria.

---

## 1. Time, Clocks, and the Ordering of Events in a Distributed System
* **Autor**: Leslie Lamport
* **Ano**: 1978
* **Resumo**: O artigo mais citado da computação distribuída. Lamport demonstra que a noção de tempo físico não é confiável em sistemas distribuídos e introduz o conceito de **tempo lógico** (relação "aconteceu antes" ou *happened-before*) para ordenar eventos de forma causal. Introduz também o conceito de relógios lógicos e algoritmos de exclusão mútua distribuídos.
* **Importância para o Curso**: Ensina o estudante a pensar em termos de causalidade e ordem parcial, ao invés de horas absolutas de parede. É a base para entender replicação e estado.

---

## 2. Impossibility of Distributed Consensus with One Faulty Process (FLP Impossibility)
* **Autores**: Michael J. Fischer, Nancy A. Lynch e Michael S. Paterson
* **Ano**: 1985
* **Resumo**: Demonstra matematicamente que, em um modelo de sistema assíncrono, nenhum algoritmo de consenso determinístico pode garantir simultaneamente segurança (Safety - nunca decidir valores diferentes) e terminação (Liveness - eventualmente decidir algo), mesmo sob a falha de desligamento simples (crash-stop) de apenas um único processo.
* **Importância para o Curso**: Define os limites físicos de algoritmos como Paxos e Raft, mostrando por que eles precisam adotar premissas de tempo adicionais (timeouts, sincronia parcial) para funcionar na prática.

---

## 3. Dynamo: Amazon’s Highly Available Key-value Store
* **Autores**: Giuseppe DeCandia, et al.
* **Ano**: 2007
* **Resumo**: Apresenta a arquitetura de um banco de dados altamente disponível de escrita livre (*write-anywhere*), focado em manter o carrinho de compras funcionando mesmo sob partições de rede severas. Introduz e populariza técnicas de:
  * *Consistent Hashing* com nós virtuais (distribuição de dados uniforme).
  * *Sloppy Quorums* e *Hinted Handoff* (alta disponibilidade de escrita).
  * *Vector Clocks* (detecção de concorrência e reconciliação pelo cliente).
  * *Merkle Trees* (anti-entropia em background).
* **Importância para o Curso**: Estudo de caso seminal sobre consistência eventual e design de sistemas "AP".

---

## 4. Spanner: Google’s Globally-Distributed Database
* **Autores**: James C. Corbett, et al.
* **Ano**: 2012
* **Resumo**: Descreve o banco de dados global do Google que suporta transações ACID em escala global. A grande inovação é o uso do **TrueTime API**, que expõe a incerteza de relógios físicos locais (usando GPS e relógios atômicos redundantes nos datacenters). Ao expor a janela de erro de tempo $[\text{earliest}, \text{latest}]$, o Spanner introduz um algoritmo de sincronização em transações (Commit Wait) que garante linearizabilidade (consistência externa) global sem a necessidade de coordenadores centrais massivos.
* **Importância para o Curso**: Representa a evolução do NoSQL em direção ao NewSQL. Ensina como a incerteza de tempo físico pode ser incorporada ao design de bancos de dados.

---

## 5. In Search of an Understandable Consensus Algorithm (Raft)
* **Autores**: Diego Ongaro e John Ousterhout
* **Ano**: 2014
* **Resumo**: Apresenta o algoritmo de consenso Raft, projetado especificamente para ser mais fácil de entender e implementar do que o clássico Multi-Paxos da década de 1990. Raft divide o consenso em três subproblemas independentes: eleição do líder, replicação de logs e segurança (garantia de consistência).
* **Importância para o Curso**: Será o algoritmo de consenso de referência estudado no curso, permitindo ao aluno compreender replicação de máquinas de estado (SMR - *State Machine Replication*).

---

## 6. Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services
* **Autores**: Seth Gilbert e Nancy Lynch
* **Ano**: 2002
* **Resumo**: Demonstração e formalização matemática da hipótese enunciada por Eric Brewer no Simpósio de Princípios da Computação Distribuída (PODC) de 2000. Utilizando o modelo de I/O Automata sob rede assíncrona, Gilbert e Lynch provam que não é possível garantir Consistência (Linearizabilidade) e Disponibilidade em redes sujeitas a partições de mensagens.
* **Importância para o Curso**: Fundamentação do clássico Teorema CAP.