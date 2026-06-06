# Preprocessador e Macros

## Objetivo
Compreender a primeira fase do pipeline de compilação em C, dominando as diretivas de preprocessamento, a criação de macros (simples e parametrizadas) e a compilação condicional de maneira segura.

## Pré-requisitos
- [Ambiente de Desenvolvimento (Módulo 1)](../01-foundations/02-setup.md)
- [Estrutura de um Programa C (Módulo 1)](../01-foundations/03-program-structure.md)

## Conceitos Fundamentais

### O que é o Preprocessador?
O preprocessador é uma ferramenta de manipulação de texto executada pelo compilador antes da análise sintática. Ele busca por diretivas (linhas iniciadas com o caractere `#`) e faz transformações puramente textuais no código.

---

### Diretiva `#include`
Substitui a diretiva pelo conteúdo do arquivo referenciado.
- `#include <arquivo.h>`: Busca o cabeçalho nos diretórios padrão do sistema.
- `#include "arquivo.h"`: Busca o cabeçalho primeiro no diretório local do projeto.

---

### Macros Básicas (`#define`)
Substituições de constantes de texto de forma cega.

```c
#define PI 3.141592
#define BUFFER_SIZE 1024

char buffer[BUFFER_SIZE]; // Vira 'char buffer[1024];' após preprocessamento
```

---

### Macros Parametrizadas (Funcionais)
Macros que aceitam parâmetros para emular funções de forma rápida (sem overhead de chamada de função na stack).

```c
// Macro clássica
#define QUADRADO(x) ((x) * (x))
```
> [!IMPORTANT]
> **Sempre envolva os argumentos de macros e o resultado geral entre parênteses**. Caso contrário, problemas graves de precedência de operadores podem surgir.
> - Se `#define MULT(x, y) x * y`, então `MULT(2 + 3, 4)` expande para `2 + 3 * 4` (resultado: 14), e não `(2+3) * 4` (resultado: 20).

---

### Compilação Condicional
Controla quais trechos de código serão de fato compilados. Útil para portabilidade multiplataforma ou depuração.

```c
#ifdef DEBUG
    printf("Log de depuração ativado.\n");
#endif

#if defined(SO_WINDOWS)
    // Código específico para Windows
#elif defined(SO_LINUX)
    // Código específico para Linux
#else
    // Código padrão
#endif
```

---

### Operadores Especiais do Preprocessador
- **`#` (Stringizing):** Converte o parâmetro em uma string literal.
- **`##` (Concatenation):** Conecta (cola) dois tokens para formar um novo identificador.

```c
#define IMPRIMIR_INT(x) printf(#x " = %d\n", x)
#define DECLARAR_VAR(tipo, nome) tipo var_##nome

IMPRIMIR_INT(10 + 5); // printf("10 + 5" " = %d\n", 10 + 5);
DECLARAR_VAR(int, contador); // int var_contador;
```

## Funcionamento Interno
O preprocessador não tem conhecimento da sintaxe do C ou de tipos. Ele funciona por análise léxica simples. Por exemplo, você pode compilar arquivos C preprocessados com a flag `-E` para ver exatamente como ficou o código expandido:

```bash
gcc -E programa.c -o programa.i
```

## Erros Comuns
1. **Efeitos Colaterais em Macros:**
   ```c
   #define DOBRO(x) ((x) + (x))
   int i = 5;
   int res = DOBRO(i++); // ERRO: expande para ((i++) + (i++)). i é incrementado duas vezes!
   ```
2. **Abuso de Macros Funcionais Complexas:** Macros complexas dificultam a leitura e tornam o debug quase impossível, pois os erros apontados pelo compilador referem-se ao código expandido que você não visualiza diretamente.
   *Solução:* Use funções `static inline` no lugar de macros funcionais complexas sempre que possível.

## Exemplos

### Padrão Include Guard (Evitar inclusões circulares)
```c
/* arquivo: util.h */
#ifndef UTIL_H
#define UTIL_H

void processar(void);

#endif /* UTIL_H */
```

### Macro Robusta com Bloco `do-while(0)`
Macros de múltiplas linhas devem ser encapsuladas em blocos `do { ... } while(0)` para garantir que funcionem corretamente como comandos únicos dentro de estruturas condicionais `if-else`.

```c
#include <stdio.h>

#define SWAP_INT(a, b) \
    do { \
        int temp = (a); \
        (a) = (b); \
        (b) = temp; \
    } while (0)

int main(void) {
    int x = 5, y = 10;
    
    if (x < y)
        SWAP_INT(x, y); // Se não usássemos do-while(0), isso quebraria a sintaxe do if-else
    else
        printf("Não trocado\n");

    printf("x: %d, y: %d\n", x, y);
    return 0;
}
```

## Exercícios
1. **(Iniciante)** Crie uma macro `MIN(a, b)` que retorne o menor valor entre `a` e `b`. Use o operador ternário de forma segura.
2. **(Iniciante)** Use a compilação condicional para alternar entre mensagens em português e inglês baseado em uma macro global `#define IDIOMA_PT`.
3. **(Intermediário)** Escreva um programa C e execute o comando `gcc -E` (ou correspondente) para extrair o código expandido do preprocessador. Analise o arquivo resultante.
4. **(Intermediário)** Escreva uma macro genérica para depuração `LOG_DEBUG(fmt, ...)` que imprima o arquivo, o nome da função e a linha atual onde o log ocorreu (Dica: utilize as macros de sistema predefinidas `__FILE__`, `__func__`, `__LINE__`).
5. **(Avançado)** Implemente uma macro para simular reflexão básica em C. A macro deve receber um identificador estruturado e retornar um array contendo os nomes dos campos como strings literais (Dica: use o operador `#`).

## Referências
- [cppreference — Preprocessing](https://en.cppreference.com/w/c/preprocessor)
- [GCC Online Docs — The C Preprocessor](https://gcc.gnu.org/onlinedocs/cpp/)
