# Listas Encadeadas

## Objetivo
Compreender, projetar e implementar a estrutura de dados dinâmica clássica: a lista simplesmente encadeada (linked list), dominando a inserção, remoção, travessia e liberação segura de nós na memória.

## Pré-requisitos
- [Ponteiros e Structs (Módulo 3)](./03-structs.md)
- [Alocação Dinâmica de Memória (Módulo 2)](../02-memory/04-dynamic-allocation.md)

## Conceitos Fundamentais

### O que é uma Lista Encadeada?
Ao contrário de um array, que armazena dados em posições contíguas fixas, uma lista encadeada é composta por estruturas chamadas **Nós** (nodes), espalhadas de forma dinâmica no heap. Cada nó contém o dado útil e um ponteiro de ligação para o próximo nó.

```
Representação de uma Lista Simplesmente Encadeada:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Dado: 10     │      │ Dado: 20     │      │ Dado: 30     │
│ Próximo: ────┼─────>│ Próximo: ────┼─────>│ Próximo: NULL│
└──────────────┘      └──────────────┘      └──────────────┘
```

---

### Definição do Nó em C
Usamos uma estrutura auto-referenciada (uma struct que contém um ponteiro para si mesma):

```c
typedef struct No {
    int valor;
    struct No *proximo; // Ponteiro para o próximo nó da lista
} No;
```

---

### Operações Básicas

#### 1. Criação de um Nó
```c
No* criar_no(int valor) {
    No *novo = malloc(sizeof(No));
    if (novo != NULL) {
        novo->valor = valor;
        novo->proximo = NULL;
    }
    return novo;
}
```

#### 2. Inserção no Início
Esta operação é $O(1)$ porque não precisamos percorrer a lista.

```c
void inserir_inicio(No **cabeca, int valor) {
    No *novo = criar_no(valor);
    if (novo == NULL) return;
    
    novo->proximo = *cabeca;
    *cabeca = novo;
}
```

#### 3. Inserção no Fim
Esta operação é $O(N)$ pois necessita percorrer a lista até o último elemento.

```c
void inserir_fim(No **cabeca, int valor) {
    No *novo = criar_no(valor);
    if (novo == NULL) return;

    if (*cabeca == NULL) {
        *cabeca = novo;
        return;
    }

    No *atual = *cabeca;
    while (atual->proximo != NULL) {
        atual = atual->proximo;
    }
    atual->proximo = novo;
}
```

#### 4. Travessia (Impressão)
```c
void exibir_lista(const No *cabeca) {
    const No *atual = cabeca;
    while (atual != NULL) {
        printf("%d -> ", atual->valor);
        atual = atual->proximo;
    }
    printf("NULL\n");
}
```

#### 5. Liberação Completa da Memória
```c
void liberar_lista(No **cabeca) {
    No *atual = *cabeca;
    No *proximo_no = NULL;

    while (atual != NULL) {
        proximo_no = atual->proximo;
        free(atual);
        atual = proximo_no;
    }
    *cabeca = NULL;
}
```

## Funcionamento Interno

### Travessia de Ponteiros
Durante a travessia ou remoção, manter referências temporárias seguras de ponteiros é crítico. Se você liberar o nó `atual` sem antes salvar o ponteiro `atual->proximo`, você perderá o acesso a todo o restante da lista, gerando um memory leak impossível de recuperar (além de comportamento indefinido).

## Erros Comuns
1. **Perda de Referência (Memory Leak):** Liberar um nó intermediário antes de religar o anterior ao posterior.
2. **Dereferenciar Ponteiro Nulo (`NULL`):** Tentar acessar `atual->proximo` quando `atual` é `NULL` (acontece muito em condições de parada de loops).
3. **Passar `No*` em vez de `No**` em modificações:**
   Se uma função precisa alterar para onde a "cabeça" (head) da lista aponta, deve-se passar o endereço do ponteiro da cabeça (`No**`). Caso contrário, a alteração se perderá ao retornar (passagem por valor).

## Exemplos

### Implementação Completa: Inserção e Remoção de Elementos
```c
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct No {
    int valor;
    struct No *proximo;
} No;

// Inserção no início
void inserir(No **cabeca, int valor) {
    No *novo = malloc(sizeof(No));
    if (!novo) return;
    novo->valor = valor;
    novo->proximo = *cabeca;
    *cabeca = novo;
}

// Remoção de um nó específico por valor
bool remover(No **cabeca, int valor) {
    No *atual = *cabeca;
    No *anterior = NULL;

    while (atual != NULL && atual->valor != valor) {
        anterior = atual;
        atual = atual->proximo;
    }

    if (atual == NULL) return false; // Não encontrado

    if (anterior == NULL) {
        *cabeca = atual->proximo; // Removendo a cabeça
    } else {
        anterior->proximo = atual->proximo; // Removendo intermediário ou fim
    }

    free(atual);
    return true;
}

void exibir(const No *cabeca) {
    while (cabeca) {
        printf("%d -> ", cabeca->valor);
        cabeca = cabeca->proximo;
    }
    printf("NULL\n");
}

void liberar(No **cabeca) {
    No *atual = *cabeca;
    while (atual) {
        No *prox = atual->proximo;
        free(atual);
        atual = prox;
    }
    *cabeca = NULL;
}

int main(void) {
    No *lista = NULL;

    inserir(&lista, 10);
    inserir(&lista, 20);
    inserir(&lista, 30);
    printf("Lista inicial: ");
    exibir(lista); // 30 -> 20 -> 10 -> NULL

    remover(&lista, 20);
    printf("Após remover 20: ");
    exibir(lista); // 30 -> 10 -> NULL

    liberar(&lista);
    return 0;
}
```

## Exercícios
1. **(Iniciante)** Crie uma função para buscar se um determinado valor existe na lista. Ela deve retornar `true` ou `false`.
2. **(Iniciante)** Escreva uma função que conte e retorne a quantidade de nós em uma lista simplesmente encadeada.
3. **(Intermediário)** Escreva uma função para inverter o sentido das ligações de uma lista simplesmente encadeada (in-place reverse), mudando a direção de cada ponteiro `proximo`.
4. **(Intermediário)** Implemente uma lista duplamente encadeada (onde cada nó aponta para o `proximo` e para o `anterior`).
5. **(Avançado)** Implemente uma lista encadeada ordenada. A inserção de novos nós deve ser feita na posição numérica correta para manter a lista ordenada em ordem crescente.

## Referências
- [Linked List Data Structure (GeeksforGeeks)](https://www.geeksforgeeks.org/data-structures/linked-list/)
- [K&R Chapter 6.5 — Self-referential Structures](https://en.wikipedia.org/wiki/The_C_Programming_Language)
