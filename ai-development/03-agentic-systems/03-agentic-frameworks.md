# Frameworks Agênticos

## Objetivo
Ao final deste tópico, o estudante será capaz de avaliar os pontos fortes e limitações dos principais frameworks de desenvolvimento de IA (LangChain, LlamaIndex, CrewAI), selecionar a ferramenta adequada para diferentes casos de uso e estruturar conceitualmente uma equipe de múltiplos agentes com CrewAI.

## Pré-requisitos
- [Function Calling e Ferramentas](02-function-calling-and-tools.md)
- [Fundamentos de RAG](../02-retrieval-augmented-generation/01-rag-fundamentals.md)

## Conceitos Fundamentais

À medida que os sistemas de IA escalam em complexidade, gerenciar manualmente o histórico de mensagens, carregar arquivos, segmentar textos, converter embeddings, monitorar sessões e gerenciar chamadas de ferramentas (*Function Calling*) usando apenas SDKs crus de APIs torna-se uma tarefa trabalhosa.

Para padronizar e acelerar esse desenvolvimento, surgiram os **Frameworks Agênticos**. Eles fornecem abstrações de alto nível que encapsulam a complexidade dos encadeamentos. Os três frameworks de maior destaque no mercado são:

### 1. LangChain
O ecossistema mais antigo e abrangente de desenvolvimento de aplicações orientadas a LLMs. Oferece uma vasta gama de integrações com bancos vetoriais, modelos e ferramentas. Introduziu a **LCEL (LangChain Expression Language)** para encadeamento declarativo de componentes.
- *Ponto Forte*: Versatilidade e ecossistema gigantesco de integrações.

### 2. LlamaIndex
Projetado especificamente para conectar fontes de dados privadas a LLMs. É o framework líder absoluto em pipelines de **RAG**. Facilita a ingestão, indexação, particionamento e consulta de dados complexos (estruturados e não estruturados).
- *Ponto Forte*: Excelência na busca, indexação e ingestão de dados para RAG.

### 3. CrewAI
Um framework focado em **sistemas multiagentes orientados a papéis (Role-Playing Multi-Agent Systems)**. Permite definir Agentes, Tarefas e Equipes (Crews) de forma extremamente declarativa e intuitiva. Os agentes podem colaborar entre si e passar tarefas sequencialmente ou de forma hierárquica.
- *Ponto Forte*: Orquestração simplificada de múltiplos agentes conversando entre si.

---

## Comparações

### Tabela Comparativa de Frameworks

| Critério | LangChain | LlamaIndex | CrewAI |
|---|---|---|---|
| **Foco Principal** | Encadeamento genérico e integrações universais. | Gerenciamento de dados e RAG avançado. | Colaboração multiagente orientada a papéis. |
| **Curva de Aprendizado** | Íngreme (devido ao tamanho do ecossistema e mudanças constantes). | Moderada (focado em dados). | Suave (muito intuitivo e declarativo). |
| **Abstração de RAG** | Suporta, mas exige mais código manual para configurar. | Alta (funções prontas de indexação de diretórios e bases). | Baixa (utiliza integrações externas para RAG). |
| **Casos de Uso Ideais** | Aplicações corporativas gerais que exigem flexibilidade máxima. | Chatbots sobre bases de dados, PDFs de relatórios e documentações. | Workflows de escrita de código, redação de newsletters ou análise competitiva. |

---

## Erros Comuns

1. **Abstração Desnecessária (Over-engineering)**: Utilizar um framework complexo como LangChain para uma aplicação que precisa apenas classificar o sentimento de uma frase. Isso adiciona dependências pesadas, aumenta a latência e dificulta a depuração do código. Se o SDK cru da API atende bem com 20 linhas de código, prefira-o.
2. **Dependência de APIs Instáveis**: Frameworks de IA estão em evolução frenética. Uma atualização de versão menor (ex. `0.1.0` para `0.1.1`) pode quebrar completamente classes e métodos usados na sua aplicação. É fundamental congelar versões de pacotes em produção (`requirements.txt` ou `package.json` com versões estritas).
3. **Falta de Controle sobre Custos de Loops**: Ao rodar agentes autônomos em frameworks (como o `AgentExecutor` do LangChain), eles podem tentar resolver um problema chamando infinitas ferramentas sem sucesso, estourando as quotas e gerando cobranças inesperadas. Sempre limite o parâmetro `max_iterations`.

---

## Exemplos

### Exemplo Prático de Estruturação com CrewAI (Python)
Abaixo está um exemplo conceitual de como estruturar uma equipe com dois agentes (um pesquisador e um escritor) para trabalharem juntos usando `CrewAI`:

```python
from crewai import Agent, Task, Crew, Process

# 1. Definição do Agente Pesquisador
pesquisador = Agent(
    role="Analista de Pesquisa Tecnológica",
    goal="Encontrar tendências emergentes na área de computação quântica em 2026.",
    backstory="Você é um pesquisador experiente e analítico que vasculha a internet em busca de inovações disruptivas.",
    verbose=True,
    allow_delegation=False
)

# 2. Definição do Agente Escritor
escritor = Agent(
    role="Redator de Tecnologia",
    goal="Escrever posts cativantes e informativos para o LinkedIn com base nas pesquisas enviadas.",
    backstory="Você é um redator especializado em traduzir conceitos tecnológicos difíceis em posts dinâmicos e de fácil leitura.",
    verbose=True,
    allow_delegation=False
)

# 3. Definição das Tarefas
tarefa_pesquisa = Task(
    description="Pesquise sobre os 3 maiores avanços práticos em computação quântica reportados em 2026.",
    expected_output="Um relatório em tópicos contendo os avanços, empresas responsáveis e impacto estimado.",
    agent=pesquisador
)

tarefa_escrita = Task(
    description="Crie um post para o LinkedIn com tom otimista baseado no relatório de pesquisa fornecido.",
    expected_output="Um post formatado para o LinkedIn contendo emojis e hashtags relevantes.",
    agent=escritor
)

# 4. Criação da Equipe e Início do Processo Sequencial
equipe = Crew(
    agents=[pesquisador, escritor],
    tasks=[tarefa_pesquisa, tarefa_escrita],
    process=Process.sequential, # A tarefa de escrita aguarda a conclusão da pesquisa
    verbose=True
)

# Executa o workflow
resultado = equipe.kickoff()
print("\n######################\n")
print(resultado)
```

---

## Exercícios

1. **[Tomada de Decisão]** Uma empresa quer construir um assistente virtual que responda perguntas de clientes baseando-se em 10.000 manuais em formato PDF. O sistema precisa rodar com alta precisão e baixo tempo de resposta. Qual framework você recomendaria usar e por quê?
2. **[Arquitetura Multiagente]** Desenhe a estrutura conceitual de uma "Crew" (Equipe) de agentes para automatizar a revisão de pull requests de código em uma empresa de software. Defina pelo menos 2 agentes, suas tarefas e dependências.
3. **[Prático / Reflexão]** Qual o papel do parâmetro `verbose=True` e `allow_delegation` ao configurar agentes no CrewAI? Em quais cenários você habilitaria a delegação de tarefas entre os agentes?

---

## Referências
- [LangChain Official Documentation](https://python.langchain.com/) — Documentação para desenvolvedores Python e JS.
- [LlamaIndex Documentation](https://www.llamaindex.ai/) — Portal oficial do framework de dados para RAG.
- [CrewAI Official Documentation](https://docs.crewai.com/) — Guia completo sobre agentes e fluxos multiagentes.
