# Bulkhead Pattern

## Objetivo

Compreender o padrão Bulkhead para isolamento de falhas em sistemas distribuídos, inspirado nos compartimentos estanques de navios, e como implementá-lo usando goroutines e semáforos em Go.

---

## Pré-requisitos

- [Circuit Breaker](01-circuit-breaker.md)

---

## Conceitos Fundamentais

### Analogia: Compartimentos de um Navio

Se um compartimento do navio é perfurado, apenas aquele compartimento inunda — os outros ficam intactos e o navio continua flutuando. Sem compartimentos, o navio inteiro afunda.

```
Sem Bulkhead:
  [Thread Pool Compartilhado: 100 threads]
  → PaymentService (lento) consome 90 threads
  → UserService (rápido) fica com 10 threads → lento para todos

Com Bulkhead:
  [Pool Payment: 30 threads] → PaymentService (lento) usa 30/30 → só Payment sofre
  [Pool User: 30 threads]    → UserService (rápido) usa 5/30 → não afetado
  [Pool Search: 40 threads]  → SearchService usa 10/40 → não afetado
```

### Tipos de Bulkhead

| Tipo | Implementação | Granularidade |
|------|--------------|---------------|
| **Thread Pool** | Pool separado por serviço downstream | Médio |
| **Semáforo** | Contador de chamadas concorrentes | Leve |
| **Processo** | Container/pod separado | Pesado, máximo isolamento |
| **Conexão** | Connection pool separado | Por recurso (DB, HTTP) |

---

## Exemplos

### Exemplo: Bulkhead com Semáforo em Go

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Bulkhead struct {
	name     string
	sem      chan struct{}
	maxConc  int
}

func NewBulkhead(name string, maxConcurrent int) *Bulkhead {
	return &Bulkhead{name: name, sem: make(chan struct{}, maxConcurrent), maxConc: maxConcurrent}
}

func (b *Bulkhead) Execute(fn func() error) error {
	select {
	case b.sem <- struct{}{}:
		defer func() { <-b.sem }()
		return fn()
	default:
		return fmt.Errorf("[%s] bulkhead cheio (%d/%d): requisição rejeitada", b.name, b.maxConc, b.maxConc)
	}
}

func main() {
	fmt.Println("=== Bulkhead Pattern ===\n")

	paymentBulkhead := NewBulkhead("PaymentService", 3)
	userBulkhead := NewBulkhead("UserService", 5)

	var wg sync.WaitGroup

	// Simula 10 chamadas ao PaymentService (bulkhead de 3)
	fmt.Println("--- 10 chamadas ao PaymentService (max 3 simultâneas) ---")
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			err := paymentBulkhead.Execute(func() error {
				fmt.Printf("  [Payment] Req %d: processando\n", id)
				time.Sleep(100 * time.Millisecond)
				return nil
			})
			if err != nil { fmt.Printf("  [Payment] Req %d: %v\n", id, err) }
		}(i)
	}

	// Simula 3 chamadas ao UserService (não afetado pelo Payment)
	fmt.Println("--- 3 chamadas ao UserService (isolado do Payment) ---")
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			err := userBulkhead.Execute(func() error {
				fmt.Printf("  [User] Req %d: processando ✓\n", id)
				time.Sleep(20 * time.Millisecond)
				return nil
			})
			if err != nil { fmt.Printf("  [User] Req %d: %v\n", id, err) }
		}(i)
	}

	wg.Wait()
	fmt.Println("\n💡 Payment lento não afetou UserService (isolamento!)")
}
```

---

## Vantagens

1. **Isolamento de falhas**: Um serviço lento não contamina outros
2. **Previsibilidade**: Limites claros de concorrência por recurso
3. **Proteção de recursos**: Previne esgotamento de threads/conexões

---

## Desvantagens

1. **Subutilização**: Pools separados podem ter capacidade ociosa
2. **Configuração**: Dimensionar cada pool adequadamente é desafiador
3. **Complexidade**: Mais componentes para monitorar

---

## Perguntas de Entrevista

### Nível Senior

**P: Como Bulkhead se complementa com Circuit Breaker?**
R: Bulkhead limita a concorrência (quantas chamadas simultâneas), Circuit Breaker detecta falhas e abre (para de tentar). Juntos: Bulkhead evita que um serviço lento consuma todos os recursos, Circuit Breaker evita chamadas repetidas a um serviço que já falhou. Um protege contra lentidão, o outro contra falha.

---

## Referências

1. **Livro**: Nygard, M. (2018). *Release It!*, Cap. 5
2. **Microsoft**: [Bulkhead Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
3. **Tópicos relacionados**: [Circuit Breaker](01-circuit-breaker.md) | [Timeout](04-timeout-and-deadline-propagation.md)
