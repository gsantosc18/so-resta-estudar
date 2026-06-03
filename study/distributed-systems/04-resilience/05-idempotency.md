# Idempotência

## Objetivo

Compreender idempotência como propriedade fundamental em sistemas distribuídos, como implementá-la com idempotency keys, e por que é pré-requisito para retry, saga e at-least-once delivery.

---

## Pré-requisitos

- [Saga Pattern](../03-data-patterns/02-saga-pattern.md)
- [Retry e Backoff](02-retry-and-backoff.md)
- [Message Brokers](../02-communication/03-message-brokers.md)

---

## Conceitos Fundamentais

### O que é Idempotência?

Uma operação é idempotente se executá-la **uma ou N vezes** produz o mesmo resultado.

```
Idempotentes:
  DELETE /users/123    → remove o user (chamar 2x: mesmo resultado)
  PUT /users/123 {name: "Alice"} → sobrescreve (chamar 2x: mesmo resultado)
  GET /users/123       → leitura (sempre idempotente)

NÃO Idempotentes:
  POST /payments {amount: 100}  → cria pagamento (chamar 2x: cobra 2x!)
  POST /orders                  → cria pedido (chamar 2x: 2 pedidos!)
```

### Por que é Essencial?

Em sistemas distribuídos:
- **Retry**: Se uma chamada falha e você retenta, a operação pode ter sido executada na primeira vez
- **Message broker**: At-least-once delivery = mensagem pode ser entregue mais de uma vez
- **Saga**: Compensações podem ser executadas mais de uma vez
- **Network**: Duplicação de pacotes é possível

**Sem idempotência, retry é perigoso**. Com idempotência, retry é seguro.

### Idempotency Key

Uma chave única associada a cada operação que permite deduplicação:

```
POST /payments
X-Idempotency-Key: pay_abc123
{amount: 100}

1ª chamada: Processa pagamento, salva key → 200 OK
2ª chamada: Encontra key já processada → 200 OK (mesmo resultado, sem processar novamente)
```

---

## Funcionamento Interno

### Implementação com Tabela de Deduplicação

```sql
CREATE TABLE idempotency_keys (
    key         VARCHAR(255) PRIMARY KEY,
    request     JSONB NOT NULL,
    response    JSONB,
    status      VARCHAR(20) NOT NULL, -- 'processing', 'completed', 'failed'
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL
);

-- Fluxo:
-- 1. INSERT idempotency_key (status='processing')
-- 2. Se INSERT falha (key já existe):
--    a. Se status='completed' → retorna response salva
--    b. Se status='processing' → retorna 409 Conflict
-- 3. Processa operação
-- 4. UPDATE status='completed', response=resultado
```

### Estratégias por Tipo de Operação

| Operação | Estratégia de Idempotência |
|----------|--------------------------|
| **POST criar recurso** | Idempotency key no header |
| **PUT atualizar** | Naturalmente idempotente (sobrescreve) |
| **DELETE** | Naturalmente idempotente (remover algo que não existe = noop) |
| **Processar evento** | Event ID como dedup key |
| **Transferência financeira** | Transaction ID único |

---

## Exemplos

### Exemplo: Idempotent Payment Service em Go

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type PaymentResult struct {
	ID      string
	Amount  float64
	Status  string
}

type IdempotencyStore struct {
	keys map[string]PaymentResult
	mu   sync.Mutex
}

func NewIdempotencyStore() *IdempotencyStore {
	return &IdempotencyStore{keys: make(map[string]PaymentResult)}
}

type PaymentService struct {
	store *IdempotencyStore
}

func (s *PaymentService) ProcessPayment(idempotencyKey string, amount float64) (PaymentResult, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	// Verifica se já foi processado
	if result, exists := s.store.keys[idempotencyKey]; exists {
		fmt.Printf("  ♻️  Key '%s' já processada → retornando resultado salvo\n", idempotencyKey)
		return result, nil
	}

	// Processa (primeira vez)
	result := PaymentResult{
		ID:     fmt.Sprintf("PAY-%d", time.Now().UnixNano()),
		Amount: amount,
		Status: "completed",
	}
	s.store.keys[idempotencyKey] = result
	fmt.Printf("  ✓ Pagamento processado: R$%.2f (key: %s)\n", amount, idempotencyKey)
	return result, nil
}

func main() {
	fmt.Println("=== Idempotência ===\n")

	svc := &PaymentService{store: NewIdempotencyStore()}

	// Simula retry (mesma key, mesma operação)
	key := "pay_abc123"
	fmt.Println("--- 3 chamadas com a mesma idempotency key ---")
	for i := 1; i <= 3; i++ {
		fmt.Printf("Chamada %d:\n", i)
		result, _ := svc.ProcessPayment(key, 100.00)
		fmt.Printf("  Resultado: %s (R$%.2f)\n\n", result.ID, result.Amount)
	}

	fmt.Println("💡 Pagamento cobrado apenas 1 vez, apesar de 3 chamadas!")

	// Chamada com key diferente → processa normalmente
	fmt.Println("--- Chamada com key diferente ---")
	svc.ProcessPayment("pay_xyz456", 200.00)
}
```

---

## Erros Comuns

### 1. Gerar a idempotency key no servidor
A key deve ser gerada pelo **cliente** (quem faz o retry). Se o servidor gera, cada retry gera uma key diferente.

### 2. Idempotency key sem expiração
Keys acumulam para sempre. Defina TTL (ex: 24h) e limpe periodicamente.

### 3. Verificar key fora da transação
A verificação e a operação devem estar na mesma transação para evitar race conditions.

---

## Perguntas de Entrevista

### Nível Senior

**P: Como garantir exactly-once processing em um sistema com at-least-once delivery?**
R: At-least-once no broker + idempotência no consumidor = exactly-once semantics. O consumidor usa o event ID (ou um idempotency key) para verificar se já processou o evento. Se sim, ignora. Implementação: tabela de dedup no banco, verificada na mesma transação que o processamento. Isso é mais prático do que tentar implementar exactly-once no broker.

### Nível Staff

**P: Quais operações são naturalmente idempotentes e quais precisam de mecanismos adicionais?**
R: **Naturalmente idempotentes**: GET (leitura), PUT (sobrescrever), DELETE (remover), SET (definir valor absoluto). **Precisam de mecanismo**: POST (criar), INCREMENT (somar), APPEND (adicionar). Para as não-idempotentes, use: idempotency key (POST), operação com valor absoluto em vez de relativo (SET balance=100 em vez de INCREMENT balance+100), ou dedup table.

---

## Referências

1. **Stripe**: [Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
2. **Paper**: Helland, P. (2012). *Idempotence Is Not a Medical Condition*
3. **Tópicos relacionados**: [Retry e Backoff](02-retry-and-backoff.md) | [Saga Pattern](../03-data-patterns/02-saga-pattern.md) | [Outbox Pattern](../03-data-patterns/03-outbox-pattern.md)
