# Roadmap de Estudos — Desenvolvimento com IA

## Visão Geral

Este roadmap organiza o estudo de **Desenvolvimento com Inteligência Artificial** em 4 fases progressivas. Cada módulo constrói sobre as competências e conceitos anteriores, culminando no domínio de monitoramento e produção.

---

## Mapa de Dependências

```
Fase 1: Introdução aos LLMs
    │
    ├──► Fase 2: RAG (Retrieval-Augmented Generation)
    │       │
    │       └──► Fase 3: Sistemas Agênticos (parcial)
    │
    ├──► Fase 3: Sistemas Agênticos
    │       │
    │       └──► Fase 4: LLMOps e Avaliação (requer Fase 2 e 3)
    │
    └──► Fase 4: LLMOps e Avaliação
```

---

## Fases

### Fase 1 — Introdução aos LLMs (`01-introduction-to-llms/`)

**Objetivo**: Entender o comportamento fundamental, arquitetura básica dos modelos de linguagem e técnicas de instrução de prompts.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 1.1 | O que são LLMs? | [01-what-are-llms.md](01-introduction-to-llms/01-what-are-llms.md) | Nenhum |
| 1.2 | Engenharia de Prompts | [02-prompt-engineering.md](01-introduction-to-llms/02-prompt-engineering.md) | 1.1 |
| 1.3 | Spec-Driven Development e SPDD | [03-spec-driven-development-and-spdd.md](01-introduction-to-llms/03-spec-driven-development-and-spdd.md) | 1.2 |

**Tempo estimado**: 1-2 semanas

---

### Fase 2 — Recuperação Aumentada de Geração (RAG) (`02-retrieval-augmented-generation/`)

**Objetivo**: Habilitar modelos a consumir bases de dados proprietárias de forma estruturada.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 2.1 | Fundamentos de RAG | [01-rag-fundamentals.md](02-retrieval-augmented-generation/01-rag-fundamentals.md) | 1.2 |
| 2.2 | Embeddings e Bancos Vetoriais | [02-embeddings-and-vector-databases.md](02-retrieval-augmented-generation/02-embeddings-and-vector-databases.md) | 2.1 |
| 2.3 | Técnicas de RAG Avançado | [03-advanced-rag-techniques.md](02-retrieval-augmented-generation/03-advanced-rag-techniques.md) | 2.2 |
| 2.4 | Avaliação e Segurança em RAG | [04-rag-evaluation-and-security.md](02-retrieval-augmented-generation/04-rag-evaluation-and-security.md) | 2.3 |

**Tempo estimado**: 2-3 semanas

---

### Fase 3 — Sistemas Agênticos (`03-agentic-systems/`)

**Objetivo**: Construir sistemas de IA dinâmicos capazes de planejar ações, executar ferramentas e iterar sobre decisões.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 3.1 | Padrões e Fluxos Agênticos | [01-agentic-workflows-and-patterns.md](03-agentic-systems/01-agentic-workflows-and-patterns.md) | 1.2 |
| 3.2 | Function Calling e Ferramentas | [02-function-calling-and-tools.md](03-agentic-systems/02-function-calling-and-tools.md) | 3.1 |
| 3.3 | Frameworks Agênticos | [03-agentic-frameworks.md](03-agentic-systems/03-agentic-frameworks.md) | 3.2, 2.1 |

**Tempo estimado**: 3-4 semanas

---

### Fase 4 — LLMOps e Avaliação (`04-llmops-and-evaluation/`)

**Objetivo**: Avaliar a qualidade dos sistemas de IA generativa e monitorar seu comportamento e custos em produção.

| Ordem | Tópico | Arquivo | Pré-requisitos |
|-------|--------|---------|---------------|
| 4.1 | Avaliação e Testes de LLMs | [01-evaluation-and-testing.md](04-llmops-and-evaluation/01-evaluation-and-testing.md) | 2.3, 3.3 |
| 4.2 | Observabilidade e Monitoramento | [02-observability-and-monitoring.md](04-llmops-and-evaluation/02-observability-and-monitoring.md) | 4.1 |

**Tempo estimado**: 2 semanas

---

## Tempo Total Estimado

| Fase | Semanas |
|------|---------|
| 1 — Introdução aos LLMs | 1-2 |
| 2 — RAG (Recuperação Aumentada) | 2-3 |
| 3 — Sistemas Agênticos | 3-4 |
| 4 — LLMOps e Avaliação | 2 |
| **Total** | **8-11 semanas** |

---

## Recursos Complementares

### Livros Recomendados
- *Build a Large Language Model (From Scratch)* — Sebastian Raschka
- *Designing Machine Learning Systems* — Chip Huyen (excelente base para LLMOps)
- *Natural Language Processing with Transformers* — Lewis Tunstall et al.

### Cursos Recomendados
- [LangChain for LLM Application Development](https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/) (DeepLearning.AI)
- [Building and Evaluating Advanced RAG Applications](https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/) (DeepLearning.AI)
- [AI Agentic Design Patterns with AutoGen](https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/) (DeepLearning.AI)
