# Compilação, Flags e Avisos (Warnings)

## Objetivo
Compreender como extrair o máximo do compilador GCC ou Clang, utilizando flags de warnings, padrões de linguagem C, otimizações de código e geração de símbolos para depuração.

## Pré-requisitos
- [Ambiente de Desenvolvimento (Módulo 1)](../01-foundations/02-setup.md)

## Conceitos Fundamentais

### O Papel do Compilador
O compilador C traduz arquivos de texto estruturados em código de máquina específico da arquitetura de CPU de destino. Ter um controle preciso sobre como essa tradução ocorre é fundamental para a qualidade e performance do software.

---

### Escolhendo o Padrão do C (`-std=`)
Como a linguagem evoluiu ao longo de décadas, é importante fixar o padrão que seu projeto utiliza:

```bash
# Padrão ANSI C (C89/C90)
gcc -std=c89 programa.c -o programa

# Padrão C99
gcc -std=c99 programa.c -o programa

# Padrão C11 (Mais universal hoje)
gcc -std=c11 programa.c -o programa

# Padrão C17 (Correções do C11)
gcc -std=c17 programa.c -o programa

# Padrão C23 (Mais recente)
gcc -std=c23 programa.c -o programa
```

---

### Flags de Warnings (Prevenção de Bugs)
Warnings não impedem a compilação, mas indicam falhas de lógica, conversões de tipos perigosas ou construções sintáticas problemáticas. **Sempre ative e trate os warnings como erros.**

- **`-Wall`:** Ativa um conjunto amplo de mensagens de aviso recomendadas (apesar do nome, não são todos).
- **`-Wextra`:** Ativa avisos adicionais que não são cobertos por `-Wall`.
- **`-Wpedantic`:** Emite avisos exigidos pela estrita conformidade aos padrões ISO C.
- **`-Werror`:** Transforma todos os avisos em erros de compilação, forçando o desenvolvedor a corrigi-los para conseguir rodar.

```bash
# Comando recomendado para desenvolvimento:
gcc -std=c11 -Wall -Wextra -Wpedantic -Werror programa.c -o programa
```

---

### Flags de Otimização (`-O`)
Controla o esforço do compilador para otimizar a velocidade e o tamanho do executável, às custas do tempo de compilação.

- **`-O0`:** Nenhuma otimização (padrão). Ideal para debug rápido.
- **`-O1`:** Otimizações básicas sem degradar tempo de compilação.
- **`-O2`:** Nível de otimização recomendado para código de produção.
- **`-O3`:** Ativa otimizações agressivas (como vetorização e inlining agressivo). Pode aumentar o tamanho do binário.
- **`-Os`:** Otimiza o código visando o menor tamanho físico do executável. Ideal para embarcados.

---

### Símbolos de Depuração (`-g`)
Gera metadados contendo informações do código-fonte (nomes de variáveis, linhas de código e nomes de funções) acoplados ao executável. Essencial para uso com ferramentas de depuração como GDB ou LLDB.

```bash
# Compila com símbolos de debug e sem otimizações (para manter compatibilidade de linhas)
gcc -g -O0 programa.c -o programa
```

---

### Definições de Preprocessamento via Terminal (`-D`)
Permite criar macros diretamente na invocação da compilação:

```bash
gcc -DDEBUG_MODE=1 programa.c -o programa
```

## Funcionamento Interno
O processo de compilação moderno com GCC/Clang envolve a geração de código intermediário. Flags de otimização alteram as fases do compilador (passos do AST e representações intermediárias como GIMPLE) para eliminar código morto, desdobrar loops (loop unrolling) e reorganizar instruções de forma mais favorável para o pipeline de hardware da CPU.

## Erros Comuns
1. **Compilar sem warnings:** Escrever código inseguro silenciosamente.
2. **Esquecer de desativar otimizações durante o debug:** Compilar com `-O3` e tentar depurar com `-g`. O compilador otimiza tanto o código que o GDB não consegue mais mapear quais instruções de assembly pertencem a quais linhas do código C (as variáveis são otimizadas fora e as linhas são reordenadas).
3. **Não configurar as flags corretas para linkar bibliotecas externas:** Por exemplo, esquecer da flag `-lm` para linkar a biblioteca matemática `<math.h>` no Linux.
   ```bash
   # Errado (causará erro de referência indefinida para sin, cos, etc.)
   gcc programa.c -o programa
   
   # Correto
   gcc programa.c -lm -o programa
   ```

## Exemplos

### Código com bug silencioso compilado com e sem `-Wall`
Considere o seguinte programa C (`bug.c`):

```c
#include <stdio.h>

int main(void) {
    int x; // Sem inicialização
    printf("Valor: %d\n", x);
    
    if (x = 5) { // Atribuição em vez de comparação
        printf("Sempre entra aqui.\n");
    }
    return 0;
}
```

```bash
# Compilação padrão (funciona silenciosamente)
gcc bug.c -o bug

# Compilação com flags rigorosas (Compilação aborta com erros claros)
gcc -Wall -Wextra -Werror bug.c -o bug
# Saída do compilador:
# bug.c: In function ‘main’:
# bug.c:5:5: error: ‘x’ is used uninitialized in this function [-Werror=uninitialized]
# bug.c:7:9: error: suggest parentheses around assignment used as truth value [-Werror=parentheses]
```

## Exercícios
1. **(Iniciante)** Crie um código C simples e intencionalmente cometa erros de tipo ou variáveis não declaradas. Tente compilar usando `-Wall` e analise a resposta do compilador.
2. **(Iniciante)** Crie um script bash ou comando no terminal que compile seu projeto usando o padrão C23 e ative todas as flags recomendadas neste guia.
3. **(Intermediário)** Escreva um código contendo um loop pesado de processamento matemático. Compile-o primeiro com `-O0` e meça o tempo de execução com `time ./programa`. Recompile com `-O3` e compare os resultados de tempo.
4. **(Intermediário)** Compile um programa com e sem a flag `-g`. Compare o tamanho em bytes de ambos os binários gerados usando `ls -lh`.
5. **(Avançado)** Configure a compilação de um projeto usando arquivos de cabeçalho dinâmicos complexos onde certas seções de depuração e verificação de limites são compiladas condicionalmente baseado na passagem de flags `-DDEBUG` via terminal.

## Referências
- [GCC Command Options](https://gcc.gnu.org/onlinedocs/gcc/Option-Summary.html)
- [How to write C code with zero compiler warnings](https://embeddedartistry.com/blog/2017/05/22/compiler-warnings-should-be-errors/)
