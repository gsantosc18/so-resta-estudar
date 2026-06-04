# Service Discovery

## Objetivo
Compreender como serviços se localizam dinamicamente em ambientes distribuídos, comparando client-side vs server-side discovery, e ferramentas como Consul, etcd e Kubernetes DNS.

---
## Pré-requisitos
- [Load Balancing](../05-scalability/02-load-balancing.md)

---
## Conceitos Fundamentais

### O Problema
Em ambientes dinâmicos (containers, cloud), IPs e portas mudam constantemente. Hardcoding endpoints é inviável.

### Padrões

#### 1. Client-Side Discovery
O cliente consulta um **service registry** e escolhe uma instância.
```
Cliente → Service Registry → [lista de instâncias]
Cliente → escolhe instância → chama diretamente
```
**Exemplos**: Netflix Eureka, gRPC client-side LB, Consul + cliente.

#### 2. Server-Side Discovery
O cliente chama um **load balancer** que consulta o registry internamente.
```
Cliente → Load Balancer → Service Registry → [lista de instâncias]
          Load Balancer → escolhe instância → roteia request
```
**Exemplos**: Kubernetes Service (kube-proxy), AWS ELB, Nginx.

### Ferramentas

| Ferramenta | Tipo | Protocolo | Usado por |
|-----------|------|-----------|-----------|
| **Kubernetes DNS** | Server-side | DNS | Kubernetes (nativo) |
| **Consul** | Client ou Server-side | HTTP/DNS/gRPC | HashiCorp stack |
| **etcd** | Key-value (base para discovery) | gRPC | Kubernetes (internamente) |
| **Eureka** | Client-side | HTTP | Netflix/Spring |

### Kubernetes Service Discovery
```yaml
# Kubernetes Service
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
```
```
# Dentro do cluster, qualquer pod pode chamar:
http://order-service.default.svc.cluster.local:80
# Ou simplesmente:
http://order-service:80
```
Kubernetes DNS resolve `order-service` para o ClusterIP do Service, que faz load balancing L4 (kube-proxy/iptables) para os pods.

---
## Erros Comuns
1. **Hardcoding IPs**: IPs mudam em containers. Use nomes de serviço.
2. **DNS cache infinito**: JVM por padrão cacheia DNS para sempre. Configure TTL curto.
3. **Não monitorar o registry**: Se Consul/etcd cai, ninguém encontra ninguém.

---
## Perguntas de Entrevista
### Nível Senior
**P: Client-side vs Server-side discovery — trade-offs?**
R: Client-side: o cliente conhece todas as instâncias e escolhe (menor latência, sem proxy intermediário), mas precisa de lógica de LB em cada cliente e cada linguagem. Server-side: transparente para o cliente (só chama um endpoint), mas adiciona um hop de rede (proxy/LB). Kubernetes usa server-side (kube-proxy) como padrão, que é suficiente para maioria dos casos. Service mesh (Istio) adiciona client-side via sidecar.

---
## Referências
1. **Livro**: Richardson, C. (2018). *Microservices Patterns*, Cap. 3 — Service Discovery
2. **Consul**: [consul.io](https://www.consul.io)
3. **Tópicos relacionados**: [API Gateway](02-api-gateway.md) | [Service Mesh](03-service-mesh.md) | [Load Balancing](../05-scalability/02-load-balancing.md)
