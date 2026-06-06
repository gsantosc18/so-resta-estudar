# Aritmética de Ponteiros

## Objetivo

Entender como ponteiros podem ser usados em operações matemáticas e como isso se relaciona ao layout de arrays na memória. A aritmética de ponteiros é a base para iteração eficiente sobre arrays e strings.

## Pré-requisitos

- [Ponteiros: fundamentos](./02-pointers-basics.md)

## Conceitos Fundamentais

### O que é aritmética de ponteiros?

Operações aritméticas em ponteiros são **escaladas automaticamente** pelo tamanho do tipo apontado:

```c
int arr[] = {10, 20, 30, 40, 50};
int *p = arr;   /* p aponta para arr[0] */

p++;            /* avança sizeof(int) bytes — agora aponta para arr[1] */
p += 2;         /* avança 2 * sizeof(int) — agora aponta para arr[3] */
p--;            /* recua sizeof(int) — agora aponta para arr[2] */
```

```
Memória (int = 4 bytes):
Endereço  │ 0x1000 │ 0x1004 │ 0x1008 │ 0x100C │ 0x1010
Valor     │   10   │   20   │   30   │   40   │   50
Índice    │ arr[0] │ arr[1] │ arr[2] │ arr[3] │ arr[4]

p = arr   → p = 0x1000
p++       → p = 0x1004  (avança 4 bytes, não 1)
p += 2    → p = 0x100C  (avança 8 bytes)
```

---

### Operações permitidas

| Operação | Exemplo | Resultado |
|---|---|---|
| Ponteiro + inteiro | `p + 3` | Ponteiro n elementos à frente |
| Ponteiro - inteiro | `p - 2` | Ponteiro n elementos atrás |
| Ponteiro++ / --Ponteiro | `p++` | Avança/recua 1 elemento |
| Ponteiro - Ponteiro | `p1 - p2` | Número de elementos entre eles (`ptrdiff_t`) |
| Comparação | `p1 < p2` | Válido para ponteiros do mesmo array |

> ⚠️ **Operações inválidas**: ponteiro + ponteiro, multiplicação, divisão de ponteiros.

---

### Diferença entre ponteiros (`ptrdiff_t`)

```c
#include <stddef.h>   /* para ptrdiff_t */

int arr[] = {1, 2, 3, 4, 5};
int *inicio = arr;
int *fim    = arr + 5;   /* um além do último elemento (sentinela) */

ptrdiff_t n = fim - inicio;   /* 5 — número de elementos entre eles */
printf("Elementos: %td\n", n);
```

---

### Equivalência entre ponteiros e arrays

Em C, `arr[i]` é **exatamente equivalente** a `*(arr + i)`:

```c
int arr[] = {10, 20, 30};
int *p = arr;

/* As quatro formas são equivalentes: */
printf("%d\n", arr[1]);   /* 20 */
printf("%d\n", *(arr + 1)); /* 20 */
printf("%d\n", p[1]);     /* 20 */
printf("%d\n", *(p + 1)); /* 20 */

/* Curiosidade: a curiosa equivalência comutativa */
printf("%d\n", 1[arr]);   /* 20 — válido em C! (não use em produção) */
```

---

### Iteração com ponteiros

```c
int arr[] = {5, 3, 8, 1, 9, 2};
int n = sizeof(arr) / sizeof(arr[0]);

/* Forma com índice (mais legível) */
for (int i = 0; i < n; i++) {
    printf("%d ", arr[i]);
}

/* Forma com ponteiro (útil para entender internamente) */
for (int *p = arr; p < arr + n; p++) {
    printf("%d ", *p);
}

/* Forma com ponteiro — iteração reversa */
for (int *p = arr + n - 1; p >= arr; p--) {
    printf("%d ", *p);
}
```

---

### Ponteiro `void*` e aritmética

`void *` **não pode** ser usado em aritmética de ponteiros diretamente, pois o compilador não sabe o tamanho do tipo:

```c
void *vp = malloc(100);
vp++;          /* ERRO: tipo desconhecido, não sabe quantos bytes avançar */
char *cp = vp;
cp++;          /* OK: char tem sizeof = 1, avança 1 byte */
```

---

### Comparação de ponteiros

```c
int arr[] = {1, 2, 3, 4, 5};
int *inicio = arr;
int *meio   = arr + 2;
int *fim    = arr + 5;

if (inicio < meio)   printf("inicio antes de meio\n");   /* verdadeiro */
if (meio   < fim)    printf("meio antes de fim\n");       /* verdadeiro */

/* Verificar se ponteiro está dentro dos limites do array */
int *p = arr + 3;
if (p >= arr && p < arr + 5) {
    printf("p está dentro do array\n");
}
```

> ⚠️ Comparar ponteiros de objetos **diferentes** é undefined behavior (exceto para verificar se são iguais com `==`).

## Funcionamento Interno

### Como o compilador escala a aritmética

```c
int *p = arr;
p + 1;
/* Compilador gera: (endereço de p) + (1 * sizeof(int))
   equivalente a:   (endereço de p) + 4  (em sistemas de 32-bit int) */

double *dp = arr_d;
dp + 1;
/* Compilador gera: (endereço de dp) + (1 * sizeof(double))
   equivalente a:   (endereço de dp) + 8 */
```

### Array decaindo para ponteiro

```c
int arr[5] = {1,2,3,4,5};

/* arr "decai" para ponteiro ao primeiro elemento na maioria dos contextos */
int *p = arr;           /* OK: arr → &arr[0] */
sizeof(arr);            /* 20 bytes — arr como array, não decai */
sizeof(p);              /* 8 bytes — p como ponteiro */
```

## Erros Comuns

1. **Ponteiro fora dos limites (out-of-bounds)**:
   ```c
   int arr[5];
   int *p = arr + 10;   /* aponta para fora do array */
   *p = 42;             /* UNDEFINED BEHAVIOR */
   ```
2. **Comparar ponteiros de arrays diferentes**:
   ```c
   int a[5], b[5];
   int *p = a;
   int *q = b;
   if (p < q) { }   /* UNDEFINED BEHAVIOR */
   ```
3. **Aritmética em ponteiro nulo**:
   ```c
   int *p = NULL;
   p++;   /* UB */
   ```
4. **Confundir `++p` e `p++` com `*`**:
   ```c
   *p++   /* dereferencia p, depois incrementa p */
   (*p)++ /* incrementa o valor apontado por p */
   *++p   /* incrementa p, depois dereferencia */
   ```

## Exemplos

### Implementando `strlen` com aritmética de ponteiros

```c
size_t meu_strlen(const char *s) {
    const char *p = s;
    while (*p != '\0') {  /* avança até o null terminator */
        p++;
    }
    return (size_t)(p - s);  /* diferença de ponteiros = comprimento */
}
```

### Busca do máximo com ponteiro

```c
int *encontrar_max(int *arr, int n) {
    if (n <= 0) return NULL;
    int *max = arr;
    for (int *p = arr + 1; p < arr + n; p++) {
        if (*p > *max) max = p;
    }
    return max;
}

int main(void) {
    int nums[] = {3, 7, 1, 9, 4, 6};
    int *pmax = encontrar_max(nums, 6);
    printf("Máximo: %d no índice %td\n", *pmax, pmax - nums);
    return 0;
}
```

### Reversão de array in-place

```c
void reverter(int *arr, int n) {
    int *esq = arr;
    int *dir = arr + n - 1;
    while (esq < dir) {
        int temp = *esq;
        *esq = *dir;
        *dir = temp;
        esq++;
        dir--;
    }
}
```

## Exercícios

1. **(Iniciante)** Imprima os endereços de cada elemento de um array `int[5]` e observe a diferença entre eles (deve ser `sizeof(int)`).
2. **(Iniciante)** Implemente `copiar_array(int *dest, const int *src, int n)` usando aritmética de ponteiros (sem índices).
3. **(Intermediário)** Implemente `meu_memset(void *ptr, int valor, size_t n)` que preenche `n` bytes a partir de `ptr` com `valor`. (Dica: use `unsigned char *`).
4. **(Intermediário)** Escreva uma função que recebe um array e retorna um ponteiro para o segundo maior elemento.
5. **(Avançado)** Implemente `meu_memmove(void *dest, const void *src, size_t n)` que funciona corretamente mesmo quando `dest` e `src` se sobrepõem.

## Referências

- [cppreference — Pointer arithmetic](https://en.cppreference.com/w/c/language/operator_arithmetic)
- [cppreference — Array-to-pointer conversion](https://en.cppreference.com/w/c/language/conversion#Array_to_pointer_conversion)
- [K&R — Chapter 5: Pointers and Arrays](https://en.wikipedia.org/wiki/The_C_Programming_Language)
