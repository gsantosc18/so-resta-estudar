# Valgrind e Detecção de Vazamentos (Memory Leaks)

## Objetivo
Compreender como utilizar a ferramenta `Valgrind` (especificamente o módulo `Memcheck`) para monitorar o uso de memória em tempo de execução, localizando memory leaks, acessos inválidos (out-of-bounds) e leituras de memória não inicializada.

## Pré-requisitos
- [Alocação Dinâmica de Memória (Módulo 2)](../02-memory/04-dynamic-allocation.md)
- [Depuração com GDB (Módulo 5)](./02-debugging.md)

## Conceitos Fundamentais

### O que é o Valgrind?
O Valgrind é uma ferramenta de análise dinâmica de código. Ela roda o seu programa dentro de um ambiente de simulação virtual de CPU, rastreando cada instrução de escrita, leitura, alocação e liberação de memória em tempo real.

---

### Executando com o Valgrind
Para obter relatórios úteis, o binário analisado deve ser compilado com símbolos de depuração (`-g`).

```bash
valgrind --leak-check=full ./programa
```

---

### Tipos de Vazamentos de Memória (Memory Leaks)
No final da execução, o Valgrind apresenta um relatório com quatro categorias de vazamentos no heap:

- **Definitely Lost (Definitivamente Perdido):** Memória alocada cujo ponteiro de acesso foi perdido para sempre (ex: ponteiro recebeu NULL antes de chamar `free`). **Este é um bug crítico.**
- **Indirectly Lost (Indiretamente Perdido):** Ocorre em estruturas complexas (como árvores ou listas). A estrutura pai foi perdida, logo, os filhos também se tornaram inacessíveis.
- **Possibly Lost (Possivelmente Perdido):** O ponteiro ainda existe, mas não aponta para o início do bloco de memória alocado (aponta para o meio do bloco).
- **Still Reachable (Ainda Alcançável):** Memória alocada que nunca foi liberada com `free`, mas cujos ponteiros ainda estavam disponíveis quando o programa terminou. Comum em programas que saem abruptamente, o SO limpa essa memória ao fechar, mas é considerado má prática em C.

---

### Erros de Memória Comuns Detectados

#### 1. Invalid Write / Invalid Read (Escrita/Leitura Inválida)
Acontece quando tentamos ler ou escrever em posições de memória fora do bloco alocado (buffer overflow na heap) ou após termos liberado o bloco (use-after-free).

#### 2. Use of uninitialised value (Uso de valor não inicializado)
Ocorre quando usamos variáveis locais ou blocos do `malloc` em testes condicionais (`if`) ou impressões (`printf`) antes de termos atribuído um valor inicial aos mesmos.

## Funcionamento Interno
O Valgrind funciona traduzindo o código de máquina do programa original (assembly) para uma representação intermediária independente da arquitetura (UCode). Ele insere rotinas de instrumentação dinâmicas nesta representação para rastrear o estado de cada byte de memória RAM (conhecidos como bits de validade "V" e bits de estado "A") e então traduz o UCode novamente para instruções da CPU nativa para execução. Isso torna o programa sob o Valgrind cerca de 20 a 50 vezes mais lento do que a execução normal.

## Erros Comuns
1. **Compilar sem `-g`:** O Valgrind informará que há vazamentos, mas não conseguirá traduzir os endereços de memória em números de linha do arquivo de código, exibindo apenas endereços hexadecimais brutos.
2. **Ignorar "Still Reachable" em bibliotecas:** Algumas bibliotecas de sistema realizam alocações internas uma única vez e não as liberam explicitamente para otimizar a velocidade de encerramento do processo. Esses vazamentos inofensivos podem poluir o relatório.

## Exemplos

### Código com múltiplos problemas de memória (`leaks.c`)
```c
#include <stdlib.h>
#include <stdio.h>

void gerar_vazamento(void) {
    int *arr = malloc(10 * sizeof(int));
    arr[0] = 5;
    // Falta free(arr) -> Definitely Lost
}

void ler_nao_inicializado(void) {
    int x; // Sem inicialização
    if (x > 0) { // Teste lógico com valor lixo -> Use of uninitialised value
        printf("Positivo\n");
    }
}

int main(void) {
    gerar_vazamento();
    ler_nao_inicializado();
    return 0;
}
```

```bash
# Compilação
gcc -g -O0 leaks.c -o leaks

# Análise
valgrind --leak-check=full ./leaks
```

Trecho de Saída do Valgrind:

```text
==12345== Conditional jump or move depends on uninitialised value(s)
==12345==    at 0x40114C: ler_nao_inicializado (leaks.c:11)
==12345==    by 0x40117E: main (leaks.c:18)
==12345== 
==12345== LEAK SUMMARY:
==12345==    definitely lost: 40 bytes in 1 blocks
==12345==    indirectly lost: 0 bytes in 0 blocks
==12345==      possibly lost: 0 bytes in 0 blocks
==12345==    still reachable: 0 bytes in 0 blocks
==12345== 
==12345== ERROR SUMMARY: 2 errors from 2 contexts (suppressed: 0 from 0)
```

## Exercícios
1. **(Iniciante)** Escreva um programa que aloque memória dinâmica, atribua valores a ela, e deliberadamente feche o programa sem executar `free`. Rode no Valgrind e interprete o relatório gerado.
2. **(Iniciante)** Crie um array dinâmico de 5 inteiros e tente escrever no índice 5 (out-of-bounds). Observe o erro `Invalid Write` reportado pelo Valgrind.
3. **(Intermediário)** Use o Valgrind para depurar o exercício de lista encadeada (Módulo 3). Garanta que após a exclusão da lista, o relatório do Valgrind exiba: `All heap blocks were freed -- no leaks are possible`.
4. **(Intermediário)** Compare o Valgrind com os "Sanitizers" do GCC compilando seu programa com a flag `-fsanitize=address` e execute o binário resultante. Analise as saídas de erros de ambos.
5. **(Avançado)** Aprenda a utilizar arquivos de supressão do Valgrind (`.supp`) para ignorar leaks conhecidos originados de bibliotecas externas (como biblioteca gráfica ou de sockets do sistema).

## Referências
- [Valgrind Quick Start Guide](https://valgrind.org/docs/manual/quick-start.html)
- [Valgrind Memcheck Manual](https://valgrind.org/docs/manual/mc-manual.html)
