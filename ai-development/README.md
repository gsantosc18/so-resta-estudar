# Desenvolvimento com Inteligência Artificial (AI Development)

## Visão Geral

Este módulo aborda as práticas, padrões arquiteturais e ferramentas necessárias para o desenvolvimento de software integrado com **Inteligência Artificial Generativa**. O conteúdo é estruturado para capacitar desenvolvedores a projetar e construir aplicações robustas que utilizam Modelos de Linguagem de Grande Porte (LLMs), sistemas de agentes autônomos, recuperação avançada de contexto e pipelines modernos de LLMOps.

A trilha está organizada em 4 fases sequenciais que guiam o estudante desde a interação direta com modelos até o monitoramento avançado em ambiente de produção.

---

## Por que Estudar Desenvolvimento com IA?

A IA generativa redefiniu a forma como criamos e interagimos com software. Apenas chamar uma API básica de chat não é mais suficiente para construir sistemas inteligentes de nível empresarial. Os engenheiros modernos enfrentam novos desafios:

- **Imprevisibilidade e Não-determinismo**: LLMs geram respostas variáveis e podem sofrer com alucinações.
- **Gerenciamento de Contexto**: Janelas de contexto são limitadas e caras; é crucial recuperar apenas a informação necessária.
- **Raciocínio Autônomo**: Projetar sistemas que decidem quais ferramentas chamar de forma autônoma exige arquiteturas baseadas em loops de decisão.
- **Avaliação e Monitoramento**: Testes de software tradicionais (asserções binárias) não funcionam bem com respostas em linguagem natural.

Dominar estes desafios é o que diferencia o uso casual da IA da criação de **sistemas de inteligência de produção**.

---

## Estrutura do Módulo

### [Fase 1 — Introdução aos LLMs](01-introduction-to-llms/)
Entendimento de como os modelos de fundação funcionam "por baixo do capô" e como extrair o máximo de performance de forma conceitual.

- [O que são LLMs?](01-introduction-to-llms/01-what-are-llms.md)
- [Engenharia de Prompts](01-introduction-to-llms/02-prompt-engineering.md)

### [Fase 2 — Recuperação Aumentada de Geração (RAG)](02-retrieval-augmented-generation/)
Como fornecer dados dinâmicos, privados e atualizados para LLMs sem a necessidade de re-treinamento ou fine-tuning custosos.

- [Fundamentos de RAG](02-retrieval-augmented-generation/01-rag-fundamentals.md)
- [Embeddings e Bancos Vetoriais](02-retrieval-augmented-generation/02-embeddings-and-vector-databases.md)
- [Técnicas de RAG Avançado](02-retrieval-augmented-generation/03-advanced-rag-techniques.md)

### [Fase 3 — Sistemas Agênticos](03-agentic-systems/)
De pipelines estáticos a agentes dinâmicos com ciclos de reflexão, memória e tomada de decisões com ferramentas externas.

- [Padrões e Fluxos Agênticos](03-agentic-systems/01-agentic-workflows-and-patterns.md)
- [Function Calling e Ferramentas](03-agentic-systems/02-function-calling-and-tools.md)
- [Frameworks Agênticos](03-agentic-systems/03-agentic-frameworks.md)

### [Fase 4 — LLMOps e Avaliação](04-llmops-and-evaluation/)
Técnicas e ferramentas para testar, validar, monitorar e otimizar aplicações baseadas em IA em produção.

- [Avaliação e Testes de LLMs](04-llmops-and-evaluation/01-evaluation-and-testing.md)
- [Observabilidade e Monitoramento](04-llmops-and-evaluation/02-observability-and-monitoring.md)

---

## Como Usar Este Material

1. **Siga a ordem lógica** — A trilha foi projetada para que cada fase introduza termos essenciais para a seguinte.
2. **Execute os Exercícios** — Ao final de cada tópico, há exercícios propostos. Tente resolvê-los antes de avançar.
3. **Consulte o [roadmap.md](roadmap.md)** — Veja o mapa de progresso, tempos estimados e fluxo de aprendizado.
4. **Use o [progress.md](progress.md)** — Rastreie seus marcos de estudo.
5. **Use o [glossary.md](glossary.md)** — Caso encontre termos novos e complexos (ex. *Temperature*, *Embeddings*, *Vector Database*), consulte o glossário integrado.

---

## Referências Gerais

| Recurso | Tipo | Nível |
|---------|------|-------|
| [Prompt Engineering Guide](https://www.promptingguide.ai/) | Site / Guia | Iniciante a Avançado |
| [DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/) | Cursos | Todos |
| [LangChain Documentation](https://python.langchain.com/v0.2/docs/introduction/) | Documentação | Intermediário |
| [LlamaIndex Documentation](https://docs.llamaindex.ai/en/stable/) | Documentação | Intermediário |
| *Build a Large Language Model (From Scratch)* — Sebastian Raschka | Livro | Avançado |
| [Hugging Face Course](https://huggingface.co/learn) | Curso / Guia | Intermediário-Avançado |
