# Rate Limiting

## Objetivo
Compreender rate limiting como proteção contra sobrecarga e abuso, algoritmos (Token Bucket, Sliding Window, Leaky Bucket), e implementação distribuída com Redis.

---
## Pré-requisitos
- [Load Balancing](02-load-balancing.md)

---
## Conceitos Fundamentais

### Algoritmos

#### 1. Token Bucket
```
Bucket com capacidade máxima de tokens.
Tokens são adicionados a uma taxa fixa.
Cada request consome 1 token.
Sem tokens → request rejeitado (429).

Permite bursts (se bucket está cheio, aceita burst de requests).
```

#### 2. Sliding Window Log
```
Registra timestamp de cada request.
Conta requests na janela atual (ex: últimos 60s).
Se count > limite → 429.

Preciso, mas consome memória (armazena cada timestamp).
```

#### 3. Sliding Window Counter
```
Combina janela fixa com interpolação.
Peso = requests_janela_anterior × (1 - elapsed/window) + requests_janela_atual
```

#### 4. Leaky Bucket
```
Requests entram no bucket.
Processados a uma taxa fixa (leak rate).
Se bucket cheio → request descartado.

Suaviza o tráfego (sem bursts).
```

### Comparação

| Algoritmo | Burst | Precisão | Memória | Complexidade |
|-----------|-------|----------|---------|-------------|
| Token Bucket | Permite | Boa | Baixa | Baixa |
| Sliding Window Log | Não | Alta | Alta | Média |
| Sliding Window Counter | Limitado | Média | Baixa | Média |
| Leaky Bucket | Não | Boa | Baixa | Baixa |

### Rate Limiting Distribuído
Com múltiplas instâncias, o rate limit precisa ser compartilhado:
```
Instância A: 30 requests/min ← sem coordenação, o total é 90/min!
Instância B: 30 requests/min
Instância C: 30 requests/min

Solução: Redis centralizado como contador compartilhado
  INCR rate:user:123
  EXPIRE rate:user:123 60
```

---
## Exemplos

### Exemplo: Token Bucket em Go

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type TokenBucket struct {
	capacity   int
	tokens     int
	refillRate int // tokens per second
	lastRefill time.Time
	mu         sync.Mutex
}

func NewTokenBucket(capacity, refillRate int) *TokenBucket {
	return &TokenBucket{capacity: capacity, tokens: capacity, refillRate: refillRate, lastRefill: time.Now()}
}

func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	// Refill tokens baseado no tempo decorrido
	elapsed := time.Since(tb.lastRefill)
	newTokens := int(elapsed.Seconds()) * tb.refillRate
	if newTokens > 0 {
		tb.tokens = min(tb.capacity, tb.tokens+newTokens)
		tb.lastRefill = time.Now()
	}

	if tb.tokens > 0 {
		tb.tokens--
		return true
	}
	return false
}

func min(a, b int) int { if a < b { return a }; return b }

func main() {
	fmt.Println("=== Rate Limiting: Token Bucket ===\n")
	limiter := NewTokenBucket(5, 2) // 5 tokens, refill 2/s

	for i := 1; i <= 10; i++ {
		if limiter.Allow() {
			fmt.Printf("  ✓ Request %d: aceito\n", i)
		} else {
			fmt.Printf("  ✗ Request %d: rate limited (429)\n", i)
		}
	}
	fmt.Println("\n⏳ Esperando refill (1s)...")
	time.Sleep(1 * time.Second)
	for i := 11; i <= 13; i++ {
		if limiter.Allow() {
			fmt.Printf("  ✓ Request %d: aceito (após refill)\n", i)
		} else {
			fmt.Printf("  ✗ Request %d: rate limited\n", i)
		}
	}
}
```

---
## Perguntas de Entrevista
### Nível Senior
**P: Como implementar rate limiting em um sistema com múltiplas instâncias?**
R: Usar um armazenamento centralizado (Redis) como contador compartilhado. Script Lua no Redis para incremento atômico + verificação de limite. Alternativa: rate limiting no API Gateway (Kong, Envoy) que é centralizado. Trade-off: centralização adiciona latência (~1ms por request ao Redis), mas garante limites globais corretos.

---
## Referências
1. **Artigo**: [Rate Limiting strategies and techniques](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
2. **Redis**: [Rate Limiting with Redis](https://redis.io/commands/incr#pattern-rate-limiter)
3. **Tópicos relacionados**: [Load Balancing](02-load-balancing.md) | [API Gateway](../07-orchestration/02-api-gateway.md)
