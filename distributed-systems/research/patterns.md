# Padrões de Projeto em Sistemas Distribuídos

Este documento cataloga os principais padrões de design arquitetural, de resiliência e de persistência distribuída que serão abordados teoricamente e aplicados no projeto prático do curso.

---

## 1. Padrões de Integração e Dados

### 1.1. Saga Pattern
* **Problema**: Transações tradicionais ACID distribuídas baseadas em protocolo Two-Phase Commit (2PC) possuem altíssimo custo de bloqueio (locks), latência elevada e não escalam bem, além de estarem sujeitas a bloqueios infinitos em caso de queda do coordenador. Como garantir consistência em transações de longa duração (*long-running transactions*) abrangendo múltiplos serviços com bancos de dados independentes?
* **Solução**: Dividir a transação global em uma sequência de transações locais em cada serviço envolvido. Cada etapa da Saga executa uma transação local e dispara um evento. Se alguma etapa falhar, a Saga dispara **ações compensatórias** (transações locais reversas que desfazem os efeitos colaterais anteriores, restaurando a consistência lógica).
* **Tipos**:
  * **Coreografia (Choreography)**: Sem coordenador central. Os serviços reagem autonomamente a eventos disparados pelos outros serviços. *Trade-off*: Simples para poucas etapas, mas complexo de visualizar e debugar em fluxos longos (risco de dependências circulares de eventos).
  * **Orquestração (Orchestration)**: Um serviço centralizado (orquestrador) dita os passos e decide quando chamar cada serviço local e quando disparar compensações. *Trade-off*: Facilita o controle e auditoria do estado do fluxo, mas introduz um ponto central de acoplamento de regras de negócio.

### 1.2. Outbox Pattern
* **Problema**: Em sistemas orientados a eventos, uma operação comum é salvar um registro no banco de dados local e enviar um evento correspondente para um message broker (ex: registrar pedido e enviar `OrderCreated`). Se o banco falhar após a publicação do evento, os dados divergem. Se a publicação do evento falhar após o commit do banco, o resto do ecossistema não sabe da mudança. Como garantir que a gravação local e a publicação do evento aconteçam de forma estritamente atômica?
* **Solução**: Adicionar uma tabela de "Outbox" (caixa de saída) no mesmo banco de dados relacional local. A operação de salvar o dado principal e inserir o evento na tabela Outbox é feita em uma **única transação de banco de dados ACID local**. Um componente secundário em background (Message Relay / Publisher Reader) varre periodicamente a tabela Outbox (ou escuta via CDC - *Change Data Capture*) e publica as mensagens no broker, marcando-as como enviadas.
* **Semântica**: Garante entrega *at-least-once* (pelo menos uma vez).

### 1.3. Idempotent Receiver (Receptor Idempotente)
* **Problema**: Devido às falhas de rede em brokers assíncronos que operam com entrega *at-least-once* (como Kafka ou RabbitMQ com confirmações), mensagens duplicadas serão enviadas ao consumidor. Como processar mensagens repetidas sem gerar duplicidade de efeitos colaterais (ex: cobrar o cliente duas vezes)?
* **Solução**: Garantir que o receptor identifique mensagens através de um ID único de transação/mensagem. Antes de processar, o receptor valida se aquele ID já foi processado com sucesso em uma tabela de controle de idempotência. Se sim, ignora a mensagem ou retorna a resposta previamente salva.

---

## 2. Padrões de Resiliência

### 2.1. Circuit Breaker (Disjuntor)
* **Problema**: Um serviço lento ou indisponível pode causar o esgotamento de threads no serviço cliente que aguarda pacientemente por respostas (cascateamento de falhas).
* **Solução**: Envelopar a chamada de rede em uma máquina de estados com três estados:
  * **Closed (Fechado)**: Operação normal. Requisições passam direto. Falhas consecutivas incrementam um contador.
  * **Open (Aberto)**: Se a taxa de erro atingir um limite, o disjuntor abre. Requisições falham imediatamente (*fail-fast*), retornando um fallback ou erro instantâneo, poupando o serviço remoto e preservando recursos locais.
  * **Half-Open (Meio-Aberto)**: Após um período de tempo determinado, o disjuntor deixa passar um número limitado de requisições de teste. Se tiverem sucesso, fecha o disjuntor; se falharem, volta para o estado Aberto.

### 2.2. Bulkhead (Compartimentalização)
* **Problema**: Um único endpoint lento ou com problemas pode monopolizar todas as threads disponíveis do servidor da aplicação, deixando o resto do sistema inteiro travado.
* **Solução**: Dividir os recursos de execução (pools de threads ou conexões com bancos) em isolamentos específicos para cada tipo de chamada de recurso. Inspirado em compartimentos estanques de navios para evitar naufrágios.

---

## 3. Padrões de Persistência Distribuída

### 3.1. Write-Ahead Log (WAL)
* **Problema**: Escritas diretas em estruturas de dados em memória organizadas em árvores complexas (B-Trees) em disco são lentas e, em caso de crash do servidor, o estado em memória é perdido.
* **Solução**: Toda escrita é primeiramente gravada de forma puramente sequencial (append-only) em um arquivo de log simples em disco antes de ser aplicada na estrutura de memória. Gravações sequenciais em disco são extremamente rápidas e, em caso de crash, o banco de dados pode reproduzir o WAL para reconstruir o estado em memória.

### 3.2. Segmented Log
* **Problema**: Um único arquivo de Write-Ahead Log que cresce infinitamente consome espaço e torna-se difícil de gerenciar, limpar e recuperar.
* **Solução**: Dividir o log físico em múltiplos arquivos de tamanho fixo (segmentos). Conforme o segmento atual atinge o limite de tamanho, ele se torna imutável e um novo segmento ativo de escrita é aberto. Isso facilita muito a expiração de dados antigos e a compactação de logs (técnica central do Kafka e Cassandra).

### 3.3. Leader and Followers (Replicação baseada em Líder)
* **Problema**: Como replicar dados entre múltiplos servidores garantindo tolerância a falhas sem que múltiplos nós escrevam em conflito direto?
* **Solução**: Um nó é designado como líder e recebe todas as requisições de escrita do cliente. O líder grava localmente e envia as atualizações como eventos de log para as réplicas (followers). Leituras podem ser feitas no líder (consistência forte) ou nos followers (consistência eventual).