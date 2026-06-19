# Glossário — Desenvolvimento com IA

Este glossário reúne termos técnicos e jargões essenciais sobre engenharia de prompts, arquitetura de LLMs, bancos vetoriais, sistemas de agentes, LLMOps, técnicas de RAG avançado, metodologias estruturadas de engenharia de software com IA e segurança, organizados em ordem alfabética.

---

### A

#### Agentic Workflow (Fluxo Agêntico)
Abordagem de design de software em que um LLM executa loops interativos de planejamento, ação, observação e reflexão, em vez de seguir um fluxo linear de execução pré-definido.

#### Alucinação (Hallucination)
Fenômeno no qual um modelo de linguagem gera informações factualmente incorretas, falsas ou sem base na realidade, expressas de forma confiável e fluida.

#### Atenção (Attention Mechanism)
Mecanismo central da arquitetura Transformer que permite ao modelo focar em partes específicas de uma sequência de entrada (contexto) ao prever o próximo token.

#### Auto-atenção (Self-Attention)
Variante da atenção que relaciona diferentes posições de uma única sequência para calcular uma representação integrada da mesma sequência (ex. ligar pronomes a substantivos na mesma frase).

---

### B

#### Bi-Encoder
Modelo de processamento de linguagem (como Sentence-Transformers) que calcula embeddings para a pergunta e para o documento de forma isolada. Permite pré-computar os vetores de documentos offline e realizar buscas semânticas em tempo de execução de forma extremamente rápida.

---

### C

#### Chain of Thought (Cadeia de Pensamento / CoT)
Técnica de prompt que instrui o LLM a detalhar seu raciocínio passo a passo antes de apresentar a resposta final, melhorando a precisão em tarefas complexas.

#### Chunking (Segmentação)
Processo de dividir um documento de texto grande em pedaços menores (chunks) legíveis e semanticamente coesos para fins de busca semântica em sistemas de RAG.

#### Context Engineering (Engenharia de Contexto)
O processo de gerenciar, priorizar, formatar e filtrar estrategicamente as informações enviadas na janela de contexto de um LLM, incluindo o uso de hiperparâmetros de inferência e arquivos globais de regras do workspace (ex: `.cursorrules`, `AGENTS.md`) para guiar o comportamento do modelo.

#### Context Window (Janela de Contexto)
O número máximo de tokens (de entrada mais saída) que um modelo de linguagem pode ler e processar de uma única vez em uma chamada à API.

#### Cross-Encoder
Modelo de processamento que recebe a pergunta e o documento de forma concatenada dentro da mesma camada de atenção de rede neural. É consideravelmente mais preciso para medir similaridade de contexto do que o Bi-Encoder, porém computacionalmente pesado, sendo utilizado de forma restrita como reordenador (*Reranker*) sobre os melhores resultados da busca vetorial inicial.

---

### E

#### Embeddings (Vetores de Incorporação)
Representações matemáticas de palavras, frases ou documentos em um espaço vetorial multidimensional de alta dimensionalidade. Capturam o significado semântico do texto: vetores próximos representam conceitos semanticamente semelhantes.

#### Evaluation (Avaliação)
O processo quantitativo e qualitativo de medir a precisão, confiabilidade, aderência ao tom e segurança das saídas de um sistema baseado em LLMs.

---

### F

#### Few-shot Prompting
Técnica em que o usuário fornece alguns exemplos de entrada e saída no próprio prompt para instruir o modelo sobre a tarefa e o formato de saída desejados.

#### Fine-Tuning (Ajuste Fino)
Processo de treinar adicionalmente um modelo de fundação já pré-treinado em um conjunto de dados menor e específico, modificando seus pesos internos para adaptá-lo a uma tarefa específica.

#### Function Calling (Chamada de Função)
Capacidade do LLM de detectar quando uma função externa precisa ser executada com base em uma pergunta do usuário e retornar um objeto JSON contendo os argumentos necessários para chamar tal função.

---

### G

#### G-Eval
Framework de avaliação que utiliza um LLM de última geração (como GPT-4) atuando como juiz humano baseado em critérios detalhados com notas de pontuação.

---

### H

#### HNSW (Hierarchical Navigable Small World)
Algoritmo de indexação para bancos de dados vetoriais que constrói grafos de aproximação multi-camada. Permite realizar buscas aproximadas de vizinhos mais próximos (ANN) com latência logarítmica $O(\log N)$ para grandes massas de dados.

#### Hybrid Search (Busca Híbrida)
Abordagem de recuperação que combina busca por similaridade densa (vetorial/embeddings) com busca baseada em palavras-chave clássica (esparsa/BM25) para maximizar a precisão da recuperação.

#### HyDE (Hypothetical Document Embeddings)
Técnica de pré-recuperação que utiliza um LLM para gerar uma resposta hipotética a partir da pergunta do usuário. O embedding dessa resposta hipotética (e não da pergunta original) é usado na busca vetorial para contornar a incompatibilidade de vocabulário.

---

### I

#### Indirect Prompt Injection (Injeção Indireta de Prompt)
Vulnerabilidade de segurança em que um invasor insere instruções de prompt maliciosas disfarçadas dentro de documentos de suporte. Ao serem recuperados no pipeline de RAG, essas instruções são lidas e executadas indevidamente pelo LLM de geração final.

#### IVF (Inverted File Index)
Algoritmo de indexação vetorial que divide o espaço de busca em partições circulares de centroides baseadas em agrupamento (K-Means), limitando a varredura fina de busca apenas às partições de vizinhos mais próximos. Pansa menos RAM que o índice HNSW.

---

### L

#### LangGraph
Framework open-source de orquestração de IA baseado na modelagem de agentes como máquinas de estado persistentes e grafos direcionados cíclicos. Permite loops complexos, decisões condicionais e controle fino sobre o fluxo de execução comparado a cadeias lineares.

#### LLM (Large Language Model)
Modelo de aprendizado profundo treinado em grandes volumes de texto para prever o próximo token e realizar tarefas de processamento de linguagem natural.

#### LLMOps (Operações com LLMs)
Conjunto de práticas, ferramentas e workflows para gerenciar o ciclo de vida operacional de modelos de linguagem e aplicações associadas em produção (desenvolvimento, testes, deploy, monitoramento).

---

### O

#### OpenAI Structured Outputs (Saídas Estruturadas)
Mecanismo de decodificação restrita (*Constrained Decoding*) em nível de inferência de API da OpenAI que força o modelo a gerar respostas em absoluta conformidade com um JSON Schema fornecido (via Pydantic), eliminando falhas de parsing de dados.

---

### P

#### Parent-Document Retrieval
Técnica de recuperação hierárquica que divide documentos em chunks filhos pequenos para maior precisão de busca semântica, mas retorna o documento "pai" correspondente maior (parágrafo ou capítulo) como contexto final de leitura para o LLM.

#### Prompt Engineering (Engenharia de Prompts)
A prática de estruturar, projetar e refinar instruções textuais inseridas em LLMs para obter saídas de maior qualidade e formato específicos.

---

### R

#### RAG (Retrieval-Augmented Generation / Geração Aumentada por Recuperação)
Arquitetura que aprimora as respostas de um LLM recuperando fatos de uma base de conhecimento externa de suporte (como um banco de dados vetorial) e inserindo-os no prompt do modelo como contexto.

#### RAG Triad (Tríade de RAG)
Framework conceitual de qualidade composto por três métricas interdependentes: Relevância do Contexto, Fidelidade (Faithfulness/Groundedness) e Relevância da Resposta.

#### ReAct (Reasoning and Acting)
Padrão de prompt que combina raciocínio (Chain of Thought) e ação (chamar ferramentas externas) de forma alternada para permitir que um modelo resolva problemas de forma autônoma.

#### Reranking (Reordenação)
Etapa em pipelines de RAG em que um modelo especializado (Cross-Encoder) reavalia os principais documentos retornados por uma busca inicial e os reordena com base na relevância semântica estrita para a consulta.

#### RRF (Reciprocal Rank Fusion)
Algoritmo de fusão híbrida utilizado para unificar rankings de buscas esparsas (BM25) e densas (cosseno) calculando o score com base no inverso da colocação ordinal do documento em cada ranking individual.

---

### S

#### Semantic Chunking (Segmentação Semântica)
Técnica de fatiamento de textos que divide o documento em sentenças e calcula a distância semântica entre sentenças subsequentes, efetuando o corte quando a discrepância entre frases excede um limite configurado.

#### Spec-Driven Development (SDD / Desenvolvimento Orientado por Especificações)
Metodologia de engenharia de software em que a especificação técnica detalhada em Markdown atua como o contrato de verdade principal, orientando de forma sistemática a geração autônoma de código por agentes de IA e banindo a prática do *vibe coding*.

#### SPDD (Structured Prompt-Driven Development)
Prática de engenharia que trata prompts em produção como ativos de código fundamentais governados por versionamento Git, parametrização dinâmica de inputs e rastreabilidade de execuções.

---

### T

#### Temperature (Temperatura)
Parâmetro de configuração do LLM que controla a aleatoriedade (ou criatividade) de suas respostas. Valores baixos (ex. 0.0) tornam a saída determinística e conservadora; valores altos (ex. 0.9) geram saídas mais criativas e variadas.

#### Test-Driven Prompt Development (TDD de Prompts)
Metodologia que dita a escrita de testes de asserções unitárias sintáticas e validações semânticas para as saídas de prompts antes da implementação das instruções textuais dos prompts.

#### Token
A unidade básica de processamento de texto em um LLM. Pode corresponder a uma palavra inteira, parte de uma palavra, ou até mesmo um único caractere.

#### Tree of Thoughts (ToT - Árvore de Pensamentos)
Técnica avançada de prompting que permite que o LLM explore múltiplos fluxos de pensamento organizados em ramos lógicos de árvore, avaliando caminhos alternativos e realizando backtracking sob erros.

---

### V

#### Vector Database (Banco de Dados Vetorial)
Banco de dados projetado especificamente para armazenar, indexar e buscar embeddings vetoriais com rapidez e eficiência por meio de algoritmos de vizinhos mais próximos (Nearest Neighbors).

---

### Z

#### Zero-shot Prompting
Técnica de prompt onde o modelo é instruído a realizar uma tarefa sem que lhe sejam apresentados exemplos prévios de execução no prompt.
