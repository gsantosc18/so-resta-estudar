# Métricas e Monitoramento

## Objetivo
Compreender tipos de métricas (counters, gauges, histograms), os 4 Golden Signals do Google SRE, e como Prometheus + Grafana formam o stack de monitoramento mais usado.

---
## Pré-requisitos
- Experiência com sistemas em produção

---
## Conceitos Fundamentais

### 4 Golden Signals (Google SRE)

| Signal | O que mede | Métrica exemplo |
|--------|-----------|----------------|
| **Latência** | Tempo de resposta | `http_request_duration_seconds` |
| **Tráfego** | Volume de requisições | `http_requests_total` |
| **Erros** | Taxa de falhas | `http_errors_total / http_requests_total` |
| **Saturação** | Utilização de recursos | `cpu_usage_percent`, `memory_usage_bytes` |

### Tipos de Métricas

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Counter** | Incrementa monotonicamente | Requests totais, erros totais |
| **Gauge** | Valor que sobe e desce | Conexões ativas, goroutines |
| **Histogram** | Distribuição de valores (buckets) | Latência p50, p95, p99 |
| **Summary** | Similar a histogram, calcula percentis no client | Latência com percentis pré-calculados |

### RED Method (para serviços)
- **R**ate: Requests por segundo
- **E**rrors: Erros por segundo
- **D**uration: Distribuição de latência

### USE Method (para recursos)
- **U**tilization: % de uso
- **S**aturation: Fila de trabalho pendente
- **E**rrors: Erros do recurso

### Prometheus + Grafana

```
App ──metrics──► Prometheus (scrape a cada 15s) ──queries──► Grafana (dashboards)
                      │
                      ▼
               AlertManager ──► PagerDuty / Slack
```

**Prometheus**: Time-series database que scrapes endpoints `/metrics` dos serviços.
**PromQL**: Linguagem de query para métricas.
```promql
# Taxa de requests por segundo (últimos 5min)
rate(http_requests_total[5m])

# Latência p99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_errors_total[5m]) / rate(http_requests_total[5m])
```

---
## Erros Comuns
1. **Métricas de mais**: Alta cardinalidade (label com user_id) explode o storage do Prometheus.
2. **Sem alertas acionáveis**: Alertas que ninguém atua criam "alert fatigue".
3. **Monitorar média em vez de percentis**: Média esconde outliers. Use p95 e p99.

---
## Perguntas de Entrevista
### Nível Senior
**P: Por que usar percentis (p95, p99) em vez de média para latência?**
R: A média esconde a cauda da distribuição. Se 99 requests levam 10ms e 1 leva 10s, a média é ~110ms — parece OK. Mas p99 é 10s — 1% dos usuários têm experiência péssima. Para SLAs e detecção de problemas, percentis são essenciais.

---
## Referências
1. **Google SRE Book**: [sre.google/sre-book](https://sre.google/sre-book/monitoring-distributed-systems/)
2. **Prometheus**: [prometheus.io](https://prometheus.io)
3. **Grafana**: [grafana.com](https://grafana.com)
4. **Tópicos relacionados**: [Distributed Tracing](01-distributed-tracing.md) | [Health Checks](04-health-checks-and-readiness.md)
