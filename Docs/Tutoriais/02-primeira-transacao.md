# 🎓 Tutorial: Registrando sua Primeira Transação

> **Objetivo:** Ao final deste tutorial, você saberá como registrar receitas e despesas no PoupEazy, entender como elas se conectam aos orçamentos e visualizar seus dados no Dashboard.

---

## Pré-requisitos

- PoupEazy rodando localmente ([Tutorial: Primeiros Passos](./01-primeiros-passos.md))
- Conta criada e logada no sistema

---

## Entendendo o Fluxo de Transações

No PoupEazy, toda transação (receita ou despesa) está vinculada a um **orçamento mensal**. Isso significa que, antes de criar uma transação, o sistema precisa de um orçamento para o mês correspondente.

```
Orçamento Mensal (Maio/2026)
├── Despesa: Supermercado — R$ 350,00
├── Despesa: Combustível — R$ 200,00
├── Receita: Salário — R$ 3.500,00
└── ...
```

O sistema cria automaticamente o orçamento ao registrar uma transação para um novo mês.

---

## Passo 1 — Acessar a página de Transações

1. No menu lateral (sidebar), clique em **💳 Transações**
2. Você verá a página com:
   - Lista de transações (inicialmente vazia)
   - Filtros por tipo (Todas, Receitas, Despesas)
   - Campo de busca
   - Botão **+ Nova Transação**

---

## Passo 2 — Registrar uma Receita

Vamos começar registrando uma receita (salário):

1. Clique em **+ Nova Transação**
2. Preencha o formulário:

   | Campo | Valor |
   |-------|-------|
   | **Tipo** | Receita |
   | **Descrição** | Salário de Maio |
   | **Valor** | 3500.00 |
   | **Data** | 05/05/2026 |
   | **Categoria** | Salário |

3. Clique em **Salvar**

Você verá uma notificação de sucesso (toast) e a transação aparecerá na lista com a tag verde de "Receita".

---

## Passo 3 — Registrar uma Despesa

Agora vamos registrar uma despesa:

1. Clique em **+ Nova Transação** novamente
2. Preencha:

   | Campo | Valor |
   |-------|-------|
   | **Tipo** | Despesa |
   | **Descrição** | Supermercado Extra |
   | **Valor** | 287.50 |
   | **Data** | 08/05/2026 |
   | **Categoria** | Alimentação |

3. Clique em **Salvar**

A despesa aparecerá na lista com a tag vermelha de "Despesa".

---

## Passo 4 — Verificar o impacto no Dashboard

1. Volte ao **Dashboard** pelo menu lateral
2. Observe os cards atualizados:
   - **Receita:** R$ 3.500,00
   - **Despesa:** R$ 287,50
   - **Saldo:** R$ 3.212,50
3. O gráfico de **Despesas por Categoria** agora mostra "Alimentação"
4. As **Transações Recentes** listam as operações que você acabou de criar

---

## Passo 5 — Filtrar e buscar transações

De volta à página de Transações:

1. **Filtrar por tipo:** Clique em "Despesas" para ver apenas as despesas
2. **Buscar:** Digite "supermercado" no campo de busca para encontrar transações específicas
3. **Voltar:** Clique em "Todas" para ver todas as transações novamente

---

## O que acontece por trás dos panos?

Quando você cria uma transação, o sistema:

1. **Verifica/cria o orçamento** do mês correspondente à data da transação
2. **Insere a transação** na tabela `despesas` vinculada ao orçamento
3. **O trigger `trg_orcamento_valor_real`** recalcula automaticamente o `valor_real` do orçamento
4. **Se vinculada a uma meta**, o trigger `trg_metas_valor_atual` atualiza o progresso da meta
5. **O Dashboard** lê os dados atualizados via hooks React (`useTransactions`, `useBudget`)

---

## Próximos passos

- 🎯 [Tutorial: Criando Metas Financeiras](./03-criando-metas.md) — Vincule transações a metas de poupança
- 📊 [How-to: Gerenciar Orçamentos Mensais](../How-tos/05-gerenciar-orcamentos.md) — Configure limites de gastos por mês
