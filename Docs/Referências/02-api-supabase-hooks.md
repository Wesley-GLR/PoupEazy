# 📖 Referência: API Supabase — Endpoints e Hooks

> Documentação dos hooks React que encapsulam a comunicação com o Supabase.

---

## Arquitetura

O PoupEazy não possui backend customizado. A comunicação é feita via `@supabase/supabase-js` com segurança por RLS.

**Cliente:** `frontend/src/lib/supabase.ts`

---

## Hooks

### `useAuth` — `frontend/src/hooks/useAuth.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `user` | `User \| null` | Usuário autenticado |
| `profile` | `Profile \| null` | Dados do profile |
| `signUp(email, password, nome)` | `async` | Criar conta |
| `signIn(email, password)` | `async` | Login |
| `signOut()` | `async` | Logout |

### `useTransactions` — `frontend/src/hooks/useTransactions.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `transactions` | `Despesa[]` | Lista de transações |
| `addTransaction(data)` | `async` | Criar transação |
| `updateTransaction(id, data)` | `async` | Atualizar |
| `deleteTransaction(id)` | `async` | Remover |

**Tabela:** `despesas` | **Triggers:** `orcamento.valor_real`, `metas.valor_atual`

### `useBudget` — `frontend/src/hooks/useBudget.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `budgets` | `Orcamento[]` | Orçamentos mensais |
| `addBudget(data)` | `async` | Criar orçamento |
| `updateBudget(id, data)` | `async` | Atualizar |
| `deleteBudget(id)` | `async` | Remover |

### `useGoals` — `frontend/src/hooks/useGoals.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `goals` | `Meta[]` | Metas financeiras |
| `addGoal(data)` | `async` | Criar meta |
| `updateGoal(id, data)` | `async` | Atualizar |
| `deleteGoal(id)` | `async` | Remover |

### `useCategories` — `frontend/src/hooks/useCategories.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `categories` | `Categoria[]` | Categorias (sistema + pessoais) |
| `addCategory(data)` | `async` | Criar categoria |
| `deleteCategory(id)` | `async` | Remover (somente pessoais) |

---

## Padrão de Consulta

```typescript
// SELECT
const { data, error } = await supabase.from('tabela').select('*')

// INSERT
const { data, error } = await supabase.from('tabela').insert(payload).select()

// UPDATE
const { data, error } = await supabase.from('tabela').update(payload).eq('id', id)

// DELETE
const { error } = await supabase.from('tabela').delete().eq('id', id)
```

> RLS filtra automaticamente por `auth.uid()`.
