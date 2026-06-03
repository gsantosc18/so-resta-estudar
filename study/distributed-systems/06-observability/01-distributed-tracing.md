# Distributed Tracing

## Objetivo
Compreender distributed tracing como pilar da observabilidade, como funciona o OpenTelemetry, conceitos de trace, span e context propagation, e como implementá-lo em Go.

---
## Pré-requisitos
- [Síncrono vs Assíncrono](../02-communication/01-synchronous-vs-asynchronous.md)
- Experiência com múltiplos serviços em produção

---
## Conceitos Fundamentais

### Os 3 Pilares da Observabilidade
1. **Logs**: O que aconteceu (textual, detalhado)
2. **Métricas**: Quanto está acontecendo (numérico, agregado)
3. **Traces**: Como aconteceu (fluxo entre serviços)

### Anatomia de um Trace

```
Trace ID: abc-123
├── Span A: API Gateway (100ms)
│   ├── Span B: Auth Service (20ms)
│   └── Span C: Order Service (70ms)
│       ├── Span D: Database query (15ms)
│       └── Span E: Payment Service (45ms)
│           └── Span F: External API (30ms)
```

- **Trace**: Representa o fluxo completo de um request (identificado por Trace ID)
- **Span**: Representa uma unidade de trabalho (chamada de serviço, query, etc.)
- **Context Propagation**: Trace ID e Span ID são propagados via headers HTTP (`traceparent`)

### W3C Trace Context

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
              │  │                                 │                  │
              │  │                                 │                  └─ flags (sampled)
              │  │                                 └─ parent span id
              │  └─ trace id
              └─ version
```

### OpenTelemetry

OpenTelemetry (OTel) é o **padrão da indústria** para instrumentação, substituindo OpenTracing e OpenCensus.

```
App (instrumented) → OTel Collector → Backend (Jaeger, Zipkin, Datadog, Grafana Tempo)
```

Componentes:
- **SDK**: Cria e gerencia spans na aplicação
- **Exporters**: Enviam spans para o backend (OTLP, Jaeger, Zipkin)
- **Collector**: Recebe, processa e exporta telemetria (deploy separado)
- **Propagators**: Injetam/extraem context de headers HTTP

---
## Funcionamento Interno

### Context Propagation em Go

```go
// Serviço A (outgoing)
ctx, span := tracer.Start(ctx, "serviceA.handleRequest")
defer span.End()

// Injeta trace context no header HTTP
otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

// Serviço B (incoming)
ctx = otel.GetTextMapPropagator().Extract(ctx, propagation.HeaderCarrier(req.Header))
ctx, span := tracer.Start(ctx, "serviceB.processOrder")
defer span.End()
```

### Sampling

Em produção com alto throughput, rastrear 100% dos requests é caro. Estratégias:
- **Head-based**: Decide no início se o trace será amostrado (random %)
- **Tail-based**: Decide após o trace completar (amostra todos com erro/latência alta)

---
## Erros Comuns
1. **Não propagar o context**: Se um serviço não extrai/injeta o trace context, o trace é "quebrado".
2. **Instrumentar demais**: Criar spans para cada function call gera overhead. Instrumente chamadas de rede, queries e operações significativas.
3. **Sampling 100% em produção**: Custo de storage e performance. Use 1-10% ou tail-based sampling.

---
## Perguntas de Entrevista
### Nível Senior
**P: Qual a diferença entre distributed tracing, logging e métricas?**
R: **Logs**: registro textual detalhado de eventos (debugging). **Métricas**: dados numéricos agregados (alerting: latência p99, error rate). **Traces**: fluxo de um request através de serviços (debugging de latência, identificação de bottleneck). São complementares: métricas detectam o problema, traces localizam o serviço, logs explicam o que aconteceu.

---
## Referências
1. **OpenTelemetry**: [opentelemetry.io](https://opentelemetry.io)
2. **Paper**: Sigelman, B. et al. (2010). *Dapper, a Large-Scale Distributed Systems Tracing Infrastructure* (Google)
3. **Jaeger**: [jaegertracing.io](https://www.jaegertracing.io)
4. **Tópicos relacionados**: [Structured Logging](02-structured-logging.md) | [Métricas](03-metrics-and-monitoring.md)
