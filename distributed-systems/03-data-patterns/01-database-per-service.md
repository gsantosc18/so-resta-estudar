# Database per Service

## Objetivo

Compreender o padrão de banco de dados por serviço, por que ele é fundamental em microserviços, como implementá-lo, e os desafios de consultas cross-service e transações distribuídas que ele introduz.

---

## Pré-requisitos

- [Modelos de Consistência](../01-foundations/02-consistency-models.md)
- Conceitos de Domain-Driven Design (Bounded Contexts)
- Experiência com bancos de dados relacionais

---

## Conceitos Fundamentais

### O que é Database per Service?

Cada microserviço é **dono exclusivo** de seus dados e os expõe apenas através de sua API. Nenhum outro serviço acessa diretamente o banco de dados de outro.

```mermaid
flowchart TD
    subgraph Shared Database (Antipadrão)
        OS1[OrderService]
        US1[UserService]
        IS1[InventoryService]
        DB[(PostgreSQL<br>shared)]
        
        OS1 --> DB
        US1 --> DB
        IS1 --> DB
    end

    subgraph Database per Service (Recomendado)
        OS2[OrderService]
        US2[UserService]
        IS2[InventoryService]
        
        DB1[(PostgreSQL<br>orders)]
        DB2[(MongoDB<br>users)]
        DB3[(Redis<br>inventory)]
        
        OS2 --> DB1
        US2 --> DB2
        IS2 --> DB3
    end
```

### Por que não compartilhar o banco?

| Problema do Shared Database | Consequência |
|----------------------------|--------------|
| **Acoplamento de schema** | Alterar uma tabela pode quebrar outro serviço |
| **Acoplamento de deploy** | Migrations exigem coordenação entre times |
| **Acoplamento de tecnologia** | Todos forçados a usar o mesmo SGBD |
| **Gargalo de performance** | Um serviço pode afetar a performance de outro |
| **Boundaries borrados** | Quem é dono dos dados? Todos e ninguém |

### Variações de Isolamento

| Nível | Descrição | Isolamento |
|-------|-----------|------------|
| **Banco separado** | Cada serviço tem sua instância | Máximo |
| **Schema separado** | Mesmo banco, schemas diferentes | Alto |
| **Tabela separada** | Mesmo schema, tabelas exclusivas | Médio |
| **SGBD diferente** | Polyglot persistence (Postgres + Mongo + Redis) | Máximo + flexibilidade |

---

## Funcionamento Interno

### Polyglot Persistence

Cada serviço escolhe o banco mais adequado para seu domínio:

```
OrderService     → PostgreSQL  (transações ACID, dados relacionais)
UserService      → PostgreSQL  (dados estruturados, queries complexas)
ProductService   → MongoDB     (catálogo flexível, schema variável)
SearchService    → Elasticsearch (full-text search, faceted)
SessionService   → Redis       (chave-valor, expiração automática)
AnalyticsService → ClickHouse  (OLAP, agregações massivas)
GraphService     → Neo4j       (relacionamentos complexos)
```

### Desafios Introduzidos

#### 1. Queries Cross-Service
**Problema**: Como listar "pedidos com nome do usuário" se dados estão em bancos diferentes?

**Soluções**:
- **API Composition**: Gateway ou BFF faz N chamadas e agrega
- **CQRS**: Materialized view com dados denormalizados para leitura
- **Event-carried state**: Consumir eventos e manter cópia local dos dados necessários

#### 2. Transações Distribuídas
**Problema**: Como garantir atomicidade quando o pedido (OrderService) e o pagamento (PaymentService) estão em bancos diferentes?

**Soluções**:
- **Saga Pattern**: Sequência de transações locais com compensação
- **Outbox Pattern**: Garante publicação de eventos na mesma transação
- **Evitar**: Se possível, redesenhar para que a transação fique em um único serviço

#### 3. Data Consistency
**Problema**: Dados duplicados entre serviços podem divergir.

**Soluções**:
- **Event-driven sync**: Propagar mudanças via eventos
- **Reconciliation jobs**: Verificação periódica de consistência
- **Aceitar eventual consistency**: Para dados não-críticos

---

## Casos de Uso

### Amazon — Thousands of Databases

Cada time na Amazon tem autonomia total sobre seu banco de dados. O time de Recommendations usa DynamoDB. O time de Orders usa MySQL. O time de Search usa Elasticsearch. Cada um escala e evolui independentemente.

### Netflix — Polyglot Persistence

- **Cassandra**: Dados de viewing history (write-heavy, alta disponibilidade)
- **MySQL**: Dados de billing e accounts (ACID)
- **Elasticsearch**: Busca de conteúdo
- **Redis**: Cache de sessão e metadados

---

## Vantagens

1. **Autonomia de time**: Cada time escolhe e gerencia seu banco
2. **Isolamento de falhas**: Problema no banco de Orders não afeta Users
3. **Escalabilidade independente**: Cada banco escala conforme sua carga
4. **Tecnologia adequada**: Polyglot persistence — banco certo para cada problema
5. **Deploy independente**: Migrations sem coordenação entre times
6. **Bounded contexts claros**: Dados pertencem a quem os gerencia

---

## Desvantagens

1. **Queries cross-service**: JOINs entre serviços são impossíveis
2. **Transações distribuídas**: Sem ACID cross-service (precisa de Saga)
3. **Duplicação de dados**: Inevitável para performance
4. **Complexidade operacional**: N bancos para gerenciar, monitorar, backupar
5. **Consistência eventual**: Dados entre serviços podem estar desatualizados
6. **Custo**: Múltiplas instâncias de banco = mais infraestrutura

---

## Erros Comuns

### 1. Shared database "temporário"
"Vamos compartilhar o banco por enquanto e separar depois" → Nunca separa. O acoplamento se acumula e a separação fica cada vez mais cara.

### 2. Acessar banco de outro serviço "só para leitura"
Mesmo leituras criam acoplamento de schema. O outro time não pode alterar tabelas sem verificar se você quebra.

### 3. Não definir ownership de dados
Se dois serviços escrevem na mesma entidade "Usuário", quem é o dono? Sem ownership claro, inconsistências e conflitos são inevitáveis.

### 4. JOINs via API (N+1 distribuído)
```go
// ❌ Para cada pedido, chama UserService (N+1)
for _, order := range orders {
    user, _ := userClient.GetUser(order.UserID)
}

// ✅ Batch call
users, _ := userClient.GetUsers(userIDs)
```

---

## Exemplos

### Exemplo: Serviços com Bancos Independentes em Go

```go
package main

import (
	"fmt"
	"sync"
)

// --- Order Service (simula PostgreSQL) ---

type Order struct {
	ID     string
	UserID string
	Amount float64
	Status string
}

type OrderRepository struct {
	orders map[string]Order
	mu     sync.RWMutex
}

func NewOrderRepository() *OrderRepository {
	return &OrderRepository{orders: make(map[string]Order)}
}

func (r *OrderRepository) Save(order Order) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.orders[order.ID] = order
	fmt.Printf("[OrderDB] Saved order %s (PostgreSQL)\n", order.ID)
}

func (r *OrderRepository) FindByUserID(userID string) []Order {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []Order
	for _, o := range r.orders {
		if o.UserID == userID {
			result = append(result, o)
		}
	}
	return result
}

// --- User Service (simula MongoDB) ---

type User struct {
	ID    string
	Name  string
	Email string
}

type UserRepository struct {
	users map[string]User
	mu    sync.RWMutex
}

func NewUserRepository() *UserRepository {
	return &UserRepository{users: make(map[string]User)}
}

func (r *UserRepository) Save(user User) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.users[user.ID] = user
	fmt.Printf("[UserDB] Saved user %s (MongoDB)\n", user.ID)
}

func (r *UserRepository) FindByID(id string) (User, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.users[id]
	return u, ok
}

func (r *UserRepository) FindByIDs(ids []string) map[string]User {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make(map[string]User)
	for _, id := range ids {
		if u, ok := r.users[id]; ok {
			result[id] = u
		}
	}
	return result
}

// --- API Composition (BFF / Gateway) ---

type OrderWithUser struct {
	Order    Order
	UserName string
}

type OrderAggregator struct {
	orderRepo *OrderRepository
	userRepo  *UserRepository
}

func (a *OrderAggregator) GetOrdersWithUserName(userID string) []OrderWithUser {
	orders := a.orderRepo.FindByUserID(userID)

	// Batch: coleta user IDs únicos
	userIDs := make([]string, 0)
	seen := make(map[string]bool)
	for _, o := range orders {
		if !seen[o.UserID] {
			userIDs = append(userIDs, o.UserID)
			seen[o.UserID] = true
		}
	}

	// Uma chamada batch em vez de N chamadas
	users := a.userRepo.FindByIDs(userIDs)

	// Composição
	result := make([]OrderWithUser, len(orders))
	for i, o := range orders {
		userName := "Unknown"
		if u, ok := users[o.UserID]; ok {
			userName = u.Name
		}
		result[i] = OrderWithUser{Order: o, UserName: userName}
	}
	return result
}

func main() {
	fmt.Println("=== Database per Service ===\n")

	// Cada serviço tem seu banco
	orderRepo := NewOrderRepository()
	userRepo := NewUserRepository()

	// Salvar dados em bancos separados
	userRepo.Save(User{ID: "USR-1", Name: "Alice", Email: "alice@example.com"})
	userRepo.Save(User{ID: "USR-2", Name: "Bob", Email: "bob@example.com"})

	orderRepo.Save(Order{ID: "ORD-1", UserID: "USR-1", Amount: 99.90, Status: "paid"})
	orderRepo.Save(Order{ID: "ORD-2", UserID: "USR-1", Amount: 299.00, Status: "shipped"})
	orderRepo.Save(Order{ID: "ORD-3", UserID: "USR-2", Amount: 49.90, Status: "pending"})

	// API Composition: combina dados de bancos diferentes
	fmt.Println("\n--- API Composition (JOIN cross-service) ---")
	aggregator := &OrderAggregator{orderRepo: orderRepo, userRepo: userRepo}
	ordersWithUser := aggregator.GetOrdersWithUserName("USR-1")

	for _, o := range ordersWithUser {
		fmt.Printf("  Order %s | User: %s | R$%.2f | Status: %s\n",
			o.Order.ID, o.UserName, o.Order.Amount, o.Order.Status)
	}
}
```

---

## Exercícios

### Exercício 1 — Design de Ownership
Para um sistema de e-commerce com: Users, Products, Orders, Payments, Reviews, Shipping — defina qual serviço é dono de cada entidade e qual banco seria adequado.

### Exercício 2 — Query Cross-Service
Projete como implementar a funcionalidade "Dashboard do vendedor" que mostra: pedidos recentes, avaliações dos produtos, e saldo a receber — dados que estão em 3 serviços diferentes.

### Exercício 3 — Migration Strategy
Você tem um monolito com um PostgreSQL compartilhado. Descreva o passo a passo para migrar para database-per-service sem downtime.

---

## Projeto Prático

### E-Commerce com Polyglot Persistence

**Objetivo**: Implementar 3 microserviços em Go, cada um com seu "banco" in-memory, comunicando via HTTP.

**Requisitos**:
1. UserService (map como "MongoDB") — porta 8081
2. OrderService (map como "PostgreSQL") — porta 8082
3. ProductService (map como "Redis") — porta 8083
4. API Gateway (porta 8080) — agrega dados dos 3 serviços
5. Endpoint: `GET /dashboard/{userId}` → retorna dados combinados

---

## Perguntas de Entrevista

### Nível Pleno

**P: Por que cada microserviço deveria ter seu próprio banco de dados?**
R: Para garantir autonomia, isolamento de falhas e independência de deploy. Com shared database, alterar o schema pode quebrar outros serviços, criar gargalos de performance compartilhados, e forçar coordenação entre times para deployments. Cada serviço ter seu banco permite escolher a tecnologia adequada, escalar independentemente, e manter bounded contexts claros.

### Nível Senior

**P: Como resolver o problema de queries que precisam de dados de múltiplos serviços?**
R: Três abordagens: (1) API Composition — um serviço agregador faz chamadas a múltiplos serviços e combina os resultados. Simples mas adiciona latência. (2) CQRS com materialized views — consumir eventos dos serviços e manter uma view otimizada para a query específica. Mais complexo mas melhor performance. (3) Event-carried state transfer — cada serviço mantém uma cópia local dos dados que precisa de outros serviços, atualizada via eventos. A escolha depende de: frequência da query, requisitos de latência, tolerância a dados stale.

### Nível Staff

**P: Como você migraria de shared database para database-per-service em produção?**
R: Strangler Fig Pattern: (1) Criar o novo serviço com seu banco. (2) Dual-write: o monolito escreve nos dois bancos temporariamente. (3) Shadow read: o novo serviço lê do novo banco, comparando com o antigo para validar. (4) Switchover: direcionar tráfego para o novo serviço. (5) Cleanup: remover código do monolito. Durante todo o processo, manter CDC (Change Data Capture) do banco antigo para o novo para garantir sincronização. O ponto mais difícil: dados que são JOINed com outras tabelas no monolito agora precisam de API calls.

---

## Referências

1. **Livro**: Newman, S. (2021). *Building Microservices*, Cap. 4 — The Database
2. **Livro**: Richardson, C. (2018). *Microservices Patterns*, Cap. 2 — Decomposition Strategies
3. **Artigo**: Fowler, M. *Database per Service Pattern* — microservices.io
4. **Tópicos relacionados**: [Saga Pattern](02-saga-pattern.md) | [CQRS](05-cqrs.md) | [Event Sourcing](04-event-sourcing.md)
