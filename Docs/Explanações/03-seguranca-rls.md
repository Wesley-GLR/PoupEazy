# 💡 Explanação: Segurança e Row Level Security (RLS)

> Entendimento do modelo de segurança do PoupEazy e como o RLS protege os dados dos usuários.

---

## O Problema

Em uma aplicação web tradicional, a segurança dos dados é implementada no **backend**: um middleware valida o token do usuário e filtra os dados antes de retorná-los. No PoupEazy, **não existe backend customizado** — o frontend se comunica diretamente com o banco de dados via Supabase.

Como garantir que o Usuário A **nunca** acesse os dados do Usuário B?

---

## A Solução: Row Level Security

O PostgreSQL oferece um recurso chamado **Row Level Security (RLS)**, que permite definir **policies** (regras) diretamente no banco de dados. Essas policies determinam quais linhas cada usuário pode ver, inserir, atualizar ou deletar.

### Como funciona

1. O usuário faz login via Supabase Auth e recebe um **JWT** (JSON Web Token)
2. Cada requisição ao banco inclui esse JWT
3. O PostgreSQL extrai o `auth.uid()` do JWT
4. As policies filtram os dados usando `auth.uid()` como critério

```sql
-- Exemplo: usuário só vê suas próprias metas
CREATE POLICY "metas_select_own" ON metas
  FOR SELECT
  USING (auth.uid() = id_usuario);
```

---

## Policies por Tabela

### Tabelas com acesso direto por `id_usuario`

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | `id = auth.uid()` | `id = auth.uid()` | `id = auth.uid()` | — |
| `metas` | `id_usuario = auth.uid()` | ✅ | ✅ | ✅ |
| `orcamento` | `id_usuario = auth.uid()` | ✅ | ✅ | ✅ |
| `open_finance_tokens` | `id_usuario = auth.uid()` | ✅ | ✅ | ✅ |
| `notificacoes` | `id_usuario = auth.uid()` | — | ✅ | ✅ |

### Tabela `categoria` — Regra especial

Categorias do sistema (`sistema = TRUE`) são visíveis para todos. Categorias personalizadas são visíveis apenas para o dono:

```sql
CREATE POLICY "categoria_select" ON categoria
  FOR SELECT
  USING (sistema = TRUE OR auth.uid() = id_usuario);
```

### Tabela `despesas` — Validação indireta

A tabela `despesas` **não tem** coluna `id_usuario`. A propriedade é derivada via `id_orcamento`:

```sql
CREATE POLICY "despesas_select_own" ON despesas
  FOR SELECT
  USING (id_orcamento IN (
    SELECT id FROM orcamento WHERE id_usuario = auth.uid()
  ));
```

Isso é uma decisão de design: evita redundância de dados e garante integridade referencial.

---

## Camadas de Segurança

```
1. Supabase Auth (JWT)         → Identidade do usuário
2. Row Level Security (RLS)    → Isolamento de dados no banco
3. Constraints (CHECK)         → Integridade dos dados
4. Triggers (proteção)         → Categorias do sistema protegidas
5. HTTPS/TLS                   → Criptografia em trânsito
```

---

## O que o RLS NÃO faz

- **Não valida lógica de negócio complexa** — ex: não impede inserir uma despesa com valor negativo (isso é feito por CHECK constraints)
- **Não protege contra SQL injection** — o Supabase client já parametriza queries automaticamente
- **Não substitui validação no frontend** — UX e feedback ao usuário ainda precisam ser implementados no React

---

## Testando o RLS

Para verificar que o RLS está funcionando:

1. Crie dois usuários distintos no app
2. Crie dados (metas, transações) com cada usuário
3. Faça login com o Usuário A e verifique que ele **não vê** os dados do Usuário B
4. No Supabase SQL Editor, execute como `service_role` (ignora RLS) para ver todos os dados
