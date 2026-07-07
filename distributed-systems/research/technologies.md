# Análise Comparativa de Tecnologias

Este documento apresenta a análise de trade-offs das tecnologias fundamentais que serão abordadas ou utilizadas como base de ferramentas práticas ao longo do curso.

---

## 1. Protocolos de Transporte e Rede

### 1.1. HTTP/1.1 vs. HTTP/2 vs. HTTP/3
* **HTTP/1.1**:
  * *Mecanismo*: Abre conexões TCP separadas para requisições concorrentes ou sofre com *Head-of-Line Blocking* (HoLB) na mesma conexão persistente (pipelining falho).
  * *Trade-off*: Altamente interoperável, simples de depurar (texto plano), mas ineficiente para APIs distribuídas de alta vazão devido à sobrecarga de handshake TCP constante e headers repetitivos não compactados.
* **HTTP/2**:
  * *Mecanismo*: Multiplexação total em uma única conexão TCP através de frames binários. Compressão de cabeçalho HPACK. Fluxo bidirecional (Server Push).
  * *Trade-off*: Extremamente eficiente para RPC (base física do gRPC). Reduz latência e consumo de portas de rede. *Limitação*: Se houver perda de pacotes na rede física, a conexão TCP inteira trava aguardando a retransmissão (HoLB no nível do TCP).
* **HTTP/3**:
  * *Mecanismo*: Utiliza QUIC (baseado em UDP) em vez de TCP. Controle de congestionamento e criptografia (TLS 1.3) embutidos no protocolo de transporte.
  * *Trade-off*: Elimina o HoLB de nível de transporte (a perda de pacotes em um fluxo não afeta os outros fluxos). Conexões mais rápidas em redes instáveis (móveis/edge).

---

## 2. Serialização e Formato de Dados

### 2.1. JSON vs. Protocol Buffers (Protobuf)
* **JSON (JavaScript Object Notation)**:
  * *Estrutura*: Texto legível por humanos. Esquema implícito ou ausente.
  * *Vantagens*: Simplicidade de leitura, suporte nativo universal em qualquer linguagem e facilidade de depuração.
  * *Desvantagens*: Tamanho de payload massivo (chaves repetidas em todo objeto), alto custo de CPU para parsear texto de/para objetos em memória.
* **Protocol Buffers (Protobuf)**:
  * *Estrutura*: Binário compacto fortemente tipado. Esquema definido explicitamente em arquivos `.proto`.
  * *Vantagens*: Payload minúsculo (transmissão de rede ultra-rápida), serialização/deserialização extremamente rápida e geração de código de contrato estrito automática.
  * *Desvantagens*: Ilegível diretamente por humanos (exige ferramentas adicionais para inspecionar o tráfego da rede).

---

## 3. Mensageria e Streaming

### 3.1. RabbitMQ vs. Apache Kafka
* **RabbitMQ (AMQP)**:
  * *Modelo*: Broker de mensagens inteligente com consumidores burros. A mensagem é empurrada (*push*) pelo broker para os consumidores ativos. Uma vez confirmada pelo consumidor (*ack*), a mensagem é deletada da fila.
  * *Padrões de Roteamento*: Extremamente flexível e complexo (Direct, Fanout, Topic, Headers Exchanges).
  * *Trade-off*: Ideal para filas de tarefas dinâmicas e roteamento refinado de mensagens. Não escala horizontalmente de forma simples como log distribuído. Não possui capacidade de reproduzir mensagens históricas.
* **Apache Kafka**:
  * *Modelo*: Log de commit distribuído (storage de mensagens) burro com consumidores inteligentes. As mensagens são imutáveis e ordenadas em partições em disco de forma sequencial. Os consumidores puxam (*pull*) as mensagens rastreando seu próprio ponteiro de leitura (*offset*).
  * *Trade-off*: Ideal para streaming de eventos de alta vazão, Event Sourcing e processamento de dados históricos em tempo real. Permite que múltiplos consumidores leiam os mesmos dados em ritmos diferentes sem interferência. *Desvantagem*: Não suporta roteamento dinâmico avançado nativo; exige que o consumidor filtre ou crie tópicos adicionais.

---

## 4. Linguagens e Concorrência na JVM

### 4.1. Java Platform: Thread Tradicional vs. Virtual Thread vs. Kotlin Coroutine
* **Platform Threads (OS Threads)**:
  * *Mecanismo*: Mapeamento direto de $1:1$ para as threads do sistema operacional.
  * *Limitação*: Custo de memória alto (~1MB por thread) e alto custo de context switch do kernel do SO. Limita a concorrência a alguns milhares de threads simultâneas por máquina.
* **Virtual Threads (Java 21+)**:
  * *Mecanismo*: Mapeamento de $M:N$ (muitas threads virtuais executando sobre poucas threads de plataforma). Gerenciadas inteiramente pela JVM.
  * *Vantagens*: Permite criar milhões de threads simultâneas. Estilo de programação síncrono e imperativo tradicional (compatível com APIs JDBC e Spring MVC antigas). A JVM suspende a thread virtual quando encontra uma operação de I/O bloqueante, liberando a thread de plataforma subjacente para rodar outras tarefas.
* **Kotlin Coroutines**:
  * *Mecanismo*: Concorrência cooperativa baseada em compilador (máquina de estados sob suspensão).
  * *Vantagens*: Excelente controle de concorrência estruturada (*structured concurrency*), tratamento rico de fluxos reativos assíncronos (`Flow`) e alta expressividade. Muito maduro antes do Loom.