# Structured Logging

## Objetivo
Compreender structured logging como prática essencial em sistemas distribuídos, diferenças para logging textual, e como implementar com `slog` (Go 1.21+).

---
## Pré-requisitos
- Experiência com logs em aplicações

---
## Conceitos Fundamentais

### Logs Textuais vs Estruturados

```
Textual (difícil de parsear):
  2024-01-15 10:30:00 INFO Order created for user 123, amount $99.90

Estruturado (JSON, fácil de agregar e filtrar):
  {"timestamp":"2024-01-15T10:30:00Z","level":"INFO","msg":"Order created","user_id":"123","amount":99.90,"order_id":"ORD-456","trace_id":"abc-789"}
```

### Campos Obrigatórios em Sistemas Distribuídos

| Campo | Descrição |
|-------|-----------|
| `timestamp` | Quando aconteceu (ISO 8601, UTC) |
| `level` | Severidade (DEBUG, INFO, WARN, ERROR) |
| `msg` | Mensagem descritiva |
| `service` | Nome do serviço |
| `trace_id` | Correlação com distributed tracing |
| `request_id` | ID da requisição |
| `user_id` | Quem disparou (quando aplicável) |

### slog (Go 1.21+)

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("Order created",
    slog.String("order_id", "ORD-123"),
    slog.String("user_id", "USR-456"),
    slog.Float64("amount", 99.90),
    slog.String("trace_id", traceID),
)
// Output: {"time":"2024-01-15T10:30:00Z","level":"INFO","msg":"Order created","order_id":"ORD-123","user_id":"USR-456","amount":99.9,"trace_id":"abc"}
```

---
## Erros Comuns
1. **Logar dados sensíveis**: Nunca logar senhas, tokens, cartões de crédito. Mascarar PII.
2. **Log level errado**: ERROR para coisas não-graves, INFO para coisas triviais. ERROR = precisa de ação. WARN = pode precisar. INFO = fluxo normal. DEBUG = desenvolvimento.
3. **Logs sem correlation ID**: Em microserviços, sem `trace_id` é impossível correlacionar logs de serviços diferentes.

---
## Perguntas de Entrevista
### Nível Senior
**P: Por que usar structured logging em microserviços?**
R: Porque logs textuais são impossíveis de agregar e filtrar em escala. Com structured logging (JSON), ferramentas como ELK, Loki ou Datadog podem indexar campos (`user_id`, `trace_id`, `error_code`), permitindo queries como "todos os erros do user 123 nos últimos 30 minutos". Além disso, correlation via `trace_id` permite seguir um request através de múltiplos serviços.

---
## Referências
1. **Go slog**: [pkg.go.dev/log/slog](https://pkg.go.dev/log/slog)
2. **ELK Stack**: [elastic.co](https://www.elastic.co/elastic-stack)
3. **Grafana Loki**: [grafana.com/oss/loki](https://grafana.com/oss/loki)
4. **Tópicos relacionados**: [Distributed Tracing](01-distributed-tracing.md) | [Métricas](03-metrics-and-monitoring.md)
