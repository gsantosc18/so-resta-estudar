# Function Calling e Integração de Ferramentas

## Objetivo
Ao final deste tópico, o estudante será capaz de descrever o ciclo completo de payloads JSON do *Function Calling* sob o protocolo HTTP, projetar schemas JSON Schema robustos com sanitização contra injeções lógicas, implementar sandboxing para execução de código não confiável e projetar mecanismos de tratamento de erro para auto-correção de agentes.

## Pré-requisitos
- [Padrões e Fluxos Agênticos](01-agentic-workflows-and-patterns.md)

---

## Conceitos Fundamentais

### 1. O Ciclo de Mensagens do Function Calling (Sob Protocolo HTTP)
Embora os SDKs modernos abstraiam a interação com as APIs dos LLMs, o *Function Calling* opera como uma troca sequencial de requisições e respostas JSON sob chamadas HTTP sem estado (Stateless). O LLM em si **nunca faz conexões diretas de rede com APIs**; ele apenas analisa o prompt e os schemas fornecidos e retorna um objeto de instrução estruturado.

O ciclo detalhado do protocolo consiste em quatro etapas lógicas:

```
                  ┌──────────────────────────────────────────────┐
                  │                 1. CLIENTE                   │
                  │ Envia: Histórico + Lista de JSON Schemas     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼ (HTTP POST /v1/chat/completions)
                  ┌──────────────────────────────────────────────┐
                  │                  2. MODELO                   │
                  │ Detecta intenção.                            │
                  │ Retorna: role="assistant", tool_calls=[...]  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼ (Retorno HTTP JSON)
                  ┌──────────────────────────────────────────────┐
                  │               3. BACKEND (App)               │
                  │ Intercepta args, valida, executa função local│
                  │ Retorna: role="tool", tool_call_id, content  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼ (HTTP POST com todo o histórico)
                  ┌──────────────────────────────────────────────┐
                  │                  4. MODELO                   │
                  │ Lê o resultado inserido no histórico.        │
                  │ Retorna: Resposta final formatada ao usuário │
                  └──────────────────────────────────────────────┘
```

#### A Estrutura dos Payloads HTTP
No payload de **entrada**, declaramos as ferramentas em um array `tools`:
```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "Qual o status do pedido 805?"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "consultar_pedido",
      "description": "Retorna o status atual de entrega de um pedido.",
      "parameters": {
        "type": "object",
        "properties": {
          "id_pedido": {"type": "integer", "description": "O ID numérico do pedido."}
        },
        "required": ["id_pedido"]
      }
    }
  }]
}
```

No payload de **resposta intermediária**, o modelo responde indicando o ID da chamada de ferramenta (`tool_calls`):
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "consultar_pedido",
          "arguments": "{\"id_pedido\": 805}"
        }
      }]
    }
  }]
}
```

---

### 2. Validação e Sanitização contra Injeções de Entrada
Disponibilizar ferramentas para IAs abre portas para vulnerabilidades severas se as entradas do LLM não forem devidamente validadas no seu backend de aplicação.

#### O Risco da Injeção Indireta por Parâmetros
Se o usuário digitar: *"Apague o banco de dados"*, e o agente tiver acesso à ferramenta `executar_sql(query: str)`, o LLM sob a influência do usuário pode gerar a string maliciosa `DROP TABLE Usuarios;`.
- **Regra de Ouro**: Nunca forneça ferramentas genéricas de execução de código aberto ou banco de dados estruturado direta (ex: `executar_codigo`, `executar_sql`).
- **Interfaces Restritas**: Forneça ferramentas granulares com parâmetros de tipos estritos, como: `consultar_pedido(id_pedido: int)` ou `atualizar_email(id_cliente: int, novo_email: str)`.
- **Validação de Tipos**: Use frameworks como Pydantic ou JSON Schema Validator no backend para garantir que strings não contenham caracteres de escape e que números estejam nos limites esperados antes de executar a função.

---

### 3. Confinamento e Sandboxing de Ferramentas de Código
Caso o agente precise rodar um interpretador de código autônomo (ex: o agente escreve um script Python para plotar um gráfico de ações), este código **nunca** deve rodar diretamente no servidor host de produção.
- **Docker Sandbox**: Rode o interpretador de código do agente em containers Docker efêmeros criados dinamicamente com limites rígidos de CPU, memória e rede desativada. O container é destruído imediatamente após a geração do output.
- **WebAssembly (WASM)**: Execute o código do agente dentro de uma máquina virtual WASM em nível de aplicação, oferecendo isolamento de memória e impedindo chamadas indesejadas de sistema.
- **MicroVMs (Firecracker / gVisor)**: Usado por provedores de nuvem para criar ambientes de virtualização leve que iniciam em milissegundos com isolamento de kernel completo.

---

### 4. Tratamento de Erros e Loops de Auto-correção
APIs de ferramentas podem falhar (erros 401, 500, timeouts). Um erro comum em desenvolvimento de RAG/Agentes é ocultar essa falha e retornar um texto genérico ou lançar uma exceção de sistema que trava o servidor.
- **Feedback de Erro de Ferramenta**: Capture a exceção no seu código de backend, formate-a em linguagem natural ou estrutura compreensível e envie-a de volta para o histórico do LLM com o papel `role="tool"`.
- *Exemplo de prompt retornado*: `"Erro na execução da ferramenta 'calcular_rota': A chave de API do provedor de mapas expirou (HTTP 401)."`
- Ao receber esse erro detalhado, o LLM entende que a ação falhou e pode escolher tentar uma ferramenta alternativa (ex: usar um mapa secundário) ou explicar a falha ao usuário com clareza.

---

## Erros Comuns

1. **Confiar nas Argumentações do LLM sem Conversão**: Tentar injetar a string retornada do LLM diretamente em variáveis numéricas sem utilizar conversores `int()` ou `float()` protegidos por blocos `try/except`.
2. **Esquecer de Passar o Histórico Inteiro na Segunda Chamada**: Enviar apenas a resposta da ferramenta para a API do LLM no passo final. O modelo precisa ler a pergunta inicial, a requisição de ferramenta, o resultado e a instrução do sistema tudo junto para sintetizar a resposta.
3. **Não Configurar `tool_choice` Adequadamente**: Configurar `tool_choice = "required"` em sistemas conversacionais gerais, forçando o modelo a tentar disparar uma chamada de ferramenta mesmo quando o usuário está apenas dizendo *"Oi, bom dia!"*.

---

## Exemplos

### Execução de Ferramentas com Tratamento de Erros Semânticos e Auto-correção (Python)
Este exemplo prático em Python implementa um backend seguro que simula falhas de rede de uma API de consulta e envia a descrição do erro detalhado para o agente propor alternativas lógicas.

```python
import json
from typing import Dict, Tuple

# Banco de dados simulando nossos clientes ativos
CLIENTES = {
    1001: {"nome": "Guilherme Santos", "plano": "Prime", "limite_credito": 5000.00},
    1002: {"nome": "Maria Souza", "plano": "Basic", "limite_credito": 1200.00}
}

# 1. Ferramenta de Backend Simulado com validação rígida e falhas intencionais
def consultar_limite_bancario(id_conta: int) -> Tuple[int, Dict]:
    # Sanitização e Validação do Tipo
    if not isinstance(id_conta, int):
        return 400, {"erro": "O ID da conta deve ser um número inteiro válido."}
        
    # Simulação de Erro de Negócio (Conta Inexistente)
    if id_conta not in CLIENTES:
        return 404, {"erro": f"Conta ID {id_conta} não localizada no sistema."}
        
    return 200, CLIENTES[id_conta]

# 2. Mecanismo de Execução do Orquestrador
def executar_pipeline_agente(pergunta_usuario: str) -> str:
    # Histórico de conversas inicial
    historico = [
        {"role": "system", "content": "Você é um assistente financeiro. Utilize a ferramenta 'consultar_limite_bancario' para buscar saldos. Se a conta não for encontrada ou a ferramenta der erro, explique o problema detalhadamente ao usuário ou tente corrigir."},
        {"role": "user", "content": pergunta_usuario}
    ]
    
    print(f"=== Pergunta do Usuário: '{pergunta_usuario}' ===")
    
    # Simulação do 1º Passo: O LLM analisa o prompt e decide chamar a ferramenta
    # (Simulamos o retorno JSON que o modelo enviaria indicando a chamada)
    print("\n[LLM Decision] Identificada necessidade de acionar ferramentas.")
    nome_funcao = "consultar_limite_bancario"
    
    # Caso 1: O usuário perguntou sobre conta que NÃO existe (1099)
    if "1099" in pergunta_usuario:
        argumentos = {"id_conta": 1099}
    else:
        argumentos = {"id_conta": 1001}
        
    print(f"   Solicitando Chamada: {nome_funcao} com args: {argumentos}")
    
    # Adiciona a chamada do assistente no histórico simulado
    historico.append({
        "role": "assistant",
        "tool_calls": [{
            "id": "call_9999",
            "type": "function",
            "function": {"name": nome_funcao, "arguments": json.dumps(argumentos)}
        }]
    })
    
    # Simulação do 2º Passo: Execução no Backend com Tratamento de Erros
    status_code, output_ferramenta = consultar_limite_bancario(argumentos["id_conta"])
    
    if status_code == 200:
        print(f"   [Backend Exec] Sucesso: {output_ferramenta}")
        conteudo_retorno = json.dumps(output_ferramenta)
    else:
        # Se deu erro, formatamos e passamos a falha amigavelmente para o LLM
        print(f"   [Backend Exec] Falha Detectada (HTTP {status_code}): {output_ferramenta}")
        conteudo_retorno = json.dumps({
            "erro_sistema": f"Falha na execução. Codigo {status_code}",
            "detalhes": output_ferramenta["erro"]
        })
        
    # Adiciona o retorno da ferramenta no histórico
    historico.append({
        "role": "tool",
        "tool_call_id": "call_9999",
        "name": nome_funcao,
        "content": conteudo_retorno
    })
    
    # Simulação do 3º Passo: O LLM lê o histórico completo (incluindo o erro ou sucesso) e gera resposta final
    print("\n[LLM Final Generation] Processando histórico de execuções...")
    
    if status_code == 200:
        resposta_final = f"Localizei a conta de {output_ferramenta['nome']}. O limite de crédito atual da conta é de R$ {output_ferramenta['limite_credito']:.2f} (Plano: {output_ferramenta['plano']})."
    else:
        resposta_final = f"Desculpe, não consegui finalizar a verificação. A ferramenta de consulta retornou um erro indicando que a conta ID {argumentos['id_conta']} não pôde ser localizada em nossa base de dados corporativa."
        
    return resposta_final

if __name__ == "__main__":
    # Teste de Fluxo de Sucesso
    resp_sucesso = executar_pipeline_agente("Qual o limite da conta 1001?")
    print(f"Resposta Final: {resp_sucesso}\n")
    
    # Teste de Fluxo de Erro Trato de Exceção
    resp_erro = executar_pipeline_agente("Consulte o limite da conta 1099.")
    print(f"Resposta Final: {resp_erro}")

```
---

## Perguntas de Entrevista

1. **Como funciona o fluxo de payloads HTTP JSON no mecanismo de Function Calling de APIs de LLMs de ponta a ponta?**
   *Resposta*: O fluxo de mensagens opera em quatro etapas: (1) O cliente envia uma chamada de completions contendo a lista de `tools` com seus respectivos JSON Schemas; (2) O LLM analisa o prompt do usuário, detecta a necessidade de ferramenta e retorna um JSON com `role: assistant` contendo o objeto `tool_calls` com a assinatura de chamada (ID da chamada, nome da função e argumentos stringificados); (3) A aplicação do cliente intercepta a instrução, realiza o parse dos argumentos, executa a função real localmente e envia o resultado de volta em uma nova chamada completions contendo a mensagem com `role: tool` e o respectivo `tool_call_id`; (4) O LLM lê todo o histórico contextual integrado e gera a resposta em linguagem natural.

2. **Como podemos prevenir injeções de código ou de banco de dados (SQL injection) ao expor ferramentas para agentes de IA?**
   *Resposta*: Para blindar o sistema, devemos: (1) Banir o fornecimento de ferramentas genéricas de execução livre (ex: `rodar_sql` ou `executar_codigo`); (2) Construir interfaces de ferramentas restritas e atômicas (ex: `consultar_saldo(id: int)`); (3) Implementar validação e sanitização estrita de parâmetros no backend do cliente usando frameworks de validação como Pydantic; (4) Executar as consultas utilizando parametrizações nativas (*Prepared Statements*) e limitar as permissões de acesso do usuário de conexão do banco de dados ao nível de leitura mínimo necessário.

3. **O que é confinamento (Sandboxing) de código em sistemas agênticos e quais são as tecnologias recomendadas para implementá-lo?**
   *Resposta*: Sandboxing é o isolamento lógico e físico do ambiente de execução do interpretador de código acionado pelo agente. Isso impede que códigos errôneos ou maliciosos do modelo deletem arquivos, acessem portas internas da nuvem ou afetem o sistema operacional hospedeiro. As tecnologias mais recomendadas são containers Docker efêmeros (iniciados e destruídos a cada execução sem rede ativa), WebAssembly (WASM) que isola a execução na camada de memória do interpretador na aplicação, e MicroVMs seguras baseadas em virtualização de hardware leve (como gVisor ou Firecracker).

---

## Exercícios

1. **[Teórico]** Desenhe um diagrama de sequência completo mostrando a troca de mensagens JSON entre a aplicação de backend local, a API do LLM e uma API externa de previsão climática para o caso de uso onde o usuário envia: *"Preciso do clima de hoje em São Paulo"*.
2. **[Prático]** Modifique a ferramenta de cálculo de imposto `calcular_imposto` mostrada nos exemplos deste arquivo para lançar uma exceção explicativa (ex: `ValueError`) caso o estado inserido não pertença à lista de estados suportados ("SP", "RJ", "MG"). Simule o envio da resposta de erro estruturada de volta para o LLM.
3. **[Design]** Projete o JSON Schema completo de especificação de ferramenta para um assistente de reservas de hotéis (`reservar_quarto`). O schema deve exigir a validação de formato de data ISO 8601 para check-in e check-out, o número de hóspedes (inteiro positivo limitado a 4) e uma tag de preferência de quarto opcional ("standard", "deluxe").

---

## Referências
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) — Documentação oficial para desenvolvedores sobre o fluxo de chamadas e mensagens de ferramentas.
- [JSON Schema Specification Guide](https://json-schema.org/) — Normas técnicas oficiais para declaração e validação de contratos JSON de dados.
- [Docker Sandboxing Best Practices](https://docs.docker.com/) — Guias lógicos de segurança sobre como executar código em containers isolados de forma segura.

