# Structs (Estruturas de Dados)

## Objetivo
Compreender como agrupar variáveis de diferentes tipos sob um único nome usando `struct`, dominar o acesso a seus membros, entender o alinhamento e empacotamento de memória (padding/packing), e o uso do operador seta (`->`).

## Pré-requisitos
- [Ponteiros: fundamentos (Módulo 2)](../02-memory/02-pointers-basics.md)

## Conceitos Fundamentais

### O que é uma Struct?
Uma `struct` (estrutura) é um tipo de dado composto definido pelo usuário que permite agrupar variáveis de diferentes tipos (membros) em um único bloco de memória.

---

### Declaração e Definição

```c
// Definição da struct
struct Livro {
    char titulo[50];
    char autor[50];
    int paginas;
    double preco;
};

// Declaração de variável do tipo struct
struct Livro livro1;

// Uso de typedef para evitar digitar "struct" toda vez (muito comum)
typedef struct {
    char nome[50];
    int idade;
} Pessoa;

Pessoa pessoa1; // Declaração limpa
```

---

### Inicialização e Acesso a Membros
Podemos acessar e modificar membros de uma struct usando o operador de ponto `.`.

```c
// Inicialização clássica
Pessoa p1 = {"Alice", 25};

// Inicialização com designadores (C99+) — mais seguro e legível
Pessoa p2 = {
    .idade = 30,
    .nome = "Bob"
};

// Acesso
printf("Nome: %s, Idade: %d\n", p2.nome, p2.idade);
p2.idade = 31; // Modificação
```

---

### Ponteiros e Structs (Operador `->`)
Quando trabalhamos com ponteiros para structs, usamos o operador seta `->` para acessar seus membros.

```c
Pessoa p1 = {"Carlos", 40};
Pessoa *ptr = &p1;

// Estas duas expressões são equivalentes:
(*ptr).idade = 41; // Acesso via dereferência
ptr->idade = 41;   // Equivalente simplificado e recomendado
```

---

### Structs como Parâmetros
Structs são passadas para funções **por valor** (cópia completa). Para structs grandes, isso é ineficiente. É recomendável passar **por ponteiro**:

```c
// Ineficiente: copia toda a struct Pessoa (56 bytes) na stack
void exibir_pessoa_infeiciente(Pessoa p);

// Eficiente: passa apenas o endereço (8 bytes em 64-bit)
// const garante que a função não modificará os dados
void exibir_pessoa_eficiente(const Pessoa *p) {
    printf("Nome: %s, Idade: %d\n", p->nome, p->idade);
}
```

## Funcionamento Interno

### Alinhamento e Padding (Preenchimento)
O tamanho de uma struct na memória nem sempre é a soma dos tamanhos de seus membros. O compilador insere bytes vazios de preenchimento (padding) para alinhar os dados aos limites naturais de palavra da CPU (ex: múltiplos de 4 ou 8 bytes).

```c
struct Exemplo {
    char c;     // 1 byte
    // 3 bytes de padding inseridos aqui para alinhar 'i'
    int i;      // 4 bytes
    char d;     // 1 byte
    // 3 bytes de padding inseridos aqui para alinhar tamanho final
}; // sizeof(struct Exemplo) = 12 bytes (e não 9!)
```

```
Estrutura na memória (12 bytes):
┌───┬───┬───┬───┬───────────────┬───┬───┬───┬───┐
│ c │  padding  │       i       │ d │  padding  │
└───┴───┴───┴───┴───────────────┴───┴───┴───┴───┘
```

**Packing (Empacotamento):** Se o espaço for crítico (como em firmware), podemos forçar a remoção do padding:

```c
#pragma pack(push, 1)
struct ExemploEmpacotado {
    char c;     // 1 byte
    int i;      // 4 bytes
    char d;     // 1 byte
};
#pragma pack(pop)
// sizeof(struct ExemploEmpacotado) = 6 bytes
```
> [!WARNING]
> Structs empacotadas forçam o processador a ler memória não alinhada, o que reduz o desempenho em algumas arquiteturas e pode causar crashes em outras (ex: ARM antigo).

## Erros Comuns
1. **Esquecer o ponto e vírgula `;` no fim da definição da struct:**
   ```c
   struct Conta {
       int numero;
   } // ERRO DE COMPILAÇÃO: falta ';' aqui
   ```
2. **Comparar structs diretamente com `==`:**
   ```c
   Pessoa p1 = {"Ana", 20};
   Pessoa p2 = {"Ana", 20};
   if (p1 == p2) { ... } // ERRO DE COMPILAÇÃO: C não suporta comparação direta de structs
   ```
   *Solução:* Compare membro por membro ou implemente uma função de comparação.

3. **Retornar ponteiro para struct declarada na stack dentro de uma função:**
   ```c
   Pessoa* criar_pessoa(void) {
       Pessoa p = {"Erro", 99};
       return &p; // ERRO CRÍTICO: p é destruída ao retornar da função!
   }
   ```

## Exemplos

### Manipulando Structs no Heap
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *titulo;
    int paginas;
} Livro;

Livro* criar_livro(const char *titulo, int paginas) {
    Livro *novo = malloc(sizeof(Livro));
    if (!novo) return NULL;

    novo->titulo = malloc(strlen(titulo) + 1);
    if (!novo->titulo) {
        free(novo);
        return NULL;
    }
    strcpy(novo->titulo, titulo);
    novo->paginas = paginas;
    return novo;
}

void destruir_livro(Livro *l) {
    if (l) {
        free(l->titulo);
        free(l);
    }
}

int main(void) {
    Livro *meu_livro = criar_livro("Dom Casmurro", 256);
    if (meu_livro) {
        printf("Livro: %s (%d págs)\n", meu_livro->titulo, meu_livro->paginas);
        destruir_livro(meu_livro);
    }
    return 0;
}
```

## Exercícios
1. **(Iniciante)** Crie uma struct chamada `Ponto` (com variáveis `x` e `y` do tipo `float`). Escreva uma função que receba dois pontos e calcule a distância euclidiana entre eles.
2. **(Iniciante)** Declare um array de structs `Aluno` (com `nome` e `nota`) contendo 5 elementos. Leia os dados dos alunos e exiba a média geral da turma.
3. **(Intermediário)** Escreva um programa que analise os tamanhos das structs descritas na seção "Alinhamento e Padding" usando `sizeof` e exiba a diferença na memória.
4. **(Intermediário)** Implemente um sistema básico de banco de dados em memória para gerenciar uma lista de até 100 produtos (`id`, `nome`, `preco`) usando structs.
5. **(Avançado)** Crie um motor de física simplificado 2D com structs para `Vetor2D`, `Particula` (com posição, velocidade, aceleração e massa) e funções para atualizar a posição a cada passo de tempo (física newtoniana).

## Referências
- [cppreference — Struct declaration](https://en.cppreference.com/w/c/language/struct)
- [Data Alignment and Padding (GeeksforGeeks)](https://www.geeksforgeeks.org/structure-member-alignment-padding-and-data-packing/)
