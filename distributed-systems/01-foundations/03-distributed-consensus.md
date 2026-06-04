# Consenso Distribuído

## Objetivo

Compreender os algoritmos de consenso distribuído (Paxos, Raft, Zab), como eles garantem que múltiplos nós concordam sobre um valor, e como são aplicados em sistemas reais como etcd, ZooKeeper e CockroachDB.

---

## Pré-requisitos

- [Teorema CAP](01-cap-theorem.md)
- [Modelos de Consistência](02-consistency-models.md)
- Conceitos de redes (latência, partições)

---

## Conceitos Fundamentais

### O que é Consenso Distribuído?

Consenso é o problema de fazer com que **múltiplos nós em um sistema distribuído concordem sobre um único valor**, mesmo na presença de falhas. É o bloco fundamental para:

- **Leader Election**: Quem é o líder do cluster?
- **Atomic Broadcast**: Todos aplicam as mesmas operações na mesma ordem
- **Distributed Locking**: Apenas um processo acessa um recurso por vez
- **State Machine Replication**: Todas as réplicas executam os mesmos comandos na mesma ordem

### Propriedades do Consenso (FLP)

Qualquer algoritmo de consenso correto deve garantir:

1. **Agreement (Acordo)**: Todos os nós que decidem concordam no mesmo valor
2. **Validity (Validade)**: O valor decidido foi proposto por algum nó
3. **Termination (Terminação)**: Todo nó correto eventualmente decide

> **Impossibilidade FLP** (Fischer, Lynch, Paterson, 1985): É impossível garantir consenso em um sistema assíncrono com pelo menos um nó falho. Na prática, algoritmos contornam isso com **timeouts** (modelo parcialmente síncrono).

### Modelos de Falha

| Modelo | Descrição | Exemplos |
|--------|-----------|----------|
| **Crash-stop** | Nó falha parando permanentemente | Hardware failure |
| **Crash-recovery** | Nó falha e pode se recuperar | Reinício de processo |
| **Byzantine** | Nó pode se comportar arbitrariamente (inclusive maliciosamente) | Blockchain, sistemas militares |

Paxos e Raft lidam com **crash-recovery**. Para falhas Byzantine, usa-se **PBFT** ou protocolos de blockchain.

---

## Funcionamento Interno

### Raft — O Algoritmo "Compreensível"

Raft foi projetado por Diego Ongaro e John Ousterhout em 2014 como uma alternativa **compreensível** ao Paxos. É dividido em três subproblemas:

#### 1. Leader Election (Eleição de Líder)

```
Estado dos nós: FOLLOWER → CANDIDATE → LEADER

Início: Todos começam como FOLLOWER

Timeout do Follower (sem heartbeat do líder):
  → Transição para CANDIDATE
  → Incrementa term (mandato)
  → Vota em si mesmo
  → Envia RequestVote para todos
  
Se recebe maioria dos votos:
  → Torna-se LEADER
  → Começa a enviar heartbeats

Se recebe heartbeat de líder com term >= seu:
  → Volta a ser FOLLOWER
```

**Regras de votação**:
- Cada nó vota **no máximo uma vez** por term
- Vota apenas se o candidato tem log **pelo menos tão atualizado** quanto o seu
- Timeouts são randomizados (150-300ms) para evitar split vote

```
Tempo →

Nó A (Follower): ────────timeout──→ Candidate ──votes──→ LEADER ──heartbeat──→
Nó B (Follower): ────────────────────────vote for A──────────────────────────→
Nó C (Follower): ────────────────────────vote for A──────────────────────────→

Term 1: A é eleito líder com 3/3 votos
```

#### 2. Log Replication (Replicação de Log)

```
Cliente → LEADER: Write(x=5)

LEADER:
  1. Anexa entry ao log local: {term:1, index:3, cmd:"x=5"}
  2. Envia AppendEntries RPC para todos os followers
  3. Followers anexam entry ao log
  4. Followers respondem com sucesso
  5. Quando maioria confirma → entry é "committed"
  6. LEADER aplica ao state machine
  7. Retorna resultado ao cliente
  8. Followers aplicam ao state machine no próximo heartbeat
```

```
Log do Leader:  [1:x=1] [1:y=2] [1:x=5] ← committed após maioria
Log Follower B: [1:x=1] [1:y=2] [1:x=5] ← replicado
Log Follower C: [1:x=1] [1:y=2]          ← atrasado (será atualizado)
```

#### 3. Safety (Segurança)

**Garantia**: Se uma entry foi committed em um term, essa entry estará no log de qualquer líder futuro.

Isso é garantido pela regra de votação: um candidato só recebe voto se seu log é pelo menos tão atualizado quanto o do votante. Como a entry committed está na maioria dos nós, qualquer maioria de votos necessariamente inclui pelo menos um nó com essa entry.

### Paxos — O Algoritmo Original

Paxos, proposto por Leslie Lamport em 1989, resolve consenso em **três fases**:

#### Single-Decree Paxos (um valor)

```
Fase 1a (Prepare): Proposer envia PREPARE(n) com número de proposta n
Fase 1b (Promise): Acceptors respondem com PROMISE (prometem não aceitar n' < n)
                   + valor já aceito anteriormente (se houver)

Fase 2a (Accept):  Proposer envia ACCEPT(n, v) com valor v
                   (usa valor recebido na Fase 1b, ou propõe novo se nenhum)
Fase 2b (Accepted): Acceptors aceitam se não prometeram a n' > n

Consenso atingido quando maioria aceita o mesmo (n, v)
```

**Multi-Paxos**: Otimização onde o líder é estável e pula a Fase 1 para propostas subsequentes, indo direto para Accept.

### Comparação: Raft vs Paxos

| Aspecto | Raft | Paxos |
|---------|------|-------|
| Compreensibilidade | Alta (projetado para isso) | Baixa (notoriamente difícil) |
| Líder | Obrigatório | Opcional (Multi-Paxos usa líder) |
| Eleição | Term + timeout randomizado | Não especifica (Multi-Paxos) |
| Log | Contíguo, sem buracos | Pode ter buracos no log |
| Implementações | etcd, Consul, TiKV | Chubby (Google), Cassandra (Paxos leve) |
| Performance | Ligeiramente inferior | Pode ser otimizado mais agressivamente |

### Quorum

A matemática por trás do consenso:

```
N = número total de nós
Q = quorum = ⌊N/2⌋ + 1 (maioria simples)

N=3: Q=2 → tolera 1 falha
N=5: Q=3 → tolera 2 falhas
N=7: Q=4 → tolera 3 falhas

Fórmula geral: tolera F falhas com N = 2F + 1 nós
```

**Por que maioria?** Quaisquer dois quorums de N nós se intersectam em pelo menos um nó. Esse nó garante que a informação do quorum anterior é preservada.

---

## Casos de Uso

### etcd — Coordenação do Kubernetes

O etcd usa **Raft** para armazenar toda a configuração do Kubernetes: deployments, services, pods, secrets. Um cluster etcd de 3 ou 5 nós garante que o estado do cluster Kubernetes é consistente mesmo se nós do etcd falharem.

**Configuração típica**:
- 3 nós para desenvolvimento (tolera 1 falha)
- 5 nós para produção (tolera 2 falhas)
- Nunca usar número par (split-brain possível)

### CockroachDB — Raft por Range

CockroachDB divide os dados em **ranges** (~64MB cada). Cada range tem seu próprio grupo Raft de 3 réplicas. Isso permite:
- Consenso paralelo em ranges diferentes
- Rebalanceamento automático de ranges
- Transações distribuídas sobre múltiplos ranges

### ZooKeeper — Zab Protocol

ZooKeeper usa o protocolo **Zab** (ZooKeeper Atomic Broadcast), similar ao Raft:
- Eleição de líder
- Todas as escritas passam pelo líder
- Leituras podem ser de qualquer nó (eventual consistency por padrão)
- Atomic broadcast garante ordem total das operações

---

## Vantagens

1. **Consistência forte**: Garantia formal de que todos os nós concordam
2. **Tolerância a falhas**: Sistema funciona com maioria dos nós
3. **Determinístico**: Dado o mesmo log, todos os nós chegam ao mesmo estado
4. **Fundação para abstrações**: Leader election, distributed locks, configuration management
5. **Bem estudado**: Décadas de pesquisa, provas formais de corretude

---

## Desvantagens

1. **Latência**: Cada operação requer round-trips de rede para atingir quorum
2. **Disponibilidade limitada**: Sem maioria → sem progresso
3. **Throughput**: Todas as escritas passam por um líder (bottleneck)
4. **Complexidade operacional**: Número ímpar de nós, monitoramento de saúde
5. **Não escala horizontalmente**: Mais nós = mais comunicação = mais lento

---

## Erros Comuns

### 1. Usar número par de nós
**Problema**: Com 4 nós, quorum = 3. Tolera 1 falha (igual a 3 nós). O 4º nó não melhora a tolerância, mas aumenta a comunicação.  
**Regra**: Sempre use N ímpar (3, 5, 7).

### 2. Confundir Raft com replicação assíncrona
Raft é **replicação síncrona com quorum**. Replicação assíncrona (MySQL, PostgreSQL streaming replication) não garante consenso — dados podem ser perdidos se o primário falhar antes de replicar.

### 3. Achar que mais nós = mais disponível
Mais nós aumenta a tolerância a falhas, mas reduz o throughput (mais RPCs para atingir quorum). 5 nós é o sweet spot para produção.

### 4. Não monitorar o lag de replicação
Um follower muito atrasado pode causar problemas durante uma eleição de líder (se eleito, pode ter log incompleto).

### 5. Split-brain com número par de nós
Com 4 nós divididos em 2+2, nenhum grupo tem maioria → sistema inteiro para. Com 3 nós divididos em 2+1, o grupo de 2 continua operando.

---

## Exemplos

### Exemplo: Leader Election Simplificado em Go

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

type NodeState int

const (
	Follower NodeState = iota
	Candidate
	Leader
)

func (s NodeState) String() string {
	return [...]string{"Follower", "Candidate", "Leader"}[s]
}

type RaftNode struct {
	ID            string
	State         NodeState
	CurrentTerm   int
	VotedFor      string
	ElectionTimer *time.Timer
	mu            sync.Mutex
}

type VoteRequest struct {
	CandidateID string
	Term        int
}

type VoteResponse struct {
	VoterID     string
	Term        int
	VoteGranted bool
}

func NewRaftNode(id string) *RaftNode {
	return &RaftNode{
		ID:          id,
		State:       Follower,
		CurrentTerm: 0,
		VotedFor:    "",
	}
}

// RequestVote processa um pedido de voto
func (n *RaftNode) RequestVote(req VoteRequest) VoteResponse {
	n.mu.Lock()
	defer n.mu.Unlock()

	// Se o term do candidato é menor, rejeita
	if req.Term < n.CurrentTerm {
		return VoteResponse{
			VoterID:     n.ID,
			Term:        n.CurrentTerm,
			VoteGranted: false,
		}
	}

	// Se o term é maior, atualiza e reseta voto
	if req.Term > n.CurrentTerm {
		n.CurrentTerm = req.Term
		n.VotedFor = ""
		n.State = Follower
	}

	// Vota se ainda não votou neste term
	granted := false
	if n.VotedFor == "" || n.VotedFor == req.CandidateID {
		n.VotedFor = req.CandidateID
		granted = true
	}

	return VoteResponse{
		VoterID:     n.ID,
		Term:        n.CurrentTerm,
		VoteGranted: granted,
	}
}

// StartElection inicia uma eleição
func StartElection(candidate *RaftNode, peers []*RaftNode) bool {
	candidate.mu.Lock()
	candidate.State = Candidate
	candidate.CurrentTerm++
	candidate.VotedFor = candidate.ID
	term := candidate.CurrentTerm
	candidate.mu.Unlock()

	fmt.Printf("\n🗳️  %s inicia eleição (term %d)\n", candidate.ID, term)

	votes := 1 // voto próprio
	totalNodes := len(peers) + 1
	quorum := (totalNodes / 2) + 1

	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, peer := range peers {
		wg.Add(1)
		go func(p *RaftNode) {
			defer wg.Done()
			// Simula latência de rede
			time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)

			resp := p.RequestVote(VoteRequest{
				CandidateID: candidate.ID,
				Term:        term,
			})

			mu.Lock()
			defer mu.Unlock()
			if resp.VoteGranted {
				votes++
				fmt.Printf("  ✓ %s votou em %s (term %d)\n", resp.VoterID, candidate.ID, term)
			} else {
				fmt.Printf("  ✗ %s rejeitou %s (term %d)\n", resp.VoterID, candidate.ID, term)
			}
		}(peer)
	}

	wg.Wait()

	if votes >= quorum {
		candidate.mu.Lock()
		candidate.State = Leader
		candidate.mu.Unlock()
		fmt.Printf("👑 %s eleito LÍDER com %d/%d votos (quorum=%d)\n",
			candidate.ID, votes, totalNodes, quorum)
		return true
	}

	fmt.Printf("❌ %s não conseguiu ser eleito: %d/%d votos (quorum=%d)\n",
		candidate.ID, votes, totalNodes, quorum)
	return false
}

func main() {
	fmt.Println("=== Simulação de Leader Election (Raft) ===")

	// Criar cluster de 5 nós
	nodes := make([]*RaftNode, 5)
	for i := 0; i < 5; i++ {
		nodes[i] = NewRaftNode(fmt.Sprintf("node-%d", i+1))
	}

	// Cenário 1: Eleição bem-sucedida (todos os nós saudáveis)
	fmt.Println("\n--- Cenário 1: Todos os nós saudáveis ---")
	candidate := nodes[0]
	peers := nodes[1:]
	StartElection(candidate, peers)

	// Cenário 2: Eleição com 2 nós indisponíveis (simula partição)
	fmt.Println("\n--- Cenário 2: 2 nós indisponíveis ---")
	// Reset
	for _, n := range nodes {
		n.mu.Lock()
		n.CurrentTerm = 0
		n.VotedFor = ""
		n.State = Follower
		n.mu.Unlock()
	}

	// Nó 1 tenta ser eleito, nós 4 e 5 estão "particionados"
	// (na prática, eles não respondem - aqui simulamos com voto já dado)
	nodes[3].mu.Lock()
	nodes[3].VotedFor = "node-5" // já votou em outro
	nodes[3].CurrentTerm = 1
	nodes[3].mu.Unlock()

	nodes[4].mu.Lock()
	nodes[4].VotedFor = "node-5" // já votou em outro
	nodes[4].CurrentTerm = 1
	nodes[4].mu.Unlock()

	candidate = nodes[0]
	peers = nodes[1:]
	StartElection(candidate, peers)
}
```

---

## Exercícios

### Exercício 1 — Cálculo de Quorum
Para cada tamanho de cluster, calcule: quorum necessário, falhas toleradas, e se faz sentido usar esse tamanho:
- N = 1, 2, 3, 4, 5, 6, 7, 9, 11

### Exercício 2 — Análise de Cenário
Um cluster Raft de 5 nós tem o seguinte estado de logs:

```
Líder (A): [1:x=1] [2:y=2] [3:z=3]
Follower B: [1:x=1] [2:y=2] [3:z=3]
Follower C: [1:x=1] [2:y=2]
Follower D: [1:x=1]
Follower E: [desconectado]
```

Pergunta: A entry `[3:z=3]` está committed? Justifique.

### Exercício 3 — Simulação de Partição
Modifique o exemplo de código para simular:
1. Uma partição que divide o cluster em 3+2
2. A minoria tenta eleger um líder (deve falhar)
3. A maioria elege um novo líder
4. A partição se resolve e a minoria se reconcilia

---

## Projeto Prático

### Implementação de Raft Simplificado

**Objetivo**: Implementar um Raft simplificado em Go com leader election, log replication e comunicação via HTTP.

**Requisitos**:
1. 3 ou 5 nós comunicando via HTTP
2. Leader election com timeout randomizado
3. Heartbeats do líder para followers
4. Log replication: escrita aceita apenas pelo líder
5. Quorum para commit de entries
6. Endpoint `GET /status` mostrando state, term, líder atual
7. Endpoint `POST /data` para escrita (redireciona para líder)

**Critérios de sucesso**:
- Derrubar o líder → novo líder eleito automaticamente
- Escrita confirmada pelo quorum não é perdida
- Dados consistentes em todos os nós após convergência

---

## Perguntas de Entrevista

### Nível Pleno

**P: O que é consenso distribuído e por que é importante?**
R: Consenso distribuído é o processo pelo qual múltiplos nós em um sistema distribuído concordam sobre um valor, mesmo com falhas. É importante porque é a base para leader election (quem coordena?), replicação de dados (todos concordam sobre a ordem das operações), e distributed locking (acesso exclusivo a recursos).

### Nível Senior

**P: Explique como o Raft garante que dados committed não são perdidos.**
R: Raft garante através de duas regras: (1) Uma entry só é committed quando o líder confirma que a maioria dos nós a replicou. (2) Um candidato só recebe voto se seu log é pelo menos tão atualizado quanto o do votante. Como a entry committed está na maioria dos nós, e qualquer maioria de votos necessariamente inclui pelo menos um nó com essa entry, o novo líder sempre terá todas as entries committed.

**P: Por que o Raft usa timeouts randomizados para eleição?**
R: Para evitar split vote. Se todos os followers tivessem o mesmo timeout, ao perder o líder, todos se tornariam candidatos simultaneamente e votariam em si mesmos, impossibilitando maioria. Com timeouts randomizados (ex: 150-300ms), geralmente um nó dispara primeiro e recebe os votos antes que outros se tornem candidatos.

### Nível Staff

**P: Compare Raft, Paxos e Zab. Quando você escolheria cada um?**
R: **Raft**: Mais compreensível, ideal para implementações novas onde a equipe precisa entender e manter o código (etcd, Consul). **Paxos**: Mais flexível e otimizável, usado em sistemas onde performance é crítica e a equipe tem expertise (Google Chubby, Megastore). **Zab**: Otimizado para o caso de uso do ZooKeeper — atomic broadcast com líder estável, bom para configuração e coordenação mas não para alto throughput de dados. Na prática, para novas implementações, Raft é quase sempre a melhor escolha pela compreensibilidade.

---

## Referências

1. **Paper Raft**: Ongaro, D. & Ousterhout, J. (2014). *In Search of an Understandable Consensus Algorithm*
2. **Paper Paxos**: Lamport, L. (2001). *Paxos Made Simple*
3. **Paper FLP**: Fischer, M., Lynch, N., Paterson, M. (1985). *Impossibility of Distributed Consensus with One Faulty Process*
4. **Visualização Raft**: [https://raft.github.io](https://raft.github.io)
5. **Livro**: Kleppmann, M. (2017). *Designing Data-Intensive Applications*, Cap. 9
6. **Tópicos relacionados**: [Modelos de Consistência](02-consistency-models.md) | [Teorema CAP](01-cap-theorem.md)
