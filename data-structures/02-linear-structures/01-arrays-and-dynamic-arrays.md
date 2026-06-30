# Arrays e Vetores Dinâmicos

## Objetivo
Ao final deste tópico, o estudante será capaz de compreender a organização física de um array na memória contígua, realizar cálculos de endereçamento de índices, implementar um vetor dinâmico completo com redimensionamento em Java, e provar matematicamente por que o fator de crescimento geométrico garante tempo constante amortizado $\mathcal{O}(1)$ para inserções, ao contrário do crescimento aritmético.

## Pré-requisitos
- [02. Análise de Complexidade de Algoritmos (Notação Big O)](../01-foundations/02-time-space-complexity-big-o.md)
- Conhecimento sobre classes genéricas em Java e manipulação básica de arrays.

## Conceitos Fundamentais

### 1. Arrays Estáticos (Vetores)
Um **Array** é uma estrutura de dados homogênea e linear que armazena uma coleção de elementos do mesmo tipo em posições físicas contíguas de memória.

#### Endereçamento Físico
Como os elementos são contíguos e de tamanho fixo, o endereço de memória de qualquer elemento no índice $i$ pode ser calculado em tempo constante $\mathcal{O}(1)$ usando a seguinte fórmula:

$$\text{Endereço}(A[i]) = \text{Endereço Base} + i \times \text{Tamanho do Elemento}$$

Isso explica por que o acesso a qualquer elemento pelo seu índice é extremamente eficiente: $\mathcal{O}(1)$.

```mermaid
line-chart
    title Endereçamento na Memória
    x-axis Índices
    y-axis Endereço de Memória (Exemplo)
    "A[0]" : 1000
    "A[1]" : 1004
    "A[2]" : 1008
    "A[3]" : 1012
```

*Nota: Em sistemas de 32 bits ou usando referências compactadas da JVM, cada elemento de referência a objeto consome 4 bytes (daí o incremento de 4 em 4 nos endereços).*

### 2. Vetores Dinâmicos (Dynamic Arrays)
Arrays estáticos têm um tamanho fixo definido na criação. Se o limite for atingido, não é possível expandi-los diretamente. O **Vetor Dinâmico** (como o `ArrayList` do Java) resolve isso encapsulando um array estático interno e gerenciando o redimensionamento automaticamente quando a capacidade máxima é atingida.

#### Mecanismo de Redimensionamento: Geométrico vs. Aritmético

*   **Redimensionamento Geométrico (Multiplicativo)**: Quando o array enche, sua nova capacidade é multiplicada por um fator constante (geralmente $2.0$ ou $1.5$ no Java `ArrayList`).
    *   *Complexidade*: Inserções consecutivas custam tempo **Amortizado** de $\mathcal{O}(1)$.
*   **Redimensionamento Aritmético (Aditivo)**: A capacidade aumenta por um valor fixo (ex: $+10$ ou $+100$ elementos).
    *   *Complexidade*: Fazer $n$ inserções gera um tempo total de $\mathcal{O}(n^2)$, resultando em um custo amortizado de $\mathcal{O}(n)$ por inserção. **Evite esta abordagem.**

```mermaid
flowchart TD
    subgraph Geométrico [Crescimento Geométrico (Fator 2)]
        g1["Capacidade: 4"] -->|Enche| g2["Nova Capacidade: 8 (Cópia O(N))"]
        g2 -->|Enche| g3["Nova Capacidade: 16 (Cópia O(N))"]
    end
    subgraph Aritmético [Crescimento Aritmético (+2)]
        a1["Capacidade: 4"] -->|Enche| a2["Nova Capacidade: 6 (Cópia O(N))"]
        a2 -->|Enche| a3["Nova Capacidade: 8 (Cópia O(N))"]
    end
```

---

## Funcionamento Interno: Prova da Análise Amortizada (Método do Crédito)
Para provar que a inserção em um vetor dinâmico de crescimento geométrico (fator 2) custa $\mathcal{O}(1)$ amortizado:
1.  Imagine que cada inserção normal que não exige redimensionamento custa 1 "unidade" de trabalho real.
2.  Cobramos do usuário um valor amortizado de **3 créditos** por inserção simples.
3.  Utilizamos 1 crédito para realizar a inserção física do elemento atual.
4.  Guardamos os outros 2 créditos como saldo:
    *   1 crédito será usado no futuro para mover o próprio elemento atual quando o array duplicar.
    *   1 crédito será usado no futuro para mover um dos elementos que já estavam no array e que não têm créditos guardados (aqueles da primeira metade do array).
5.  Quando o array de tamanho $N$ enche e precisa duplicar para $2N$, temos exatamente $N/2$ novos elementos que guardaram 2 créditos cada, totalizando $N$ créditos acumulados. Esse saldo é exatamente o custo necessário para copiar todos os $N$ elementos para o novo array.
6.  Como cobramos constantes 3 operações por inserção, o custo amortizado é **$\mathcal{O}(1)$**.

---

## Vantagens e Desvantagens

### Vantagens
*   **Acesso Rápido**: Acesso aleatório por índice em $\mathcal{O}(1)$.
*   **Localidade de Referência**: Elementos contíguos na memória física aproveitam o cache do processador (L1/L2/L3), reduzindo *cache misses*.
*   **Baixo Desperdício de Metadados**: Consome pouca memória adicional por elemento em comparação com nós de listas encadeadas.

### Desvantagens
*   **Inserções/Exclusões no Meio/Início são Lentas**: Exigem o deslocamento de múltiplos elementos à direita ou esquerda: $\mathcal{O}(n)$.
*   **Desperdício de Espaço**: Pode alocar mais memória do que o necessário (ex: um array de capacidade 100 contendo apenas 51 elementos desperdiça 49 posições).

---

## Erros Comuns
1.  **Inserir Elementos em Loop na Posição Zero**: Executar `list.add(0, item)` em um loop de $n$ elementos. Como cada inserção na primeira posição exige empurrar todos os elementos existentes, a complexidade total será quadrática: $\mathcal{O}(n^2)$.
2.  **Não Definir a Capacidade Inicial Estimada**: Se você sabe que vai inserir 1.000.000 de itens no `ArrayList`, crie-o definindo `new ArrayList<>(1000000)`. Isso evita dezenas de redimensionamentos custosos e cópias desnecessárias na memória.

---

## Exemplos em Java

Abaixo está uma implementação limpa e genérica de um vetor dinâmico (`DynamicArray`) contendo as operações essenciais, redimensionamento automático de fator 2, remoção com encolhimento de capacidade e verificação de limites.

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

public class DynamicArray<T> implements Iterable<T> {
    private T[] data;
    private int size;
    private int capacity;

    private static final int INITIAL_CAPACITY = 8;

    @SuppressWarnings("unchecked")
    public DynamicArray() {
        this.capacity = INITIAL_CAPACITY;
        this.size = 0;
        this.data = (T[]) new Object[INITIAL_CAPACITY];
    }

    // Acesso O(1)
    public T get(int index) {
        checkIndex(index);
        return data[index];
    }

    // Modificação O(1)
    public void set(int index, T element) {
        checkIndex(index);
        data[index] = element;
    }

    // Inserção no fim: O(1) amortizado
    public void add(T element) {
        if (size == capacity) {
            resize(capacity * 2); // Crescimento Geométrico
        }
        data[size++] = element;
    }

    // Inserção em índice específico: O(n) pior caso
    public void add(int index, T element) {
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("Índice inválido.");
        }
        if (size == capacity) {
            resize(capacity * 2);
        }
        // Desloca elementos para a direita
        for (int i = size; i > index; i--) {
            data[i] = data[i - 1];
        }
        data[index] = element;
        size++;
    }

    // Remoção do último elemento: O(1) amortizado
    public T removeLast() {
        if (size == 0) throw new NoSuchElementException("Array vazio.");
        T element = data[size - 1];
        data[size - 1] = null; // Evita memory leak
        size--;
        // Encolhe o array se estiver muito vazio para liberar memória
        if (size > 0 && size == capacity / 4) {
            resize(capacity / 2);
        }
        return element;
    }

    // Remoção por índice: O(n)
    public T remove(int index) {
        checkIndex(index);
        T element = data[index];
        // Desloca elementos para a esquerda
        for (int i = index; i < size - 1; i++) {
            data[i] = data[i + 1];
        }
        data[size - 1] = null; // Evita memory leak
        size--;
        if (size > 0 && size == capacity / 4) {
            resize(capacity / 2);
        }
        return element;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    @SuppressWarnings("unchecked")
    private void resize(int newCapacity) {
        T[] temp = (T[]) new Object[newCapacity];
        for (int i = 0; i < size; i++) {
            temp[i] = data[i];
        }
        data = temp;
        capacity = newCapacity;
    }

    private void checkIndex(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index " + index + " fora do limite size " + size);
        }
    }

    @Override
    public Iterator<T> iterator() {
        return new Iterator<T>() {
            private int index = 0;
            @Override
            public boolean hasNext() { return index < size; }
            @Override
            public T next() {
                if (!hasNext()) throw new NoSuchElementException();
                return data[index++];
            }
        };
    }
}
```

---

## Exercícios

### Exercício 1: Simulação de Créditos de Inserção
Considere um `DynamicArray` com capacidade inicial de 2. Faça o rastreamento do saldo de créditos e número de cópias de dados após realizar a inserção de 6 elementos consecutivos (utilizando a lógica do Método do Crédito onde cada inserção cobra 3 créditos).

### Exercício 2: Implementação Prática — Encolhimento Histerético
No código de exemplo fornecido, o array encolhe pela metade (`capacity / 2`) quando o tamanho atinge um quarto da capacidade (`size == capacity / 4`).
*   **Pergunta**: Por que não encolhemos o array assim que `size == capacity / 2`? Explique a ocorrência de "oscilação violenta" (thrashing) se fizéssemos isso.
*   **Prática**: Modifique a classe `DynamicArray` para expor o método `capacity()` e escreva um pequeno teste unitário simulando inserções e remoções alternadas no limite da capacidade para verificar se o redimensionamento ocorre de forma amortizada estável.

---

## Referências
*   CLRS. **Introduction to Algorithms**. 4. ed. Capítulo 17 (Amortized Analysis).
*   Documentação da classe ArrayList do Java: [Oracle Java Docs - ArrayList](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/ArrayList.html).
