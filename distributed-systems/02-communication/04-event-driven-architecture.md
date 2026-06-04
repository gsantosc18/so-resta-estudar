# Event-Driven Architecture (EDA)

## Objetivo

Compreender Event-Driven Architecture como estilo arquitetural, diferenciando event notification, event-carried state transfer e event sourcing, e entender como EDA habilita sistemas desacoplados, escaláveis e reativos.

---

## Pré-requisitos

- [Síncrono vs Assíncrono](01-synchronous-vs-asynchronous.md)
- [Message Brokers](03-message-brokers.md)
- Conceitos de Domain-Driven Design (DDD)

---

## Conceitos Fundamentais

### O que é Event-Driven Architecture?

EDA é um estilo arquitetural onde componentes se comunicam através da **produção, detecção e consumo de eventos**. Um evento representa um **fato que aconteceu** — é imutável e no passado.

```
Evento ≠ Comando

Comando: "Crie o pedido"     → imperativo, dirigido a alguém
Evento:  "Pedido foi criado" → declarativo, notifica a todos
```

### Tipos de Eventos (Martin Fowler)

#### 1. Event Notification
Notifica que algo aconteceu, com **mínimo de dados**. Consumidores precisam buscar detalhes.

```json
{
  "type": "OrderCreated",
  "orderId": "ORD-123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```
O consumidor precisa chamar `GET /orders/ORD-123` para obter os detalhes → **cria acoplamento**.

#### 2. Event-Carried State Transfer
O evento carrega **todos os dados relevantes**. Consumidores não precisam buscar mais informações.

```json
{
  "type": "OrderCreated",
  "orderId": "ORD-123",
  "userId": "USR-001",
  "items": [
    {"productId": "PROD-1", "name": "Teclado", "quantity": 1, "price": 299.90}
  ],
  "total": 299.90,
  "shippingAddress": {
    "street": "Rua X, 123",
    "city": "São Paulo"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```
Consumidor tem tudo que precisa → **sem acoplamento**, mas evento maior.

#### 3. Event Sourcing
O evento **é** a fonte de verdade. O estado é derivado do replay de eventos.
→ Ver: [Event Sourcing](../03-data-patterns/04-event-sourcing.md)

### Topologias

#### Mediator Topology
Um mediador central coordena o fluxo de eventos.

```
   Evento ──► [Mediador] ──► Step 1 ──► Step 2 ──► Step 3
                    │
              Orquestra o fluxo
              (sabe quem chamar e quando)
```

**Quando usar**: Fluxos complexos com múltiplos passos e lógica condicional.

#### Broker Topology
Sem mediador. Cada componente reage a eventos e publica novos eventos.

```
OrderService ──"OrderCreated"──► [Broker]
                                    ├──► InventoryService ──"StockReserved"──► [Broker]
                                    ├──► PaymentService  ──"PaymentProcessed"──► [Broker]
                                    └──► NotificationService
```

**Quando usar**: Fluxos desacoplados onde cada serviço sabe o que fazer com cada evento.

---

## Funcionamento Interno

### Event Schema e Evolução

Um contrato de evento deve ser tratado como uma **API pública**:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string" },
    "aggregateId": { "type": "string" },
    "aggregateType": { "type": "string" },
    "version": { "type": "integer" },
    "timestamp": { "type": "string", "format": "date-time" },
    "data": { "type": "object" },
    "metadata": {
      "type": "object",
      "properties": {
        "correlationId": { "type": "string" },
        "causationId": { "type": "string" },
        "userId": { "type": "string" }
      }
    }
  }
}
```

**Regras de evolução**:
- Adicionar campos opcionais → ✅ backward compatible
- Remover campos → ❌ breaking change
- Mudar tipo de campo → ❌ breaking change
- Usar schema registry (Confluent, AWS Glue) para versionamento

### Correlation e Causation IDs

```
Request do cliente (correlationId: "abc-123")
  └─► OrderCreated (eventId: "evt-1", correlationId: "abc-123", causationId: "abc-123")
       ├─► StockReserved (eventId: "evt-2", correlationId: "abc-123", causationId: "evt-1")
       └─► PaymentProcessed (eventId: "evt-3", correlationId: "abc-123", causationId: "evt-1")
            └─► NotificationSent (eventId: "evt-4", correlationId: "abc-123", causationId: "evt-3")
```

- **correlationId**: Identifica toda a cadeia de eventos originada de um request
- **causationId**: Identifica o evento que causou este evento (pai direto)
- Permite reconstruir a **árvore de causalidade** completa para debugging

---

## Casos de Uso

### Amazon — Tudo é Evento

A arquitetura da Amazon é fundamentalmente event-driven:
- Pedido criado → evento dispara dezenas de reações (estoque, pagamento, fulfillment, fraud detection, recommendations, analytics)
- Cada equipe é dona de seus eventos e seus consumidores
- Backbone: SQS + SNS + EventBridge + Kinesis

### Nubank — Event-First Architecture

- Toda operação de negócio é um evento no Kafka
- O "estado" é derivado do replay de eventos
- Permite reconstruir o saldo de qualquer conta em qualquer ponto no tempo
- Auditoria 100% natural (todo evento é registrado)

### Mercado Livre — Eventos para Escalabilidade

- ~1 bilhão de eventos/dia via Kafka
- Search indexing: eventos de produto → índice de busca
- Pricing: eventos de oferta/demanda → preço dinâmico
- Notifications: eventos de compra → push/email/SMS

---

## Vantagens

1. **Baixo acoplamento**: Produtor não sabe quem consome
2. **Escalabilidade**: Adicionar novos consumidores sem alterar o produtor
3. **Resiliência**: Falha de um consumidor não afeta outros
4. **Extensibilidade**: Novo requisito = novo consumidor (sem alterar código existente)
5. **Auditoria natural**: Eventos são o registro do que aconteceu
6. **Temporal decoupling**: Produtor e consumidor não precisam estar online ao mesmo tempo

---

## Desvantagens

1. **Complexidade**: Fluxo distribuído é mais difícil de entender
2. **Debugging**: "O que aconteceu com meu pedido?" requer tracing distribuído
3. **Consistência eventual**: O estado leva tempo para convergir
4. **Ordenação**: Garantir ordem de processamento é não-trivial
5. **Schema evolution**: Alterar a estrutura de eventos sem quebrar consumidores
6. **Duplicatas**: Eventos podem ser entregues mais de uma vez

---

## Erros Comuns

### 1. Eventos com dados demais (fat events)
Se um evento contém toda a entidade com 50 campos, qualquer mudança no schema quebra consumidores. Balance entre notification e carried state.

### 2. Eventos como comandos disfarçados
```
// ❌ Isso é um comando, não um evento
{ "type": "SendEmailToUser", "userId": "123", "template": "welcome" }

// ✅ Isso é um evento
{ "type": "UserRegistered", "userId": "123", "email": "alice@example.com" }
// O NotificationService decide se/como envia email
```

### 3. Não usar correlationId
Sem correlation ID, é impossível rastrear o fluxo de um request que disparou dezenas de eventos em serviços diferentes.

### 4. Acoplamento temporal disfarçado
```
// ❌ Consumidor espera evento em <5 segundos para timeout
// Isso reintroduz acoplamento temporal em sistema "assíncrono"

// ✅ Design para eventual consistency
// O consumidor processa quando puder, sem prazo
```

### 5. Event storm: publicar eventos para tudo
Nem tudo precisa ser um evento. Logging, métricas e queries não devem ser modelados como domain events. Reserve eventos para **fatos de domínio significativos**.

---

## Exemplos

### Exemplo: Event-Driven Order Processing em Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// --- Domain Events ---

type DomainEvent struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	AggregateID   string          `json:"aggregate_id"`
	AggregateType string          `json:"aggregate_type"`
	Timestamp     time.Time       `json:"timestamp"`
	CorrelationID string          `json:"correlation_id"`
	CausationID   string          `json:"causation_id"`
	Data          json.RawMessage `json:"data"`
}

func NewEvent(eventType, aggID, aggType, corrID, causeID string, data interface{}) DomainEvent {
	payload, _ := json.Marshal(data)
	return DomainEvent{
		EventID:       generateID(),
		EventType:     eventType,
		AggregateID:   aggID,
		AggregateType: aggType,
		Timestamp:     time.Now(),
		CorrelationID: corrID,
		CausationID:   causeID,
		Data:          payload,
	}
}

func generateID() string {
	// Em produção, usaria uuid.New().String()
	return fmt.Sprintf("evt-%d", time.Now().UnixNano())
}

// --- Event Bus ---

type EventHandler func(event DomainEvent) []DomainEvent

type EventBus struct {
	handlers map[string][]EventHandler
	mu       sync.RWMutex
}

func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[string][]EventHandler),
	}
}

func (eb *EventBus) Subscribe(eventType string, handler EventHandler) {
	eb.mu.Lock()
	defer eb.mu.Unlock()
	eb.handlers[eventType] = append(eb.handlers[eventType], handler)
}

func (eb *EventBus) Publish(event DomainEvent) {
	eb.mu.RLock()
	handlers := eb.handlers[event.EventType]
	eb.mu.RUnlock()

	fmt.Printf("\n📢 [EventBus] %s (corrID: %s)\n", event.EventType, event.CorrelationID[:8])

	var newEvents []DomainEvent
	for _, handler := range handlers {
		results := handler(event)
		newEvents = append(newEvents, results...)
	}

	// Publicar eventos derivados (chain reaction)
	for _, e := range newEvents {
		eb.Publish(e)
	}
}

// --- Event Handlers (Serviços) ---

type OrderData struct {
	OrderID string  `json:"order_id"`
	UserID  string  `json:"user_id"`
	Amount  float64 `json:"amount"`
}

type StockData struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}

type PaymentData struct {
	OrderID string  `json:"order_id"`
	Amount  float64 `json:"amount"`
	Status  string  `json:"status"`
}

func InventoryHandler(event DomainEvent) []DomainEvent {
	var order OrderData
	json.Unmarshal(event.Data, &order)

	fmt.Printf("  📦 [InventoryService] Reservando estoque para %s\n", order.OrderID)
	time.Sleep(30 * time.Millisecond)
	fmt.Printf("  📦 [InventoryService] ✓ Estoque reservado\n")

	// Emite novo evento
	return []DomainEvent{
		NewEvent("StockReserved", order.OrderID, "Order",
			event.CorrelationID, event.EventID,
			StockData{OrderID: order.OrderID, Status: "reserved"}),
	}
}

func PaymentHandler(event DomainEvent) []DomainEvent {
	var stock StockData
	json.Unmarshal(event.Data, &stock)

	fmt.Printf("  💳 [PaymentService] Processando pagamento para %s\n", stock.OrderID)
	time.Sleep(50 * time.Millisecond)
	fmt.Printf("  💳 [PaymentService] ✓ Pagamento aprovado\n")

	return []DomainEvent{
		NewEvent("PaymentProcessed", stock.OrderID, "Order",
			event.CorrelationID, event.EventID,
			PaymentData{OrderID: stock.OrderID, Amount: 299.90, Status: "approved"}),
	}
}

func NotificationHandler(event DomainEvent) []DomainEvent {
	fmt.Printf("  📧 [NotificationService] Enviando confirmação para pedido\n")
	time.Sleep(10 * time.Millisecond)
	fmt.Printf("  📧 [NotificationService] ✓ Email enviado\n")
	return nil // sem eventos derivados
}

func AnalyticsHandler(event DomainEvent) []DomainEvent {
	fmt.Printf("  📊 [AnalyticsService] Registrando evento %s\n", event.EventType)
	return nil
}

func main() {
	fmt.Println("=== Event-Driven Architecture: Order Processing ===")

	bus := NewEventBus()

	// Registrar handlers (cada serviço se inscreve nos eventos que interessa)
	bus.Subscribe("OrderCreated", InventoryHandler)
	bus.Subscribe("OrderCreated", AnalyticsHandler)
	bus.Subscribe("StockReserved", PaymentHandler)
	bus.Subscribe("PaymentProcessed", NotificationHandler)
	bus.Subscribe("PaymentProcessed", AnalyticsHandler)

	// Criar pedido → dispara cadeia de eventos
	correlationID := generateID()
	orderEvent := NewEvent("OrderCreated", "ORD-12345", "Order",
		correlationID, correlationID,
		OrderData{OrderID: "ORD-12345", UserID: "USR-001", Amount: 299.90})

	fmt.Println("\n🛒 Pedido criado! Disparando cadeia de eventos...")
	bus.Publish(orderEvent)

	fmt.Println("\n✓ Toda a cadeia de eventos processada via EDA")
	fmt.Println("\n💡 Observe: OrderService não sabe sobre Inventory, Payment ou Notification")
	fmt.Println("   Cada serviço reage ao evento que lhe interessa")

	_ = uuid.UUID{} // placeholder
}
```

---

## Exercícios

### Exercício 1 — Modelagem de Eventos
Para um sistema de e-commerce, modele os domain events para:
1. Ciclo de vida do pedido (criação → pagamento → envio → entrega)
2. Gestão de estoque (reserva → confirmação → baixa)
3. Programa de pontos/fidelidade

### Exercício 2 — Notification vs Carried State
Para cada evento do exercício 1, decida se deve ser event notification ou event-carried state transfer. Justifique.

### Exercício 3 — Trace de Causalidade
Dado o seguinte log de eventos, reconstrua a árvore de causalidade:
```
evt-1: OrderCreated (corrID: abc, causeID: abc)
evt-2: StockChecked (corrID: abc, causeID: evt-1)
evt-3: PaymentRequested (corrID: abc, causeID: evt-1)
evt-4: StockReserved (corrID: abc, causeID: evt-2)
evt-5: PaymentProcessed (corrID: abc, causeID: evt-3)
evt-6: OrderConfirmed (corrID: abc, causeID: evt-5)
```

---

## Projeto Prático

### Event-Driven Notification System

**Objetivo**: Implementar um sistema de notificações reativo que processa diferentes tipos de eventos e despacha notificações via múltiplos canais.

**Requisitos**:
1. Event bus com suporte a múltiplos handlers por evento
2. Eventos: `UserRegistered`, `OrderShipped`, `PaymentFailed`
3. Canais de notificação: Email, SMS, Push (simulados com log)
4. Regras: `UserRegistered` → Email. `OrderShipped` → Email+Push. `PaymentFailed` → Email+SMS
5. Correlation/Causation ID tracking
6. Log de todos os eventos processados (audit trail)

---

## Perguntas de Entrevista

### Nível Pleno

**P: O que é Event-Driven Architecture e quais os benefícios?**
R: EDA é um estilo arquitetural onde componentes comunicam via eventos — fatos imutáveis que representam algo que aconteceu. Benefícios: (1) baixo acoplamento — produtor não conhece consumidores; (2) escalabilidade — novos consumidores sem alterar produtores; (3) resiliência — falha de um consumidor não afeta outros; (4) auditoria natural — eventos são o log do que aconteceu.

### Nível Senior

**P: Qual a diferença entre event notification e event-carried state transfer? Quando usar cada um?**
R: Event notification contém apenas o ID e tipo, forçando o consumidor a buscar detalhes no serviço de origem (cria acoplamento runtime). Event-carried state transfer inclui todos os dados necessários no evento (elimina acoplamento runtime, mas eventos maiores e schema evolution mais complexo). Use notification para eventos onde poucos consumidores precisam dos detalhes. Use carried state quando muitos consumidores precisam dos dados e você quer eliminar dependência runtime do serviço produtor.

### Nível Staff

**P: Como garantir consistência em um sistema event-driven quando múltiplos serviços precisam reagir a um evento de forma coordenada?**
R: Três abordagens: (1) **Saga pattern** com compensação: cada serviço processa e publica resultado; se algum falha, a cadeia de compensação desfaz os anteriores. (2) **Process manager**: um componente centralizado (mediator) coordena o fluxo, verificando pré-condições e tratando falhas. (3) **Eventual consistency com reconciliation**: aceita inconsistência temporária e roda processos de reconciliação periódicos para detectar e corrigir divergências. A escolha depende do domínio: financeiro → saga com compensação rigorosa; analytics → eventual consistency é suficiente.

---

## Referências

1. **Artigo**: Fowler, M. (2017). *What do you mean by "Event-Driven"?* — martinfowler.com
2. **Livro**: Richards, M. (2015). *Software Architecture Patterns*, Cap. 2 — Event-Driven Architecture
3. **Livro**: Vernon, V. (2013). *Implementing Domain-Driven Design*, Cap. 8 — Domain Events
4. **Paper**: Overeem, M. et al. (2021). *An Empirical Characterization of Event Sourced Systems and Their Schema Evolution*
5. **Tópicos relacionados**: [Message Brokers](03-message-brokers.md) | [Event Sourcing](../03-data-patterns/04-event-sourcing.md) | [Saga Pattern](../03-data-patterns/02-saga-pattern.md)
