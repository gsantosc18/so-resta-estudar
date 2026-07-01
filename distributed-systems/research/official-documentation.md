# Fontes de Documentação Oficial

Este documento compila as referências de documentação oficial para as linguagens, frameworks, ferramentas e padrões arquiteturais estudados ou utilizados ao longo deste curso.

---

## 1. Concorrência e JVM
* **Java Memory Model (JMM) - JSR 133**:
  * *O que é*: A especificação oficial de como a JVM lida com leitura e escrita de dados compartilhados por múltiplas threads na memória física, definindo regras cruciais de visibilidade e reordenação (instruções `volatile`, blocos `synchronized`, garantias de *happened-before* locais).
  * *Documentação*: [Java Language Specification - Chapter 17](https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html)
* **Virtual Threads (Project Loom)**:
  * *O que é*: A documentação oficial sobre threads leves no Java (Java 21+), fundamentais para concorrência de alta vazão sem sobrecarga do sistema operacional.
  * *Documentação*: [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)

---

## 2. Frameworks e APIs
* **Spring Boot & Spring Cloud**:
  * *O que é*: Ecosistema para construir microserviços e aplicações resilientes em Java/Kotlin.
  * *Documentação*: [Spring Cloud Stream](https://spring.io/projects/spring-cloud-stream) (para mensageria agnóstica), [Spring Cloud OpenFeign](https://spring.io/projects/spring-cloud-openfeign) (APIs síncronas), e [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html) (Métricas/Health check).
* **gRPC e Protocol Buffers**:
  * *O que é*: RPC de alta performance e serialização binária eficiente do Google.
  * *Documentação*: [gRPC IO Documentation](https://grpc.io/docs/) e [Protocol Buffers Guide](https://protobuf.dev/)

---

## 3. Mensageria e Streaming
* **Apache Kafka**:
  * *O que é*: Log de commit distribuído de alta vazão.
  * *Documentação*: [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
  * *Tópicos Críticos*: Protocolo de Replicação, Semânticas de Entrega (At-least-once, At-most-once, Exactly-once), Rebalanceamento de Grupos de Consumidores.
* **RabbitMQ (AMQP 0-9-1)**:
  * *O que é*: Message broker clássico focado em roteamento flexível.
  * *Documentação*: [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
  * *Tópicos Críticos*: Protocolo AMQP, Publisher Confirms, Consumer Acknowledgements, DLX (Dead Letter Exchanges).

---

## 4. Orquestração e Infraestrutura
* **Kubernetes (K8s)**:
  * *O que é*: Plataforma padrão da indústria para orquestração de containers.
  * *Documentação*: [Kubernetes Documentation](https://kubernetes.io/docs/home/)
  * *Tópicos Críticos*: Pods, Services (ClusterIP, NodePort, LoadBalancer), StatefulSets (para persistência e replicação ordenada), ConfigMaps, Secrets, e Probes de Liveness/Readiness/Startup.

---

## 5. Observabilidade
* **OpenTelemetry**:
  * *O que é*: Padrão aberto da CNCF para instrumentação de rastreamento distribuído, métricas e logs.
  * *Documentação*: [OpenTelemetry IO Documentation](https://opentelemetry.io/docs/)
  * *Tópicos Críticos*: Instrumentação automática em Java/Kotlin, Context Propagation (W3C Trace Context), Span, Trace, Collector.
* **Prometheus & Grafana**:
  * *O que é*: Banco de dados de séries temporais para métricas e motor de visualização de painéis.
  * *Documentação*: [Prometheus Docs](https://prometheus.io/docs/introduction/overview/) e [Grafana Docs](https://grafana.com/docs/)
