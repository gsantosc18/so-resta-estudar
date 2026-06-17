# Glossário — Desenvolvimento com IA

Este glossário reúne termos técnicos e jargões essenciais sobre engenharia de prompts, arquitetura de LLMs, bancos vetoriais, sistemas de agentes e LLMOps, organizados em ordem alfabética.

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

### C

#### Chain of Thought (Cadeia de Pensamento / CoT)
Técnica de prompt que instrui o LLM a detalhar seu raciocínio passo a passo antes de apresentar a resposta final, melhorando a precisão em tarefas complexas.

#### Chunking (Segmentação)
Processo de dividir um documento de texto grande em pedaços menores (chunks) legíveis e semanticamente coesos para fins de busca semântica em sistemas de RAG.

#### Context Window (Janela de Contexto)
O número máximo de tokens (de entrada mais saída) que um modelo de linguagem pode ler e processar de uma única vez em uma chamada à API.

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

#### Hybrid Search (Busca Híbrida)
Abordagem de recuperação que combina busca por similaridade densa (vetorial/embeddings) com busca baseada em palavras-chave clássica (esparsa/BM25) para maximizar a precisão da recuperação.

---

### L

#### LLM (Large Language Model)
Modelo de aprendizado profundo treinado em grandes volumes de texto para prever o próximo token e realizar tarefas de processamento de linguagem natural.

#### LLMOps (Operações com LLMs)
Conjunto de práticas, ferramentas e workflows para gerenciar o ciclo de vida operacional de modelos de linguagem e aplicações associadas em produção (desenvolvimento, testes, deploy, monitoramento).

---

### P

#### Prompt Engineering (Engenharia de Prompts)
A prática de estruturar, projetar e refinar instruções textuais inseridas em LLMs para obter saídas de maior qualidade e formato específicos.

---

### R

#### RAG (Retrieval-Augmented Generation / Geração Aumentada por Recuperação)
Arquitetura que aprimora as respostas de um LLM recuperando fatos de uma base de conhecimento externa de suporte (como um banco de dados vetorial) e inserindo-os no prompt do modelo como contexto.

#### ReAct (Reasoning and Acting)
Padrão de prompt que combina raciocínio (Chain of Thought) e ação (chamar ferramentas externas) de forma alternada para permitir que um modelo resolva problemas de forma autônoma.

#### Reranking (Reordenação)
Etapa em pipelines de RAG em que um modelo especializado (Cross-Encoder) reavalia os principais documentos retornados por uma busca inicial e os reordena com base na relevância semântica estrita para a consulta.

---

### T

#### Temperature (Temperatura)
Parâmetro de configuração do LLM que controla a aleatoriedade (ou criatividade) de suas respostas. Valores baixos (ex. 0.0) tornam a saída determinística e conservadora; valores altos (ex. 0.9) geram saídas mais criativas e variadas.

#### Token
A unidade básica de processamento de texto em um LLM. Pode corresponder a uma palavra inteira, parte de uma palavra, ou até mesmo um único caractere.

---

### V

#### Vector Database (Banco de Dados Vetorial)
Banco de dados projetado especificamente para armazenar, indexar e buscar embeddings vetoriais com rapidez e eficiência por meio de algoritmos de vizinhos mais próximos (Nearest Neighbors).

---

### Z

#### Zero-shot Prompting
Técnica de prompt onde o modelo é instruído a realizar uma tarefa sem que lhe sejam apresentados exemplos prévios de execução no prompt.
