# Arquivos e Entrada/Saída (I/O)

## Objetivo
Compreender como abrir, ler, escrever e fechar arquivos na linguagem C usando fluxos (streams) de arquivos de texto e arquivos binários, dominando o tratamento de erros em operações de disco.

## Pré-requisitos
- [Strings em C (Módulo 3)](../03-data-structures/02-strings.md)

## Conceitos Fundamentais

### A Estrutura `FILE`
Em C, todo acesso a arquivos é gerenciado através de um tipo especial chamado `FILE`, definido em `<stdio.h>`, que funciona como um identificador para o stream (fluxo) de dados associado.

---

### Abertura e Fechamento de Arquivos
Toda operação começa com `fopen` e deve obrigatoriamente terminar com `fclose` para liberar buffers do sistema.

```c
FILE *fp = fopen("dados.txt", "r"); // Abre para leitura
if (fp == NULL) {
    perror("Erro ao abrir arquivo");
    return -1;
}

// ... operações de leitura ...

fclose(fp); // Libera o recurso
```

---

### Modos de Abertura Comuns
| Modo | Descrição |
|---|---|
| `"r"` | Leitura (arquivo deve existir). |
| `"w"` | Escrita (cria arquivo novo ou limpa/sobrescreve o existente). |
| `"a"` | Anexar (escreve dados no final do arquivo). |
| `"rb"`, `"wb"`, `"ab"` | Abre os arquivos no modo **Binário** em vez de texto. |
| `"r+"`, `"w+"`, `"a+"` | Modos mistos de leitura e escrita simultâneos. |

---

### Operações em Arquivos de Texto

#### Escrita:
- `fputc(c, fp)`: Escreve um caractere.
- `fputs(str, fp)`: Escreve uma string.
- `fprintf(fp, format, ...)`: Escrita formatada (semelhante ao `printf`).

#### Leitura:
- `fgetc(fp)`: Lê um caractere. Retorna `EOF` ao fim do arquivo.
- `fgets(buffer, tamanho, fp)`: Lê uma linha completa de forma segura.
- `fscanf(fp, format, ...)`: Leitura formatada.

---

### Operações em Arquivos Binários
Arquivos binários armazenam os bytes brutos da memória diretamente em disco (ex: salvar structs completas).

```c
// Escrita de blocos de dados
size_t fwrite(const void *ptr, size_t tamanho, size_t nmemb, FILE *stream);

// Leitura de blocos de dados
size_t fread(void *ptr, size_t tamanho, size_t nmemb, FILE *stream);
```

---

### Navegando pelo Arquivo (Posicionamento)
- `fseek(fp, offset, origem)`: Move o cursor interno do arquivo. Origens: `SEEK_SET` (início), `SEEK_CUR` (atual), `SEEK_END` (fim).
- `ftell(fp)`: Retorna a posição atual do cursor em bytes.
- `rewind(fp)`: Volta o cursor para o início do arquivo.

## Funcionamento Interno
As funções do C usam buffers de memória intermediários. Ao escrever algo via `fprintf`, os dados não vão imediatamente para o disco físico; eles são agrupados na memória RAM pelo sistema de I/O do C. A gravação física ocorre quando:
1. O buffer enche.
2. `fclose` é chamado.
3. `fflush(fp)` é executado manualmente.

## Erros Comuns
1. **Não verificar o retorno de `fopen`:** Aberturas de arquivo podem falhar por falta de permissão, arquivo inexistente, disco cheio, etc. Tentar acessar `fp` nulo causará Segmentation Fault.
2. **Esquecer de chamar `fclose`:** Deixar arquivos abertos causa vazamento de recursos do SO (file descriptors leaks). Em servidores, isso pode travar o serviço após algumas horas.
3. **Errar na comparação do fim de arquivo (EOF):** `fgetc` retorna um `int` e não um `char` para poder comportar o valor especial de `EOF` (-1). Trate a leitura com tipo `int`.

## Exemplos

### Leitura Segura de Linhas de Texto
```c
#include <stdio.h>

int main(void) {
    FILE *fp = fopen("lista.txt", "r");
    if (!fp) {
        perror("Erro ao abrir");
        return 1;
    }

    char buffer[256];
    int linha = 1;
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("Linha %d: %s", linha++, buffer);
    }

    fclose(fp);
    return 0;
}
```

### Salvando e Carregando Structs de Forma Binária
```c
#include <stdio.h>

typedef struct {
    int id;
    char nome[20];
    float nota;
} RegistroAluno;

int main(void) {
    RegistroAluno turma[2] = {
        {.id = 1, .nome = "Alice", .nota = 9.5},
        {.id = 2, .nome = "Bob",   .nota = 8.0}
    };

    // 1. Salvando dados no modo binário
    FILE *fout = fopen("alunos.bin", "wb");
    if (fout) {
        fwrite(turma, sizeof(RegistroAluno), 2, fout);
        fclose(fout);
    }

    // 2. Lendo dados do arquivo binário
    FILE *fin = fopen("alunos.bin", "rb");
    if (fin) {
        RegistroAluno aluno_lido;
        // Lê um registro de cada vez
        while (fread(&aluno_lido, sizeof(RegistroAluno), 1, fin) == 1) {
            printf("ID: %d | Nome: %s | Nota: %.1f\n", 
                   aluno_lido.id, aluno_lido.nome, aluno_lido.nota);
        }
        fclose(fin);
    }

    return 0;
}
```

## Exercícios
1. **(Iniciante)** Escreva um programa que leia caracteres digitados pelo usuário no console e os salve em um arquivo de texto até que a tecla 'Esc' ou 'q' seja digitada.
2. **(Iniciante)** Escreva um utilitário que faça a cópia exata de um arquivo de texto caractere por caractere.
3. **(Intermediário)** Escreva um programa que leia um arquivo de texto contendo números e calcule a média aritmética de todos os valores.
4. **(Intermediário)** Escreva uma função que retorne o tamanho em bytes de um arquivo sem percorrê-lo caractere por caractere (Dica: use `fseek` e `ftell`).
5. **(Avançado)** Crie um editor de arquivo CSV básico em C: o programa deve carregar o CSV em structs dinâmicas, permitir inserção de dados pelo usuário e salvar as atualizações mantendo o formato delimitado por vírgulas.

## Referências
- [cppreference — File Input/Output](https://en.cppreference.com/w/c/io)
- [C File I/O (Programiz)](https://www.programiz.com/c-programming/c-file-input-output)
