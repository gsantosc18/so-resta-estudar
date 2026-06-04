# Teorema CAP

## Objetivo

Compreender profundamente o Teorema CAP (Consistency, Availability, Partition Tolerance), suas implicações práticas no design de sistemas distribuídos, e como ele influencia decisões arquiteturais em bancos de dados, filas de mensagens e caches distribuídos.

---

## Pré-requisitos

- Conceitos básicos de redes de computadores
- Entendimento de bancos de dados relacionais e NoSQL
- Noção de replicação de dados

---

## Conceitos Fundamentais

### O que é o Teorema CAP?

O Teorema CAP, formulado por **Eric Brewer** em 2000 e formalizado por **Seth Gilbert e Nancy Lynch** em 2002, afirma que um sistema de dados distribuído pode garantir **no máximo duas** das três propriedades simultaneamente:

1. **Consistency (Consistência)**: Toda leitura recebe a escrita mais recente ou um erro. Todos os nós veem os mesmos dados ao mesmo tempo.

2. **Availability (Disponibilidade)**: Toda requisição recebe uma resposta (não necessariamente com os dados mais recentes), sem garantia de que é a versão mais atual.

3. **Partition Tolerance (Tolerância a Partições)**: O sistema continua operando apesar de falhas de comunicação (partições de rede) entre os nós.

### A Falsa Escolha: "Escolha Dois"

A formulação "escolha dois de três" é simplista e frequentemente mal interpretada. Na prática:

- **Partições de rede são inevitáveis** — não é uma escolha, é uma realidade. Redes falham, switches morrem, cabos são cortados.
- A verdadeira escolha é: **quando uma partição ocorre**, você prioriza **Consistência (CP)** ou **Disponibilidade (AP)**?

```
                    ┌─────────────────────┐
                    │   Partição de Rede   │
                    │     (inevitável)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                      │
              ┌─────▼─────┐         ┌─────▼─────┐
              │     CP     │         │     AP     │
              │ Consistência│         │Disponibilidade│
              │  priorizada │         │  priorizada │
              └─────┬─────┘         └─────┬─────┘
                    │                      │
              Retorna erro           Retorna dados
              ou bloqueia          (possivelmente stale)
```

### Classificação de Sistemas

| Sistema | Tipo | Comportamento durante partição |
|---------|------|-------------------------------|
| PostgreSQL (single node) | CA | Não tolera partições (não é distribuído) |
| MongoDB (com majority write concern) | CP | Rejeita escritas se não houver maioria |
| Cassandra | AP | Aceita escritas em qualquer nó, reconcilia depois |
| etcd / Consul | CP | Para de aceitar escritas sem quorum |
| DynamoDB | AP (configurável) | Aceita escritas, resolve conflitos com vector clocks |
| CockroachDB | CP | Serializable, bloqueia sem quorum |
| Redis Cluster | AP | Aceita escritas no master disponível |

---

## Funcionamento Interno

### Como uma Partição de Rede Afeta o Sistema

Considere um cluster com 3 nós (N1, N2, N3) e um cliente que escreve dados:

**Cenário normal (sem partição):**
```
Cliente → N1 (escrita) → Replica para N2 e N3 → Confirmação
```

**Cenário com partição:**
```
        ┌───────────────────────────────────────┐
        │          Partição de Rede              │
        │                                       │
   ┌────┴────┐                           ┌──────┴──────┐
   │  N1, N2  │                           │     N3      │
   │ (maioria)│                           │ (isolado)   │
   └─────────┘                           └─────────────┘
```

**Se o sistema é CP:**
- N1 e N2 continuam aceitando escritas (têm maioria/quorum)
- N3 **rejeita** leituras e escritas (não tem quorum)
- Após a partição se resolver, N3 sincroniza com N1/N2

**Se o sistema é AP:**
- Todos os nós continuam aceitando leituras e escritas
- N3 pode ter dados **divergentes** de N1/N2
- Após a partição, o sistema precisa **resolver conflitos** (last-write-wins, vector clocks, CRDTs)

### O Modelo PACELC

O Teorema CAP foca apenas no cenário de partição. O modelo **PACELC** (proposto por Daniel Abadi) estende:

> **P**artition → escolha **A** ou **C**  
> **E**lse (sem partição) → escolha **L**atência ou **C**onsistência

| Sistema | Partição (PAC) | Sem Partição (ELC) |
|---------|----------------|-------------------|
| DynamoDB | PA | EL (baixa latência, consistência eventual) |
| MongoDB | PC | EC (consistência forte por padrão) |
| Cassandra | PA | EL (configurável por query) |
| CockroachDB | PC | EC (serializable) |

Isso captura melhor a realidade: mesmo sem partições, há um trade-off entre latência e consistência.

---

## Casos de Uso

### Netflix — AP para Catálogo, CP para Billing

- **Catálogo de filmes**: AP. Se um usuário vê um filme que acaba de ser removido, a experiência não é catastrófica.
- **Billing/Pagamentos**: CP. Cobrar duas vezes ou não registrar um pagamento é inaceitável.

### Uber — AP para Localização, CP para Transações

- **Localização de motoristas**: AP. Posição ligeiramente desatualizada é aceitável.
- **Cálculo de tarifa e pagamento**: CP. Consistência forte é obrigatória.

### Nubank — CP para Core Banking

- **Movimentações financeiras**: CP com PostgreSQL + replicação síncrona. Consistência forte é exigência regulatória.

---

## Vantagens

### De entender o CAP Theorem:
1. **Decisões informadas**: Escolher o banco de dados certo para cada caso de uso
2. **Expectativas calibradas**: Entender o que é possível e impossível em sistemas distribuídos
3. **Design consciente**: Projetar sistemas com trade-offs explícitos em vez de implícitos
4. **Vocabulário compartilhado**: Comunicação clara com o time sobre requisitos de consistência

---

## Desvantagens

### Limitações do Teorema:
1. **Simplificação excessiva**: A realidade tem mais nuances do que "escolha dois"
2. **Ignora latência**: O modelo PACELC é mais completo
3. **Binário demais**: Na prática, consistência é um espectro (eventual, causal, strong)
4. **Não considera o tempo**: Partições são temporárias, o teorema trata como permanentes
5. **Escopo limitado**: Aplica-se a dados replicados, não a todos os problemas distribuídos

---

## Erros Comuns

### 1. "Escolhemos AP, então não temos consistência"
**Errado**. AP significa que durante uma partição, você prioriza disponibilidade. Sem partição, o sistema pode ser perfeitamente consistente (PACELC: PA/EC).

### 2. "MongoDB é CP, então é sempre consistente"
**Depende da configuração**. Com `readPreference: secondary` e `writeConcern: 1`, MongoDB pode retornar dados stale — comportamento AP.

### 3. "Nosso sistema é CA"
**Impossível em sistemas distribuídos**. Se você tem múltiplos nós em rede, partições podem acontecer. CA só existe em sistemas single-node.

### 4. "CAP se aplica a microserviços"
**CAP se aplica a armazenamento de dados distribuído**, não à comunicação entre serviços. Para serviços, os padrões de resiliência (Circuit Breaker, Retry, etc.) são mais relevantes.

### 5. Confundir "Consistency" do CAP com ACID
No **CAP**, Consistency = todos os nós veem os mesmos dados.  
No **ACID**, Consistency = transição de um estado válido para outro.  
São conceitos **diferentes**.

---

## Exemplos

### Exemplo 1: Simulando Decisão CP vs AP em Go

```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

// Node representa um nó em um cluster distribuído
type Node struct {
	ID        string
	Data      map[string]string
	IsHealthy bool
	mu        sync.RWMutex
}

// Cluster representa um cluster distribuído
type Cluster struct {
	Nodes         []*Node
	Mode          string // "CP" ou "AP"
	QuorumSize    int
	mu            sync.RWMutex
}

var (
	ErrNoQuorum       = errors.New("quorum não atingido: operação rejeitada (modo CP)")
	ErrPartialWrite   = errors.New("escrita parcial: alguns nós podem ter dados stale (modo AP)")
)

func NewCluster(mode string, nodeCount int) *Cluster {
	nodes := make([]*Node, nodeCount)
	for i := 0; i < nodeCount; i++ {
		nodes[i] = &Node{
			ID:        fmt.Sprintf("node-%d", i+1),
			Data:      make(map[string]string),
			IsHealthy: true,
		}
	}
	return &Cluster{
		Nodes:      nodes,
		Mode:       mode,
		QuorumSize: (nodeCount / 2) + 1,
	}
}

// Write escreve um valor no cluster
func (c *Cluster) Write(key, value string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	healthyNodes := c.getHealthyNodes()

	switch c.Mode {
	case "CP":
		// Modo CP: exige quorum para aceitar a escrita
		if len(healthyNodes) < c.QuorumSize {
			return fmt.Errorf("%w: %d nós disponíveis, %d necessários",
				ErrNoQuorum, len(healthyNodes), c.QuorumSize)
		}
		for _, node := range healthyNodes {
			node.mu.Lock()
			node.Data[key] = value
			node.mu.Unlock()
		}
		fmt.Printf("[CP] Escrita aceita: %s=%s em %d nós (quorum atingido)\n",
			key, value, len(healthyNodes))

	case "AP":
		// Modo AP: aceita escrita em qualquer nó disponível
		if len(healthyNodes) == 0 {
			return errors.New("nenhum nó disponível")
		}
		for _, node := range healthyNodes {
			node.mu.Lock()
			node.Data[key] = value
			node.mu.Unlock()
		}
		if len(healthyNodes) < len(c.Nodes) {
			fmt.Printf("[AP] Escrita aceita com dados potencialmente inconsistentes: %s=%s em %d/%d nós\n",
				key, value, len(healthyNodes), len(c.Nodes))
			return ErrPartialWrite
		}
		fmt.Printf("[AP] Escrita aceita: %s=%s em todos os %d nós\n",
			key, value, len(healthyNodes))
	}
	return nil
}

// Read lê um valor do cluster
func (c *Cluster) Read(key string) (string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	healthyNodes := c.getHealthyNodes()

	switch c.Mode {
	case "CP":
		if len(healthyNodes) < c.QuorumSize {
			return "", fmt.Errorf("%w: leitura rejeitada", ErrNoQuorum)
		}
		// Leitura do primeiro nó saudável (com quorum garantido, todos têm o mesmo dado)
		node := healthyNodes[0]
		node.mu.RLock()
		defer node.mu.RUnlock()
		val, ok := node.Data[key]
		if !ok {
			return "", fmt.Errorf("chave '%s' não encontrada", key)
		}
		return val, nil

	case "AP":
		if len(healthyNodes) == 0 {
			return "", errors.New("nenhum nó disponível")
		}
		// Leitura do primeiro nó disponível (pode ser stale)
		node := healthyNodes[0]
		node.mu.RLock()
		defer node.mu.RUnlock()
		val, ok := node.Data[key]
		if !ok {
			return "", fmt.Errorf("chave '%s' não encontrada", key)
		}
		return val, nil
	}
	return "", errors.New("modo inválido")
}

func (c *Cluster) getHealthyNodes() []*Node {
	var healthy []*Node
	for _, n := range c.Nodes {
		if n.IsHealthy {
			healthy = append(healthy, n)
		}
	}
	return healthy
}

// SimulatePartition simula uma partição de rede desativando nós
func (c *Cluster) SimulatePartition(nodeIDs ...string) {
	for _, n := range c.Nodes {
		for _, id := range nodeIDs {
			if n.ID == id {
				n.IsHealthy = false
				fmt.Printf("⚡ Partição: %s está isolado\n", n.ID)
			}
		}
	}
}

func main() {
	fmt.Println("=== Demonstração do Teorema CAP ===\n")

	// --- Cenário CP ---
	fmt.Println("--- Modo CP (Consistência + Tolerância a Partição) ---")
	cpCluster := NewCluster("CP", 3)

	cpCluster.Write("user:1", "Alice")
	val, _ := cpCluster.Read("user:1")
	fmt.Printf("Leitura: user:1 = %s\n\n", val)

	// Simular partição (2 de 3 nós caem → sem quorum)
	cpCluster.SimulatePartition("node-2", "node-3")
	err := cpCluster.Write("user:2", "Bob")
	fmt.Printf("Resultado: %v\n\n", err)

	// --- Cenário AP ---
	fmt.Println("--- Modo AP (Disponibilidade + Tolerância a Partição) ---")
	apCluster := NewCluster("AP", 3)

	apCluster.Write("user:1", "Alice")

	// Simular partição (2 de 3 nós caem)
	apCluster.SimulatePartition("node-2", "node-3")
	err = apCluster.Write("user:2", "Bob")
	fmt.Printf("Aviso: %v\n", err)

	val, _ = apCluster.Read("user:2")
	fmt.Printf("Leitura (possivelmente stale): user:2 = %s\n", val)

	_ = time.Now() // placeholder para evitar import não utilizado
}
```

**Saída esperada:**
```
=== Demonstração do Teorema CAP ===

--- Modo CP (Consistência + Tolerância a Partição) ---
[CP] Escrita aceita: user:1=Alice em 3 nós (quorum atingido)
Leitura: user:1 = Alice

⚡ Partição: node-2 está isolado
⚡ Partição: node-3 está isolado
Resultado: quorum não atingido: operação rejeitada (modo CP): 1 nós disponíveis, 2 necessários

--- Modo AP (Disponibilidade + Tolerância a Partição) ---
[AP] Escrita aceita: user:1=Alice em todos os 3 nós
⚡ Partição: node-2 está isolado
⚡ Partição: node-3 está isolado
[AP] Escrita aceita com dados potencialmente inconsistentes: user:2=Bob em 1/3 nós
Aviso: escrita parcial: alguns nós podem ter dados stale (modo AP)
Leitura (possivelmente stale): user:2 = Bob
```

---

## Exercícios

### Exercício 1 — Análise de Cenários
Para cada cenário abaixo, identifique se o sistema deveria priorizar CP ou AP e justifique:

1. Sistema de controle de estoque de um e-commerce durante Black Friday
2. Feed de notícias de uma rede social
3. Sistema de transferência bancária entre contas
4. Cache de sessões de usuário
5. Sistema de votação online

### Exercício 2 — Análise de Banco de Dados
Pesquise e documente o comportamento CAP dos seguintes bancos de dados com suas configurações padrão:
- Redis Cluster
- ScyllaDB
- TiDB
- YugabyteDB
- FoundationDB

### Exercício 3 — PACELC na Prática
Estenda a tabela PACELC com os bancos de dados do exercício 2.

---

## Projeto Prático

### Key-Value Store Distribuído com Modo CP/AP Configurável

**Objetivo**: Implementar um key-value store distribuído simples em Go que permita alternar entre modos CP e AP.

**Requisitos**:
1. Cluster de 3 nós comunicando via HTTP
2. Endpoint `PUT /data/{key}` para escrita
3. Endpoint `GET /data/{key}` para leitura
4. Endpoint `POST /admin/partition/{nodeId}` para simular partição
5. Endpoint `POST /admin/heal/{nodeId}` para resolver partição
6. Header `X-Consistency-Mode: CP|AP` para selecionar o modo
7. Logs detalhados mostrando o comportamento durante partições

**Critérios de sucesso**:
- Em modo CP, escritas falham sem quorum
- Em modo AP, escritas são aceitas e conflitos são logados
- Após resolver a partição, dados convergem

---

## Perguntas de Entrevista

### Nível Pleno

**P: O que é o Teorema CAP?**
R: O Teorema CAP afirma que um sistema de dados distribuído pode garantir no máximo duas das três propriedades: Consistency (todos os nós veem os mesmos dados), Availability (toda requisição recebe resposta) e Partition Tolerance (o sistema funciona apesar de falhas de rede). Na prática, como partições são inevitáveis, a escolha real é entre consistência e disponibilidade durante uma partição.

### Nível Senior

**P: Por que dizer que um sistema é "CA" é geralmente incorreto?**
R: Porque partições de rede são inevitáveis em qualquer sistema distribuído real. Um sistema CA só existe em single-node ou em redes onde partições são literalmente impossíveis. Na prática, todo sistema distribuído precisa lidar com partições, forçando a escolha entre CP ou AP.

**P: Como você escolheria entre CP e AP para diferentes partes de um sistema?**
R: Diferentes domínios do sistema podem ter requisitos diferentes. Para dados financeiros (pagamentos, saldos), CP é essencial — é preferível rejeitar a operação do que ter inconsistência. Para dados sociais (likes, visualizações), AP é aceitável — eventual consistency é suficiente e a disponibilidade melhora a experiência do usuário. O ponto-chave é que CP e AP não são escolhas globais — são decisões por serviço/funcionalidade.

### Nível Staff

**P: Quais são as limitações do Teorema CAP e como o modelo PACELC o complementa?**
R: O CAP é limitado porque: (1) só considera o cenário de partição, ignorando o comportamento normal; (2) trata consistência como binário quando é um espectro; (3) não considera latência. O PACELC estende dizendo: durante uma Partição, escolha A ou C; Else (sem partição), escolha Latência ou Consistência. Isso captura trade-offs do dia a dia, como Cassandra oferecendo baixa latência com eventual consistency mesmo sem partições (PA/EL) vs CockroachDB oferecendo consistência forte com maior latência (PC/EC).

**P: Como o Jepsen testing se relaciona com o CAP Theorem?**
R: O Jepsen é uma ferramenta que testa empiricamente as garantias de consistência de bancos de dados distribuídos, injetando falhas de rede (partições). Ele verifica se o sistema realmente entrega as garantias que promete sob o CAP. Muitos bancos "CP" falharam em testes Jepsen, revelando que suas implementações não mantinham consistência durante partições reais.

---

## Referências

1. **Paper original**: Brewer, E. (2000). *Towards Robust Distributed Systems* — Keynote PODC
2. **Formalização**: Gilbert, S. & Lynch, N. (2002). *Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services*
3. **PACELC**: Abadi, D. (2012). *Consistency Tradeoffs in Modern Distributed Database System Design*
4. **Revisão do Brewer**: Brewer, E. (2012). *CAP Twelve Years Later: How the "Rules" Have Changed*
5. **Livro**: Kleppmann, M. (2017). *Designing Data-Intensive Applications*, Cap. 9 — Consistency and Consensus
6. **Jepsen**: [https://jepsen.io](https://jepsen.io) — Kyle Kingsbury
7. **Tópico relacionado**: [Modelos de Consistência](02-consistency-models.md)
