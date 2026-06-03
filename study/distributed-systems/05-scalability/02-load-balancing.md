# Load Balancing

## Objetivo
Compreender estratégias de distribuição de carga entre instâncias, algoritmos (round-robin, least connections, consistent hashing), e como load balancers operam nas camadas L4 e L7.

---
## Pré-requisitos
- [Horizontal vs Vertical Scaling](01-horizontal-vs-vertical-scaling.md)

---
## Conceitos Fundamentais

### O que é Load Balancing?
Distribuir requisições entre múltiplas instâncias de um serviço para maximizar throughput, minimizar latência e garantir alta disponibilidade.

### L4 vs L7

| Camada | Opera em | Decisão baseada em | Exemplos |
|--------|----------|-------------------|----------|
| **L4 (Transport)** | TCP/UDP | IP + porta | AWS NLB, HAProxy (modo TCP) |
| **L7 (Application)** | HTTP/gRPC | URL, headers, cookies, body | Nginx, Envoy, AWS ALB |

### Algoritmos

| Algoritmo | Descrição | Quando usar |
|-----------|-----------|-------------|
| **Round Robin** | Distribui sequencialmente | Instâncias homogêneas |
| **Weighted Round Robin** | Peso por instância | Instâncias com capacidade diferente |
| **Least Connections** | Envia para quem tem menos conexões ativas | Requests com duração variável |
| **IP Hash** | Hash do IP → mesma instância | Sticky sessions simples |
| **Consistent Hashing** | Hash distribuído com mínimo de remap | Cache distribuído, sharding |
| **Random** | Escolha aleatória | Simples, surpreendentemente eficaz |

### Consistent Hashing
```
Hash ring:
  0 ─── Node A ─── 90° ─── Node B ─── 180° ─── Node C ─── 270° ─── 360°

Key "user:123" → hash = 120° → cai entre A e B → vai para B
Key "user:456" → hash = 200° → cai entre B e C → vai para C

Se Node B sai: apenas keys entre A e B migram para C (não todas!)
```

---
## Erros Comuns
1. **L4 LB para gRPC**: gRPC usa HTTP/2 com uma conexão persistente. L4 distribui por conexão, não por request → todo tráfego para um backend.
2. **Sem health checks**: LB envia tráfego para instância morta.
3. **Sticky sessions sem necessidade**: Limitam a distribuição de carga.

---
## Perguntas de Entrevista
### Nível Senior
**P: Por que gRPC requer L7 load balancing?**
R: gRPC usa HTTP/2 com multiplexação — múltiplos RPCs em uma conexão TCP. L4 LB distribui por conexão, então todos os RPCs de um cliente vão para o mesmo backend. L7 LB (Envoy, Istio) decodifica os frames HTTP/2 e distribui cada RPC individualmente.

---
## Referências
1. **Livro**: Kleppmann, M. (2017). *DDIA*, Cap. 6 — Partitioning
2. **Nginx**: [Load Balancing Methods](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
3. **Tópicos relacionados**: [Horizontal Scaling](01-horizontal-vs-vertical-scaling.md) | [Service Discovery](../07-orchestration/01-service-discovery.md) | [Rate Limiting](05-rate-limiting.md)
