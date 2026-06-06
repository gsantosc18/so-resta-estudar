# Boas Práticas e Padrões de Código

## Objetivo
Adotar padrões de codificação da indústria (como MISRA C ou SEI CERT C), organizando projetos de forma modular, aplicando programação defensiva, lidando com erros de forma resiliente e evitando comportamentos indefinidos (Undefined Behaviors).

## Pré-requisitos
- Todos os módulos anteriores do guia de estudos de C.

## Conceitos Fundamentais

### Evitar Comportamento Indefinido (Undefined Behavior - UB)
Em C, quando o código viola as regras do padrão da linguagem, o compilador não é obrigado a emitir um erro, e o resultado da execução torna-se completamente imprevisível.
- **Exemplos comuns de UB:** Estourar limites de array, dereferenciar ponteiros nulos, estouro de inteiros com sinal (signed integer overflow), uso de variáveis locais não inicializadas.

---

### Programação Defensiva
Assuma que erros vão acontecer (entrada do usuário incorreta, ponteiros nulos, falhas de I/O) e monte barreiras de proteção preventivas.

- **Valide todos os parâmetros de entrada de funções públicas:**
  ```c
  void processar_dados(const int *dados, size_t tamanho) {
      if (dados == NULL || tamanho == 0) {
          // Trate o erro de forma segura
          return;
      }
      // ... processamento seguro ...
  }
  ```

---

### Tratamento e Propagação de Erros
Diferente de C++ ou Java, C não possui sistema de exceções (`try-catch`). Erros devem ser tratados por meio de códigos de retorno ou passagem de ponteiros de status.

#### Prática recomendada (Retornar Código de Status):
```c
typedef enum {
    STATUS_OK = 0,
    STATUS_ERR_NOMEM,
    STATUS_ERR_INVALID,
    STATUS_ERR_IO
} Status;

Status ler_arquivo(const char *caminho, char **conteudo) {
    if (!caminho || !conteudo) return STATUS_ERR_INVALID;
    
    FILE *fp = fopen(caminho, "r");
    if (!fp) return STATUS_ERR_IO;
    
    // ...
    fclose(fp);
    return STATUS_OK;
}
```

---

### Organização de Diretórios
Mantenha seus projetos padronizados para facilitar a colaboração e a escalabilidade.

```
meu-projeto/
├── src/           # Arquivos de código-fonte (.c)
│   ├── main.c
│   └── modulo1.c
├── include/       # Arquivos de cabeçalho (.h)
│   └── modulo1.h
├── test/          # Testes unitários (.c)
├── build/         # Arquivos objetos compilados (.o) - gerados no build
├── bin/           # Executáveis finais - gerados no build
├── Makefile       # Arquivo de build
└── README.md      # Documentação
```

---

### Padrões de Codificação da Indústria
- **MISRA C:** Um conjunto de diretrizes de software originalmente desenvolvido para a indústria automobilística, hoje usado em sistemas aeroespaciais, médicos e embarcados críticos de alta confiabilidade. Restringe recursos perigosos do C (ex: proíbe alocação dinâmica e limita o uso de ponteiros avançados).
- **SEI CERT C Coding Standard:** Padrão voltado para segurança de software, focando em evitar vulnerabilidades cibernéticas comuns (buffer overflows, injeções, erros de concorrência).

## Regras e Exceções

### Gerenciamento de Recursos
- **A Regra de Ouro:** Quem aloca, libera. A função ou o módulo responsável por instanciar um recurso no heap (`malloc`) idealmente deve ser responsável por destruí-lo (`free`). Caso o recurso seja retornado ao chamador, documente isso explicitamente nas assinaturas da API (ex: `Pessoa* criar_pessoa(void); // Retorna recurso que o chamador deve liberar`).

## Exemplos

### Padrão de Inicialização Segura e Cleanup Único
Uso de `goto` de forma saudável para cleanup de memória, evitando repetição desnecessária de `free` no código (padrão muito adotado no kernel do Linux).

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *dados1;
    int *dados2;
} Recurso;

Recurso* inicializar_recurso(size_t n) {
    Recurso *r = malloc(sizeof(Recurso));
    if (!r) return NULL;
    
    r->dados1 = NULL;
    r->dados2 = NULL;

    r->dados1 = malloc(n * sizeof(int));
    if (!r->dados1) goto erro;

    r->dados2 = malloc(n * sizeof(int));
    if (!r->dados2) goto erro;

    return r;

erro:
    // Limpeza em caso de falha parcial
    if (r->dados1) free(r->dados1);
    if (r->dados2) free(r->dados2);
    free(r);
    return NULL;
}
```

## Exercícios
1. **(Iniciante)** Reescreva uma função de divisão de dois inteiros aplicando programação defensiva para evitar divisão por zero, retornando um status de erro caso ocorra.
2. **(Iniciante)** Crie um cabeçalho `.h` que declare constantes e tipos usando enums e structs. Use include guards de forma correta e modularizada.
3. **(Intermediário)** Escreva um programa que faça parsing de entrada do usuário. Valide rigorosamente todos os limites de buffer para impedir qualquer possibilidade de buffer overflow (Use `fgets` e valide tamanhos antes de copiar).
4. **(Intermediário)** Pesquise sobre ferramentas de análise estática de código (como `cppcheck` ou `Clang Static Analyzer`). Instale uma delas e execute no seu projeto em C para identificar problemas ocultos.
5. **(Avançado)** Estude as 10 regras de segurança de C do SEI CERT C. Crie um guia de referência rápida em markdown com exemplos práticos aplicados a cada uma dessas regras.

## Referências
- [SEI CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c/SEI+CERT+C+Coding+Standard)
- [MISRA C Guidelines](https://www.misra.org.uk/)
- [NASA Jet Propulsion Laboratory (JPL) Coding Standards](https://lars-lab.jpl.nasa.gov/JPL_Coding_Standard_C.pdf)
