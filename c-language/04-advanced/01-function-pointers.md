# Ponteiros para Funções

## Objetivo
Compreender que funções também ocupam endereços de memória, aprender a declarar e inicializar ponteiros para funções, e utilizá-los para implementar callbacks e estruturas genéricas de processamento de dados.

## Pré-requisitos
- [Funções (Módulo 1)](../01-foundations/07-functions.md)
- [Ponteiros: fundamentos (Módulo 2)](../02-memory/02-pointers-basics.md)

## Conceitos Fundamentais

### O que é um Ponteiro para Função?
Assim como variáveis de dados, as funções compiladas são carregadas no segmento de código (text segment) na memória principal do computador. Um **ponteiro para função** armazena o endereço de início do código executável dessa função.

```
Layout conceitual de memória de um programa:
┌───────────────────────────┐
│ Segmento de Código (Text) │
├───────────────────────────┤
│ 0x00401000: somar()       │ <─── O ponteiro armazena este endereço
│ 0x00401050: subtrair()    │
└───────────────────────────┘
```

---

### Declaração de Ponteiro para Função
A declaração deve refletir exatamente a assinatura da função (tipo de retorno e parâmetros).

```c
// tipo_de_retorno (*nome_do_ponteiro)(tipos_dos_parametros);

int (*ptr_operacao)(int, int); 
```
> [!IMPORTANT]
> Os parênteses ao redor de `*nome_do_ponteiro` são obrigatórios. Sem eles, o compilador interpretará como uma declaração de função normal que retorna um ponteiro.
> - `int (*p)(int)` -> Ponteiro para função.
> - `int *p(int)`  -> Função que retorna um ponteiro para `int`.

---

### Atribuição e Chamada

```c
int somar(int a, int b) {
    return a + b;
}

int main(void) {
    // Inicialização (o nome da função decai para seu endereço)
    int (*op)(int, int) = somar; 

    // Chamada usando o ponteiro (ambas as sintaxes abaixo são válidas e idênticas)
    int res1 = (*op)(5, 3); // Sintaxe explícita
    int res2 = op(5, 3);   // Sintaxe implícita (mais usada)
    
    return 0;
}
```

---

### Callbacks (Funções de Retorno)
Podemos passar ponteiros para funções como parâmetros para outras funções. Esse é o padrão clássico de **Callback**.

```c
// Função executora que recebe o callback
void processar_numeros(int x, int y, int (*callback)(int, int)) {
    int resultado = callback(x, y);
    printf("Resultado do processamento: %d\n", resultado);
}
```

---

### Simplificação com `typedef`
A sintaxe de ponteiros para funções pode se tornar confusa rapidamente. O uso de `typedef` é altamente recomendado:

```c
// Define um alias chamado 'Operacao' que representa um ponteiro para função (int, int) -> int
typedef int (*Operacao)(int, int);

// Agora podemos usar de forma limpa:
Operacao op = somar;
void processar(int x, int y, Operacao callback);
```

## Funcionamento Interno
Em tempo de execução, ao chamar `op(5, 3)`, a CPU realiza um desvio incondicional (salto / branch) para o endereço contido em `op`, mudando o registrador PC (Program Counter) para a primeira instrução da função de destino, empilhando o endereço de retorno.

## Erros Comuns
1. **Esquecer os parênteses na declaração:**
   ```c
   double *ptr(double); // Declaração de função normal, e não um ponteiro!
   ```
2. **Incompatibilidade de Assinatura:** Tentar atribuir uma função com parâmetros ou retornos diferentes da declaração do ponteiro. O compilador emitirá avisos ou erros graves de tipagem.
3. **Ponteiro de função nulo:** Chamar uma função através de um ponteiro que é `NULL` causará crash imediato. Sempre valide se o ponteiro é válido antes de chamar.

## Exemplos

### Filtro Genérico de Array (Callbacks)
```c
#include <stdio.h>
#include <stdbool.h>

typedef bool (*Predicado)(int);

// Filtra elementos de um array baseado em uma condição dinâmica
void filtrar(const int *arr, int tamanho, Predicado condicao) {
    for (int i = 0; i < tamanho; i++) {
        if (condicao(arr[i])) {
            printf("%d ", arr[i]);
        }
    }
    printf("\n");
}

bool eh_par(int n) {
    return n % 2 == 0;
}

bool eh_positivo(int n) {
    return n > 0;
}

int main(void) {
    int dados[] = {-3, -1, 0, 2, 4, 7, 8};
    int n = sizeof(dados) / sizeof(dados[0]);

    printf("Pares: ");
    filtrar(dados, n, eh_par);

    printf("Positivos: ");
    filtrar(dados, n, eh_positivo);

    return 0;
}
```

### Tabela de Despacho (Dispatch Table)
Substitui estruturas longas de `switch-case` por execução direta indexada.

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

typedef int (*OpFunc)(int, int);

int main(void) {
    // Array de ponteiros para funções (Tabela de despacho)
    OpFunc calculadora[] = {add, sub, mul};

    int op = 2; // Representa Multiplicação (índice 2)
    int x = 6, y = 7;

    if (op >= 0 && op < 3) {
        int resultado = calculadora[op](x, y);
        printf("Resultado: %d\n", resultado); // 42
    }

    return 0;
}
```

## Exercícios
1. **(Iniciante)** Declare um ponteiro para uma função que recebe uma string e retorna um inteiro (`strlen`). Associe-o e teste.
2. **(Iniciante)** Crie três funções de saudação diferentes (ex: `saudar_pt`, `saudar_en`, `saudar_es`). Escreva uma função controladora que receba uma saudação como ponteiro e a execute.
3. **(Intermediário)** Escreva um clone simplificado de `qsort` que ordene um array de inteiros usando uma função de comparação personalizada recebida via parâmetro.
4. **(Intermediário)** Implemente um laço de eventos (event loop) de console. O usuário digita comandos e, dependendo da entrada, a correspondente função callback cadastrada é ativada usando uma tabela de despacho.
5. **(Avançado)** Crie um padrão Orientado a Objetos clássico em C: crie uma struct contendo dados de um objeto e ponteiros para funções que atuam como "métodos" da struct (passando explicitamente o ponteiro `this`/`self` como primeiro parâmetro).

## Referências
- [cppreference — Function pointer](https://en.cppreference.com/w/c/language/pointer#Pointers_to_functions)
- [Function Pointers in C (GeeksforGeeks)](https://www.geeksforgeeks.org/function-pointer-in-c/)
