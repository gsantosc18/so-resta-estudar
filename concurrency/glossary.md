# Glossário — Concorrência e Paralelismo

Este glossário define de forma concisa os principais termos utilizados na teoria e prática de programação concorrente, paralela e assíncrona.

---

### A
* **Asynchronous (Assíncrono)**: Modelo de execução onde uma operação não bloqueia o fluxo principal. A tarefa é despachada e o programa continua sua execução; o resultado é tratado em um momento futuro.

### C
* **Callback**: Uma função passada como argumento para outra função, destinada a ser executada ("chamada de volta") após a conclusão de uma tarefa assíncrona.
* **Concurrency (Concorrência)**: A habilidade de estruturar um programa de forma que múltiplos fluxos de execução façam progresso de forma intercalada (sobreposição lógica de tarefas). É sobre *lidar* com muitas coisas ao mesmo tempo.
* **Context Switch (Troca de Contexto)**: Operação do sistema operacional (ou runtime) de salvar o estado de uma thread/processo ativo (registradores, program counter, etc.) para carregar e executar outra thread/processo. É uma operação custosa em nível de Kernel do SO.
* **Coroutine (Corotina)**: Unidade de execução cooperativa e leve gerenciada no espaço do usuário (user-space), que permite pausar (suspender) e retomar a execução sem bloquear a thread do SO subjacente.

### D
* **Deadlock**: Situação de travamento mútuo onde duas ou mais execuções concorrentes ficam bloqueadas indefinidamente, cada uma esperando pela liberação de um recurso retido pela outra.

### E
* **Event Loop (Loop de Eventos)**: Mecanismo de execução de thread única que monitora continuamente uma fila de tarefas (task queue) e executa callbacks/eventos pendentes assim que a pilha de chamadas (call stack) principal estiver vazia.

### G
* **Goroutine**: Unidade de execução multiplexada e ultra-leve usada na linguagem Go, gerenciada em tempo de execução (runtime do Go) que mapeia M goroutines para N threads de sistema operacional.

### L
* **Lock (Bloqueio)**: Primitiva de sincronização que restringe o acesso concorrente a uma seção de código ou recurso compartilhado, garantindo exclusão mútua.

### M
* **Multithreading**: Técnica que permite a um processo executar múltiplas threads simultaneamente, dividindo o espaço de memória do processo original.
* **Mutex (Mutual Exclusion)**: Um lock binário que garante que apenas um fluxo de execução (thread) acesse um recurso crítico de cada vez.

### P
* **Parallelism (Paralelismo)**: Execução simultânea física de múltiplas tarefas em diferentes processadores ou núcleos de CPU (multi-core). É sobre *fazer* muitas coisas ao mesmo tempo.
* **Process (Processo)**: Uma instância isolada de um programa de computador em execução no SO, com seu próprio espaço de endereçamento de memória e recursos.

### R
* **Race Condition (Condição de Corrida)**: Anomalia que ocorre quando múltiplos fluxos concorrentes leem e escrevem em um estado compartilhado mutável ao mesmo tempo, e o resultado final depende da ordem de execução (agendamento) desses fluxos.

### S
* **Semaphore (Semáforo)**: Primitiva de sincronização baseada em um contador que gerencia o acesso a um pool de recursos, permitindo que até *N* fluxos de execução acessem a seção crítica concorrentemente.
* **Starvation (Inanição)**: Situação na qual um fluxo de execução válido é permanentemente privado de recursos necessários (como tempo de CPU ou locks) devido ao agendamento ou priorização de outros fluxos.

### T
* **Thread**: A menor unidade de execução que o sistema operacional consegue agendar. Uma thread executa instruções sequencialmente dentro do contexto de um processo, compartilhando memória com outras threads do mesmo processo.

### V
* **Virtual Thread (Thread Virtual)**: Implementação de thread leve introduzida no ecossistema Java (Project Loom / Java 21) que permite a criação de milhões de instâncias com baixo consumo de memória, gerenciadas pela JVM e montadas dinamicamente sobre threads do sistema operacional.
