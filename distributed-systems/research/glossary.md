# Glossário de Pesquisa Técnica

Este glossário reúne definições precisas dos termos técnicos mais importantes da computação distribuída para servir de referência conceitual unificada ao autor durante a escrita das aulas.

---

### A
* **At-Least-Once Delivery (Entrega ao Menos Uma Vez)**: Garantia de que uma mensagem enviada por uma rede distribuída será processada pelo receptor pelo menos uma vez. Pode haver duplicações em caso de falha de rede/confirmação. Exige que o receptor seja idempotente.
* **At-Most-Once Delivery (Entrega no Máximo Uma Vez)**: Garantia de que a mensagem será entregue uma única vez ou nenhuma. Não há risco de processamento duplicado, mas a mensagem pode ser perdida silenciosamente em caso de falhas de hardware/rede.

---

### B
* **Byzantine Fault (Falha Bizantina)**: Qualquer tipo de falha arbitrária onde um nó continua funcionando mas envia informações errôneas, contraditórias ou falsificadas a outros nós, intencionalmente (malicioso) ou devido a bugs graves de memória.

---

### C
* **CDC (Change Data Capture - Captura de Mudança de Dados)**: Padrão onde as alterações sofridas em uma base de dados (inserções, atualizações, exclusões no log de transações) são capturadas em tempo real e propagadas como eventos para outros sistemas. Muito utilizado no padrão Outbox para otimização de leitura.
* **Consensus (Consenso)**: O processo de concordar em um único valor proposto entre múltiplos nós distribuídos independentes e potencialmente não confiáveis ou sujeitos a falhas.

---

### E
* **Eventual Consistency (Consistência Eventual)**: Modelo de consistência fraca que garante que, se não houver novas atualizações de escrita, todas as réplicas eventualmente convergirão e retornarão o mesmo valor lido. Durante atualizações simultâneas, leituras podem retornar dados desatualizados.
* **Exactly-Once Processing (Processamento Exatamente Uma Vez)**: A semântica mais complexa onde, sob a perspectiva de efeitos colaterais visíveis, o processamento de uma mensagem acontece exatamente uma vez, combinando entrega *at-least-once* com controle de idempotência e transações atômicas de escrita.

---

### G
* **Gossip Protocol (Protocolo de Fofoca / Epidêmico)**: Um protocolo de comunicação distribuído descentralizado (P2P) inspirado na forma como epidemias se espalham. Os nós enviam periodicamente informações locais (como metadados de membros ou estados de réplica) a vizinhos selecionados aleatoriamente, propagando a informação rapidamente por toda a rede sem a necessidade de um coordenador central.

---

### L
* **Linearizability (Linearizabilidade / Consistência Forte)**: O modelo de consistência de leitura/escrita mais forte para um único objeto. Garante que qualquer operação de leitura retorna a escrita concluída mais recente no tempo físico global ou uma escrita simultânea em andamento. Dá a ilusão de que existe apenas uma única cópia dos dados na rede.

---

### N
* **Network Partition (Partição de Rede)**: Uma falha de comunicação onde a rede física é dividida em dois ou mais subgrupos isolados de nós que não conseguem mais enviar mensagens entre si, embora os nós individuais de cada lado continuem funcionando normalmente.

---

### S
* **Split-Brain (Cérebro Dividido)**: Uma anomalia catastrófica em sistemas com eleição de líder que ocorre após uma partição de rede. Se ambos os lados isolados da partição acreditarem de forma independente que o outro lado caiu, cada subgrupo pode eleger seu próprio líder ativo. Isso resulta em duas autoridades conflitantes aceitando escritas simultâneas de dados, corrompendo a consistência dos dados históricos.
* **State Machine Replication (SMR / Replicação de Máquina de Estados)**: Técnica para construir serviços tolerantes a falhas onde uma máquina de estados idêntica é replicada em múltiplos nós. Se todas as réplicas processarem a mesma sequência ordenada de comandos a partir de um estado inicial comum, todas atingirão o mesmo estado final idêntico. Base de funcionamento do Raft e Paxos.

---

### W
* **Write-Ahead Log (WAL)**: Técnica em sistemas de banco de dados onde alterações são escritas em um log persistente sequencial no disco antes de serem de fato aplicadas nas estruturas de memória e arquivos de dados estruturados. Garante durabilidade (D do ACID) em caso de travamentos.
