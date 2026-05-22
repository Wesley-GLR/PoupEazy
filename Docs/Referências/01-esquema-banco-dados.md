# 📖 Referência: Esquema do Banco de Dados

> Documentação técnica completa do banco de dados PostgreSQL do PoupEazy, hospedado no Supabase.

---

## Diagrama Entidade-Relacionamento

```
┌──────────────────┐
│   auth.users     │ (Supabase Auth — gerenciado automaticamente)
│   (id, email)    │
└────────┬─────────┘
         │ 1:1 (trigger on_auth_user_created)
         ▼
┌──────────────────┐       ┌──────────────────┐
│    profiles      │       │    categoria     │
│ id (PK, FK)      │       │ id (PK)          │
│ nome             │       │ id_usuario (FK)  │◄── NULL = sistema
│ telefone         │       │ nome             │
│ criado_em        │       │ tipo             │
│ atualizado_em    │       │ icone            │
└──┬───┬───┬───┬───┘       │ sistema (bool)   │
   │   │   │   │           └────────┬─────────┘
   │   │   │   │                    │
   │   │   │   │     ┌─────────────┘
   │   │   │   ▼     ▼
   │   │   │  ┌──────────────────┐
   │   │   │  │    despesas      │
   │   │   │  │ id (PK)          │
   │   │   │  │ id_orcamento(FK) │──► orcamento
   │   │   │  │ id_categoria(FK) │──► categoria
   │   │   │  │ id_metas (FK)    │──► metas (nullable)
   │   │   │  │ valor            │
   │   │   │  │ data_transacao   │
   │   │   │  │ descricao        │
   │   │   │  │ tipo             │
   │   │   │  │ origem           │
   │   │   │  │ status           │
   │   │   │  │ nlp_metadata     │
   │   │   │  └──────────────────┘
   │   │   │
   │   │   ▼
   │   │  ┌──────────────────┐
   │   │  │     metas        │
   │   │  │ id (PK)          │
   │   │  │ id_usuario (FK)  │
   │   │  │ nome             │
   │   │  │ valor_objetivo   │
   │   │  │ valor_atual      │ ← Trigger: recalculado automaticamente
   │   │  │ data_limite      │
   │   │  │ status           │
   │   │  └──────────────────┘
   │   │
   │   ▼
   │  ┌──────────────────┐
   │  │   orcamento      │
   │  │ id (PK)          │
   │  │ id_usuario (FK)  │
   │  │ mes              │
   │  │ ano              │
   │  │ valor_planejado  │
   │  │ valor_real       │ ← Trigger: recalculado automaticamente
   │  │ atualizado_em    │
   │  └──────────────────┘
   │
   ▼
┌──────────────────────┐     ┌──────────────────┐
│ open_finance_tokens  │     │   notificacoes   │
│ id (PK)              │     │ id (PK)          │
│ id_usuario (FK)      │     │ id_usuario (FK)  │
│ instituicao          │     │ tipo             │
│ access_token_enc     │     │ titulo           │
│ refresh_token_enc    │     │ mensagem         │
│ expira_em            │     │ lida (bool)      │
│ ativo (bool)         │     │ criado_em        │
└──────────────────────┘     └──────────────────┘
```

---

## Tabelas

### `profiles`

Dados complementares do usuário. A autenticação é gerenciada pelo Supabase Auth.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | — | PK, FK → `auth.users(id)` |
| `nome` | VARCHAR(150) | NOT NULL | `''` | Nome completo |
| `telefone` | VARCHAR(20) | NULL | — | Telefone do usuário |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |
| `atualizado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Última atualização (trigger) |

---

### `metas`

Metas financeiras do usuário.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_usuario` | UUID | NOT NULL | — | FK → `profiles(id)` |
| `nome` | VARCHAR(100) | NOT NULL | — | Nome da meta |
| `descricao` | TEXT | NULL | — | Descrição opcional |
| `valor_objetivo` | DECIMAL(12,2) | NOT NULL | `0.00` | Valor alvo (> 0) |
| `valor_atual` | DECIMAL(12,2) | NOT NULL | `0.00` | Progresso (trigger) |
| `data_limite` | DATE | NOT NULL | — | Prazo final |
| `status` | VARCHAR(20) | NOT NULL | `'ativa'` | `ativa`, `concluida`, `cancelada` |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |

**Constraints:** `ck_metas_status`, `ck_metas_valor_positivo`

---

### `orcamento`

Orçamento mensal por usuário.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_usuario` | UUID | NOT NULL | — | FK → `profiles(id)` |
| `mes` | INT | NOT NULL | — | Mês (1-12) |
| `ano` | INT | NOT NULL | — | Ano (2000-2100) |
| `valor_planejado` | DECIMAL(12,2) | NOT NULL | `0.00` | Limite mensal (≥ 0) |
| `valor_real` | DECIMAL(12,2) | NOT NULL | `0.00` | Gasto real (trigger) |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |
| `atualizado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Última atualização (trigger) |

**Constraints:** `uq_orcamento_usuario_mes_ano` (UNIQUE), `ck_orcamento_mes`, `ck_orcamento_ano`, `ck_orcamento_valor_planejado`

---

### `categoria`

Categorias de transação (sistema e personalizadas).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_usuario` | UUID | NULL | — | FK → `profiles(id)`. NULL = sistema |
| `nome` | VARCHAR(100) | NOT NULL | — | Nome da categoria |
| `tipo` | VARCHAR(20) | NOT NULL | — | `despesa_fixa`, `despesa_variavel`, `receita` |
| `icone` | VARCHAR(50) | NULL | — | Nome do ícone Lucide |
| `sistema` | BOOLEAN | NOT NULL | `FALSE` | Protegida contra exclusão |

**Constraints:** `uq_categoria_nome_tipo_usuario` (UNIQUE), `ck_categoria_tipo`

**Categorias padrão do sistema:**

| Nome | Tipo | Ícone |
|------|------|-------|
| Alimentação | despesa_variavel | utensils |
| Transporte | despesa_variavel | car |
| Moradia | despesa_fixa | home |
| Saúde | despesa_variavel | heart-pulse |
| Lazer | despesa_variavel | music |
| Educação | despesa_variavel | book-open |
| Assinaturas | despesa_fixa | repeat |
| Outros | despesa_variavel | ellipsis |
| Salário | receita | briefcase |
| Freelance | receita | zap |
| Investimentos | receita | trending-up |

---

### `despesas`

Transações financeiras (receitas e despesas).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_orcamento` | UUID | NOT NULL | — | FK → `orcamento(id)` |
| `id_categoria` | UUID | NOT NULL | — | FK → `categoria(id)` |
| `id_metas` | UUID | NULL | — | FK → `metas(id)` (SET NULL on delete) |
| `valor` | DECIMAL(12,2) | NOT NULL | — | Valor (> 0) |
| `data_transacao` | DATE | NOT NULL | — | Data da transação |
| `descricao` | VARCHAR(255) | NOT NULL | — | Descrição textual |
| `tipo` | VARCHAR(20) | NOT NULL | — | `despesa` ou `receita` |
| `origem` | VARCHAR(20) | NOT NULL | `'manual'` | `manual`, `open_finance`, `chatbot` |
| `status` | VARCHAR(20) | NOT NULL | `'confirmada'` | `pendente`, `confirmada`, `cancelada` |
| `nlp_metadata` | JSONB | NULL | — | Dados de categorização automática |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |

**Constraints:** `ck_despesas_valor`, `ck_despesas_tipo`, `ck_despesas_origem`, `ck_despesas_status`

---

### `open_finance_tokens`

Tokens OAuth 2.0 para integração Open Finance.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_usuario` | UUID | NOT NULL | — | FK → `profiles(id)` |
| `instituicao` | VARCHAR(100) | NOT NULL | — | Nome da instituição bancária |
| `access_token_enc` | TEXT | NOT NULL | — | Token de acesso (criptografado) |
| `refresh_token_enc` | TEXT | NULL | — | Token de refresh (criptografado) |
| `expira_em` | TIMESTAMPTZ | NOT NULL | — | Data de expiração do token |
| `ultimo_uso` | TIMESTAMPTZ | NULL | — | Último uso do token |
| `ativo` | BOOLEAN | NOT NULL | `TRUE` | Se a integração está ativa |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |

**Constraints:** `uq_token_usuario_instituicao` (UNIQUE)

---

### `notificacoes`

Notificações e alertas do usuário.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `id_usuario` | UUID | NOT NULL | — | FK → `profiles(id)` |
| `tipo` | VARCHAR(30) | NOT NULL | — | `alerta_limite`, `meta_proxima`, `meta_concluida`, `dica`, `relatorio` |
| `titulo` | VARCHAR(200) | NOT NULL | — | Título da notificação |
| `mensagem` | TEXT | NOT NULL | — | Corpo da mensagem |
| `lida` | BOOLEAN | NOT NULL | `FALSE` | Se foi lida |
| `criado_em` | TIMESTAMPTZ | NOT NULL | `NOW()` | Data de criação |

---

## Triggers

| Trigger | Tabela | Evento | Função | Descrição |
|---------|--------|--------|--------|-----------|
| `trg_profiles_atualizado_em` | profiles | BEFORE UPDATE | `fn_set_atualizado_em()` | Atualiza `atualizado_em` |
| `trg_orcamento_atualizado_em` | orcamento | BEFORE UPDATE | `fn_set_atualizado_em()` | Atualiza `atualizado_em` |
| `trg_orcamento_valor_real` | despesas | AFTER INSERT/UPDATE/DELETE | `fn_sync_orcamento_valor_real()` | Recalcula `valor_real` do orçamento |
| `trg_metas_valor_atual` | despesas | AFTER INSERT/UPDATE/DELETE | `fn_sync_metas_valor_atual()` | Recalcula `valor_atual` da meta |
| `trg_protege_categoria_sistema` | categoria | BEFORE DELETE | `fn_protege_categoria_sistema()` | Impede exclusão de categorias do sistema |
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` | Cria profile automaticamente |

---

## Views

| View | Descrição |
|------|-----------|
| `vw_resumo_mensal` | Resumo de gastos por categoria/mês com percentual de orçamento consumido |
| `vw_progresso_metas` | Progresso das metas ativas com dias restantes e situação |
| `vw_historico_comparativo` | Comparativo mensal planejado vs real com variação mês-a-mês |

---

## Índices

| Índice | Tabela | Colunas | Tipo |
|--------|--------|---------|------|
| `idx_despesas_orcamento` | despesas | `id_orcamento, data_transacao DESC` | B-tree |
| `idx_despesas_categoria` | despesas | `id_categoria, data_transacao DESC` | B-tree |
| `idx_despesas_metas` | despesas | `id_metas` (WHERE NOT NULL) | B-tree parcial |
| `idx_despesas_origem` | despesas | `origem, status` | B-tree |
| `idx_despesas_descricao` | despesas | `descricao` | GIN (trigram) |
| `idx_despesas_nlp` | despesas | `nlp_metadata` | GIN |
| `idx_orcamento_usuario` | orcamento | `id_usuario, ano DESC, mes DESC` | B-tree |
| `idx_metas_usuario` | metas | `id_usuario, status, data_limite ASC` | B-tree |
| `idx_tokens_usuario` | open_finance_tokens | `id_usuario, ativo` (WHERE ativo) | B-tree parcial |
| `idx_notificacoes_usuario` | notificacoes | `id_usuario, lida, criado_em DESC` | B-tree |
