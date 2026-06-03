# Health Checks e Readiness Probes

## Objetivo
Compreender a diferença entre liveness e readiness probes, como implementá-las em Go, e como Kubernetes as utiliza para gerenciar o ciclo de vida de pods.

---
## Pré-requisitos
- Conceitos de Kubernetes (pods, services)
- Experiência com HTTP servers

---
## Conceitos Fundamentais

### Liveness vs Readiness vs Startup

| Probe | Pergunta | Se falhar |
|-------|---------|-----------|
| **Liveness** | "O processo está vivo?" | Kubernetes **reinicia** o pod |
| **Readiness** | "O pod está pronto para receber tráfego?" | Remove do **Service** (para de receber requests) |
| **Startup** | "A aplicação já inicializou?" | Espera antes de verificar liveness/readiness |

### Quando usar cada uma

```yaml
# Kubernetes Pod spec
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3    # 3 falhas → restart

readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2    # 2 falhas → remove do LB

startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30   # 30 × 10s = 5min para inicializar
  periodSeconds: 10
```

### O que verificar em cada probe

**Liveness (`/healthz`)**: O processo está funcionando? (simples, rápido)
- ✓ Responde 200 OK
- ✗ NÃO verificar banco, cache, serviços externos (se o banco caiu, reiniciar o pod não resolve)

**Readiness (`/readyz`)**: O pod está pronto para receber requests?
- ✓ Conexão com banco estabelecida
- ✓ Caches aquecidos
- ✓ Dependências essenciais acessíveis
- ✓ Graceful shutdown em progresso → false

---
## Exemplos

### Exemplo: Health Check em Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync/atomic"
	"time"
)

type HealthStatus struct {
	Status    string            `json:"status"`
	Checks   map[string]string `json:"checks,omitempty"`
	Timestamp string           `json:"timestamp"`
}

var ready atomic.Bool

func healthzHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthStatus{
		Status: "ok", Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func readyzHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if !ready.Load() {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(HealthStatus{
			Status: "not ready",
			Checks: map[string]string{"database": "connecting..."},
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	json.NewEncoder(w).Encode(HealthStatus{
		Status: "ready",
		Checks: map[string]string{"database": "connected", "cache": "connected"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func main() {
	fmt.Println("=== Health Checks ===")
	// Simula startup lento
	go func() {
		fmt.Println("Conectando ao banco...")
		time.Sleep(2 * time.Second)
		ready.Store(true)
		fmt.Println("✓ Pronto para receber tráfego")
	}()

	http.HandleFunc("/healthz", healthzHandler)
	http.HandleFunc("/readyz", readyzHandler)
	fmt.Println("Server em :8080 (/healthz, /readyz)")
	http.ListenAndServe(":8080", nil)
}
```

---
## Erros Comuns
1. **Liveness verifica banco externo**: Se o banco cai, todos os pods reiniciam em loop → cascade failure. Liveness deve ser simples (processo vivo).
2. **Sem readiness durante graceful shutdown**: Quando o pod recebe SIGTERM, deve marcar readiness como false ANTES de parar de aceitar requests.
3. **Probes sem timeout**: Se o endpoint de health trava, o kubelet fica bloqueado.

---
## Perguntas de Entrevista
### Nível Senior
**P: Qual a diferença entre liveness e readiness probe?**
R: Liveness verifica se o processo está vivo — se falhar, Kubernetes reinicia. Readiness verifica se está pronto para tráfego — se falhar, remove do load balancer mas não reinicia. Erro comum: colocar check de banco no liveness. Se o banco cair, todos os pods reiniciam em loop, piorando a situação.

---
## Referências
1. **Kubernetes**: [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
2. **Tópicos relacionados**: [Métricas](03-metrics-and-monitoring.md) | [Container Orchestration](../07-orchestration/04-container-orchestration.md)
