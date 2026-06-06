# Depuração com GDB (GNU Debugger)

## Objetivo
Compreender como utilizar o GNU Debugger (`GDB`) ou `LLDB` para depurar programas C de forma interativa, definindo breakpoints, assistindo variáveis, inspecionando a pilha de chamadas (stack backtrace) e localizando a causa de falhas de segmentação (Segmentation Faults).

## Pré-requisitos
- [Compilação, Flags e Avisos (Módulo 5)](./01-compilation.md)

## Conceitos Fundamentais

### O que é o GDB?
O GDB é uma ferramenta de depuração de linha de comando poderosa que permite "olhar por dentro" de outro programa enquanto ele executa, ou ver o que o programa estava fazendo no momento exato em que travou.

---

### Preparando o Binário
Para depurar, você deve compilar o código adicionando símbolos de depuração e removendo otimizações.

```bash
gcc -g -O0 programa.c -o programa
```

---

### Iniciando o Depurador
```bash
gdb ./programa
```

Uma vez dentro do console interativo do GDB, utilize os comandos básicos de controle:

---

### Comandos de Controle Essenciais
| Comando | Abreviação | Descrição |
|---|---|---|
| `run` | `r` | Inicia a execução do programa a partir do início. |
| `break [local]` | `b` | Define um breakpoint. Local pode ser o nome de uma função (`b main`) ou linha (`b 15`). |
| `next` | `n` | Executa a próxima linha de código (passa por cima de chamadas de funções). |
| `step` | `s` | Executa a próxima linha de código (entra para dentro de funções). |
| `continue` | `c` | Retoma a execução normal do programa até o próximo breakpoint. |
| `print [expr]` | `p` | Avalia e exibe o valor atual de uma variável ou expressão (`p x`, `p *ptr`). |
| `display [expr]`| `disp`| Semelhante ao `print`, mas atualiza e mostra automaticamente a cada passo. |
| `list` | `l` | Mostra as linhas de código-fonte ao redor do cursor de execução atual. |
| `backtrace` | `bt` | Mostra a pilha de chamadas ativa (útil para ver como chegou a um erro). |
| `quit` | `q` | Sai do GDB. |

---

### Analisando Core Dumps (Pós-morte)
Quando um programa fecha com "Segmentation Fault", ele pode gerar um arquivo chamado `core dump` (um instantâneo da memória no momento do crash).

Podemos abrir o arquivo de core no GDB para ver onde o erro ocorreu:

```bash
gdb ./programa core
```
No console do GDB, execute `backtrace` para localizar a linha exata que disparou a falha de segmentação.

## Funcionamento Interno
O GDB interage com o kernel do sistema operacional utilizando chamadas de sistema específicas (como `ptrace` no Linux). Isso permite que o GDB pause o processo do programa, leia e escreva nos registradores da CPU (incluindo o Program Counter e registradores de dados) e leia o espaço de memória virtual do processo.

## Erros Comuns
1. **Esquecer a flag `-g` na compilação:** O GDB abrirá, mas exibirá mensagens de aviso informando que não há símbolos carregados (No debugging symbols found). Comandos como `list` e `break` por linhas não funcionarão.
2. **Depurar código otimizado (`-O2` ou `-O3`):** O cursor de execução saltará de forma errática entre as linhas e as variáveis exibirão valores como `<optimized out>`, impossibilitando uma análise precisa do fluxo de dados.

## Exemplos

### Sessão de Depuração Real: Diagnosticando Segmentation Fault
Considere o seguinte código problemático (`crash.c`):

```c
#include <stdio.h>

void funcao_perigosa(int *ptr) {
    *ptr = 42; // Causa falha se ptr for NULL
}

int main(void) {
    int *p = NULL;
    funcao_perigosa(p);
    return 0;
}
```

```bash
# 1. Compilação
gcc -g -O0 crash.c -o crash

# 2. Executando sob o GDB
gdb ./crash
```

Sessão interativa do GDB resultante:

```text
(gdb) run
Starting program: /home/usuario/crash 

Program received signal SIGSEGV, Segmentation fault.
0x0000000000401126 in funcao_perigosa (ptr=0x0) at crash.c:4
4	    *ptr = 42;
(gdb) backtrace
#0  0x0000000000401126 in funcao_perigosa (ptr=0x0) at crash.c:4
#1  0x0000000000401147 in main () at crash.c:9
(gdb) print ptr
$1 = (int *) 0x0
```

O GDB nos aponta diretamente para a linha 4 de `crash.c` e mostra que o parâmetro `ptr` recebido tinha o valor nulo `0x0`.

## Exercícios
1. **(Iniciante)** Compile um programa C simples contendo variáveis locais e use o GDB para definir um breakpoint na `main`, execute o programa passo a passo usando `next` e imprima os valores das variáveis em tempo real.
2. **(Iniciante)** Crie um programa com um loop infinito. Execute o programa no GDB, interrompa-o pressionando `Ctrl+C` e inspecione a linha onde ele foi pausado.
3. **(Intermediário)** Escreva um programa recursivo (como cálculo de Fibonacci) e use o comando `backtrace` para examinar todas as instâncias ativas na pilha durante uma execução profunda.
4. **(Intermediário)** Use o comando `watch [variavel]` no GDB (que define um Watchpoint) e observe como o programa pausa automaticamente no instante exato em que o valor dessa variável é modificado.
5. **(Avançado)** Aprenda a utilizar o TUI (Text User Interface) do GDB pressionando `Ctrl+X` seguido de `Ctrl+A` para visualizar o código C em tempo real de forma gráfica no terminal durante a depuração.

## Referências
- [GDB: The GNU Project Debugger](https://www.sourceware.org/gdb/)
- [GDB Cheat Sheet (UTexas)](https://www.cs.utexas.edu/~EWD/ewd10xx/EWD1080.PDF)
