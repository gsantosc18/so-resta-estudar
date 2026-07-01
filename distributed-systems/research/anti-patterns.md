# Antipadrões em Sistemas Distribuídos

Este documento reúne e cataloga os antipadrões comuns de arquitetura e desenvolvimento de sistemas distribuídos que devem ser apresentados e desencorajados ao longo do curso.

---

## 1. O Monolito Distribuído (The Distributed Monolith)
* **O que é**: Uma arquitetura dividida fisicamente em múltiplos serviços (ex: contêineres separados, repositórios separados), mas que continuam fortemente acoplados logicamente. As chamadas entre serviços são predominantemente síncronas (HTTP/REST), e a falha em um único serviço derruba ou bloqueia o fluxo de todo o sistema. Alterações em um serviço exigem deploys coordenados e simultâneos de outros serviços.
* **Por que é ruim**: Combina as desvantagens dos monolitos (acoplamento, dificuldade de deploy independente) com a complexidade física dos sistemas distribuídos (latência de rede, gerenciamento de portas, falhas de rede, dificuldades de observabilidade), sem obter nenhuma das vantagens de microserviços (escalabilidade e deploy independentes, times autônomos).
* **Solução**: Introduzir comunicação assíncrona orientada a eventos para desacoplamento temporal, redesenhar limites de domínio (Bounded Contexts) baseados em DDD (*Domain-Driven Design*) e garantir tolerância a falhas locais.

---

## 2. Banco de Dados Compartilhado (Shared Database)
* **O que é**: Múltiplos microserviços independentes conectam-se diretamente ao mesmo esquema de banco de dados central para ler e gravar dados.
* **Por que é ruim**:
  * Quebra total da autonomia de implantação. Se o Time A altera uma coluna ou tabela para o Serviço A, o Serviço B do Time B quebra silenciosamente em produção.
  * O banco de dados torna-se o gargalo físico central de concorrência e escalabilidade.
  * Impede que cada serviço escolha a tecnologia de persistência ideal para o seu domínio de dados (ex: busca textual, cache, grafos).
* **Solução**: Banco de dados por serviço (*Database-per-service*). Cada microserviço expõe seus dados estritamente através de suas APIs ou eventos públicos.

---

## 3. Confiança Cega em Relógios Físicos (Wall Clock Trust)
* **O que é**: Projetar regras críticas de ordenação temporal ou lógica de concorrência no banco de dados assumindo que o relógio de parede da máquina ($System.currentTimeMillis()$) é idêntico em todos os servidores.
* **Por que é ruim**: Devido à deriva física natural do quartzo e atrasos de sincronização NTP, relógios em servidores diferentes podem estar dessincronizados por dezenas ou centenas de milissegundos. Tomar decisões transacionais com base nisso causa perda silenciosa de dados (ex: sobrescrever dados novos com dados velhos na lógica LWW - *Last-Write-Wins*).
* **Solução**: Usar identificadores únicos lógicos, Relógios Vetoriais, Relógios Lógicos de Lamport, ou mecanismos como Hybrid Logical Clocks (HLC).

---

## 4. Ignorância da Rede (Network Ignorance)
* **O que é**: Chamar serviços remotos sem configurar timeouts de conexão e leitura rígidos, sem políticas de retry configuradas ou sem tratamento de falhas.
* **Por que é ruim**: As requisições locais ficam bloqueadas indefinidamente aguardando conexões lentas do servidor remoto. Isso esgota rapidamente as pools de threads da aplicação e resulta no travamento total do sistema por exaustão de recursos.
* **Solução**: Configurar sempre limites superiores rígidos de timeouts (Connect Timeout e Read Timeout). Implementar disjuntores (Circuit Breakers) e limites de requisições (Rate Limiters).

---

## 5. Dependências Cíclicas de Serviço (Cyclic Service Dependencies)
* **O que é**: O Serviço A chama o Serviço B de forma síncrona, que por sua vez chama o Serviço C, e o Serviço C, para completar alguma lógica, chama o Serviço A de volta.
* **Por que é ruim**: Cria um acoplamento circular complexo de resolver. Introduz alto risco de deadlock distribuído, esgotamento rápido de conexões e torna a depuração de rastreabilidade do fluxo quase impossível.
* **Solução**: Reestruturar as fronteiras de domínio ou converter o fluxo circular em uma arquitetura orientada a eventos assíncrona, ou usar o padrão Saga para orquestrar de forma linear.
