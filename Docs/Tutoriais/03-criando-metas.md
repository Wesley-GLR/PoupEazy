# 🎓 Tutorial: Criando Metas Financeiras

> **Objetivo:** Ao final deste tutorial, você saberá criar metas financeiras, acompanhar o progresso através da barra de progresso e entender como as transações alimentam automaticamente suas metas.

---

## Pré-requisitos

- PoupEazy rodando localmente ([Tutorial: Primeiros Passos](./01-primeiros-passos.md))
- Pelo menos uma transação registrada ([Tutorial: Primeira Transação](./02-primeira-transacao.md))

---

## O que são Metas Financeiras?

Metas financeiras são objetivos de poupança com:

- **Nome** — Identificação da meta (ex: "Viagem de férias")
- **Valor objetivo** — Quanto você deseja acumular
- **Data limite** — Prazo para atingir o objetivo
- **Valor atual** — Progresso atual (calculado automaticamente pelas transações vinculadas)
- **Status** — Ativa, Concluída ou Cancelada

---

## Passo 1 — Acessar a página de Metas

1. No menu lateral, clique em **🎯 Metas**
2. Você verá a lista de metas (inicialmente vazia)
3. Cada meta exibe uma **barra de progresso** visual

---

## Passo 2 — Criar uma meta

1. Clique em **+ Nova Meta**
2. Preencha o formulário:

   | Campo | Valor |
   |-------|-------|
   | **Nome** | Fundo de Emergência |
   | **Descrição** | Reserva equivalente a 6 meses de despesas |
   | **Valor Objetivo** | 10000.00 |
   | **Data Limite** | 31/12/2026 |

3. Clique em **Salvar**

A meta aparecerá com a barra de progresso em **0%** e status **Ativa**.

---

## Passo 3 — Vincular transações à meta

Para que o progresso da meta seja atualizado, vincule transações a ela:

1. Vá para **💳 Transações**
2. Crie uma nova transação (ou edite uma existente):

   | Campo | Valor |
   |-------|-------|
   | **Tipo** | Despesa |
   | **Descrição** | Depósito poupança — fundo emergência |
   | **Valor** | 500.00 |
   | **Data** | 10/05/2026 |
   | **Categoria** | Outros |
   | **Meta** | Fundo de Emergência |

3. Salve a transação

---

## Passo 4 — Acompanhar o progresso

1. Volte à página de **🎯 Metas**
2. Observe que a meta "Fundo de Emergência" agora mostra:
   - **Valor atual:** R$ 500,00
   - **Barra de progresso:** 5%
   - **Status:** Ativa

Cada nova transação vinculada à meta atualiza automaticamente o progresso via trigger no banco de dados.

---

## Passo 5 — Gerenciar metas existentes

Na página de Metas, você pode:

- **✏️ Editar** — Alterar nome, descrição, valor objetivo ou prazo
- **✅ Concluir** — Marcar manualmente como concluída
- **❌ Cancelar** — Cancelar uma meta que não faz mais sentido
- **🗑️ Excluir** — Remover permanentemente a meta

---

## Como funciona o cálculo automático?

O banco de dados possui um trigger (`trg_metas_valor_atual`) que:

1. É acionado **automaticamente** a cada INSERT, UPDATE ou DELETE na tabela `despesas`
2. Recalcula o `valor_atual` da meta somando todas as despesas confirmadas vinculadas
3. Garante que o progresso exibido na interface é sempre preciso e atualizado

```sql
-- Lógica simplificada do trigger
UPDATE metas
SET valor_atual = (
    SELECT COALESCE(SUM(valor), 0)
    FROM despesas
    WHERE id_metas = meta.id AND status = 'confirmada' AND tipo = 'despesa'
)
WHERE id = meta_afetada;
```

---

## Dicas para boas metas financeiras

1. **Seja específico:** "Viagem para Gramado em julho" é melhor que "Viagem"
2. **Defina prazos realistas:** Considere sua renda e despesas fixas
3. **Divida metas grandes:** Em vez de uma meta de R$ 50.000, crie marcos intermediários
4. **Revise regularmente:** Ajuste valores e prazos conforme sua situação muda

---

## Próximos passos

- 📊 [How-to: Gerenciar Orçamentos Mensais](../How-tos/05-gerenciar-orcamentos.md) — Controle seus limites de gastos
- 📖 [Referência: Esquema do Banco de Dados](../Referências/01-esquema-banco-dados.md) — Detalhes técnicos da tabela `metas`
