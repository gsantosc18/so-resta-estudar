# Concorrência e Paralelismo

## Visão Geral

Este módulo aborda os conceitos, modelos e padrões de **Programação Concorrente, Paralela e Assíncrona**. Ele é projetado para desenvolvedores que desejam entender como os sistemas operacionais, runtimes e linguagens modernas gerenciam múltiplas tarefas simultaneamente para otimizar o uso do processador (CPU-bound) e a eficiência de entrada/saída (I/O-bound).

O material é organizado de forma progressiva em 4 módulos que cobrem desde os conceitos físicos de hardware e sistemas operacionais até modelos de concorrência ultra-leve e assincronia moderna.

---

## Por que Estudar Concorrência e Paralelismo?

O hardware moderno evoluiu para múltiplos núcleos físicos (Multi-core), o que significa que o desenvolvimento de software altamente performático exige o domínio de execução paralela. Além disso, a arquitetura de sistemas Web modernos lida com milhões de requisições de I/O por segundo, tornando essencial a otimização do uso de threads para evitar desperdício de memória e CPU.

Entender esses conceitos permite:
- **Evitar Race Conditions e Deadlocks**: Escrever código thread-safe de verdade.
- **Escolher a ferramenta certa para o problema**: Saber quando usar multithreading tradicional, programação assíncrona ou concorrência leve (Virtual Threads/Coroutines).
- **Entender o runtime das linguagens**: Compreender como o Node.js lida com milhares de conexões em uma única thread, como o Go escala goroutines ou como o Java 21 otimizou I/O com Virtual Threads.
- **Otimizar recursos de hardware**: Maximizar o throughput da aplicação e reduzir custos de infraestrutura.

---

## Estrutura do Módulo

### [Módulo 1 — Fundamentos](01-foundations/)
Os princípios de execução e a separação física/lógica no nível do processador e sistema operacional.

- [Concorrência vs Paralelismo](01-foundations/01-concurrency-vs-parallelism.md)
- [Processos vs Threads](01-foundations/02-processes-vs-threads.md)

### [Módulo 2 — Concorrência baseada em Threads (Multithreading)](02-multithreading/)
Como criar e gerenciar fluxos de execução paralelos usando threads do SO e os riscos de gerenciar estado compartilhado mutável.

- [Conceitos de Multithreading](02-multithreading/01-multithreading-concepts.md)
- [Sincronização e Locks](02-multithreading/02-synchronization-and-locks.md)

### [Módulo 3 — Programação Assíncrona](03-asynchronous-programming/)
O paradigma não-bloqueante orientado a eventos que evita a dependência de múltiplas threads de sistema para escalar I/O.

- [Event Loop e Callbacks](03-asynchronous-programming/01-event-loop-and-callbacks.md)
- [Promises e Async/Await](03-asynchronous-programming/02-promises-and-async-await.md)

### [Módulo 4 — Concorrência Leve (Virtual Threads e Coroutines)](04-lightweight-concurrency/)
A evolução da concorrência: threads leves gerenciadas no espaço do usuário (runtimes e VMs) para alta concorrência de I/O.

- [Modelos de Mapeamento de Threads](04-lightweight-concurrency/01-thread-mapping-models.md)
- [Virtual Threads](04-lightweight-concurrency/02-virtual-threads.md)
- [Coroutines e Goroutines](04-lightweight-concurrency/03-coroutines-and-goroutines.md)

---

## Como Usar Este Material

1. **Siga a ordem dos módulos** — a teoria de um módulo fundamenta as soluções apresentadas no módulo seguinte.
2. **Escreva e teste os exercícios** — concorrência é contra-intuitiva, a prática e a depuração são as melhores formas de fixar o aprendizado.
3. **Use o [glossário](glossary.md)** — para tirar dúvidas rápidas sobre terminologias (Ex: Mutex vs Semáforo).
4. **Consulte o [roadmap](roadmap.md)** — para entender as dependências de aprendizado.
5. **Atualize seu progresso no [progress.md](progress.md)** — para rastrear seu avanço de estudos.

---

## Referências Gerais

| Recurso | Tipo | Nível |
|---------|------|-------|
| *Java Concurrency in Practice* — Brian Goetz | Livro | Avançado |
| *Operating Systems: Three Easy Pieces* — Remzi Arpaci-Dusseau | Livro / PDF | Intermediário |
| *Go Concurrency Patterns* — Rob Pike | Vídeo / Palestra | Intermediário-Avançado |
| [MDN Web Docs - Concurrency model and the event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) | Artigos | Iniciante-Intermediário |
| [JDK 21 Release Notes - JEP 444: Virtual Threads](https://openjdk.org/jeps/444) | Documentação | Avançado |
