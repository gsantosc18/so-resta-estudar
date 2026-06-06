# Arrays Unidimensionais e Multidimensionais

## Objetivo
Dominar a criação, inicialização e manipulação de arrays unidimensionais e multidimensionais em C, compreendendo seu layout de memória contíguo e como trabalhar com limites de forma segura.

## Pré-requisitos
- [Ponteiros e Arrays (Módulo 2)](../02-memory/05-pointers-and-arrays.md)

## Conceitos Fundamentais

### O que é um Array?
Um array é uma coleção de elementos do mesmo tipo armazenados em posições físicas **contíguas** de memória. 

```
Layout de memória de int arr[5] (onde cada int tem 4 bytes):
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  arr[0]  │  arr[1]  │  arr[2]  │  arr[3]  │  arr[4]  │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0x1000   │ 0x1004   │ 0x1008   │ 0x100C   │ 0x1010   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### Declaração e Inicialização

```c
// Declaração sem inicialização (contém lixo de memória se local)
int arr[5];

// Inicialização completa
int arr2[5] = {10, 20, 30, 40, 50};

// Inicialização parcial (elementos restantes são preenchidos com 0)
int arr3[5] = {1, 2}; // arr3[2], arr3[3], arr3[4] são 0

// Inicialização completa com tamanho implícito
int arr4[] = {1, 2, 3, 4, 5}; // O compilador define tamanho 5

// Inicialização com zeros (muito comum)
int arr5[5] = {0}; // Inicializa todos os elementos com 0

// Inicialização com designadores (C99+)
int arr6[5] = {[1] = 10, [4] = 20}; // {0, 10, 0, 0, 20}
```

---

### Acessando Elementos
O acesso a um elemento é feito através do operador de indexação `[]`. Os índices em C são **baseados em zero** (0 a N-1).

```c
int arr[3] = {10, 20, 30};
arr[0] = 99; // Altera o primeiro elemento
int x = arr[2]; // x recebe 30
```

---

### Tamanho de um Array
Para descobrir o número de elementos de um array alocado estaticamente:

```c
int arr[] = {1, 2, 3, 4, 5, 6, 7, 8};
size_t total_bytes = sizeof(arr);             // 32 bytes (8 ints * 4 bytes)
size_t element_bytes = sizeof(arr[0]);        // 4 bytes (1 int)
size_t num_elementos = total_bytes / element_bytes; // 8 elementos
```

---

### Arrays Multidimensionais
Arrays com mais de uma dimensão são representados como "arrays de arrays". O caso mais comum é a matriz bidimensional (2D).

```c
// Linhas x Colunas
int matriz[3][4] = {
    {1, 2, 3, 4},     // Linha 0
    {5, 6, 7, 8},     // Linha 1
    {9, 10, 11, 12}   // Linha 2
};

// Acesso
int val = matriz[1][2]; // Linha 1, Coluna 2 -> valor 7
```

---

### Layout de Memória Row-Major (Ordem de Linha)
Em C, arrays multidimensionais são guardados de forma linear na memória em ordem de linha. A linha interna muda primeiro.

```
matriz[0][0] -> matriz[0][1] -> matriz[0][2] -> matriz[0][3] -> matriz[1][0] -> ...
```

---

### Variable Length Arrays — VLA (C99)
A partir do padrão C99, é possível declarar arrays cujo tamanho é definido em tempo de execução na stack.

```c
void criar_vla(int n) {
    int arr[n]; // Tamanho dinâmico na stack
    arr[0] = 42;
    // ...
}
```
> [!WARNING]
> VLAs podem facilmente causar stack overflow se o valor de `n` for muito grande ou vier de entrada não confiável do usuário. No padrão C11, o suporte a VLA tornou-se **opcional**.

## Funcionamento Interno
O cálculo do endereço de memória do elemento `arr[i]` em um array unidimensional de tipo `T` é feito como:
$$\text{Endereço}(arr[i]) = \text{Endereço Base} + (i \times \text{sizeof}(T))$$

Para uma matriz `int M[Linhas][Colunas]`, o endereço de `M[i][j]` é calculado como:
$$\text{Endereço}(M[i][j]) = \text{Endereço Base} + ((i \times \text{Colunas} + j) \times \text{sizeof}(int))$$

## Erros Comuns
1. **Acesso fora dos limites (Out-of-bounds):** C não valida se o índice está dentro do intervalo do array.
   ```c
   int arr[5];
   arr[5] = 10; // ERRO CRÍTICO: invade memória adjacente (UB)
   ```
2. **Tentar copiar arrays com atribuição direta:**
   ```c
   int a[3] = {1, 2, 3};
   int b[3];
   b = a; // ERRO DE COMPILAÇÃO: arrays não podem ser atribuídos diretamente
   ```
   *Solução:* Use `memcpy` da `<string.h>` ou copie elemento por elemento com um laço.

3. **Passar VLA com tamanho negativo ou zero:** Causa comportamento indefinido imediato.

## Exemplos

### Cópia e Comparação de Arrays
```c
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

int main(void) {
    int original[] = {10, 20, 30, 40, 50};
    int n = sizeof(original) / sizeof(original[0]);
    int copia[5];

    // Copiando usando memcpy
    memcpy(copia, original, sizeof(original));

    // Comparando elementos
    bool iguais = true;
    for (int i = 0; i < n; i++) {
        if (original[i] != copia[i]) {
            iguais = false;
            break;
        }
    }

    if (iguais) {
        printf("Os arrays são idênticos!\n");
    }

    return 0;
}
```

### Multiplicação de Matrizes
```c
#include <stdio.h>

#define L1 2
#define C1_L2 3
#define C2 2

int main(void) {
    int A[L1][C1_L2] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    int B[C1_L2][C2] = {
        {7, 8},
        {9, 10},
        {11, 12}
    };
    int C[L1][C2] = {0};

    // Multiplicação de matrizes
    for (int i = 0; i < L1; i++) {
        for (int j = 0; j < C2; j++) {
            for (int k = 0; k < C1_L2; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    // Exibição do resultado
    printf("Matriz Resultante C:\n");
    for (int i = 0; i < L1; i++) {
        for (int j = 0; j < C2; j++) {
            printf("%d ", C[i][j]);
        }
        printf("\n");
    }

    return 0;
}
```

## Exercícios
1. **(Iniciante)** Escreva um programa que declare um array de 10 inteiros, leia valores para preenchê-lo e exiba o maior elemento e sua posição.
2. **(Iniciante)** Crie um programa que inverta a ordem dos elementos de um array estático (in-place).
3. **(Intermediário)** Escreva um programa que calcule a transposta de uma matriz $3 \times 4$ e a armazene em uma matriz $4 \times 3$.
4. **(Intermediário)** Escreva uma função `bool contem_duplicados(const int *arr, size_t tamanho)` que retorna verdadeiro caso existam valores repetidos no array.
5. **(Avançado)** Crie um simulador de tabuleiro de campo minado $8 \times 8$ salvando minas e contagem de vizinhos em arrays 2D.

## Referências
- [cppreference — Arrays](https://en.cppreference.com/w/c/language/array)
- [C99 Standard Section 6.7.5.2 — Array declarators](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1256.pdf)
