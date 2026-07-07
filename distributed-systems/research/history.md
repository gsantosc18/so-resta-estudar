# Evolução Histórica dos Sistemas Distribuídos

Este documento apresenta uma perspectiva histórica da computação distribuída, destacando os problemas fundamentais que cada era tentou resolver e como as arquiteturas modernas evoluíram.

---

## 1. A Era da Centralização: Mainframes (Décadas de 1960 a 1970)
* **Paradigma**: Um único computador central massivo (mainframe) executava todo o processamento de dados. Os usuários interagiam através de "terminais burros" (sem capacidade de processamento local).
* **Vantagens**: Consistência trivial (tudo acontecia em uma única CPU/memória), alta confiabilidade física e simplicidade de modelo mental.
* **Limitações**: Custo financeiro proibitivo para escala, ponto único de falha total (single point of failure - SPOF), e limitação física de crescimento vertical (escala vertical ou *scale-up*).

---

## 2. O Surgimento da Rede e o Modelo Cliente-Servidor (Década de 1980)
Com o desenvolvimento das redes locais (LANs) e a redução do custo dos computadores pessoais, a computação começou a se fragmentar.
* **Paradigma**: Divisão de responsabilidade. Computadores clientes lidam com a interface de usuário e alguma lógica de apresentação; servidores centralizados gerenciam recursos como arquivos (NFS), impressão e bancos de dados relacionais nascentes.
* **Marcos Tecnológicos**:
  * **RPC (Remote Procedure Call - Sun/ONC RPC, 1984)**: Primeira tentativa bem-sucedida de mascarar a rede, permitindo chamar funções em máquinas remotas como se fossem locais.
  * **NFS (Network File System)**: Compartilhamento transparente de arquivos via rede.
  * **DNS (Domain Name System, 1983)**: A primeira grande base de dados distribuída e hierárquica do mundo com cache agressivo.
* **Problema Resolvido**: Descentralização física e compartilhamento de recursos custosos.
* **Desafio**: A ilusão de que chamadas de rede são idênticas a chamadas locais de memória (falácia que causou muitos bugs de travamento e latência).

---

## 3. A Era dos Objetos Distribuídos e Middleware (Década de 1990)
Tentou-se unificar o desenvolvimento orientado a objetos com sistemas distribuídos.
* **Paradigma**: Middleware de objetos. Desenvolvedores podiam instanciar objetos em servidores remotos e invocar métodos neles de forma transparente.
* **Tecnologias**: CORBA (Common Object Request Broker Architecture), DCOM (Distributed Component Object Model) da Microsoft, e Java RMI (Remote Method Invocation).
* **Por que falhou em escala?**:
  * Acoplamento excessivamente forte entre sistemas.
  * Complexidade extrema das especificações (especialmente CORBA).
  * Incapacidade de tolerar latência de rede e falhas parciais de forma transparente.
  * Falta de interoperabilidade real pela internet nascente.

---

## 4. A Explosão da Web e a Escala Google (Anos 2000)
A popularização da Internet forçou empresas de tecnologia a lidar com volumes de dados e acessos nunca antes vistos. Os computadores individuais mais potentes do mercado não eram capazes de suportar a carga de indexação da web inteira.
* **Paradigma**: Escala horizontal (*scale-out*) utilizando hardware de baixo custo (*commodity hardware*). Em vez de um mainframe caro, utilizam-se milhares de servidores baratos interconectados.
* **Trilogia Clássica do Google (Papers que mudaram a indústria)**:
  1. **GFS (Google File System, 2003)**: Um sistema de arquivos distribuído otimizado para arquivos gigantescos lidos em lote, tolerando falhas frequentes de discos individuais.
  2. **MapReduce (2004)**: Modelo de programação para processamento paralelo massivo de dados em clusters.
  3. **Bigtable (2006)**: Banco de dados distribuído de alta performance estruturado como um mapa esparso multidimensional.
* **Nascimento do Hadoop (2006)**: Doug Cutting cria o HDFS e MapReduce open-source baseado nos papers do Google, democratizando o processamento de Big Data.

---

## 5. A Revolução NoSQL e Consistência Eventual (2007-2012)
Em 2007, a Amazon publica o paper do **Dynamo DB** (não confundir com o serviço DynamoDB gerenciado atual), demonstrando como um banco de dados altamente disponível (AP) estruturado em anel (Consistent Hashing) podia suportar o carrinho de compras do site sem interrupções, aceitando escritas mesmo durante partições de rede ao custo de consistência eventual e resolução de conflitos no cliente (Vector Clocks).
* **Paradigma**: Abandono do modelo ACID dos bancos relacionais tradicionais em favor de escalabilidade linear e alta disponibilidade.
* **Nascimento do Movimento NoSQL**: Centenas de bancos como Cassandra (combinando Bigtable e Dynamo), MongoDB, CouchDB e Redis ganham adoção em massa.
* **Trade-off Central**: Sacrificou-se a facilidade de programação dos bancos relacionais (SQL, transações ACID complexas) em troca de performance bruta e disponibilidade extrema.

---

## 6. Microserviços e Computação em Nuvem (2012-2018)
Com a consolidação da AWS e o nascimento do Netflix OSS, o modelo arquitetural migra do monolito centralizado para centenas de pequenos serviços independentes.
* **Paradigma**: Arquitetura orientada a serviços de grão fino (Microserviços). Cada serviço é dono de seu próprio banco de dados e comunica-se via HTTP/REST ou mensageria assíncrona.
* **Marcos**:
  * Conteinerização (Docker, 2013) e orquestração de containers (Kubernetes, 2015).
  * Arquiteturas orientadas a eventos e brokers de alta vazão (Apache Kafka).
  * Padrões de resiliência distribuída (Circuit Breaker, Service Mesh para roteamento seguro).

---

## 7. A Era NewSQL e Consistência Forte Distribuída (2012-Presente)
O Google publica o paper do **Spanner** em 2012. O Spanner é o primeiro banco de dados globalmente distribuído que oferece transações ACID multitable e consistência externa (linearizabilidade) usando hardware especial: relógios atômicos e receptores GPS integrados nos datacenters (API TrueTime) combinados com o algoritmo de consenso Paxos.
* **Paradigma**: Retorno às transações ACID e SQL tradicional, mas rodando de forma nativamente distribuída, particionada e replicada sem comprometer a integridade dos dados sob falhas de datacenter inteiro.
* **Tecnologias Derivadas/Inspiradas**: CockroachDB, YugabyteDB, TiDB (utilizando Raft em vez de Paxos e TrueTime lógico adaptado).

---

## 8. Tendências Atuais (Edge, Serverless e Consistência Flexível)
* **Edge Computing**: Trazer computação e persistência de dados para o mais próximo possível do usuário final (Cloudflare Workers, Vercel, Fly.io), dividindo a aplicação entre datacenters globais centralizados e centenas de pontos de presença periféricos.
* **CRDTs (Conflict-free Replicated Data Types)**: Estruturas de dados matemáticas que resolvem conflitos de sincronização de forma determinística sem a necessidade de consenso centralizado de rede (muito usado em ferramentas colaborativas e bases de dados edge).