# Glossário de Estruturas de Dados

Termos técnicos e conceitos fundamentais organizados em ordem alfabética para consulta rápida.

---

### A
* **ADT (Abstract Data Type / Tipo Abstrato de Dados)**: Um modelo matemático para estruturas de dados que define o comportamento do ponto de vista do usuário (operações e propriedades), mas sem especificar a implementação. Exemplos: `List`, `Stack`, `Queue`.
* **Algoritmo**: Uma sequência finita e bem definida de instruções ou etapas para resolver um problema computacional.
* **Amortized Analysis (Análise Amortizada)**: Método de estimar a complexidade temporal média de uma sequência de operações, garantindo que mesmo se uma única operação for cara, o custo médio por operação no longo prazo é baixo (ex: redimensionamento de array dinâmico).
* **Array (Vetor)**: Estrutura de dados que armazena uma coleção de elementos do mesmo tipo em locais de memória física contíguos, permitindo acesso de tempo constante $O(1)$ por meio de índices.
* **Árvore (Tree)**: Estrutura de dados não-linear, hierárquica, composta de nós conectados por arestas unidirecionais, sem ciclos.
* **Árvore Binária (Binary Tree)**: Uma árvore onde cada nó possui no máximo dois nós filhos, convencionalmente chamados de filho esquerdo e filho direito.
* **Árvore Binária de Busca (BST - Binary Search Tree)**: Uma árvore binária onde, para cada nó, todos os elementos da subárvore esquerda são menores e todos da subárvore direita são maiores que ele.
* **AVL**: Uma árvore binária de busca auto-balanceável onde a diferença de altura entre as subárvores esquerda e direita de qualquer nó (fator de balanceamento) é de no máximo 1.

### B
* **BFS (Breadth-First Search / Busca em Largura)**: Algoritmo de percurso em grafos ou árvores que explora todos os vizinhos de um nó em um determinado nível antes de ir para o próximo nível de profundidade. Utiliza uma Fila (Queue).
* **Big O Notation (Notação Big O)**: Notação matemática usada para descrever o limite superior do tempo de execução ou do espaço de memória requerido por um algoritmo no pior caso, em função do tamanho da entrada $n$.

### C
* **Collision (Colisão)**: Situação em uma Tabela Hash onde duas chaves diferentes geram o mesmo índice de dispersão através da função Hash.
* **Complexity (Complexidade)**: Medida dos recursos (tempo de CPU ou espaço de memória) exigidos para rodar um algoritmo.

### D
* **Deque (Double-Ended Queue)**: Tipo abstrato de dados que permite a inserção e remoção de elementos em ambas as extremidades (início e fim) com tempo constante $O(1)$.
* **DFS (Depth-First Search / Busca em Profundidade)**: Algoritmo de percurso em grafos ou árvores que avança o máximo possível ao longo de cada ramo antes de retroceder (backtracking). Utiliza uma Pilha (Stack).

### F
* **FIFO (First In, First Out)**: Princípio de ordenação de elementos onde o primeiro a entrar é o primeiro a sair. Característico de **Filas**.

### G
* **Grafo (Graph)**: Estrutura não-linear que consiste em um conjunto de vértices (nós) conectados por um conjunto de arestas (links). Pode ser direcionado, não-direcionado, ponderado ou não-ponderado.

### H
* **Hash Function (Função Hash)**: Algoritmo matemático que mapeia dados de tamanho arbitrário (chaves) para uma sequência de bits de tamanho fixo (índice da tabela).
* **Heap**: Uma árvore binária quase completa que satisfaz a propriedade do heap: em um Max-Heap, a chave do pai é maior ou igual à dos filhos; em um Min-Heap, a chave do pai é menor ou igual à dos filhos.

### L
* **LIFO (Last In, First Out)**: Princípio de ordenação de elementos onde o último a entrar é o primeiro a sair. Característico de **Pilhas**.
* **Linked List (Lista Encadeada)**: Estrutura de dados linear cujos elementos não estão armazenados de forma contígua na memória. Cada elemento (nó) contém o dado e uma referência (ponteiro) para o próximo elemento.

### P
* **Pointer (Ponteiro / Referência)**: Um valor que aponta diretamente para outro valor armazenado em outra parte da memória do computador usando seu endereço de memória. No Java, todas as variáveis de objetos são referências.
* **Priority Queue (Fila de Prioridade)**: Tipo de fila onde cada elemento possui uma prioridade associada e o elemento com maior prioridade é removido antes do de menor prioridade. Geralmente implementado com Heaps.

### R
* **Red-Black Tree (Árvore Rubro-Negra)**: Árvore binária de busca auto-balanceável onde cada nó possui um bit de cor adicional (vermelho ou preto), utilizado para garantir que a árvore permaneça balanceada durante inserções e deleções.
* **Rotation (Rotação)**: Operação algébrica em árvores binárias de busca balanceadas (como AVL e Red-Black) que altera a estrutura de ponteiros mantendo a ordem relativa dos elementos, usada para restaurar o balanceamento da árvore.
