# Sharding e Particionamento

## Objetivo
Compreender sharding (particionamento horizontal) de dados, estratégias de shard key, problemas de hot spots e resharding, e como bancos distribuídos implementam particionamento.

---
## Pré-requisitos
- [Database per Service](../03-data-patterns/01-database-per-service.md)
- [Load Balancing](02-load-balancing.md)

---
## Conceitos Fundamentais

### Particionamento vs Replicação
- **Replicação**: Cópias do **mesmo dado** em múltiplos nós (disponibilidade)
- **Particionamento/Sharding**: Subconjuntos **diferentes** dos dados em diferentes nós (escalabilidade)

### Estratégias de Particionamento

#### 1. Range-based
```
Shard A: users com ID 1-1.000.000
Shard B: users com ID 1.000.001-2.000.000
Shard C: users com ID 2.000.001-3.000.000
```
**Vantagem**: Range queries eficientes. **Desvantagem**: Hot spots (shard A pode receber mais writes se IDs sequenciais).

#### 2. Hash-based
```
Shard = hash(user_id) % num_shards
```
**Vantagem**: Distribuição uniforme. **Desvantagem**: Range queries impossíveis (dados espalhados).

#### 3. Directory-based
Tabela de lookup mapeia cada chave para seu shard.
**Vantagem**: Flexibilidade total. **Desvantagem**: O diretório é SPOF e gargalo.

### Problemas

#### Hot Spots
Uma shard key mal escolhida concentra tráfego:
```
Shard key: country_code
  BR: 80% dos dados → Shard BR sobrecarregada
  US: 15%
  Outros: 5%
```
**Solução**: Composite key (`country_code + user_id_hash`) ou salting.

#### Cross-Shard Queries
```sql
-- Fácil (single shard):
SELECT * FROM orders WHERE user_id = 123;

-- Difícil (scatter-gather):
SELECT * FROM orders WHERE created_at > '2024-01-01' ORDER BY total DESC;
-- Precisa consultar TODOS os shards e agregar resultados
```

#### Resharding
Adicionar/remover shards exige mover dados. **Consistent hashing** minimiza o impacto: apenas ~1/N dos dados precisa ser movido ao adicionar um shard.

---
## Casos de Uso
- **Instagram**: Shard por user_id (cada shard tem todos os dados de um subconjunto de usuários)
- **MongoDB**: Sharding nativo por shard key configurável
- **Vitess (YouTube)**: Sharding de MySQL para escala do YouTube

---
## Perguntas de Entrevista
### Nível Staff
**P: Como escolher uma shard key?**
R: Critérios: (1) **Cardinalidade alta** — muitos valores distintos. (2) **Distribuição uniforme** — evitar hot spots. (3) **Query pattern** — queries frequentes devem atingir poucos shards. (4) **Imutabilidade** — mudar a shard key exige mover dados. Exemplo: para e-commerce, `user_id` é boa para queries de "meus pedidos", mas ruim para "todos os pedidos de hoje" (scatter-gather).

---
## Referências
1. **Livro**: Kleppmann, M. (2017). *DDIA*, Cap. 6 — Partitioning
2. **Vitess**: [vitess.io](https://vitess.io)
3. **Tópicos relacionados**: [Database per Service](../03-data-patterns/01-database-per-service.md) | [Consistent Hashing](02-load-balancing.md)
