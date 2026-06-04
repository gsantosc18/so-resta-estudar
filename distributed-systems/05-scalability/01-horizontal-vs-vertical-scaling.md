# Horizontal vs Vertical Scaling

## Objetivo
Compreender as estratégias de escalonamento vertical (scale up) e horizontal (scale out), seus trade-offs, e quando aplicar cada uma.

---
## Pré-requisitos
- Conceitos de infraestrutura e cloud computing
- [Falácias da Computação Distribuída](../01-foundations/04-fallacies-of-distributed-computing.md)

---
## Conceitos Fundamentais

### Vertical Scaling (Scale Up)
Aumentar os recursos de uma **única máquina**: mais CPU, RAM, disco, rede.
```
Antes: 4 vCPU, 16GB RAM → Depois: 32 vCPU, 128GB RAM
```
**Limite**: Existe um teto físico. A maior instância AWS tem 448 vCPU e 24TB RAM.

### Horizontal Scaling (Scale Out)
Adicionar **mais máquinas** distribuindo a carga entre elas.
```
Antes: 1 máquina (4 vCPU) → Depois: 10 máquinas (4 vCPU cada) = 40 vCPU total
```
**Sem limite teórico**: Adicione quantas máquinas precisar.

### Comparação

| Aspecto | Vertical | Horizontal |
|---------|----------|------------|
| **Complexidade** | Baixa (mesma arquitetura) | Alta (estado distribuído, networking) |
| **Limite** | Físico (hardware máximo) | Sem limite teórico |
| **Downtime** | Sim (precisa reiniciar) | Não (adiciona instâncias ao vivo) |
| **Custo** | Exponencial (CPUs maiores custam mais por unidade) | Linear (mais máquinas iguais) |
| **Redundância** | Nenhuma (SPOF) | Sim (múltiplas instâncias) |
| **Estado** | Simples (tudo local) | Complexo (shared state, sessions) |
| **Banco de dados** | Funciona bem até certo ponto | Requer sharding, replicação |

---
## Casos de Uso
- **Banco de dados**: Vertical primeiro (mais RAM = mais cache), horizontal quando não basta (read replicas, sharding)
- **APIs stateless**: Horizontal desde o início (fácil com load balancer)
- **Batch processing**: Horizontal (MapReduce, Spark)
- **Monolito legado**: Vertical (refatorar para horizontal é caro)

---
## Vantagens
### Vertical: Simplicidade, sem mudança de arquitetura, sem problemas de distribuição.
### Horizontal: Sem limite, redundância, zero downtime, custo linear.

## Desvantagens
### Vertical: Limite físico, SPOF, downtime no upgrade, custo exponencial.
### Horizontal: Complexidade, estado distribuído, consistência, networking.

---
## Erros Comuns
1. **"Vamos escalar horizontalmente desde o dia 1"** → Over-engineering. Comece vertical, escale horizontal quando precisar.
2. **Aplicação stateful sem session management** → Scale out sem externalizar sessions (Redis) = problemas.
3. **Banco de dados horizontal prematuro** → Sharding é complexo. Use read replicas primeiro.

---
## Perguntas de Entrevista
### Nível Senior
**P: Quando vertical scaling é melhor que horizontal?**
R: Quando o sistema é stateful e difícil de distribuir (banco de dados, monolito legado), quando a simplicidade operacional é prioritária, ou quando o custo de refatorar para horizontal supera o custo de hardware maior. Na prática, começa-se vertical e migra-se para horizontal quando se atinge o limite.

---
## Referências
1. **Livro**: Kleppmann, M. (2017). *Designing Data-Intensive Applications*, Cap. 1
2. **Tópicos relacionados**: [Load Balancing](02-load-balancing.md) | [Sharding](04-sharding-and-partitioning.md)
