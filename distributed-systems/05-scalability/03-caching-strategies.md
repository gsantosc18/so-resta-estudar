# Estratégias de Cache

## Objetivo
Dominar padrões de caching distribuído (Cache-Aside, Write-Through, Write-Behind), problemas clássicos (cache stampede, stale data), e como Redis é usado em produção.

---
## Pré-requisitos
- [Modelos de Consistência](../01-foundations/02-consistency-models.md)

---
## Conceitos Fundamentais

### Padrões de Cache

#### 1. Cache-Aside (Lazy Loading)
```
Leitura:
  1. App verifica cache
  2. Cache miss → lê do banco → salva no cache → retorna
  3. Cache hit → retorna do cache

Escrita:
  1. App escreve no banco
  2. Invalida o cache (ou não atualiza)
```

#### 2. Write-Through
```
Escrita:
  1. App escreve no cache
  2. Cache escreve no banco (síncrono)
  3. Retorna

Leitura:
  Sempre do cache (sempre atualizado)
```

#### 3. Write-Behind (Write-Back)
```
Escrita:
  1. App escreve no cache
  2. Cache escreve no banco (assíncrono, em batch)
  3. Retorna imediatamente

Risco: Se cache crashar antes de persistir, dados são perdidos.
```

### Comparação

| Padrão | Latência escrita | Consistência | Risco |
|--------|-----------------|-------------|-------|
| Cache-Aside | Baixa (só banco) | Stale possível | Cache stampede |
| Write-Through | Média (cache + banco) | Forte | Latência dupla |
| Write-Behind | Mínima (só cache) | Eventual | Perda de dados |

### Problemas Clássicos

#### Cache Stampede (Thundering Herd)
```
Cache expira → 1000 requests simultâneos → todos fazem cache miss → 1000 queries ao banco

Solução: Lock/singleflight → apenas 1 request busca do banco, outros esperam
```

#### Cache Invalidation
> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

Estratégias:
- **TTL (Time-To-Live)**: Expira automaticamente (simples, stale temporário)
- **Event-based**: Invalida via evento quando o dado muda (complexo, consistente)
- **Versioning**: Key inclui versão (`user:123:v5`)

---
## Exemplos

### Exemplo: Cache-Aside com Singleflight em Go

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Cache struct {
	data map[string]cacheEntry
	mu   sync.RWMutex
}
type cacheEntry struct { value string; expiresAt time.Time }

func NewCache() *Cache { return &Cache{data: make(map[string]cacheEntry)} }

func (c *Cache) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.data[key]
	if !ok || time.Now().After(entry.expiresAt) { return "", false }
	return entry.value, true
}

func (c *Cache) Set(key, value string, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = cacheEntry{value: value, expiresAt: time.Now().Add(ttl)}
}

// Singleflight evita cache stampede
type Singleflight struct {
	mu      sync.Mutex
	inflight map[string]*call
}
type call struct { wg sync.WaitGroup; val string; err error }

func NewSingleflight() *Singleflight { return &Singleflight{inflight: make(map[string]*call)} }

func (sf *Singleflight) Do(key string, fn func() (string, error)) (string, error) {
	sf.mu.Lock()
	if c, ok := sf.inflight[key]; ok {
		sf.mu.Unlock()
		c.wg.Wait()
		return c.val, c.err
	}
	c := &call{}
	c.wg.Add(1)
	sf.inflight[key] = c
	sf.mu.Unlock()

	c.val, c.err = fn()
	c.wg.Done()

	sf.mu.Lock()
	delete(sf.inflight, key)
	sf.mu.Unlock()
	return c.val, c.err
}

func main() {
	fmt.Println("=== Cache-Aside com Singleflight ===\n")
	cache := NewCache()
	sf := NewSingleflight()
	dbCalls := 0

	fetchFromDB := func(key string) string {
		dbCalls++
		fmt.Printf("  📀 Query ao banco (call #%d)\n", dbCalls)
		time.Sleep(50 * time.Millisecond)
		return "Alice"
	}

	getUser := func(key string) string {
		if val, ok := cache.Get(key); ok {
			fmt.Println("  ⚡ Cache hit!")
			return val
		}
		val, _ := sf.Do(key, func() (string, error) {
			result := fetchFromDB(key)
			cache.Set(key, result, 5*time.Second)
			return result, nil
		})
		return val
	}

	// 10 goroutines simultâneas → apenas 1 query ao banco
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); getUser("user:1") }()
	}
	wg.Wait()
	fmt.Printf("\n📊 Total de queries ao banco: %d (de 10 requests)\n", dbCalls)
}
```

---
## Perguntas de Entrevista
### Nível Senior
**P: Como evitar cache stampede?**
R: (1) **Singleflight/Mutex**: quando o cache expira, apenas um request busca do banco, outros esperam. (2) **Stale-while-revalidate**: servir dado stale enquanto atualiza em background. (3) **Probabilistic early expiration**: renovar antes do TTL com probabilidade crescente.

---
## Referências
1. **Livro**: Kleppmann, M. (2017). *DDIA*, Cap. 5
2. **Redis**: [Caching Patterns](https://redis.io/docs/manual/client-side-caching/)
3. **Go**: [golang.org/x/sync/singleflight](https://pkg.go.dev/golang.org/x/sync/singleflight)
4. **Tópicos relacionados**: [Modelos de Consistência](../01-foundations/02-consistency-models.md) | [Sharding](04-sharding-and-partitioning.md)
