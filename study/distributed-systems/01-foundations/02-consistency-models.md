# Modelos de Consistência

## Objetivo

Entender os diferentes modelos de consistência em sistemas distribuídos, desde o mais forte (Linearizability) até o mais relaxado (Eventual Consistency), compreendendo os trade-offs de cada modelo e quando aplicá-los em cenários reais.

---

## Pré-requisitos

- [Teorema CAP](01-cap-theorem.md)
- Conceitos de replicação de dados
- Noção de concorrência e paralelismo

---

## Conceitos Fundamentais

### O que é um Modelo de Consistência?

Um modelo de consistência é um **contrato** entre o sistema de armazenamento distribuído e seus clientes. Ele define **quais resultados são válidos** para operações de leitura e escrita concorrentes em múltiplos nós.

Quanto mais forte o modelo, mais "intuitivo" o comportamento — mas mais custoso em termos de latência e disponibilidade.

### Espectro de Consistência

```
Mais Forte ◄──────────────────────────────────────────► Mais Fraco

┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Lineariz-    │  Sequential  │   Causal     │  Read-your-  │  Eventual    │
│  ability     │  Consistency │  Consistency │   writes     │  Consistency │
│              │              │              │              │              │
│ "Uma cópia"  │ "Ordem       │ "Causa e     │ "Você vê     │ "Eventualm-  │
│              │  global"     │  efeito"     │  suas        │  ente         │
│              │              │              │  escritas"   │  converge"   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
  ▲ Latência alta                                         ▲ Latência baixa
  ▲ Disponibilidade baixa                                 ▲ Disponibilidade alta
```

---

### 1. Linearizability (Consistência Forte / Strict)

O modelo **mais forte**. Toda operação parece ocorrer **instantaneamente** em algum ponto entre sua invocação e resposta. Como se houvesse uma **única cópia** dos dados.

**Garantias**:
- Se uma escrita completa antes de uma leitura iniciar, a leitura **deve** ver essa escrita
- Todas as operações têm uma ordem total consistente com o tempo real
- Equivalente a um sistema single-node do ponto de vista do cliente

**Custo**: Requer coordenação entre nós (consenso), alta latência, menor disponibilidade durante partições.

**Onde é usado**: etcd, ZooKeeper, CockroachDB, Spanner (Google).

```
Tempo real →

Cliente A:  |---Write(x=1)---|
Cliente B:                        |---Read(x)---| → deve retornar 1
                                                     (a escrita já completou)
```

### 2. Sequential Consistency

Todas as operações de **todos os clientes** são vistas na mesma ordem. Essa ordem é consistente com a ordem de operações de cada cliente individual, mas **não precisa respeitar o tempo real**.

**Diferença para Linearizability**: A ordem global não precisa corresponder ao tempo real das operações.

```
Cliente A: Write(x=1), Write(x=2)
Cliente B: Read(x) → pode ver 1 ou 2, mas se viu 2, nunca verá 1 depois
```

### 3. Causal Consistency

Operações que têm **relação causal** são vistas na mesma ordem por todos. Operações **concorrentes** (sem relação causal) podem ser vistas em ordens diferentes.

**Relação causal**: A operação B é causalmente dependente de A se B poderia ter sido influenciada pelo resultado de A.

```
Cliente A: Write(x=1)                     ← causa
Cliente A: Write(y=2) baseado em x=1      ← efeito

Todos os clientes veem: x=1 antes de y=2 (causalidade preservada)
Mas operações concorrentes sem relação causal podem aparecer em qualquer ordem.
```

**Onde é usado**: MongoDB (padrão com causal sessions), COPS.

### 4. Read-Your-Writes (Session Consistency)

Um cliente **sempre vê suas próprias escritas**. Outros clientes podem ver versões anteriores.

**Caso clássico**: Após atualizar seu perfil, você deve ver a versão atualizada. Outros usuários podem ver a versão antiga temporariamente.

```
Cliente A: Write(nome="Alice Atualizado")
Cliente A: Read(nome) → "Alice Atualizado"  ✓ (garantido)
Cliente B: Read(nome) → "Alice"              ✓ (aceitável, stale)
```

### 5. Eventual Consistency

O modelo **mais relaxado**. Se nenhuma nova escrita for feita, **eventualmente** todos os nós convergem para o mesmo valor. Sem garantia de quanto tempo leva.

**Garantias**: Apenas convergência eventual. Leituras podem retornar valores desatualizados por tempo indefinido.

**Onde é usado**: DNS, Cassandra (configuração padrão), DynamoDB (default reads), caches distribuídos.

---

## Funcionamento Interno

### Como Garantir Linearizability

**Abordagem 1: Leader-based replication com leitura no líder**
```
Escrita → Líder → Replica síncrona → Followers
Leitura → Sempre do Líder (ou de Follower com lease)
```

**Abordagem 2: Quorum reads/writes**
```
N nós, W escritas confirmadas, R leituras consultadas
Garantia: W + R > N → pelo menos um nó consultado na leitura tem o dado mais recente

Exemplo: N=3, W=2, R=2
  Escrita: confirmada por 2 de 3 nós
  Leitura: consulta 2 de 3 nós → overlap de pelo menos 1 nó
```

### Mecanismos de Detecção de Causalidade

**Vector Clocks**: Cada nó mantém um vetor com um contador por nó.

```
Nó A: [A:1, B:0, C:0]  → Write(x=1)
Nó B: [A:1, B:1, C:0]  → Read(x), Write(y=2)  (causal: viu x=1)
Nó C: [A:0, B:0, C:1]  → Write(z=3)            (concorrente: não viu x=1)

Comparação:
  [A:1, B:1, C:0] → [A:1, B:0, C:0]: B aconteceu depois (causalmente)
  [A:1, B:0, C:0] ↔ [A:0, B:0, C:1]: Concorrentes (incomparáveis)
```

**Lamport Timestamps**: Contador lógico global mais simples, mas não distingue causalidade de concorrência.

### Resolução de Conflitos em Eventual Consistency

Quando escritas concorrentes geram conflitos:

| Estratégia | Descrição | Trade-off |
|-----------|-----------|-----------|
| **Last-Write-Wins (LWW)** | Timestamp mais recente vence | Simples, mas perde escritas |
| **Vector Clocks** | Detecta conflitos, merge manual | Complexo, preserva dados |
| **CRDTs** | Estruturas que convergem automaticamente | Limitado a certos tipos de dados |
| **Application-level** | A aplicação resolve | Flexível, complexo de implementar |

---

## Casos de Uso

### Google Spanner — Linearizability Global com TrueTime

O Google Spanner é o único banco de dados que oferece **linearizability global** usando relógios atômicos (TrueTime API). Cada operação recebe um timestamp com incerteza limitada, permitindo ordenação global sem comunicação entre datacenters.

**Trade-off**: Latência de escrita de ~10ms (espera o intervalo de incerteza do TrueTime).

### Amazon DynamoDB — Eventual por padrão, Strong por requisição

DynamoDB oferece ambos os modelos:
- `ConsistentRead: false` → Eventual consistency (padrão, menor latência)
- `ConsistentRead: true` → Strong consistency (maior latência, leitura do líder)

A escolha é **por operação**, não por tabela.

### Slack — Read-Your-Writes para Mensagens

Quando você envia uma mensagem no Slack, ela aparece imediatamente na sua tela (read-your-writes). Outros participantes da conversa podem ter um delay de milissegundos a segundos (eventual consistency na replicação).

---

## Vantagens

| Modelo | Vantagem Principal |
|--------|-------------------|
| Linearizability | Mais fácil de raciocinar, como single-node |
| Sequential | Garante ordem global sem custo do tempo real |
| Causal | Captura dependências reais sem overhead de linearizability |
| Read-Your-Writes | Experiência consistente para o usuário individual |
| Eventual | Máxima disponibilidade e menor latência |

---

## Desvantagens

| Modelo | Desvantagem Principal |
|--------|-----------------------|
| Linearizability | Alta latência, indisponível durante partições |
| Sequential | Pode reordenar em relação ao tempo real |
| Causal | Complexo de implementar (vector clocks) |
| Read-Your-Writes | Sticky sessions limitam load balancing |
| Eventual | Leituras stale, conflitos possíveis |

---

## Erros Comuns

### 1. "Eventual consistency = dados incorretos"
**Errado**. Eventual consistency garante convergência. Os dados estarão corretos — eventualmente. O "problema" é o delay, não a corretude final.

### 2. "Strong consistency é sempre melhor"
**Errado**. Strong consistency tem custo. Para um contador de likes em um post, pagar o preço de linearizability é desperdício. Para um saldo bancário, é obrigatório.

### 3. "Quorum garante linearizability"
**Nem sempre**. Quorum (W + R > N) garante que a leitura vê a escrita mais recente em cenários simples, mas sem cuidados adicionais (como read repair ou consensus), pode haver race conditions.

### 4. Ignorar o modelo de consistência do banco de dados
Muitos desenvolvedores usam bancos de dados distribuídos sem entender o modelo de consistência padrão. Cassandra com `CL=ONE` é eventual. Com `CL=QUORUM` é mais forte. A configuração importa.

---

## Exemplos

### Exemplo: Simulando Modelos de Consistência em Go

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// Replica simula um nó de armazenamento
type Replica struct {
	ID   string
	data map[string]VersionedValue
	mu   sync.RWMutex
}

// VersionedValue armazena valor com timestamp para ordenação
type VersionedValue struct {
	Value     string
	Timestamp time.Time
	Version   int
}

// EventualStore simula um store com eventual consistency
type EventualStore struct {
	replicas []*Replica
	mu       sync.RWMutex
}

func NewEventualStore(n int) *EventualStore {
	replicas := make([]*Replica, n)
	for i := 0; i < n; i++ {
		replicas[i] = &Replica{
			ID:   fmt.Sprintf("replica-%d", i+1),
			data: make(map[string]VersionedValue),
		}
	}
	return &EventualStore{replicas: replicas}
}

// Write escreve em uma réplica e propaga assíncronamente
func (s *EventualStore) Write(key, value string) {
	// Escrita vai para a primeira réplica (simula líder)
	primary := s.replicas[0]
	primary.mu.Lock()
	v := VersionedValue{
		Value:     value,
		Timestamp: time.Now(),
		Version:   1,
	}
	if existing, ok := primary.data[key]; ok {
		v.Version = existing.Version + 1
	}
	primary.data[key] = v
	primary.mu.Unlock()

	fmt.Printf("[Write] %s = %s (v%d) em %s\n", key, value, v.Version, primary.ID)

	// Propagação assíncrona para outras réplicas (simula replication lag)
	go func() {
		time.Sleep(500 * time.Millisecond) // simula delay de rede
		for _, r := range s.replicas[1:] {
			r.mu.Lock()
			r.data[key] = v
			r.mu.Unlock()
			fmt.Printf("[Replicação] %s = %s propagado para %s\n", key, value, r.ID)
		}
	}()
}

// ReadFromReplica lê de uma réplica específica
func (s *EventualStore) ReadFromReplica(replicaIdx int, key string) (string, bool) {
	r := s.replicas[replicaIdx]
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, ok := r.data[key]
	if !ok {
		return "", false
	}
	return v.Value, true
}

func main() {
	fmt.Println("=== Demonstração: Eventual Consistency ===\n")

	store := NewEventualStore(3)

	// Escreve na réplica primária
	store.Write("user:name", "Alice")

	// Leitura imediata da réplica primária → vê a escrita
	if val, ok := store.ReadFromReplica(0, "user:name"); ok {
		fmt.Printf("[Read replica-1] user:name = %s ✓ (read-your-writes)\n", val)
	}

	// Leitura imediata de outra réplica → pode não ver a escrita ainda
	if _, ok := store.ReadFromReplica(1, "user:name"); !ok {
		fmt.Println("[Read replica-2] user:name = NOT FOUND (stale read!)")
	}

	// Espera a replicação
	fmt.Println("\n... aguardando propagação (500ms) ...\n")
	time.Sleep(600 * time.Millisecond)

	// Agora todas as réplicas têm o dado
	for i := 0; i < 3; i++ {
		if val, ok := store.ReadFromReplica(i, "user:name"); ok {
			fmt.Printf("[Read replica-%d] user:name = %s ✓ (convergiu)\n", i+1, val)
		}
	}
}
```

---

## Exercícios

### Exercício 1 — Identificação de Modelos
Para cada cenário, identifique qual modelo de consistência é mais adequado:

1. Sistema de chat em tempo real
2. Carrinho de compras em e-commerce
3. Sistema de reserva de assentos em avião
4. Feed de rede social
5. Ledger financeiro de banco

### Exercício 2 — Vector Clocks
Dado o seguinte cenário com 3 nós (A, B, C), calcule os vector clocks:

1. A escreve x=1 → VC_A = ?
2. B lê de A, escreve y=2 → VC_B = ?
3. C escreve z=3 (independente) → VC_C = ?
4. B envia mensagem para C → VC_C atualizado = ?
5. Quais operações são concorrentes?

### Exercício 3 — Quorum Calculator
Implemente uma função que, dado N (total de nós), calcule todas as combinações válidas de W (write quorum) e R (read quorum) que satisfaçam `W + R > N`.

---

## Projeto Prático

### Key-Value Store com Consistência Configurável

**Objetivo**: Estender o projeto do [Teorema CAP](01-cap-theorem.md) adicionando suporte a múltiplos modelos de consistência.

**Requisitos**:
1. Suporte a 3 níveis de consistência: `STRONG`, `SESSION`, `EVENTUAL`
2. `STRONG`: Leitura sempre do líder após confirmar quorum
3. `SESSION`: Sticky session — cliente sempre lê do mesmo nó
4. `EVENTUAL`: Leitura de qualquer réplica
5. Endpoint `GET /data/{key}?consistency=strong|session|eventual`
6. Métricas de latência por nível de consistência

---

## Perguntas de Entrevista

### Nível Pleno

**P: Qual a diferença entre Eventual Consistency e Strong Consistency?**
R: Strong Consistency garante que toda leitura retorna a escrita mais recente — como se houvesse uma única cópia dos dados. Eventual Consistency garante apenas que, na ausência de novas escritas, todos os nós eventualmente convergem para o mesmo valor. O trade-off é latência e disponibilidade: strong consistency exige coordenação entre nós (mais lento, menos disponível), eventual consistency permite que cada nó responda independentemente (mais rápido, mais disponível).

### Nível Senior

**P: O que são Vector Clocks e quando você os usaria?**
R: Vector Clocks são estruturas de dados que rastreiam causalidade em sistemas distribuídos. Cada nó mantém um vetor com um contador por nó. Quando dois vector clocks são incomparáveis (nenhum domina o outro), as operações são concorrentes e potencialmente conflitantes. São usados em sistemas AP como DynamoDB (versões anteriores) e Riak para detectar conflitos de escrita concorrente, permitindo que a aplicação resolva o conflito.

### Nível Staff

**P: Compare CRDTs com Vector Clocks para resolução de conflitos. Quando usar cada um?**
R: **Vector Clocks** detectam conflitos mas não os resolvem automaticamente — exigem intervenção da aplicação ou heurísticas (LWW). São genéricos e funcionam com qualquer tipo de dado. **CRDTs** (Conflict-free Replicated Data Types) são estruturas de dados que convergem automaticamente sem coordenação, usando propriedades matemáticas (comutatividade, associatividade, idempotência). Mas são limitados a tipos específicos: contadores, sets, registros LWW, mapas. Use CRDTs quando o tipo de dado se encaixa (contadores, flags, sets). Use Vector Clocks quando precisa de resolução customizada ou com tipos complexos.

---

## Referências

1. **Livro**: Kleppmann, M. (2017). *Designing Data-Intensive Applications*, Cap. 5 — Replication, Cap. 9 — Consistency and Consensus
2. **Paper**: Lamport, L. (1978). *Time, Clocks, and the Ordering of Events in a Distributed System*
3. **Paper**: Shapiro, M. et al. (2011). *A comprehensive study of Convergent and Commutative Replicated Data Types*
4. **Artigo**: Bailis, P. & Ghodsi, A. (2013). *Eventual Consistency Today: Limitations, Extensions, and Beyond*
5. **Tópicos relacionados**: [Teorema CAP](01-cap-theorem.md) | [Consenso Distribuído](03-distributed-consensus.md)
