# Unions e Enums

## Objetivo
Compreender a definição e aplicação de `union` (uniões) e `enum` (enumerações) em C, entendendo o compartilhamento de memória em uniões, e o uso de constantes simbólicas em enumerações para melhorar a legibilidade e segurança do código.

## Pré-requisitos
- [Structs (Estruturas de Dados)](./03-structs.md)

## Conceitos Fundamentais

### Unions (Uniões)
Uma `union` é um tipo de dado composto semelhante a uma `struct`, mas com uma diferença fundamental: todos os seus membros compartilham a **mesma posição de memória**. O tamanho total da união é igual ao tamanho do seu maior membro.

```c
union Dado {
    int i;
    float f;
    char c;
}; // O tamanho desta união na memória é de 4 bytes (tamanho de int/float)

union Dado d;
d.i = 42; // Atribui 42 ao espaço compartilhado
d.f = 3.14f; // Sobrescreve o mesmo espaço! d.i agora contém lixo
```

```
Compartilhamento de Memória (4 bytes):
┌──────────────────────────────────────┐
│                byte 0                │ <- d.c (1 byte)
├──────────────────────────────────────┤
│  byte 0  │  byte 1  │ byte 2 │ byte 3│ <- d.i (4 bytes) ou d.f (4 bytes)
└──────────────────────────────────────┘
```

---

### Enums (Enumerações)
Uma `enum` é um tipo definido pelo usuário que consiste em um conjunto de constantes inteiras nomeadas (chamadas enumeradores). Por padrão, o primeiro elemento tem o valor `0`, o segundo `1`, e assim por diante.

```c
enum DiaDaSemana {
    DOMINGO, // 0
    SEGUNDA, // 1
    TERCA,   // 2
    QUARTA,  // 3
    QUINTA,  // 4
    SEXTA,   // 5
    SABADO   // 6
};

enum DiaDaSemana hoje = QUARTA; // hoje recebe valor inteiro 3
```

Podemos definir valores personalizados explicitamente:

```c
enum StatusHTTP {
    HTTP_OK = 200,
    HTTP_BAD_REQUEST = 400,
    HTTP_UNAUTHORIZED = 401,
    HTTP_NOT_FOUND = 404,
    HTTP_INTERNAL_ERROR = 500
};
```

---

### Tagged Unions (Uniões Marcadas)
O caso de uso mais comum para `union` é combiná-la com `struct` e `enum` para criar tipos de dados variantes (tagged unions).

```c
typedef enum {
    TIPO_INT,
    TIPO_FLOAT,
    TIPO_STRING
} TipoValor;

typedef struct {
    TipoValor tipo;
    union {
        int i;
        float f;
        char *s;
    } dado;
} ValorVariante;
```

## Funcionamento Interno

### Alinhamento e Espaço de Memória da Union
O compilador C garante que o alinhamento da união seja adequado para todos os seus membros.

```c
#include <stdio.h>

union Exemplo {
    char c[9];  // 9 bytes
    int i;      // 4 bytes (requer alinhamento de 4 bytes)
}; // sizeof(union Exemplo) será 12 bytes por causa do alinhamento (padding)
```

## Erros Comuns
1. **Ler um membro inativo da Union:**
   ```c
   union Dado d;
   d.f = 3.14f;
   printf("%d\n", d.i); // ERRO: interpreta a representação binária do float como int (UB)
   ```
2. **Confundir Enum com Strings:**
   Em C, enums são estritamente representações simbólicas para **inteiros**. Você não pode imprimi-las ou lê-las diretamente como strings sem mapeamento manual.
   ```c
   enum DiaDaSemana hoje = SEGUNDA;
   printf("%s\n", hoje); // ERRO CRÍTICO: tenta tratar o inteiro 1 como um ponteiro de char
   ```

## Exemplos

### Tagged Union na Prática
```c
#include <stdio.h>

typedef enum {
    VAR_INT,
    VAR_DOUBLE
} TipoVar;

typedef struct {
    TipoVar tipo;
    union {
        int iVal;
        double dVal;
    } valor;
} Numero;

void imprimir_numero(const Numero *num) {
    switch (num->tipo) {
        case VAR_INT:
            printf("Inteiro: %d\n", num->valor.iVal);
            break;
        case VAR_DOUBLE:
            printf("Double: %.2f\n", num->valor.dVal);
            break;
    }
}

int main(void) {
    Numero n1;
    n1.tipo = VAR_INT;
    n1.valor.iVal = 100;

    Numero n2;
    n2.tipo = VAR_DOUBLE;
    n2.valor.dVal = 42.57;

    imprimir_numero(&n1);
    imprimir_numero(&n2);

    return 0;
}
```

### Convertendo Enum para String (Mapeamento)
```c
#include <stdio.h>

typedef enum {
    LOG_INFO,
    LOG_WARNING,
    LOG_ERROR
} NivelLog;

// Array de strings mapeado na mesma ordem dos valores da enum
const char* const NIVEL_LOG_STR[] = {
    "INFO",
    "AVISO",
    "ERRO"
};

void registrar(NivelLog nivel, const char *msg) {
    printf("[%s] %s\n", NIVEL_LOG_STR[nivel], msg);
}

int main(void) {
    registrar(LOG_INFO, "Sistema iniciado.");
    registrar(LOG_ERROR, "Falha de conexão com o banco de dados.");
    return 0;
}
```

## Exercícios
1. **(Iniciante)** Escreva uma união que armazene um `float` e um array de `char[4]`. Mostre como a alteração do `float` altera os valores em hexadecimal armazenados no array de caracteres (Dica: inspecione os bytes individualmente).
2. **(Iniciante)** Crie uma enum para representar os meses do ano. Escreva um programa que receba o número de um mês e use o `switch` para imprimir o nome correspondente.
3. **(Intermediário)** Escreva uma tagged union para modelar formas geométricas (Círculo, Retângulo) e calcule a área de uma forma dada.
4. **(Intermediário)** Implemente um protocolo de mensagens em rede simplificado: use uma struct contendo um código de operação (enum) e os dados da mensagem (union baseada no tipo de operação).
5. **(Avançado)** Crie um interpretador de bytecode simplificado. Defina instruções da máquina virtual (como `ADD`, `SUB`, `PUSH`, `POP`) usando enums, e o registrador/valores usando unions.

## Referências
- [cppreference — Union declaration](https://en.cppreference.com/w/c/language/union)
- [cppreference — Enumeration constant](https://en.cppreference.com/w/c/language/enum)
