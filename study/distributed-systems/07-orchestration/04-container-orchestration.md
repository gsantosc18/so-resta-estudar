# Container Orchestration

## Objetivo

Compreender orquestração de containers com foco em Kubernetes — sua arquitetura, componentes principais, padrões de deploy, e como ele gerencia o ciclo de vida de aplicações distribuídas em produção.

---

## Pré-requisitos

- [Service Discovery](01-service-discovery.md)
- [API Gateway](02-api-gateway.md)
- [Health Checks e Readiness](../06-observability/04-health-checks-and-readiness.md)
- [Horizontal vs Vertical Scaling](../05-scalability/01-horizontal-vs-vertical-scaling.md)
- Conceitos de Docker (imagens, containers)

---

## Conceitos Fundamentais

### Por que Orquestração?

Com poucos containers, `docker run` e `docker-compose` são suficientes. Com centenas/milhares de containers em múltiplas máquinas, você precisa de:

- **Scheduling**: Em qual máquina roda cada container?
- **Scaling**: Como escalar de 3 para 30 instâncias automaticamente?
- **Self-healing**: Se um container morre, quem o recria?
- **Networking**: Como containers em máquinas diferentes se comunicam?
- **Storage**: Como dados persistentes sobrevivem a restarts?
- **Secrets**: Como gerenciar senhas, tokens, certificados?
- **Rolling updates**: Como fazer deploy sem downtime?

### Kubernetes — O Padrão da Indústria

Kubernetes (K8s), criado pelo Google (baseado no Borg), é o orquestrador de containers padrão da indústria.

### Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   Control Plane                      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ API      │  │ etcd     │  │ Controller       │  │
│  │ Server   │  │ (state)  │  │ Manager          │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │Scheduler │  │ Cloud Controller Manager         │ │
│  └──────────┘  └──────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│   Worker Node │ │   Worker Node │ │   Worker Node │
│               │ │               │ │               │
│ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │
│ │  kubelet  │ │ │ │  kubelet  │ │ │ │  kubelet  │ │
│ │ kube-proxy│ │ │ │ kube-proxy│ │ │ │ kube-proxy│ │
│ │           │ │ │ │           │ │ │ │           │ │
│ │ [Pod A]   │ │ │ │ [Pod C]   │ │ │ │ [Pod E]   │ │
│ │ [Pod B]   │ │ │ │ [Pod D]   │ │ │ │ [Pod F]   │ │
│ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Componentes do Control Plane

| Componente | Função |
|-----------|--------|
| **API Server** | Ponto de entrada para toda comunicação (REST). `kubectl` fala com ele. |
| **etcd** | Key-value store distribuído. Armazena todo o estado do cluster (Raft consensus). |
| **Scheduler** | Decide em qual nó cada pod será executado (considerando recursos, afinidade, taints). |
| **Controller Manager** | Roda controllers que garantem o estado desejado (ReplicaSet, Deployment, etc.). |

### Componentes do Worker Node

| Componente | Função |
|-----------|--------|
| **kubelet** | Agente que roda em cada nó. Garante que os containers dos pods estão rodando. |
| **kube-proxy** | Proxy de rede. Implementa Services (L4 load balancing via iptables/IPVS). |
| **Container Runtime** | Executa containers (containerd, CRI-O). |

### Recursos Principais

```yaml
# Pod: menor unidade deployável (1+ containers)
apiVersion: v1
kind: Pod
metadata:
  name: order-api
spec:
  containers:
  - name: order
    image: order-service:v1
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "128Mi"
        cpu: "250m"
      limits:
        memory: "256Mi"
        cpu: "500m"

---
# Deployment: gerencia ReplicaSets e rolling updates
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: order
    spec:
      containers:
      - name: order
        image: order-service:v2
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8080

---
# Service: endpoint estável + load balancing L4
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP

---
# HorizontalPodAutoscaler: escala automática por CPU/memória
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Funcionamento Interno

### O Loop de Reconciliação

Kubernetes funciona por **declarative state management**. Você declara o estado desejado, e controllers trabalham continuamente para alcançá-lo.

```
Estado Desejado (YAML):   replicas: 3
Estado Atual:             pods rodando: 2

Controller detecta diferença → cria 1 pod → estado converge para 3
```

```
Loop infinito do Controller:
  1. Observe: ler estado atual do cluster
  2. Diff: comparar com estado desejado
  3. Act: criar/deletar/atualizar recursos para convergir
```

### Rolling Update

```
Deployment v1 → v2 (maxSurge: 1, maxUnavailable: 0)

Passo 1: [v1] [v1] [v1] [v2]     ← cria 1 novo pod (v2)
Passo 2: [v1] [v1] [v2] [v2]     ← v2 ready, remove 1 v1
Passo 3: [v1] [v2] [v2] [v2]     ← repete
Passo 4: [v2] [v2] [v2]          ← todos v2, deploy completo

Se v2 falha readiness → rollback automático
```

### Estratégias de Deploy

| Estratégia | Descrição | Risco |
|-----------|-----------|-------|
| **Rolling Update** | Gradual, sem downtime | Versões coexistem temporariamente |
| **Recreate** | Mata tudo, recria | Downtime durante transição |
| **Blue/Green** | Dois deployments, switch no Service | Dobra os recursos temporariamente |
| **Canary** | 1-5% do tráfego para nova versão | Requer traffic splitting (Istio) |

### Networking

```
Pod-to-Pod:
  Cada pod tem IP único no cluster
  Pods se comunicam diretamente (sem NAT)

Pod-to-Service:
  Service tem ClusterIP virtual
  kube-proxy configura iptables/IPVS para L4 load balancing

External-to-Service:
  Ingress Controller (Nginx, Traefik) → Service → Pods
  LoadBalancer Service → Cloud LB → Service → Pods
```

---

## Casos de Uso

### Spotify — 1000+ Microserviços

Spotify roda 1000+ microserviços em Kubernetes, com auto-scaling baseado em métricas customizadas. Cada squad tem autonomia para fazer deploy independentemente.

### Adidas — Migração de VM para K8s

Adidas migrou de VMs on-premise para Kubernetes na AWS, reduzindo tempo de deploy de 6 meses para 3-5 minutos, e custo de infraestrutura em 50%.

### CERN — K8s para Física de Partículas

CERN usa Kubernetes para orquestrar workloads de processamento de dados do Large Hadron Collider, escalando para milhares de pods durante experimentos.

---

## Vantagens

1. **Self-healing**: Pods que morrem são recriados automaticamente
2. **Auto-scaling**: HPA escala baseado em CPU, memória ou métricas customizadas
3. **Rolling updates**: Deploy sem downtime com rollback automático
4. **Service discovery**: DNS nativo para comunicação entre pods
5. **Declarativo**: Estado desejado em YAML, Kubernetes converge
6. **Ecossistema**: Helm, Operators, CRDs, CNCF landscape
7. **Multi-cloud**: Funciona em AWS, GCP, Azure, on-premise

---

## Desvantagens

1. **Complexidade**: Curva de aprendizado íngreme (networking, RBAC, storage, CRDs)
2. **Overhead operacional**: Control plane precisa de monitoramento e manutenção
3. **Custo**: Para workloads pequenos, ECS/Cloud Run são mais simples e baratos
4. **Networking**: Debugging de rede em K8s é notoriamente difícil
5. **Stateful workloads**: Databases em K8s exigem Operators especializados
6. **YAML verboso**: Centenas de linhas de YAML para um serviço simples

---

## Erros Comuns

### 1. Rodar bancos de dados em Kubernetes sem Operator
Bancos de dados são stateful e precisam de gerenciamento especial (backup, replicação, failover). Sem Operator (ex: CrunchyData para PostgreSQL, Strimzi para Kafka), é muito fácil perder dados.

### 2. Não configurar resource requests/limits
Sem requests, o scheduler não sabe quanta CPU/memória o pod precisa. Sem limits, um pod pode consumir todos os recursos do nó.

### 3. Usar `:latest` como tag de imagem
`:latest` é imprevisível — você não sabe qual versão está rodando. Use tags imutáveis (`v1.2.3` ou SHA do commit).

### 4. Não implementar graceful shutdown
Kubernetes envia SIGTERM antes de matar o pod. Se o serviço não captura SIGTERM e drena conexões, requests em andamento são perdidos.

```go
// Graceful shutdown em Go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)

go func() {
    <-quit
    log.Println("Shutting down...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    server.Shutdown(ctx)
}()
```

### 5. Cluster sem monitoramento
Kubernetes sem Prometheus + Grafana + AlertManager é como dirigir sem painel. Você não sabe quando nós estão lotados, etcd está lento, ou pods estão crashando.

---

## Exercícios

### Exercício 1 — Kubernetes YAML
Escreva os manifests YAML para um microserviço completo:
- Deployment (3 replicas, rolling update)
- Service (ClusterIP)
- HPA (scale 3-10, target CPU 70%)
- ConfigMap e Secret
- Liveness e Readiness probes

### Exercício 2 — Troubleshooting
Um pod está em `CrashLoopBackOff`. Descreva o processo de investigação:
- Quais comandos `kubectl` usar?
- O que verificar nos logs?
- Causas comuns?

### Exercício 3 — Design de Cluster
Projete um cluster Kubernetes para produção com:
- 3 microserviços (API, Worker, Dashboard)
- PostgreSQL (operador)
- Redis (cache)
- Ingress para tráfego externo
- Monitoring stack

---

## Projeto Prático

### Deploy de Microserviços em Kubernetes Local

**Objetivo**: Deployar 3 microserviços Go em Kubernetes local (minikube/kind) com comunicação entre eles.

**Requisitos**:
1. 3 serviços Go compilados como Docker images
2. Deployment + Service para cada serviço
3. Ingress para acesso externo
4. HPA configurado para um dos serviços
5. ConfigMap para configuração
6. Teste de rolling update (v1 → v2)
7. Teste de self-healing (matar um pod e observar recriação)

**Critérios de sucesso**:
- `kubectl get pods` mostra todos os pods healthy
- `curl http://localhost/api/orders` retorna dados
- Matar um pod → pod recriado em <30s
- Atualizar imagem → rolling update sem downtime

---

## Perguntas de Entrevista

### Nível Pleno

**P: O que é Kubernetes e quais problemas ele resolve?**
R: Kubernetes é um orquestrador de containers que automatiza: deployment (rolling updates sem downtime), scaling (horizontal auto-scaling), self-healing (restart de pods que falham), service discovery (DNS interno), e gerenciamento de configuração (ConfigMaps, Secrets). Resolve o problema de gerenciar centenas de containers em múltiplas máquinas, que seria impossível manualmente.

**P: Qual a diferença entre um Pod e um Deployment?**
R: Pod é a menor unidade em K8s — um ou mais containers que compartilham rede e storage. Deployment é um controller que gerencia um ReplicaSet de Pods, garantindo N réplicas rodando e habilitando rolling updates. Na prática, nunca se cria Pods diretamente — usa-se Deployments.

### Nível Senior

**P: Como funciona o networking em Kubernetes?**
R: Três níveis: (1) **Pod-to-Pod**: cada pod tem IP único, comunicação direta sem NAT. CNI plugin (Calico, Cilium) implementa a rede. (2) **Pod-to-Service**: Service tem ClusterIP virtual; kube-proxy configura iptables/IPVS para L4 load balancing entre os pods do Service. (3) **External-to-Cluster**: Ingress Controller (Nginx, Traefik) recebe tráfego externo e roteia para Services internos.

**P: Como Kubernetes garante que o estado desejado é mantido?**
R: Controllers rodam loops de reconciliação contínuos: observam o estado atual (via API Server), comparam com o estado desejado (armazenado no etcd), e tomam ação para convergir (criar/deletar/atualizar recursos). Exemplo: ReplicaSet controller verifica se o número de pods rodando é igual ao `replicas` desejado. Se não, cria ou deleta pods.

### Nível Staff

**P: Quais os maiores desafios de operar Kubernetes em produção e como mitigá-los?**
R: (1) **etcd**: SPOF para todo o cluster. Mitigação: cluster etcd de 3-5 nós, backup regular, monitoramento de latência. (2) **Networking**: debugging de rede é difícil. Mitigação: CNI com observabilidade (Cilium com Hubble), network policies, service mesh. (3) **Resource management**: pods sem limits consomem todos os recursos. Mitigação: LimitRanges por namespace, ResourceQuotas, admission controllers. (4) **Security**: RBAC mal configurado = acesso irrestrito. Mitigação: least privilege, Pod Security Standards, network policies, secrets encryption at rest. (5) **Upgrade**: upgrades de K8s podem quebrar APIs deprecated. Mitigação: ambientes de staging, pluperfect deprecation checks.

---

## Referências

1. **Documentação**: [kubernetes.io/docs](https://kubernetes.io/docs/)
2. **Livro**: Burns, B. et al. (2019). *Kubernetes: Up and Running*
3. **Livro**: Hightower, K. (2017). *Kubernetes The Hard Way*
4. **CNCF Landscape**: [landscape.cncf.io](https://landscape.cncf.io)
5. **Paper**: Burns, B. et al. (2016). *Borg, Omega, and Kubernetes* (Google)
6. **Tópicos relacionados**: [Service Discovery](01-service-discovery.md) | [Service Mesh](03-service-mesh.md) | [Health Checks](../06-observability/04-health-checks-and-readiness.md) | [Horizontal Scaling](../05-scalability/01-horizontal-vs-vertical-scaling.md)
