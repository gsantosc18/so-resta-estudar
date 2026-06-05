# Roadmap de Estudos — Concorrência e Paralelismo

## Visão Geral

Este roadmap organiza o estudo de **Programação Concorrente, Paralela e Assíncrona** em 4 módulos progressivos. A sequência foi planejada de modo que cada conceito sirva de base para o seguinte, culminando nas técnicas de concorrência leve usadas nos servidores modernos.

---

## Mapa de Dependências

```
Módulo 1: Fundamentos
    │
    ├──► Módulo 2: Multithreading (Concorrência baseada em Threads do SO)
    │
    ├──► Módulo 3: Programação Assíncrona (I/O Não-bloqueante e Event Loop)
    │
    └──► Módulo 4: Concorrência Leve (Virtual Threads, Coroutines, Goroutines)
            ▲
            └─── Requer Módulo 2 (Conceito de Thread OS) e Módulo 3 (Conceito de Suspensão/Eventos)
```

---

## Módulos

### Módulo 1 — Fundamentos (`01-foundations/`)

**Objetivo**: Compreender a separação conceitual entre concorrência e paralelismo e a fundação lógica do SO (processos e threads).

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 1.1 | Concorrência vs Paralelismo | [01-concurrency-vs-parallelism.md](01-foundations/01-concurrency-vs-parallelism.md) | Nenhum |
| 1.2 | Processos vs Threads | [02-processes-vs-threads.md](01-foundations/02-processes-vs-threads.md) | 1.1 |

**Tempo estimado**: 1 semana

---

### Módulo 2 — Concorrência baseada em Threads (`02-multithreading/`)

**Objetivo**: Dominar o modelo de execução multithreaded clássico do SO e aprender a gerenciar o estado compartilhado sem introduzir bugs de concorrência.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 2.1 | Conceitos de Multithreading | [01-multithreading-concepts.md](02-multithreading/01-multithreading-concepts.md) | 1.2 |
| 2.2 | Sincronização e Locks | [02-synchronization-and-locks.md](02-multithreading/02-synchronization-and-locks.md) | 2.1 |

**Tempo estimado**: 1-2 semanas

---

### Módulo 3 — Programação Assíncrona (`03-asynchronous-programming/`)

**Objetivo**: Compreender como sistemas escalam tarefas de I/O através de loops de eventos e execução não-bloqueante sem a sobrecarga de múltiplas threads de sistema.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 3.1 | Event Loop e Callbacks | [01-event-loop-and-callbacks.md](03-asynchronous-programming/01-event-loop-and-callbacks.md) | 1.1 |
| 3.2 | Promises e Async/Await | [02-promises-and-async-await.md](03-asynchronous-programming/02-promises-and-async-await.md) | 3.1 |

**Tempo estimado**: 1 semana

---

### Módulo 4 — Concorrência Leve (`04-lightweight-concurrency/`)

**Objetivo**: Dominar o estado da arte da concorrência moderna, onde milhares ou milhões de tarefas concorrentes rodam sob demanda de recursos mínimos usando threads virtuais e corotinas.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 4.1 | Modelos de Mapeamento de Threads | [01-thread-mapping-models.md](04-lightweight-concurrency/01-thread-mapping-models.md) | 2.1 |
| 4.2 | Virtual Threads | [02-virtual-threads.md](04-lightweight-concurrency/02-virtual-threads.md) | 4.1, 3.2 |
| 4.3 | Coroutines e Goroutines | [03-coroutines-and-goroutines.md](04-lightweight-concurrency/03-coroutines-and-goroutines.md) | 4.1, 3.2 |

**Tempo estimado**: 2 semanas

---

## Tempo Total Estimado

| Módulo | Semanas |
|--------|---------|
| 1 — Fundamentos | 1 |
| 2 — Multithreading | 1-2 |
| 3 — Programação Assíncrona | 1 |
| 4 — Concorrência Leve | 2 |
| **Total** | **5-6 semanas** |
