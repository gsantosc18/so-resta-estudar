# Conceitos Fundamentais de Sistemas Distribuídos

Este documento reúne a pesquisa teórica sobre os fundamentos que sustentam os Sistemas Distribuídos. Ele serve como base conceitual para o desenvolvimento de todo o curso.

---

## 1. O que é um Sistema Distribuído?
Um sistema distribuído é uma coleção de computadores independentes que aparecem para os usuários como um único sistema coerente.
* **Características principais**:
  * Ausência de memória compartilhada (comunicação estritamente via troca de mensagens).
  * Ausência de relógio global comum.
  * Concorrência de execução.
  * Falhas independentes dos componentes (um nó pode falhar enquanto outros continuam rodando).

---

## 2. Modelos de Sistemas (System Models)
Para projetar e raciocinar sobre algoritmos distribuídos, dividimos os modelos de sistemas em três dimensões: tempo, falhas e rede.

### 2.1. Modelos de Tempo (Timing Assumptions)
1. **Síncrono (Synchronous)**:
   * Há um limite superior conhecido $D$ para o tempo de trânsito de mensagens.
   * Há um limite superior conhecido para o tempo de processamento de cada nó.
   * Relógios locais possuem uma taxa de deriva (drift) máxima conhecida.
   * *Realidade*: Quase nenhum sistema prático de rede WAN/Internet é síncrono.
2. **Assíncrono (Asynchronous)**:
   * Não há limites superiores para tempo de transmissão de mensagens ou velocidade de processamento.
   * Mensagens podem atrasar indefinidamente (mas eventualmente chegam, sob pressuposto de rede confiável, ou são perdidas).
   * Não há relógios físicos sincronizados com os quais contar para corretude de segurança.
   * *Realidade*: É o modelo mais seguro de projetar, pois um algoritmo correto sob o modelo assíncrono continua correto sob qualquer velocidade de rede.
3. **Parcialmente Síncrono (Partially Synchronous)**:
   * O sistema se comporta de forma assíncrona por períodos arbitrários (chamados de períodos de instabilidade ou *asynchrony*), mas eventualmente se estabiliza e passa a se comportar de forma síncrona após um tempo limite desconhecido (GST - *Global Stabilization Time*).
   * *Realidade*: É o modelo mais próximo de sistemas de produção reais na nuvem (onde redes sofrem engarrafamentos/partições de curta duração, mas eventualmente se estabilizam).

### 2.2. Modelos de Falha (Failure Models)
Os nós podem falhar das seguintes formas (ordenados da menor para a maior severidade):
1. **Crash-Stop (Fail-Stop)**:
   * Um nó para de funcionar abruptamente e nunca mais se recupera. Outros nós podem detectar essa falha de forma confiável apenas em sistemas síncronos.
2. **Crash-Recovery (Fail-Recovery)**:
   * Um nó para de funcionar a qualquer momento (crash), mas pode reiniciar (recovery) mais tarde. Ele retém o estado persistido em disco antes da falha e precisa recuperar o estado em memória.
3. **Omission (Omissão)**:
   * Um nó falha ao enviar ou receber mensagens (ex: buffers cheios, perda de pacotes), mas continua processando internamente.
4. **Byzantine (Arbitrary/Active)**:
   * O nó pode exibir qualquer comportamento arbitrário, incluindo comportamento malicioso, envio de mensagens contraditórias a nós diferentes (duplicidade), mentira sobre seu próprio estado ou simplesmente travamento.
   * *Aplicações*: Blockchains, sistemas aeroespaciais ou críticos sob ameaça de segurança ativa.

---

## 3. Tempo e Ordenação (Time & Ordering)
Em sistemas distribuídos, determinar a ordem dos eventos é complexo porque não existe um relógio global perfeitamente sincronizado.

### 3.1. Relógios Físicos e Deriva
* **Drift (Deriva)**: Relógios de quartzo sofrem desvios de tempo devido a fatores térmicos e envelhecimento físico.
* **Sincronização Física**: Protocolos como NTP (Network Time Protocol) e PTP (Precision Time Protocol) sincronizam relógios locais com referências confiáveis (GPS/Relógios Atômicos), mas sempre há uma incerteza residual (bounded uncertainty window).
* **Riscos**: Usar relógios físicos locais para ordenar transações financeiras ou commits de banco de dados pode levar a anomalias de consistência se não houver um tratamento rigoroso como o do Google TrueTime (Spanner).

### 3.2. Relógios Lógicos (Logical Clocks)
Quando a ordem causal é mais importante do que a hora exata da parede.
1. **Relógios de Lamport (Lamport Timestamps)**:
   * Define a relação "aconteceu antes" (happened-before: $a \to b$).
   * Cada nó mantém um contador inteiro simples local.
   * Incrementado a cada evento local.
   * Enviado junto com cada mensagem. Ao receber uma mensagem com timestamp $T$, o nó receptor atualiza seu relógio para $\max(local, T) + 1$.
   * *Limitação*: Se $L(a) < L(b)$, não podemos inferir com certeza que $a \to b$ (eventos concorrentes podem ter timestamps ordenados arbitrariamente).
2. **Relógios Vetoriais (Vector Clocks)**:
   * Permite identificar concorrência real entre eventos.
   * Cada nó mantém um vetor de tamanho $N$ (número de nós no sistema).
   * O nó $i$ incrementa sua própria entrada $V[i]$ a cada evento local.
   * O vetor é enviado em cada mensagem. O receptor atualiza seu vetor fazendo o máximo elemento a elemento.
   * Se $V(a) < V(b)$, então $a$ causou causou $b$ ($a \to b$). Se nem $V(a) \le V(b)$ nem $V(b) \le V(a)$, os eventos $a$ e $b$ são concorrentes ($a \parallel b$).

---

## 4. Teoremas e Limitações Físicas

### 4.1. Teorema CAP (Brewer's Theorem)
Em um sistema de dados distribuído compartilhado, é impossível garantir simultaneamente mais de duas das seguintes garantias:
* **Consistency (Consistência - Linearizabilidade)**: Toda leitura retorna a escrita mais recente ou um erro.
* **Availability (Disponibilidade)**: Todo nó não faltoso responde a toda requisição com sucesso (sem erro e sem atraso infinito), mesmo em presença de falhas de outros nós.
* **Partition Tolerance (Tolerância a Partição)**: O sistema continua funcionando apesar de perdas ou atrasos de mensagens arbitrários causados pela rede.

Uma partição de rede ($P$) é um fato físico inevitável em sistemas de rede real. Portanto, a escolha real em design de sistemas distribuídos é entre:
* **CP (Consistency / Partition Tolerance)**: Em caso de partição, o sistema bloqueia ou retorna erro para garantir a consistência das informações.
* **AP (Availability / Partition Tolerance)**: Em caso de partição, os nós continuam aceitando escritas e respondendo leituras, sacrificando a consistência imediata (podem retornar dados obsoletos ou divergir).

### 4.2. Extensão PACELC (Abadi's Theorem)
O Teorema CAP descreve o comportamento sob falhas (partições). O teorema PACELC estende isso para o funcionamento normal (sem partições):
* Se houver partição (**P**artition), o trade-off é entre **A**vailability e **C**onsistência;
* **E**lse (em condições normais de operação), o trade-off é entre **L**atency (Latência) e **C**onsistência.
* *Exemplo*: Bancos de dados replicados precisam decidir se esperam a confirmação de réplicas remotas para garantir consistência (maior latência) ou respondem imediatamente ao cliente após gravar localmente (menor latência, mas risco de inconsistência em caso de leitura simultânea em outra réplica).

### 4.3. Impossibilidade FLP (Fischer, Lynch, Paterson)
* Em um modelo de sistema **assíncrono** com canal de comunicação confiável, **não existe algoritmo de consenso determinístico que seja totalmente tolerante a pelo menos uma falha por travamento (crash-stop)**.
* *Significado prático*: Para obter consenso garantido (Safety e Liveness) em sistemas reais, precisamos abrir mão de pelo menos uma dessas premissas:
  1. Adotar determinismo probabilístico ou aleatoriedade (algoritmos baseados em probabilidade de terminação).
  2. Adotar pressupostos de tempo parcial ou sincronia (detectores de falhas por timeouts, assumindo sincronia parcial).

---

## 5. Consenso e Coordenação
* **O Problema do Consenso**: Como um conjunto de processos independentes pode concordar em um único valor proposto por um ou mais deles.
* **Propriedades Exigidas**:
  * **Agreement (Acordo)**: Todos os processos não faltosos decidem pelo mesmo valor.
  * **Integrity/Validity (Validade)**: Se um processo decide por um valor $v$, então $v$ deve ter sido proposto por algum processo.
  * **Termination (Terminação - Liveness)**: Todo processo não faltoso eventualmente toma uma decisão.
* **Algoritmos Reais**: Paxos, Raft e variantes de tolerância a falhas bizantinas (PBFT, Tendermint).
