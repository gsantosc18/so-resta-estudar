# Makefile e Sistemas de Build

## Objetivo
Compreender a automação de builds de projetos C usando o utilitário `make` e arquivos `Makefile`, definindo regras de compilação incremental de arquivos objeto, dependências, e targets utilitários como `clean`.

## Pré-requisitos
- [Ambiente de Desenvolvimento (Módulo 1)](../01-foundations/02-setup.md)
- [Estrutura de um Programa C (Módulo 1)](../01-foundations/03-program-structure.md)

## Conceitos Fundamentais

### Por que Automação de Build?
Para projetos com múltiplos arquivos `.c`, digitar `gcc` manualmente a cada alteração é ineficiente e propenso a erros. Um **Makefile** especifica como compilar e linkar as partes do projeto de forma automatizada e inteligente (apenas arquivos modificados são recompilados).

---

### Estrutura básica de uma Regra
Um `Makefile` é composto por um conjunto de regras com a seguinte sintaxe:

```makefile
alvo: dependencias
	comando1
	comando2
```
> [!IMPORTANT]
> A linha de comandos abaixo do alvo **deve obrigatoriamente ser iniciada com um caractere TAB**. Espaços normais farão com que o `make` apresente erros de sintaxe e falhe.

---

### Variáveis no Makefile
Definimos variáveis para tornar a compilação configurável e limpa.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
LDFLAGS = -lm # Bibliotecas para o Linker
```

---

### Variáveis Automáticas (Atalhos)
- **`$@`:** Representa o nome do alvo (target) atual da regra.
- **`$^`:** Representa a lista de todas as dependências da regra.
- **`$<`:** Representa a primeira dependência da regra.

---

### Exemplo de Regra Genérica (Compilação Incremental)
Para evitar compilar tudo todas as vezes, convertemos cada `.c` em um arquivo objeto `.o` (compilação). Só então linkamos todos os `.o` no executável final.

```makefile
# Regra implícita: converte qualquer arquivo .c em .o correspondente
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

---

### Alvos Fonias (Phony Targets)
Alvos que não geram arquivos reais na pasta do projeto, mas atuam como comandos utilitários (ex: limpar binários antigos). Devem ser declarados na diretiva `.PHONY` para evitar conflito com arquivos de mesmo nome que porventura existam no disco.

```makefile
.PHONY: all clean

all: programa

clean:
	rm -f *.o programa
```

## Funcionamento Interno
O `make` compara a data de última modificação (timestamp) do arquivo do *alvo* com as datas de suas *dependências*. Se o arquivo de dependência for mais novo do que o arquivo do alvo (ou se o alvo não existir), o `make` executa a receita associada. Se nada mudou, ele pula a instrução emitindo a mensagem: `"make: 'alvo' is up to date."`.

## Erros Comuns
1. **Esquecer o caractere TAB:** Substituir por espaços gera o erro: `Makefile:*** missing separator. Stop.`.
2. **Esquecer de listar cabeçalhos (`.h`) como dependências:** Se você alterar uma struct em um arquivo `.h`, mas o `.h` não estiver mapeado como dependência da regra do `.c` correspondente, o `make` não entenderá que precisa recompilar os arquivos objetos, gerando comportamentos bizarros na execução devido a layouts de memória dessincronizados.

## Exemplos

### Makefile de Estrutura Padrão para Projetos C
Abaixo está um modelo completo e profissional de Makefile para projetos organizados nas pastas `src` (fontes), `include` (cabeçalhos) e `build` (objetos compilados).

```makefile
# Variáveis do Compilador e Flags
CC = gcc
CFLAGS = -Wall -Wextra -Wpedantic -std=c11 -Iinclude -g
LDFLAGS = 

# Pastas do Projeto
SRC_DIR = src
INC_DIR = include
OBJ_DIR = build

# Busca todos os arquivos .c na pasta src
SRCS = $(wildcard $(SRC_DIR)/*.c)
# Mapeia os caminhos de .c em src para .o em build
OBJS = $(patsubst $(SRC_DIR)/%.c, $(OBJ_DIR)/%.o, $(SRCS))

# Nome do Executável Final
TARGET = meu_programa

# Alvo Principal
all: $(TARGET)

# Linkagem final
$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

# Compilação dos objetos individuais
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

# Garante a criação da pasta build antes de gerar os .o
$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

# Limpeza
clean:
	rm -rf $(OBJ_DIR) $(TARGET)

.PHONY: all clean
```

## Exercícios
1. **(Iniciante)** Crie um Makefile básico contendo apenas dois alvos: um para compilar um `main.c` simples e outro alvo `.PHONY` chamado `rodar` que compila e executa o binário sequencialmente.
2. **(Iniciante)** Adicione variáveis de compilador (`CC` e `CFLAGS`) ao Makefile do exercício anterior para permitir compilar com `clang` em vez de `gcc` apenas redefinindo a variável no Makefile.
3. **(Intermediário)** Escreva um Makefile que diferencie o build de desenvolvimento (com flags de debug `-g`) do build de produção (com flags de otimização `-O3` e remoção de símbolos de depuração), acionados por alvos separados `make debug` e `make release`.
4. **(Intermediário)** Configure a criação de diretórios de build dinamicamente a partir do Makefile (ex: criar pasta `bin` e `obj` caso elas não existam na pasta raiz).
5. **(Avançado)** Estude a ferramenta CMake: configure um arquivo `CMakeLists.txt` simples para seu projeto C e use-o para gerar o Makefile de forma automatizada multiplataforma.

## Referências
- [GNU Make Manual](https://www.gnu.org/software/make/manual/make.html)
- [A Simple Makefile Tutorial (Colby)](https://www.cs.colby.edu/maxwell/courses/tutorials/maketutor/)
