# Falácias da Computação Distribuída

## Objetivo

Compreender as 8 falácias da computação distribuída formuladas por L. Peter Deutsch e James Gosling na Sun Microsystems, internalizando por que cada suposição falsa leva a bugs, falhas em produção e designs frágeis.

---

## Pré-requisitos

- Conceitos básicos de redes (TCP/IP, DNS, HTTP)
- Experiência com chamadas entre serviços

---

## Conceitos Fundamentais

### As 8 Falácias

Em 1994, Peter Deutsch identificou 7 suposições falsas que desenvolvedores fazem ao projetar sistemas distribuídos. James Gosling adicionou a 8ª. São:

1. **A rede é confiável** (*The network is reliable*)
2. **A latência é zero** (*Latency is zero*)
3. **A largura de banda é infinita** (*Bandwidth is infinite*)
4. **A rede é segura** (*The network is secure*)
5. **A topologia não muda** (*Topology doesn't change*)
6. **Existe um administrador** (*There is one administrator*)
7. **O custo de transporte é zero** (*Transport cost is zero*)
8. **A rede é homogênea** (*The network is homogeneous*)

Cada falácia representa uma suposição que funciona em ambiente local mas **falha catastroficamente** em sistemas distribuídos.

---

### Falácia 1: A Rede é Confiável

**Suposição falsa**: Chamadas de rede sempre funcionam.

**Realidade**:
- Pacotes são perdidos, duplicados e reordenados
- Switches e roteadores falham
- Cabos de fibra são cortados (literalmente: tubarões mordem cabos submarinos)
- Cloud providers sofrem outages (AWS us-east-1 é famoso)
- DNS pode falhar ou retornar resultados stale

**Consequências de ignorar**:
```
// ❌ Código ingênuo — assume rede confiável
resp, err := http.Get("http://payment-service/charge")
if err != nil {
    log.Fatal(err) // Fatal? A rede vai falhar em produção!
}

// ✅ Código resiliente — assume rede não confiável
resp, err := httpClientWithRetry.Get("http://payment-service/charge")
if err != nil {
    // Retry com backoff, circuit breaker, fallback
    return handleNetworkFailure(err)
}
```

**Soluções**:
- Retry com backoff exponencial e jitter
- Circuit breaker para falhas persistentes
- Timeouts em todas as chamadas de rede
- Queues para operações assíncronas (sobrevivem a falhas temporárias)
- Idempotência para operações repetidas com segurança

---

### Falácia 2: A Latência é Zero

**Suposição falsa**: Chamadas remotas são tão rápidas quanto chamadas locais.

**Realidade**:

| Operação | Latência Típica |
|----------|----------------|
| Referência L1 cache | 0.5 ns |
| Referência L2 cache | 7 ns |
| Referência memória RAM | 100 ns |
| SSD random read | 16 μs |
| Round-trip na mesma datacenter | 500 μs |
| Round-trip mesma região (inter-AZ) | 1-2 ms |
| Round-trip cross-region (US → EU) | 70-100 ms |
| Round-trip cross-continent (US → Asia) | 150-300 ms |

Uma chamada de rede é **~500.000x mais lenta** que uma referência de memória.

**Consequências de ignorar**:
```
// ❌ N+1 queries distribuídas — morte por latência
for _, userID := range userIDs {
    user, _ := userService.GetUser(userID) // 1 chamada de rede por usuário
    orders, _ := orderService.GetOrders(userID) // mais 1 por usuário
    // 100 usuários = 200 chamadas de rede = 100-200ms
}

// ✅ Batch + paralelismo
users, _ := userService.GetUsers(userIDs) // 1 chamada batch
orders, _ := orderService.GetOrdersBatch(userIDs) // 1 chamada batch
// 2 chamadas de rede = 1-2ms
```

**Soluções**:
- Batching de requisições
- Cache local para dados lidos frequentemente
- Async/non-blocking I/O
- Colocação de serviços que se comunicam muito na mesma região
- gRPC com streaming para reduzir overhead por mensagem

---

### Falácia 3: A Largura de Banda é Infinita

**Suposição falsa**: Você pode enviar qualquer quantidade de dados pela rede.

**Realidade**:
- Largura de banda é compartilhada entre todos os serviços
- Payloads grandes fragmentam e aumentam chance de falha
- Serialização/deserialização de payloads grandes consome CPU
- Cloud providers cobram por tráfego de rede (egress)

**Consequências de ignorar**:
```
// ❌ Retorna entidade inteira quando só precisa do nome
GET /api/users/123
Response: { id, name, email, address, preferences, history, avatar_base64... } // 50KB

// ✅ GraphQL ou campos seletivos
GET /api/users/123?fields=name,email
Response: { name, email } // 100 bytes
```

**Soluções**:
- Paginação para listas
- Compressão (gzip, brotli)
- Protocol Buffers / gRPC em vez de JSON verbose
- Field selection / GraphQL
- Streaming para dados grandes
- CDN para assets estáticos

---

### Falácia 4: A Rede é Segura

**Suposição falsa**: Comunicação interna não precisa de segurança.

**Realidade**:
- Zero Trust: nunca confie, sempre verifique
- Ataques internos (insider threats) são comuns
- Lateral movement: uma vez dentro, o atacante se move entre serviços
- Cloud shared infrastructure: você não controla o hardware

**Soluções**:
- mTLS (mutual TLS) entre todos os serviços
- Service mesh para segurança transparente
- Network policies (Kubernetes NetworkPolicy)
- Autenticação e autorização em cada serviço (JWT, OAuth2)
- Encriptação at-rest e in-transit
- Secret management (Vault, AWS Secrets Manager)

---

### Falácia 5: A Topologia Não Muda

**Suposição falsa**: Endereços IP e rotas são estáveis.

**Realidade**:
- Containers são efêmeros — IPs mudam a cada restart
- Auto-scaling adiciona e remove instâncias
- Deploy blue/green muda os backends
- Failover muda o tráfego entre datacenters

**Soluções**:
- Service discovery (Consul, DNS-based, Kubernetes Services)
- Load balancer como ponto de entrada estável
- Não hardcode IPs — use nomes de serviço
- Health checks para detectar nós indisponíveis

---

### Falácia 6: Existe Um Administrador

**Suposição falsa**: Uma pessoa/equipe controla todo o sistema.

**Realidade**:
- Microserviços → times diferentes → deploys independentes
- Dependências externas (APIs de terceiros, SaaS)
- Multi-cloud e híbrido
- Cada time tem suas políticas e ferramentas

**Soluções**:
- Contratos de API versionados (OpenAPI, Protocol Buffers)
- Backward compatibility como regra
- Monitoramento centralizado com alertas distribuídos
- Runbooks e documentação de operação
- Platform team para infraestrutura compartilhada

---

### Falácia 7: O Custo de Transporte é Zero

**Suposição falsa**: Enviar dados pela rede não tem custo.

**Realidade**:
- **Custo financeiro**: Cloud providers cobram por GB de egress
- **Custo de CPU**: Serialização/deserialização (JSON é caro)
- **Custo de latência**: Cada hop adiciona delay
- **Custo de confiabilidade**: Mais chamadas = mais pontos de falha

| Cloud | Egress Custo (por GB) |
|-------|----------------------|
| AWS | $0.09/GB (inter-region) |
| GCP | $0.08/GB (inter-region) |
| Azure | $0.087/GB (inter-region) |

**Soluções**:
- Minimizar chamadas entre serviços (bounded contexts corretos)
- Usar formatos binários (Protobuf, Avro) em vez de JSON
- Cache agressivo para reduzir calls
- Colocação de serviços acoplados na mesma região/VPC

---

### Falácia 8: A Rede é Homogênea

**Suposição falsa**: Todos os nós e conexões são iguais.

**Realidade**:
- Diferentes provedores de cloud
- Diferentes versões de OS, runtime, bibliotecas
- IPv4 vs IPv6
- Diferentes MTUs, firewalls, proxies
- HTTP/1.1 vs HTTP/2 vs gRPC vs WebSocket

**Soluções**:
- Usar protocolos bem definidos e padronizados
- Testes de integração cross-platform
- Contract testing (Pact)
- Service mesh para abstrair a heterogeneidade

---

## Funcionamento Interno

### Impacto Cumulativo das Falácias

As falácias não são independentes — elas se compõem:

```
Chamada de rede:
  1. Rede não confiável → precisa de retry
  2. Latência não é zero → retry adiciona mais latência
  3. Bandwidth limitada → retry reenvia dados
  4. Rede não segura → precisa de TLS (mais CPU e latência)
  5. Topologia muda → retry pode ir para nó errado
  6. Múltiplos admins → difícil diagnosticar o problema
  7. Transporte tem custo → retry multiplica o custo
  8. Rede heterogênea → falha pode ser de incompatibilidade

Uma simples chamada HTTP envolve TODAS as 8 falácias.
```

---

## Casos de Uso

### Amazon — Falácia 1 (Rede não confiável) em 2017

Em fevereiro de 2017, um comando errado no S3 derrubou uma porção significativa da internet. Serviços que assumiam que o S3 era "sempre disponível" falharam em cascata. Resultado: **$150M em perdas** para empresas afetadas.

**Lição**: Mesmo serviços com 99.99% de SLA falham. Design para falha.

### Google — Falácia 2 (Latência) no Spanner

O Google Spanner precisa esperar o intervalo de incerteza do TrueTime (~7ms) antes de confirmar transações para garantir consistência global. Isso é um custo direto da falácia 2: latência entre datacenters globais não é zero, e a consistência exige esperar essa latência.

### Cloudflare — Falácia 5 (Topologia muda) em 2020

Uma mudança de roteamento BGP não intencional redirecionou tráfego por um caminho inesperado, causando outage global de 27 minutos. A topologia da internet mudou literalmente em segundos.

---

## Vantagens

### De conhecer as falácias:
1. **Mindset correto**: Você para de tratar rede como confiável
2. **Design defensivo**: Arquitetura preparada para falhas desde o início
3. **Menos bugs em produção**: Cenários de falha já considerados
4. **Melhor estimativa de custos**: Inclui bandwidth, serialização, segurança
5. **Comunicação eficaz**: Vocabulário para explicar por que "funciona local mas falha em prod"

---

## Desvantagens

### De ser "paranóico demais":
1. **Over-engineering**: Nem todo sistema precisa de todos os padrões de resiliência
2. **Complexidade**: Retry + circuit breaker + timeout + idempotência = muita infraestrutura
3. **Custo**: Implementar tudo é caro em tempo e dinheiro
4. **Pragmatismo necessário**: Monolitos bem feitos não sofrem da maioria dessas falácias

---

## Erros Comuns

### 1. "Funciona na minha máquina"
O ambiente local é o oposto de um sistema distribuído: rede perfeita, latência zero, um admin. Tudo que pode dar errado em produção é invisível localmente.

### 2. Tratar timeout como erro raro
Em sistemas distribuídos, timeouts são a **norma**, não a exceção. Seu código deve ter tratamento de timeout em **todas** as chamadas externas.

### 3. Ignorar a falácia 7 em microserviços
Microserviços multiplicam o custo de transporte. Um monolito faz function calls (nanosegundos, custo zero). Microserviços fazem HTTP/gRPC calls (milissegundos, custo de serialização, bandwidth, TLS).

### 4. "Nossos serviços estão na mesma rede, então é seguro"
Zero Trust: mesmo na mesma VPC, um serviço comprometido pode atacar outros. mTLS e autenticação entre serviços são necessários.

---

## Exemplos

### Exemplo: Demonstrando Impacto da Latência em Go

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// SimulateNetworkCall simula uma chamada de rede com latência variável
func SimulateNetworkCall(service string) (time.Duration, error) {
	// Latência base + variação (simula rede real)
	baseLatency := 5 * time.Millisecond
	jitter := time.Duration(rand.Intn(10)) * time.Millisecond

	// 5% de chance de falha
	if rand.Float64() < 0.05 {
		time.Sleep(baseLatency + jitter)
		return baseLatency + jitter, fmt.Errorf("timeout calling %s", service)
	}

	// 2% de chance de latência alta (slow response)
	if rand.Float64() < 0.02 {
		slowLatency := 500 * time.Millisecond
		time.Sleep(slowLatency)
		return slowLatency, nil
	}

	time.Sleep(baseLatency + jitter)
	return baseLatency + jitter, nil
}

// SequentialCalls faz chamadas sequenciais (N+1 problem)
func SequentialCalls(services []string) (time.Duration, int) {
	start := time.Now()
	errors := 0

	for _, svc := range services {
		_, err := SimulateNetworkCall(svc)
		if err != nil {
			errors++
		}
	}

	return time.Since(start), errors
}

// ParallelCalls faz chamadas em paralelo
func ParallelCalls(services []string) (time.Duration, int) {
	start := time.Now()
	errors := 0
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, svc := range services {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			_, err := SimulateNetworkCall(s)
			if err != nil {
				mu.Lock()
				errors++
				mu.Unlock()
			}
		}(svc)
	}

	wg.Wait()
	return time.Since(start), errors
}

func main() {
	fmt.Println("=== Falácia 2: Latência NÃO é Zero ===\n")

	// Simular 10 serviços
	services := make([]string, 10)
	for i := 0; i < 10; i++ {
		services[i] = fmt.Sprintf("service-%d", i+1)
	}

	// Chamadas sequenciais
	fmt.Println("--- Chamadas Sequenciais ---")
	totalSeq := time.Duration(0)
	totalErrors := 0
	iterations := 5

	for i := 0; i < iterations; i++ {
		duration, errs := SequentialCalls(services)
		totalSeq += duration
		totalErrors += errs
		fmt.Printf("  Iteração %d: %v (erros: %d)\n", i+1, duration, errs)
	}
	avgSeq := totalSeq / time.Duration(iterations)
	fmt.Printf("  Média: %v\n\n", avgSeq)

	// Chamadas paralelas
	fmt.Println("--- Chamadas Paralelas ---")
	totalPar := time.Duration(0)
	totalErrors = 0

	for i := 0; i < iterations; i++ {
		duration, errs := ParallelCalls(services)
		totalPar += duration
		totalErrors += errs
		fmt.Printf("  Iteração %d: %v (erros: %d)\n", i+1, duration, errs)
	}
	avgPar := totalPar / time.Duration(iterations)
	fmt.Printf("  Média: %v\n\n", avgPar)

	// Comparação
	speedup := float64(avgSeq) / float64(avgPar)
	fmt.Printf("=== Resultado ===\n")
	fmt.Printf("Sequencial: %v | Paralelo: %v\n", avgSeq, avgPar)
	fmt.Printf("Speedup: %.1fx mais rápido com paralelismo\n", speedup)
	fmt.Println("\n💡 Lição: Latência se acumula em chamadas sequenciais.")
	fmt.Println("   Em sistemas distribuídos, paralelize sempre que possível.")
}
```

---

## Exercícios

### Exercício 1 — Identificação de Falácias
Para cada bug abaixo, identifique qual falácia está sendo ignorada:

1. "O serviço de pagamento está lento desde que movemos para multi-region"
2. "O deploy quebrou porque o IP do banco de dados mudou"
3. "Nossa API retorna 10MB de JSON e os clientes mobile reclamam"
4. "Um hacker acessou o serviço interno de relatórios"
5. "O custo de cloud triplicou quando migramos de monolito para microserviços"

### Exercício 2 — Audit de Código
Revise um serviço que você desenvolveu e identifique onde cada falácia é (ou não) tratada. Crie um checklist de melhorias.

### Exercício 3 — Cálculo de Latência
Um request atravessa 5 serviços em sequência. Cada serviço tem latência média de 5ms com p99 de 50ms. Calcule:
1. Latência média do request completo
2. Latência p99 do request completo
3. Se cada serviço tem 99.9% de success rate, qual a success rate do request completo?

---

## Projeto Prático

### Fallacy Checker Tool

**Objetivo**: Criar uma ferramenta CLI em Go que analisa um serviço HTTP e identifica potenciais violações das falácias.

**Requisitos**:
1. Input: URL de um serviço
2. Testa latência (média, p50, p95, p99) com múltiplas requisições
3. Testa comportamento sob timeout (requisição com deadline curto)
4. Verifica tamanho do payload de resposta
5. Verifica se usa HTTPS
6. Relatório com score de resiliência

---

## Perguntas de Entrevista

### Nível Pleno

**P: Cite pelo menos 4 das 8 falácias da computação distribuída e como mitiga cada uma.**
R: (1) Rede não confiável → retry com backoff + circuit breaker. (2) Latência não zero → batching, cache, paralelismo. (3) Bandwidth limitada → paginação, compressão, campos seletivos. (4) Rede não segura → mTLS, JWT, network policies.

### Nível Senior

**P: Como as falácias se compõem em uma arquitetura de microserviços?**
R: Cada hop entre serviços multiplica o impacto. Com 5 serviços em série: latência se soma (5x), reliability se multiplica (0.999^5 = 0.995), custo de transporte se multiplica (5x serialização), superfície de ataque aumenta (5 pontos). Um monolito sofre zero dessas penalidades. Por isso, microserviços exigem investimento em infraestrutura (service mesh, observabilidade, resiliência) que monolitos não precisam.

### Nível Staff

**P: Quando você NÃO usaria microserviços, mesmo tendo a escala para isso?**
R: Quando o custo das falácias supera os benefícios. Especificamente: (1) Time pequeno (<10 devs) — overhead de operação supera ganho de produtividade. (2) Domínio altamente acoplado — se todos os serviços precisam mudar juntos, são um monolito disfarçado. (3) Latência crítica — cada hop adiciona milissegundos; trading systems usam monolitos. (4) Início de projeto — premature optimization; comece com modular monolith e extraia serviços quando a dor justificar.

---

## Referências

1. **Artigo original**: Deutsch, L.P. (1994). *The Eight Fallacies of Distributed Computing*
2. **Artigo expandido**: Rotem-Gal-Oz, A. (2006). *Fallacies of Distributed Computing Explained*
3. **Livro**: Nygard, M. (2018). *Release It! Second Edition*, Cap. 4-5
4. **Talk**: Hohpe, G. (2019). *The Architect Elevator* — Microservices edition
5. **Números de latência**: [Latency Numbers Every Programmer Should Know](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
6. **Tópicos relacionados**: [Circuit Breaker](../04-resilience/01-circuit-breaker.md) | [Retry e Backoff](../04-resilience/02-retry-and-backoff.md) | [Síncrono vs Assíncrono](../02-communication/01-synchronous-vs-asynchronous.md)
