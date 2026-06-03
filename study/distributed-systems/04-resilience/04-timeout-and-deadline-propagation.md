# Timeout e Deadline Propagation

## Objetivo

Compreender a importância de timeouts em sistemas distribuídos e como propagar deadlines através da cadeia de serviços para evitar requests "zumbis" que consomem recursos indefinidamente.

---

## Pré-requisitos

- [Síncrono vs Assíncrono](../02-communication/01-synchronous-vs-asynchronous.md)
- [Circuit Breaker](01-circuit-breaker.md)

---

## Conceitos Fundamentais

### O Problema: Sem Timeout

```
Cliente (timeout: ∞) → A (timeout: ∞) → B (timeout: ∞) → C (travou!)

Resultado: Toda a cadeia fica bloqueada esperando C para sempre.
Recursos (threads, conexões, memória) são consumidos sem liberação.
```

### Deadline Propagation

O deadline do request original é propagado para todos os serviços downstream. Cada serviço calcula quanto tempo **resta** antes de fazer a próxima chamada.

```
Cliente: deadline = now + 5s
  → A recebe, gasta 500ms, passa deadline restante (4.5s) para B
    → B recebe, gasta 200ms, passa deadline restante (4.3s) para C
      → C tem 4.3s para completar

Se C leva 5s → timeout! A cadeia inteira respeita o deadline do cliente.
```

### Context em Go

Go tem suporte nativo a deadline propagation via `context.Context`:

```go
// Define deadline no início
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Passa context para todas as chamadas downstream
resp, err := serviceA.Call(ctx, request)
// serviceA internamente passa o mesmo ctx para serviceB
// O deadline é automaticamente respeitado em toda a cadeia
```

---

## Funcionamento Interno

### Cálculo do Timeout Restante

```go
func callDownstream(ctx context.Context) error {
    deadline, ok := ctx.Deadline()
    if ok {
        remaining := time.Until(deadline)
        if remaining <= 0 {
            return context.DeadlineExceeded
        }
        fmt.Printf("Tempo restante: %v\n", remaining)
    }
    // Faz a chamada com o context (deadline propagado)
    return httpClient.Do(req.WithContext(ctx))
}
```

### Timeout Budget Pattern

Distribui o timeout total entre os steps:

```
Total budget: 5s
  Auth:      500ms  (10%)
  Order:     2s     (40%)
  Payment:   2s     (40%)
  Notify:    500ms  (10%)
```

---

## Erros Comuns

### 1. Timeout maior no caller do que no downstream
Se A tem timeout de 30s e B tem timeout de 5s, quando B retorna timeout, A ainda espera 25s — desperdiçando recursos.

### 2. Não propagar o context
Criar novo `context.Background()` dentro de um handler descarta o deadline do caller.

### 3. Timeout do banco maior que do HTTP
Se o HTTP timeout é 5s mas o query timeout é 30s, o HTTP retorna timeout enquanto a query continua rodando no banco.

---

## Exemplos

### Exemplo: Deadline Propagation em Go

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func serviceA(ctx context.Context) (string, error) {
	fmt.Println("[A] Iniciando...")
	time.Sleep(200 * time.Millisecond)

	// Propaga o context (com deadline) para B
	result, err := serviceB(ctx)
	if err != nil { return "", fmt.Errorf("A falhou: %w", err) }
	return "A+" + result, nil
}

func serviceB(ctx context.Context) (string, error) {
	fmt.Println("[B] Iniciando...")
	remaining := time.Until(mustDeadline(ctx))
	fmt.Printf("[B] Tempo restante: %v\n", remaining)

	// Simula operação lenta
	select {
	case <-time.After(300 * time.Millisecond):
		return "B", nil
	case <-ctx.Done():
		return "", fmt.Errorf("B: %w", ctx.Err())
	}
}

func mustDeadline(ctx context.Context) time.Time {
	d, _ := ctx.Deadline()
	return d
}

func main() {
	fmt.Println("=== Deadline Propagation ===\n")

	// Cenário 1: Deadline suficiente (1s)
	fmt.Println("--- Cenário 1: Deadline 1s (suficiente) ---")
	ctx1, cancel1 := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel1()
	result, err := serviceA(ctx1)
	if err != nil { fmt.Printf("❌ %v\n", err) } else { fmt.Printf("✅ Resultado: %s\n", result) }

	// Cenário 2: Deadline curto (300ms)
	fmt.Println("\n--- Cenário 2: Deadline 300ms (insuficiente) ---")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 300*time.Millisecond)
	defer cancel2()
	result, err = serviceA(ctx2)
	if err != nil { fmt.Printf("❌ %v\n", err) } else { fmt.Printf("✅ Resultado: %s\n", result) }
}
```

---

## Perguntas de Entrevista

### Nível Senior

**P: Por que é importante propagar deadlines entre serviços?**
R: Sem propagação, cada serviço define seu próprio timeout independentemente, podendo gastar tempo em chamadas que o caller já desistiu (request zumbi). Com propagação via context, cada serviço sabe quanto tempo resta e pode abortar cedo, liberando recursos. Em Go, `context.Context` é o mecanismo padrão.

---

## Referências

1. **Go Blog**: [Go Concurrency Patterns: Context](https://blog.golang.org/context)
2. **gRPC**: [Deadlines](https://grpc.io/docs/guides/deadlines/)
3. **Tópicos relacionados**: [Circuit Breaker](01-circuit-breaker.md) | [Retry](02-retry-and-backoff.md)
