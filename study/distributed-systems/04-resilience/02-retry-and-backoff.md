# Retry e Backoff Exponencial

## Objetivo

Dominar estratégias de retry para falhas transientes, incluindo backoff exponencial com jitter, limites de retry, e quando NÃO fazer retry.

---

## Pré-requisitos

- [Circuit Breaker](01-circuit-breaker.md)
- [Falácias da Computação Distribuída](../01-foundations/04-fallacies-of-distributed-computing.md)

---

## Conceitos Fundamentais

### Falhas Transientes vs Permanentes

| Tipo | Exemplos | Ação |
|------|----------|------|
| **Transiente** | Timeout, 503, network glitch | Retry |
| **Permanente** | 400 Bad Request, 401 Unauthorized, 404 | NÃO retry |

### Estratégias de Retry

```
1. Retry imediato:    [X] [X] [X] [X]  ← bombardeia o servidor
2. Intervalo fixo:    [X] --1s-- [X] --1s-- [X]
3. Backoff linear:    [X] --1s-- [X] --2s-- [X] --3s--
4. Backoff exponencial: [X] --1s-- [X] --2s-- [X] --4s-- [X] --8s--
5. Exponencial + jitter: [X] --1.2s-- [X] --2.7s-- [X] --3.9s--  ← RECOMENDADO
```

### Por que Jitter?

Sem jitter, quando um serviço se recupera, todos os clientes que estavam em backoff fazem retry ao mesmo tempo → **thundering herd** → serviço cai de novo.

```
Sem jitter:  100 clientes → retry em 1s, 2s, 4s (todos ao mesmo tempo!)
Com jitter:  100 clientes → retry em 0.8-1.2s, 1.5-2.5s, 3.2-4.8s (distribuídos)
```

### Tipos de Jitter

- **Full jitter**: `random(0, base * 2^attempt)` — mais distribuído
- **Equal jitter**: `base * 2^attempt / 2 + random(0, base * 2^attempt / 2)`
- **Decorrelated jitter**: `min(cap, random(base, prev_sleep * 3))`

---

## Funcionamento Interno

### Fórmula do Backoff Exponencial

```
delay = min(maxDelay, baseDelay * 2^attempt + random(0, jitter))

Exemplo (base=1s, max=30s):
  Attempt 0: min(30, 1 * 2^0) = 1s + jitter
  Attempt 1: min(30, 1 * 2^1) = 2s + jitter
  Attempt 2: min(30, 1 * 2^2) = 4s + jitter
  Attempt 3: min(30, 1 * 2^3) = 8s + jitter
  Attempt 4: min(30, 1 * 2^4) = 16s + jitter
  Attempt 5: min(30, 1 * 2^5) = 30s + jitter (cap)
```

---

## Erros Comuns

### 1. Retry em erros 4xx
400, 401, 403, 404 são erros do **cliente**. Retry não vai resolvê-los. Apenas 408 (Timeout) e 429 (Rate Limited) justificam retry entre os 4xx.

### 2. Retry sem limite
Retry infinito em um serviço permanentemente fora = loop infinito. Sempre defina max retries.

### 3. Retry sem idempotência
Se a operação não é idempotente (ex: cobrar cartão), retry pode cobrar duas vezes. Garanta idempotência antes de implementar retry.

### 4. Sem backoff (retry imediato)
Retry imediato em loop sobrecarrega o serviço que está tentando se recuperar.

---

## Exemplos

### Exemplo: Retry com Backoff Exponencial em Go

```go
package main

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"time"
)

type RetryConfig struct {
	MaxRetries int
	BaseDelay  time.Duration
	MaxDelay   time.Duration
	JitterPct  float64 // 0.0 a 1.0
}

func RetryWithBackoff(ctx context.Context, cfg RetryConfig, operation func() error) error {
	var lastErr error
	for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
		if attempt > 0 {
			delay := calculateDelay(cfg, attempt)
			fmt.Printf("  ⏳ Retry %d/%d em %v\n", attempt, cfg.MaxRetries, delay)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return ctx.Err()
			}
		}

		if err := operation(); err != nil {
			lastErr = err
			fmt.Printf("  ✗ Attempt %d falhou: %v\n", attempt, err)
			continue
		}
		fmt.Printf("  ✓ Sucesso no attempt %d\n", attempt)
		return nil
	}
	return fmt.Errorf("todos os %d retries falharam: %w", cfg.MaxRetries, lastErr)
}

func calculateDelay(cfg RetryConfig, attempt int) time.Duration {
	delay := float64(cfg.BaseDelay) * math.Pow(2, float64(attempt-1))
	if delay > float64(cfg.MaxDelay) { delay = float64(cfg.MaxDelay) }
	jitter := delay * cfg.JitterPct * (rand.Float64()*2 - 1) // ±jitter%
	return time.Duration(delay + jitter)
}

func main() {
	fmt.Println("=== Retry com Backoff Exponencial ===\n")
	cfg := RetryConfig{MaxRetries: 5, BaseDelay: 500 * time.Millisecond, MaxDelay: 10 * time.Second, JitterPct: 0.25}

	failCount := 0
	err := RetryWithBackoff(context.Background(), cfg, func() error {
		failCount++
		if failCount <= 3 { return fmt.Errorf("service unavailable (tentativa %d)", failCount) }
		return nil // sucesso na 4ª tentativa
	})
	if err != nil { fmt.Printf("\n❌ %v\n", err) } else { fmt.Println("\n✅ Operação bem-sucedida!") }
}
```

---

## Exercícios

### Exercício 1: Implemente os 3 tipos de jitter e compare a distribuição dos delays.
### Exercício 2: Combine retry com circuit breaker — se o circuit breaker está aberto, não faça retry.
### Exercício 3: Implemente retry com context deadline — o retry respeita o deadline total.

---

## Perguntas de Entrevista

### Nível Senior

**P: Por que usar backoff exponencial com jitter em vez de retry com intervalo fixo?**
R: Intervalo fixo causa thundering herd: quando o serviço se recupera, todos os clientes retentam ao mesmo tempo. Exponencial espaça as tentativas crescentemente, dando tempo ao serviço. Jitter distribui os retries no tempo, evitando sincronização entre clientes. AWS recomenda "full jitter" para serviços com muitos clientes.

---

## Referências

1. **AWS**: [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
2. **Livro**: Nygard, M. (2018). *Release It!*
3. **Tópicos relacionados**: [Circuit Breaker](01-circuit-breaker.md) | [Idempotência](05-idempotency.md)
