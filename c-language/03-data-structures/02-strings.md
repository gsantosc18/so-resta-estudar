# Strings em C

## Objetivo
Compreender como a linguagem C manipula strings na memória como arrays de caracteres terminados com um byte nulo (`\0`), e aprender a manipulá-las usando funções seguras da biblioteca padrão.

## Pré-requisitos
- [Arrays Unidimensionais e Multidimensionais](./01-arrays.md)

## Conceitos Fundamentais

### O que é uma String em C?
Em C, não existe um tipo de dado primitivo chamado `string`. Uma string é simplesmente um array de caracteres do tipo `char` que obrigatoriamente termina com o caractere nulo **`\0`** (ASCII 0).

```
String "Hello" na memória:
┌─────┬─────┬─────┬─────┬─────┬──────┐
│ 'H' │ 'e' │ 'l' │ 'l' │ 'o' │ '\0' │
└─────┴─────┴─────┴─────┴─────┴──────┘
Tamanho do array: 6 bytes | Comprimento da string: 5 caracteres
```

---

### Declaração e Inicialização

```c
// Inicialização automática do \0 usando aspas duplas
char str1[] = "Hello"; // Compilador aloca 6 bytes

// Inicialização explícita caractere por caractere (requer \0 manual)
char str2[] = {'H', 'e', 'l', 'l', 'o', '\0'};

// Inicialização com tamanho pré-definido
char str3[10] = "Hello"; // 5 chars + \0 + 4 bytes não inicializados (preenchidos com 0)

// String literal não modificável (armazenada em read-only data segment)
const char *str4 = "Hello"; 
```
> [!WARNING]
> Tentar alterar um caractere em uma string literal apontada por `const char *` resulta em **comportamento indefinido** (frequentemente Segmentation Fault).
> ```c
> char *perigo = "Hello";
> perigo[0] = 'h'; // CRASH!
> ```

---

### Leitura de Strings do Teclado
Leitura de strings é uma das maiores fontes de vulnerabilidade em C.

```c
char nome[50];

// Inseguro: scanf não valida limites do buffer
scanf("%s", nome); 

// Seguro: fgets impede que mais caracteres do que o buffer suporta sejam lidos
fgets(nome, sizeof(nome), stdin);
```
> [!NOTE]
> `fgets` inclui o caractere de quebra de linha `\n` na string caso haja espaço. Geralmente é necessário removê-lo.

---

### Funções da Biblioteca `<string.h>`

| Função | Descrição | Equivalente Seguro |
|---|---|---|
| `strlen(s)` | Retorna o comprimento da string (exclui `\0`) | - |
| `strcpy(dest, src)` | Copia `src` para `dest` | `strncpy(dest, src, n)` / `strcpy_s` |
| `strcat(dest, src)` | Concatena `src` no fim de `dest` | `strncat(dest, src, n)` |
| `strcmp(s1, s2)` | Compara s1 e s2 (retorna 0 se iguais) | `strncmp(s1, s2, n)` |
| `strchr(s, c)` | Encontra a primeira ocorrência do caractere `c` | - |
| `strstr(s, sub)` | Encontra a primeira ocorrência da substring `sub` | - |

---

### Exemplo de Uso Seguro de Funções

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char destino[10] = {0};
    char origem[] = "MuitoGrandeParaOBuf";

    // strncpy garante que não estouramos destino, mas NÃO adiciona \0 se atingir o limite
    strncpy(destino, origem, sizeof(destino) - 1);
    destino[sizeof(destino) - 1] = '\0'; // Garante terminação nula

    printf("Destino seguro: %s\n", destino); // Imprime "MuitoGran"
    return 0;
}
```

## Funcionamento Interno
O terminador nulo `\0` é a única indicação para funções como `printf` e `strlen` sobre onde a string termina. Se o `\0` for sobrescrito ou omitido, essas funções continuarão lendo bytes adjacentes na memória até encontrar um byte zero aleatório, o que pode causar vazamento de dados ou falha de segmentação.

## Erros Comuns
1. **Esquecer o byte de terminação nula:**
   ```c
   char str[5] = "Hello"; // ERRO: Hello precisa de 6 bytes. Não haverá espaço para o \0!
   ```
2. **Buffer Overflow:** Copiar dados para uma string sem verificar se há espaço suficiente.
3. **Comparar strings usando `==`:**
   ```c
   char s1[] = "Ola";
   char s2[] = "Ola";
   if (s1 == s2) { ... } // ERRADO: Compara os endereços de memória, não os caracteres!
   ```
   *Solução:* Use `strcmp(s1, s2) == 0`.

## Exemplos

### Remoção segura do caractere de quebra de linha (`\n`) do `fgets`
```c
#include <stdio.h>
#include <string.h>

void limpar_quebra_linha(char *str) {
    size_t len = strlen(str);
    if (len > 0 && str[len - 1] == '\n') {
        str[len - 1] = '\0';
    }
}

int main(void) {
    char nome[30];
    printf("Digite seu nome: ");
    if (fgets(nome, sizeof(nome), stdin)) {
        limpar_quebra_linha(nome);
        printf("Nome lido: [%s]\n", nome);
    }
    return 0;
}
```

### Conversão de String para Números (`<stdlib.h>`)
```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char str_int[] = "1234";
    char str_double[] = "3.1415";

    int val_int = atoi(str_int);       // Converte para int
    double val_double = atof(str_double); // Converte para double

    printf("Inteiro: %d, Real: %.4f\n", val_int, val_double);
    return 0;
}
```

## Exercícios
1. **(Iniciante)** Crie uma função que receba uma string e converta todos os seus caracteres para maiúsculas (Dica: use `toupper` da biblioteca `<ctype.h>`).
2. **(Iniciante)** Escreva uma função que inverta uma string in-place sem usar memória auxiliar.
3. **(Intermediário)** Escreva um programa que leia uma string e determine se ela é um palíndromo (ex: "radar", "arara").
4. **(Intermediário)** Implemente sua própria versão da função `strcmp`: `int meu_strcmp(const char *s1, const char *s2)`.
5. **(Avançado)** Crie um analisador léxico básico que leia uma string de expressão matemática (ex: `12 + 45 * 2`) e a divida em tokens separados em um array de strings.

## Referências
- [cppreference — C Strings](https://en.cppreference.com/w/c/string/byte)
- [OWASP C-Based Tooling Vulnerabilities — Buffer Overflow](https://owasp.org/www-community/vulnerabilities/Buffer_Overflow_via_sprintf)
