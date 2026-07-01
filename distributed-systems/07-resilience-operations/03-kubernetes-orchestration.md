# 03. Orquestração e Deploy Resiliente no Kubernetes

## Objetivo
Ao final deste capítulo, você será capaz de conceituar o ciclo de vida de Pods no Kubernetes, configurar e diferenciar as três sondas de saúde (*Liveness*, *Readiness* e *Startup Probes*), dimensionar e limitar recursos físicos de CPU e Memória evitando *CPU Throttling* e erros de *OOM Killer*, e projetar estratégias de deploy resilientes (como *Rolling Updates* e *Canary*).

---

## Motivação
Nos capítulos anteriores, estudamos como proteger nossa aplicação com Circuit Breakers e monitorar logs com OpenTelemetry. Mas se o servidor virtual (VM) que roda o nosso serviço de Ledger travar fisicamente ou sofrer queda de energia, quem criará uma nova instância do Ledger em outra máquina saudável de forma automática? Como distribuímos o tráfego IP entre dezenas de instâncias rodando em paralelo?

Resolver isso manualmente exige scripts de infraestrutura complexos e propensos a falhas. Para automatizar o gerenciamento do ciclo de vida, escalabilidade, cicatrização e roteamento de rede de containers, a indústria adota o **Kubernetes (K8s)**.

---

## Pré-requisitos
* Conceito de conteinerização (Docker/Containers).
* [Módulo 7, Capítulo 01: Padrões de Resiliência Distribuída](./01-resilience-patterns.md).

---

## Conceitos Fundamentais

### 1. Ciclo de Vida do Pod no Kubernetes
Um **Pod** é a menor unidade computacional implantável no Kubernetes, agrupando um ou mais containers que compartilham armazenamento e rede física local.
O ciclo de vida do Pod passa pelos seguintes estados lógicos:
* **Pending (Pendente)**: O Pod foi aceito pelo Kubernetes, mas o Scheduler está buscando um nó físico com recursos de CPU/RAM disponíveis para executá-lo ou baixando a imagem Docker da rede.
* **Running (Em Execução)**: O Pod foi alocado a um nó e todos os containers foram criados. Pelo menos um container está rodando ou em processo de inicialização.
* **Succeeded (Concluído)**: Todos os containers do Pod finalizaram com sucesso (código de saída $0$) e não serão reiniciados (comum para tarefas Batch/Jobs).
* **Failed (Falhou)**: Pelo menos um container finalizou com código de erro (saída diferente de $0$).
* **Unknown (Desconhecido)**: O plano de controle perdeu contato com o nó físico (geralmente por partição física de rede).

---

### 2. Sondas de Saúde (Health Checks / Probes)
O Kubernetes monitora continuamente a saúde dos containers usando sondas periódicas enviadas pelo agente local (Kubelet):

#### 2.1. Startup Probe (Sonda de Inicialização)
* **Objetivo**: Detectar se o container terminou seu processo de boot inicial.
* **Comportamento**: Desativa as sondas de Liveness e Readiness até que a Startup Probe confirme sucesso. Isso impede que aplicações JVM (como Spring Boot), que demoram de 10 a 30 segundos para subir, sejam mortas prematuramente por Liveness probes apressadas.

#### 2.2. Liveness Probe (Sonda de Sobrevivência)
* **Objetivo**: Detectar se a aplicação travou física/logicamente em um estado irrecuperável (ex: *Deadlock* de threads).
* **Comportamento**: Se a sonda falhar repetidas vezes, o Kubelet mata o container e inicia um novo container limpo a partir da imagem original (*Self-Healing*).

#### 2.3. Readiness Probe (Sonda de Prontidão)
* **Objetivo**: Detectar se a aplicação está pronta para receber tráfego de clientes na rede.
* **Comportamento**: Se a sonda falhar (ex: banco de dados local desconectado temporariamente), o Kubernetes remove o IP do Pod das regras de roteamento do Load Balancer (Service). O Pod continua vivo, mas não recebe requisições de rede até a sonda normalizar, impedindo que usuários recebam erros HTTP 500.

---

### 3. Gerenciamento de Recursos (Requests e Limits)
Para planejar a alocação de pods no cluster físico, definimos limites lógicos de CPU e Memória RAM nos manifestos YAML do K8s:

#### 3.1. Requests (Reservas)
* A quantidade de CPU/RAM que o Scheduler **garante** reservar no nó físico para o Pod rodar. Se o nó tiver 8GB de RAM totais livres e o Pod pedir 2GB de Request, o Scheduler aloca o Pod lá e desconta 2GB da cota do nó.

#### 3.2. Limits (Tetos Físicos)
* A quantidade máxima de recursos que o Pod está autorizado a consumir fisicamente do nó.

#### 3.3. CPU Throttling vs. Memory OOM Killer
A punição física aplicada pelo kernel do Linux quando o Pod ultrapassa o teto limite difere radicalmente entre CPU e RAM:
* **CPU (Recurso Compressível)**: Se a aplicação exigir mais CPU do que o `limit`, o kernel do Linux restringe os tempos de ciclo de CPU do container (CPU Throttling). A aplicação não morre, mas fica extremamente lenta (latências disparam).
* **Memória (Recurso Não-Compressível)**: Se o container consumir mais RAM do que o `limit`, o sistema operacional do nó não tem onde alocar os bytes físicos. O kernel ativa o processo **OOM Killer** (*Out of Memory Killer*), que mata o container instantaneamente com o código de erro `Exit Code 137`.

---

### 4. Estratégias de Implantação Resilientes (Deployments)
* **Rolling Update (Atualização Progressiva)**: O K8s cria novos Pods com a versão nova incrementalmente e, apenas após as Readiness Probes darem sucesso, remove os Pods antigos, garantindo *Zero Downtime*.
* **Canary**: Uma fração pequena de tráfego de rede (ex: 5%) é roteada para a nova versão para validação sob carga real de usuários.

---

## Funcionamento Interno
O Kubelet monitora as restrições físicas dos containers interagindo diretamente com os mecanismos de controle do kernel do Linux chamados **cgroups** (*control groups*) e namespaces no nível de isolamento de processos do sistema operacional.

---

## Exemplos

### 1. Manifesto YAML de Deployment Resiliente no Kubernetes para JVM
O exemplo abaixo define um manifesto de implantação de alta resiliência contendo limites físicos configurados, Probes alinhadas e estratégia de Rolling Update.

```yaml
# ARQUIVO: deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ledger-service-deployment
  labels:
    app: ledger-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1       # Cria no máximo 1 pod extra durante o deploy
      maxUnavailable: 0 # Garante que nenhum pod fique indisponível no deploy
  selector:
    matchLabels:
      app: ledger-service
  template:
    metadata:
      labels:
        app: ledger-service
    spec:
      containers:
      - name: ledger-container
        image: distributed-systems/ledger-service:v2.0
        ports:
        - containerPort: 8080
        
        # Dimensionamento Físico de Recursos (Evita OOM e Throttling)
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"      # 250 milicores (1/4 de 1 núcleo físico)
          limits:
            memory: "1024Mi" # Teto de RAM (OOM Killer acima disso)
            cpu: "500m"      # Teto de CPU (Throttling acima disso)

        # Sondas de Saúde Alinhadas ao Ciclo da JVM
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          failureThreshold: 30 # Tenta 30 vezes
          periodSeconds: 2     # A cada 2s (Dá 60 segundos totais de boot)

        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 2
```

### 2. Implementação do Endpoint de Saúde e Prontidão em Kotlin
Abaixo, criamos o controlador que responde às probes do Kubernetes simulando a checagem física de conexão ao banco de dados e mensageria local.

```kotlin
// ARQUIVO: HealthCheckController.kt
package com.distribuidos.projeto.kubernetes

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HealthCheckController(
    private val dbConnection: FakeDbCheck,
    private val queueConnection: FakeQueueCheck
) {

    // Liveness Probe Endpoint: Valida apenas integridade interna (se a JVM não travou)
    @GetMapping("/actuator/health/liveness")
    fun checkLiveness(): ResponseEntity<String> {
        // Retorna sucesso instantâneo se a thread estiver ativa
        return ResponseEntity.ok("UP")
    }

    // Readiness Probe Endpoint: Valida dependências externas necessárias para receber tráfego
    @GetMapping("/actuator/health/readiness")
    fun checkReadiness(): ResponseEntity<String> {
        val isDbConnected = dbConnection.isHealthy()
        val isQueueConnected = queueConnection.isHealthy()

        return if (isDbConnected && isQueueConnected) {
            ResponseEntity.ok("READY")
        } else {
            // Retorna HTTP 503 Service Unavailable alertando o K8s para remover o tráfego do Pod
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("NOT_READY")
        }
    }
}

class FakeDbCheck { fun isHealthy(): Boolean = true }
class FakeQueueCheck { fun isHealthy(): Boolean = true }
```

---

## Casos de Uso
* **Netflix**: Migrou sua infraestrutura de VMs clássicas da AWS (EC2) para containers orquestrados no Kubernetes, reduzindo custos de provisionamento dinâmico de hardware de datacenters e otimizando o isolamento e failover automatizado de serviços.
* **Nubank**: Executa milhares de microsserviços em Kotlin em Kubernetes, gerenciando deploys com canary e auto-scaling sob picos de transaçõesPix.

---

## Quando Utilizar Kubernetes
* Ecossistemas complexos contendo múltiplos microserviços independentes que precisam rodar em clusters de dezenas de servidores virtuais.

---

## Quando Não Utilizar Kubernetes
* Aplicações web monolíticas simples ou startups de pequeno porte com poucos usuários. Operar e configurar a infraestrutura de controle do Kubernetes (Kubernetes Control Plane) adiciona custos e complexidade operacional excessiva desnecessária para equipes pequenas.

---

## Vantagens
* **Self-Healing Nativo**: K8s substitui instâncias travadas automaticamente.
* **Auto-Scaling**: Escala o número de réplicas de Pods baseado em métricas de uso de CPU/RAM de forma elástica.
* **Abstração de Nuvem**: Manifestos YAML são portáveis entre Google Cloud, AWS e Azure.

---

## Desvantagens
* **Curva de Aprendizado Extrema**: Complexidade conceitual de rede e roteamento interno de portas e namespaces.
* **Custo Operacional**: Requer profissionais especializados para manter e atualizar o cluster estável.

---

## Comparações

### Probes do Kubernetes

| Probe | Finalidade | Comportamento sob Falha |
|---|---|---|
| **Startup** | Aguarda carregamento lento de boot | Congela checagem das outras Probes |
| **Liveness** | Detecta deadlocks e travamento físico | Mata o Pod e inicia um novo container |
| **Readiness** | Detecta dependências caídas | Remove o tráfego de rede do Pod |

---

## Erros Comuns
1. **Verificar Dependências na Liveness Probe**: Mapear a checagem de banco de dados na Liveness Probe. Se o banco de dados cair por 10 minutos por manutenção, todos os Pods do seu microserviço começarão a falhar a Liveness Probe simultaneamente. O Kubernetes entrará em um loop de reinicialização frenético de todos os Pods do cluster de forma inútil, elevando o tempo de indisponibilidade quando o banco voltar. Dependências externas devem ser validadas **apenas na Readiness Probe**.
2. **Ignorar startup Probes na JVM**: Definir Liveness Probes com timeouts curtos sem Startup Probes em microsserviços Java pesados. O container será morto ciclicamente antes de conseguir concluir o processo de boot da JVM.

---

## Projeto Prático
No projeto **FinTech Ledger**, projetamos a configuração de infraestrutura resiliente de deploy.
Escrevemos o arquivo YAML do Ledger definindo a alocação de 3 réplicas redundantes de Pods, configuramos os limites físicos de memória RAM para evitar que estouros de Heap da JVM acionem o OOM Killer do nó físico e alinhamos as Startup e Readiness Probes.

---

## Exercícios

### Básico
1. Qual o papel do *Scheduler* do Kubernetes na alocação física de Pods nos nós do cluster?
2. Por que o processo *OOM Killer* mata um container instantaneamente quando este ultrapassa o limite máximo de memória especificado?

### Intermediário
3. Considere que a JVM do seu container Spring Boot está configurada com `-Xmx2g` (tamanho máximo de Heap de 2GB de RAM), mas o manifesto YAML do Kubernetes define o limite físico do container como `limits.memory: "1Gi"`. Descreva detalhadamente a falha física catastrófica que ocorrerá no servidor sob carga intensa e sugira a correção de alinhamento de limites.

### Avançado
4. Crie um manifesto YAML completo contendo a definição de um **Horizontal Pod Autoscaler (HPA)** que escalone elasticamente o número de réplicas do `ledger-service` de 3 a 10 réplicas quando o uso médio de CPU das réplicas ultrapassar $75\%$. Explique o algoritmo matemático e a taxa de resiliência que o HPA adiciona ao sistema distribuído.

---

## Perguntas de Entrevista
1. **Por que a configuração incorreta de `requests` e `limits` de recursos em clusters compartilhados do Kubernetes pode gerar o fenômeno de "Noisy Neighbor" (Vizinho Barulhento) e como a configuração do QoS (Quality of Service) do Pod (Guaranteed, Burstable, BestEffort) previne esse problema?**
   * *Resposta esperada*: Se definirmos limits altos e requests baixos para todos os Pods, múltiplos pods compartilharão o mesmo nó físico subutilizado. No entanto, se todos os Pods tiverem picos simultâneos de processamento, eles competirão por CPU e RAM físicos do nó. Aquele que for mais agressivo consumirá os recursos das outras máquinas vizinhas (Noisy Neighbor), degradando a performance geral. O K8s previne isso classificando os Pods em classes de **QoS (Quality of Service)**:
     * **Guaranteed (Garantido)**: Ocorre quando `limits` e `requests` são definidos com valores idênticos de CPU e RAM. Esse Pod tem recursos fisicamente dedicados e nunca é expulso do nó em caso de sobrecarga.
     * **Burstable (Flutuante)**: Ocorre quando os limits são maiores que os requests. O Pod pode crescer, mas corre risco de sofrer CPU Throttling ou despejo se o nó faltar memória.
     * **BestEffort**: Ocorre quando nenhum limit ou request é definido. Esses Pods são os primeiros a serem mortos sob qualquer sinal de sobrecarga do nó físico para proteger a infraestrutura.

2. **Como a política de deploy `RollingUpdate` do Kubernetes utiliza a Readiness Probe para garantir "Zero Downtime" de rede e evitar que requisições de clientes caiam em "buracos negros" de portas de sockets fechadas durante a transição de versões da aplicação?**
   * *Resposta esperada*: O `RollingUpdate` substitui os Pods incrementando novas versões de forma gradual. O K8s cria o Pod da versão nova, mas **não direciona tráfego para ele imediatamente**. Ele aguarda que a Startup e a Readiness Probes retornem sucesso contínuo. Apenas após a Readiness confirmar que a aplicação concluiu seu boot e conectou nos recursos necessários, o Kubernetes adiciona o IP do novo Pod na rota de tráfego do endpoint do Service. Em seguida, ele inicia a remoção do Pod antigo, enviando o sinal de encerramento de sistema `SIGTERM` e aguardando um período de encerramento gracioso (*Termination Grace Period*) para que o Pod antigo termine de processar as conexões de sockets ativas antes de matá-lo fisicamente com o sinal `SIGKILL`, garantindo transição sem perdas de chamadas ativas de usuários.

---

## Resumo
* Kubernetes orquestra o ciclo de vida e resiliência física de pods distribuídos em clusters compartilhados.
* Probes configuradas adequadamente monitoram a inicialização da aplicação (Startup), travamentos irrecuperáveis (Liveness) e prontidão de serviços externos (Readiness).
* O dimensionamento físico via Requests/Limits evita indisponibilidade por OOM Killer e latências severas causadas por CPU Throttling no nível do kernel Linux.

---

## Próximo Capítulo
No [Capítulo 04: Testes de Robustez com Chaos Engineering](./04-chaos-engineering.md), encerraremos a parte teórica do Módulo 7 e de todo o curso. Estudaremos a disciplina de Engenharia de Caos, analisando como injetar falhas parciais controladas em ambientes de teste para validar a auto-recuperação do sistema distribuído.

---

## Referências
* **Kubernetes in Action**, Marko Lukša. Editora Manning Publications.
* **Kubernetes Documentation**: [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).
* **Production-Ready Microservices**, Susan J. Fowler. Editora O'Reilly Media.
