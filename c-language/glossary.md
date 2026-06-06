# Glossário — Linguagem C

Termos organizados em ordem alfabética.

---

## A

**Alocação dinâmica**: Reserva de memória em tempo de execução no heap, feita com funções como `malloc`, `calloc` e `realloc`. Requer liberação manual com `free`.

**Aritmética de ponteiros**: Operações matemáticas aplicadas a ponteiros. Incrementar um ponteiro avança pelo tamanho do tipo apontado, não por 1 byte.

**Array**: Sequência contígua de elementos do mesmo tipo na memória. Em C, o nome do array decai para um ponteiro para o primeiro elemento.

---

## B

**Buffer**: Região de memória usada para armazenar dados temporariamente, tipicamente durante operações de I/O.

**Buffer overflow**: Erro que ocorre quando dados são escritos além dos limites de um buffer, corrompendo memória adjacente.

---

## C

**calloc**: Função da stdlib que aloca memória para N elementos de determinado tamanho e inicializa tudo com zeros.

**Cast (type cast)**: Conversão explícita de um tipo de dado para outro. Ex: `(int) 3.14` converte o double para int.

**Compilação**: Processo de transformar código-fonte C em código objeto (`.o`) e depois em executável.

**Const**: Qualificador que declara que uma variável não pode ser modificada após a inicialização.

**Coerção implícita (implicit conversion)**: Conversão automática de tipo feita pelo compilador, como promover `int` para `double` em expressões mistas.

---

## D

**Dangling pointer**: Ponteiro que aponta para memória já liberada ou fora de escopo. Dereferenciá-lo causa comportamento indefinido.

**Dereferência (dereference)**: Acesso ao valor armazenado no endereço apontado por um ponteiro, usando o operador `*`.

**Double free**: Erro de chamar `free` duas vezes no mesmo ponteiro, causando corrupção do heap.

---

## E

**Endianness**: Ordem em que bytes de um valor multi-byte são armazenados na memória. Big-endian: byte mais significativo primeiro. Little-endian: byte menos significativo primeiro.

**Enum**: Tipo enumerado que associa nomes a valores inteiros constantes.

---

## F

**free**: Função da stdlib que libera memória previamente alocada com `malloc`/`calloc`/`realloc`.

**Função variádica**: Função que aceita número variável de argumentos. Ex: `printf`. Usa `<stdarg.h>`.

---

## G

**GDB**: GNU Debugger, ferramenta de depuração para programas C/C++ que permite executar o programa passo a passo, inspecionar variáveis e analisar core dumps.

---

## H

**Heap**: Região de memória gerenciada manualmente pelo programador. Usada para alocação dinâmica. Persiste além do escopo da função.

---

## I

**Include guard**: Técnica com `#ifndef`/`#define`/`#endif` (ou `#pragma once`) para evitar inclusão dupla de headers.

**Inline**: Sugestão ao compilador para substituir a chamada de função pelo corpo da função no ponto de chamada.

---

## L

**Linkage**: Determina se um identificador é visível em outras unidades de tradução. `static` = linkage interno; `extern` = linkage externo.

**Lista encadeada (linked list)**: Estrutura de dados onde cada elemento (nó) armazena um valor e um ponteiro para o próximo nó.

**Literal**: Valor fixo escrito diretamente no código. Ex: `42`, `'A'`, `"hello"`, `3.14`.

---

## M

**Macro**: Substituição de texto feita pelo preprocessador com `#define`. Não tem tipo e não respeita escopo.

**malloc**: Função da stdlib que aloca um bloco de N bytes no heap sem inicialização. Retorna `void*`.

**Makefile**: Arquivo de build que define regras de compilação. Gerenciado pela ferramenta `make`.

**Memory leak**: Falha em liberar memória alocada dinamicamente, causando consumo crescente de RAM ao longo do tempo.

**Modo de operação de arquivo**: Strings passadas a `fopen`: `"r"` (leitura), `"w"` (escrita), `"a"` (append), `"rb"` (leitura binária), etc.

---

## N

**NULL**: Ponteiro nulo, representado por `0` ou `(void*)0`. Dereferenciá-lo causa segmentation fault.

**Null terminator (`\0`)**: Byte nulo que marca o fim de uma string em C.

---

## O

**Objeto (C)**: Região de armazenamento de dados. Em C, "objeto" não tem a conotação de POO.

---

## P

**Padding**: Bytes inseridos pelo compilador entre campos de uma struct para alinhamento de memória.

**Ponteiro (pointer)**: Variável que armazena um endereço de memória.

**Ponteiro para função**: Ponteiro cujo tipo codifica a assinatura de uma função, permitindo chamar a função indiretamente.

**Preprocessador**: Fase de compilação que processa diretivas `#include`, `#define`, `#ifdef`, etc. antes da compilação real.

---

## R

**realloc**: Função da stdlib que redimensiona um bloco de memória previamente alocado.

**Recursão**: Função que chama a si mesma. Em C, cada chamada cria um novo frame na stack.

---

## S

**Segmentation fault (segfault)**: Erro de acesso a memória não permitida. Causas comuns: dereferência de NULL, acesso fora dos limites de arrays, uso de ponteiro não inicializado.

**Stack**: Região de memória gerenciada automaticamente. Armazena variáveis locais e frames de função. LIFO (Last In, First Out).

**Stack overflow**: Esgotamento da stack, geralmente por recursão infinita ou alocação de arrays muito grandes na stack.

**Static**: Palavra-chave com dois significados: (1) variáveis locais `static` persistem entre chamadas; (2) variáveis/funções globais `static` têm linkage interno.

**String**: Em C, array de `char` terminado com `\0`. Não é um tipo primitivo.

**Struct**: Tipo de dado composto que agrupa variáveis de tipos diferentes sob um nome.

---

## T

**Typedef**: Cria um alias de tipo. Ex: `typedef unsigned int uint32_t`.

---

## U

**Undefined behavior (UB)**: Comportamento não especificado pelo padrão C. O compilador pode gerar qualquer resultado. Causas: overflow de inteiro com sinal, acesso fora de bounds, dereferência de NULL, etc.

**Union**: Tipo que permite armazenar diferentes tipos no mesmo espaço de memória. O tamanho é o do maior membro.

---

## V

**Valgrind**: Ferramenta para detecção de memory leaks, uso de memória não inicializada e outros erros de memória.

**Variável automática**: Variável local com storage class `auto` (padrão). Criada na stack e destruída ao sair do escopo.

**Volatile**: Qualificador que informa ao compilador que o valor de uma variável pode ser alterado externamente (ex: hardware, outra thread), impedindo otimizações agressivas.

---

## W

**Warning**: Aviso do compilador sobre código potencialmente problemático. Tratar todos os warnings como erros é boa prática.
