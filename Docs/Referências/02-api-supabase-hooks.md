# 📖 Referência: API Supabase — Endpoints e Hooks

> Documentação dos hooks React que encapsulam a comunicação com o Supabase.

---

## Arquitetura

O PoupEazy não possui backend customizado. A comunicação é feita via `@supabase/supabase-js` com segurança por RLS.

**Cliente:** `frontend/src/lib/supabase.ts`

---

## Hooks

### `useAuth` — `frontend/src/hooks/useAuth.tsx`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `user` | `User \| null` | Usuário autenticado |
| `session` | `Session \| null` | Sessão Supabase ativa |
| `profile` | `Profile \| null` | Dados do profile |
| `loading` | `boolean` | Indica se o estado de autenticação está sendo resolvido |
| `signUp(email, password, nome, telefone?)` | `async` | Criar conta (telefone é opcional) |
| `signIn(email, password)` | `async` | Login |
| `signOut()` | `async` | Logout |
| `updateProfile(data)` | `async` | Atualizar dados do profile |

### `useTransactions` — `frontend/src/hooks/useTransactions.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `transactions` | `DespesaComCategoria[]` | Lista de transações com categoria via join |
| `loading` | `boolean` | Indica se está carregando |
| `refresh` | `() => Promise` | Recarrega a lista de transações |
| `addTransaction(data)` | `async` | Criar transação |
| `updateTransaction(id, data)` | `async` | Atualizar |
| `deleteTransaction(id)` | `async` | Remover |

**Tabela:** `despesas` | **Triggers:** `orcamento.valor_real`, `metas.valor_atual`

### `useBudget` — `frontend/src/hooks/useBudget.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `budgets` | `Orcamento[]` | Orçamentos mensais |
| `loading` | `boolean` | Indica se está carregando |
| `refresh` | `() => Promise` | Recarrega a lista de orçamentos |
| `addBudget(data)` | `async` | Criar orçamento |
| `updateBudget(id, data)` | `async` | Atualizar |
| `getOrCreateBudget(mes, ano)` | `async → Orcamento \| null` | Obtém orçamento existente ou cria com valor_planejado = 0 |

### `useGoals` — `frontend/src/hooks/useGoals.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `goals` | `Meta[]` | Metas financeiras |
| `loading` | `boolean` | Indica se está carregando |
| `refresh` | `() => Promise` | Recarrega a lista de metas |
| `addGoal(data)` | `async` | Criar meta |
| `updateGoal(id, data)` | `async` | Atualizar |
| `deleteGoal(id)` | `async` | Remover |

### `useCategories` — `frontend/src/hooks/useCategories.ts`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `categories` | `Categoria[]` | Categorias (sistema + pessoais) |
| `loading` | `boolean` | Indica se está carregando |
| `refresh` | `() => Promise` | Recarrega a lista de categorias |
| `addCategory(data)` | `async` | Criar categoria |
| `updateCategory(id, data)` | `async` | Atualizar categoria |
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
