# Comunicação Síncrona vs Assíncrona

## Objetivo

Entender profundamente os dois paradigmas de comunicação entre serviços distribuídos, seus trade-offs, impacto em acoplamento, resiliência e escalabilidade, e quando usar cada abordagem.

---

## Pré-requisitos

- [Falácias da Computação Distribuída](../01-foundations/04-fallacies-of-distributed-computing.md)
- Conceitos de HTTP e TCP
- Noção de filas de mensagens

---

## Conceitos Fundamentais

### Comunicação Síncrona

O cliente envia uma requisição e **aguarda a resposta** antes de continuar. O fluxo é bloqueante.

```
Cliente ──req──► Serviço A ──req──► Serviço B
                                        │
Cliente ◄──res── Serviço A ◄──res── Serviço B
         ▲                                  ▲
         └──── tempo total de espera ───────┘
```

**Protocolos comuns**: HTTP/REST, gRPC, GraphQL

**Características**:
- Request-Response direto
- Acoplamento temporal: ambos precisam estar disponíveis ao mesmo tempo
- Latência acumulativa: tempo total = soma das latências
- Fácil de rastrear e debugar (trace linear)

### Comunicação Assíncrona

O produtor envia uma mensagem e **não aguarda resposta**. O processamento acontece de forma independente.

```
Produtor ──msg──► Broker ──msg──► Consumidor
    │                                  │
    ▼ (continua imediatamente)         ▼ (processa quando puder)
```

**Tecnologias comuns**: Kafka, RabbitMQ, NATS, Amazon SQS, Redis Streams

**Características**:
- Fire-and-forget ou eventual response
- Desacoplamento temporal: produtor e consumidor não precisam estar online ao mesmo tempo
- Broker como intermediário (buffer, persistência, retry)
- Mais difícil de rastrear e debugar

### Comparação Direta

| Aspecto | Síncrono | Assíncrono |
|---------|----------|------------|
| **Acoplamento temporal** | Alto (ambos online) | Baixo (independentes) |
| **Acoplamento espacial** | Alto (precisa saber o endereço) | Baixo (sabe apenas o tópico) |
| **Latência** | Acumulativa | Não bloqueante |
| **Throughput** | Limitado pelo mais lento | Limitado pelo broker |
| **Consistência** | Imediata (se necessário) | Eventual |
| **Debugging** | Simples (stack trace) | Complexo (trace distribuído) |
| **Resiliência** | Se B cai, A falha | Se B cai, mensagem fica no broker |
| **Ordem** | Garantida por chamada | Depende da configuração |

---

## Funcionamento Interno

### Padrões de Comunicação Síncrona

#### 1. Request-Response
```
A ──GET /users/123──► B
A ◄──{user: "Alice"}── B
```

#### 2. RPC (Remote Procedure Call)
```
A ──GetUser(123)──► B    // parece uma chamada local
A ◄──User{...}──── B     // mas atravessa a rede
```

#### 3. Aggregation (API Gateway)
```
Cliente ──req──► Gateway ──req──► Serviço A
                         ──req──► Serviço B
                         ──req──► Serviço C
Cliente ◄──{A+B+C}─── Gateway    // agrega respostas
```

### Padrões de Comunicação Assíncrona

#### 1. Point-to-Point (Queue)
```
Produtor ──msg──► [Queue] ──msg──► Consumidor único
```
Uma mensagem é processada por **exatamente um** consumidor.

#### 2. Publish-Subscribe (Topic)
```
Produtor ──msg──► [Topic] ──msg──► Consumidor A
                          ──msg──► Consumidor B
                          ──msg──► Consumidor C
```
Uma mensagem é entregue a **todos** os assinantes.

#### 3. Request-Reply Assíncrono
```
A ──request──► [Queue Request]  ──► B
A ◄──reply──── [Queue Response] ◄── B
```
Comunicação assíncrona com correlação de request-response via `correlationId`.

#### 4. Event Notification
```
OrderService ──"OrderCreated"──► [Topic]
                                   ├──► InventoryService
                                   ├──► NotificationService
                                   └──► AnalyticsService
```
O produtor **não sabe nem se importa** com quem consome o evento.

### Chain of Calls: O Problema da Latência Acumulativa

```
Síncrono:
  API → Auth (10ms) → Order (15ms) → Inventory (8ms) → Payment (20ms)
  Total: 53ms (soma) + overhead de rede

Síncrono com Paralelismo:
  API → Auth (10ms)
      → [Order (15ms) + Inventory (8ms)] em paralelo = 15ms
      → Payment (20ms)
  Total: 45ms

Assíncrono:
  API → Auth (10ms) → Publica "OrderRequested" → Retorna 202 Accepted (12ms)
  Processamento: Order → Inventory → Payment (acontece em background)
  Total visível: 12ms
```

---

## Casos de Uso

### Uber — Modelo Híbrido

- **Síncrono**: Cálculo de preço da corrida (precisa da resposta imediata para mostrar ao usuário)
- **Assíncrono**: Processamento de pagamento após a corrida (o motorista não precisa esperar o processamento)
- **Assíncrono**: Atualização de localização do motorista (Kafka com milhões de eventos/segundo)

### Netflix — Event-Driven por Padrão

- **Assíncrono**: Encoding de vídeos (um upload gera centenas de jobs de encoding)
- **Assíncrono**: Personalização de catálogo (eventos de visualização alimentam ML)
- **Síncrono**: Streaming de vídeo (o player precisa dos chunks em tempo real)

### Nubank — Kafka como Backbone

- **Assíncrono**: Todas as transações são eventos Kafka
- **Síncrono**: Consulta de saldo (o cliente precisa da resposta imediata)
- **Padrão**: Event-first — toda operação de negócio gera um evento primeiro

---

## Vantagens

### Comunicação Síncrona
1. **Simplicidade**: Fácil de entender, implementar e debugar
2. **Consistência imediata**: Resposta confirma que a operação aconteceu
3. **Controle de fluxo**: O cliente sabe exatamente quando a operação completou
4. **Ecossistema maduro**: HTTP, REST, gRPC têm excelente tooling

### Comunicação Assíncrona
1. **Desacoplamento**: Serviços evoluem independentemente
2. **Resiliência**: Falha do consumidor não afeta o produtor
3. **Escalabilidade**: Buffer natural do broker absorve picos
4. **Throughput**: Não bloqueia — produtores enviam na velocidade máxima

---

## Desvantagens

### Comunicação Síncrona
1. **Acoplamento temporal**: Se B está fora, A não funciona
2. **Cascata de falhas**: Falha se propaga para trás na cadeia
3. **Latência acumulativa**: Cada hop adiciona latência
4. **Escalabilidade limitada**: O serviço mais lento define o throughput

### Comunicação Assíncrona
1. **Complexidade operacional**: Broker é mais um componente para gerenciar
2. **Debugging difícil**: "A mensagem entrou... mas onde está?"
3. **Consistência eventual**: O cliente não sabe quando o efeito ocorrerá
4. **Ordenação**: Garantir ordem de mensagens é não-trivial
5. **Poison pills**: Uma mensagem inválida pode travar o consumidor

---

## Erros Comuns

### 1. "Vamos usar mensageria para tudo"
**Problema**: Nem tudo precisa ser assíncrono. Login do usuário, consulta de saldo, busca de produto — o cliente precisa da resposta imediata. Forçar async adiciona complexidade sem benefício.

### 2. "Vamos fazer HTTP para tudo"
**Problema**: Notificação por email, geração de relatório, processamento de imagem — não precisam bloquear o request. Fazer síncrono desperdiça recursos e aumenta latência.

### 3. Não implementar retry em chamadas síncronas
Chamadas HTTP falham. Sempre. Não ter retry é garantia de problemas em produção.

### 4. Não implementar dead letter queue em mensageria
Mensagens que falham repetidamente (poison pills) devem ir para uma DLQ para análise, não ficar em loop infinito.

### 5. Usar HTTP polling em vez de eventos
```
// ❌ Polling (desperdiça recursos)
while (!orderReady) {
    status = GET /orders/123/status  // a cada 1 segundo
}

// ✅ Event-driven (eficiente)
subscribe("order.completed", (event) => {
    handleOrderReady(event)
})
```

---

## Exemplos

### Exemplo: Comparando Síncrono e Assíncrono em Go

```go
package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// --- Modelo Síncrono ---

type SyncOrderService struct{}

func (s *SyncOrderService) CreateOrder(ctx context.Context, userID string) (string, error) {
	fmt.Println("[Sync] 1. Validando usuário...")
	time.Sleep(10 * time.Millisecond) // simula chamada ao UserService

	fmt.Println("[Sync] 2. Reservando estoque...")
	time.Sleep(15 * time.Millisecond) // simula chamada ao InventoryService

	fmt.Println("[Sync] 3. Processando pagamento...")
	time.Sleep(20 * time.Millisecond) // simula chamada ao PaymentService

	// 10% chance de falha no pagamento
	if rand.Float64() < 0.1 {
		return "", fmt.Errorf("pagamento falhou")
	}

	fmt.Println("[Sync] 4. Enviando notificação...")
	time.Sleep(8 * time.Millisecond) // simula chamada ao NotificationService

	return "ORDER-12345", nil
}

// --- Modelo Assíncrono ---

type Event struct {
	Type    string
	Payload map[string]string
}

type AsyncOrderService struct {
	eventBus chan Event
}

func NewAsyncOrderService() *AsyncOrderService {
	return &AsyncOrderService{
		eventBus: make(chan Event, 100),
	}
}

func (a *AsyncOrderService) CreateOrder(ctx context.Context, userID string) (string, error) {
	fmt.Println("[Async] 1. Validando usuário...")
	time.Sleep(10 * time.Millisecond) // esta parte é síncrona (precisa da resposta)

	orderID := "ORDER-12345"

	// Publica evento e retorna imediatamente
	a.eventBus <- Event{
		Type: "OrderCreated",
		Payload: map[string]string{
			"orderId": orderID,
			"userId":  userID,
		},
	}
	fmt.Println("[Async] 2. Evento 'OrderCreated' publicado → retorna imediatamente")

	return orderID, nil
}

func (a *AsyncOrderService) StartConsumers(wg *sync.WaitGroup) {
	// Consumidor: Inventory
	wg.Add(1)
	go func() {
		defer wg.Done()
		event := <-a.eventBus
		fmt.Printf("[Async Consumer] InventoryService processando %s...\n", event.Type)
		time.Sleep(15 * time.Millisecond)
		fmt.Println("[Async Consumer] Estoque reservado ✓")
	}()

	// Consumidor: Payment (processa após inventory - simplificado)
	wg.Add(1)
	go func() {
		defer wg.Done()
		time.Sleep(20 * time.Millisecond) // espera inventory (simplificado)
		fmt.Println("[Async Consumer] PaymentService processando...")
		time.Sleep(20 * time.Millisecond)
		fmt.Println("[Async Consumer] Pagamento processado ✓")
	}()

	// Consumidor: Notification
	wg.Add(1)
	go func() {
		defer wg.Done()
		time.Sleep(40 * time.Millisecond) // espera payment (simplificado)
		fmt.Println("[Async Consumer] NotificationService enviando email...")
		time.Sleep(8 * time.Millisecond)
		fmt.Println("[Async Consumer] Email enviado ✓")
	}()
}

func main() {
	fmt.Println("=== Comunicação Síncrona vs Assíncrona ===\n")

	// --- Síncrono ---
	fmt.Println("--- Modo Síncrono ---")
	syncService := &SyncOrderService{}
	start := time.Now()
	orderID, err := syncService.CreateOrder(context.Background(), "user-1")
	syncDuration := time.Since(start)

	if err != nil {
		fmt.Printf("[Sync] Erro: %v\n", err)
	} else {
		fmt.Printf("[Sync] Pedido criado: %s\n", orderID)
	}
	fmt.Printf("[Sync] Tempo total (cliente esperou): %v\n\n", syncDuration)

	// --- Assíncrono ---
	fmt.Println("--- Modo Assíncrono ---")
	asyncService := NewAsyncOrderService()

	var wg sync.WaitGroup
	asyncService.StartConsumers(&wg)

	start = time.Now()
	orderID, err = asyncService.CreateOrder(context.Background(), "user-1")
	asyncDuration := time.Since(start)

	if err != nil {
		fmt.Printf("[Async] Erro: %v\n", err)
	} else {
		fmt.Printf("[Async] Pedido aceito: %s (processamento em background)\n", orderID)
	}
	fmt.Printf("[Async] Tempo de resposta (cliente esperou): %v\n\n", asyncDuration)

	// Espera consumidores terminarem
	fmt.Println("--- Processamento em Background ---")
	wg.Wait()

	fmt.Printf("\n=== Resultado ===\n")
	fmt.Printf("Síncrono:  cliente esperou %v\n", syncDuration)
	fmt.Printf("Assíncrono: cliente esperou %v (processamento continua em background)\n", asyncDuration)
}
```

---

## Exercícios

### Exercício 1 — Classificação
Classifique cada operação como melhor atendida por comunicação síncrona ou assíncrona:

1. Autenticação de usuário (login)
2. Envio de email de boas-vindas
3. Consulta de saldo bancário
4. Processamento de imagem de perfil (resize, crop)
5. Busca de produtos em catálogo
6. Geração de relatório mensal em PDF
7. Validação de cupom de desconto
8. Atualização de analytics/métricas

### Exercício 2 — Design de Fluxo
Desenhe o fluxo de um checkout de e-commerce usando modelo híbrido:
- Quais etapas são síncronas? (o cliente precisa esperar)
- Quais etapas são assíncronas? (podem acontecer em background)
- Onde entra o message broker?

### Exercício 3 — Cálculo de Disponibilidade
Se cada serviço tem 99.9% de uptime:
- Calcule a disponibilidade de uma chain síncrona de 5 serviços
- Calcule a disponibilidade se 3 desses serviços fossem assíncronos

---

## Projeto Prático

### Order Processing com Modelo Híbrido

**Objetivo**: Implementar um sistema de pedidos usando modelo híbrido (sync para validação, async para processamento).

**Requisitos**:
1. API HTTP para criar pedido (síncrono: valida user + verifica estoque)
2. Retorna 202 Accepted com orderId
3. Publica evento `OrderCreated` em um channel Go (simula broker)
4. Consumidores processam: pagamento, notificação, analytics
5. Endpoint `GET /orders/{id}/status` para consultar estado
6. Status evolui: `CREATED → PAYMENT_PROCESSING → PAID → SHIPPED`

---

## Perguntas de Entrevista

### Nível Pleno

**P: Qual a diferença entre comunicação síncrona e assíncrona em microserviços?**
R: Síncrona: o cliente faz uma requisição e aguarda a resposta (HTTP, gRPC). O fluxo é bloqueante e ambos precisam estar online. Assíncrona: o produtor envia uma mensagem para um broker e não aguarda resposta. O consumidor processa quando puder. O trade-off é: síncrono é mais simples e dá feedback imediato, mas cria acoplamento temporal. Assíncrono é mais resiliente e escalável, mas adiciona complexidade e consistência eventual.

### Nível Senior

**P: Como você decidiria entre síncrono e assíncrono para uma funcionalidade?**
R: Três perguntas: (1) O cliente precisa da resposta para continuar? Sim → síncrono. (2) A operação pode ser diferida? Sim → assíncrono. (3) O que acontece se o serviço downstream estiver fora? Se precisa falhar → síncrono com circuit breaker. Se pode esperar → assíncrono com retry. Na prática, a maioria dos sistemas usa modelo híbrido: validações e consultas são síncronas, processamento pesado e notificações são assíncronos.

### Nível Staff

**P: Quais os riscos de migrar de síncrono para assíncrono e como mitigar?**
R: (1) Perda de transacionalidade: operações que eram atômicas agora são eventual. Mitigação: Saga pattern + idempotência. (2) Debugging mais complexo: tracing distribuído com correlation ID. (3) Ordered processing: garantir ordem no broker (partition key). (4) Monitoring: sem request-response, precisa monitorar lag de consumo, DLQ size, processing time. (5) Backward compatibility: consumidores antigos precisam lidar com novos tipos de evento. (6) Duplicate processing: broker pode entregar a mesma mensagem mais de uma vez → idempotência obrigatória.

---

## Referências

1. **Livro**: Newman, S. (2021). *Building Microservices*, Cap. 4 — Communication Styles
2. **Livro**: Richardson, C. (2018). *Microservices Patterns*, Cap. 3 — Interprocess Communication
3. **Artigo**: Fowler, M. *What do you mean by "Event-Driven"?* — martinfowler.com
4. **Tópicos relacionados**: [REST e gRPC](02-rest-and-grpc.md) | [Message Brokers](03-message-brokers.md) | [Event-Driven Architecture](04-event-driven-architecture.md)
