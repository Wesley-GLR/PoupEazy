-- =============================================================================
--  MIGRATION: OPEN_FINANCE_TOKENS
--  Cria a tabela de tokens OAuth 2.0 para integrações Open Finance/Pluggy,
--  habilita Row Level Security e configura políticas de acesso por usuário.
--
--  Como usar:
--    1. Abra o SQL Editor no painel do Supabase
--    2. Cole este script inteiro e execute
--    3. Verifique no Table Editor se a tabela apareceu corretamente
--
--  Este script é IDEMPOTENTE — pode ser rodado mais de uma vez sem causar erros.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CRIAÇÃO DA TABELA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS open_finance_tokens (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario        UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instituicao       VARCHAR(100)  NOT NULL,
    access_token_enc  TEXT          NOT NULL,
    refresh_token_enc TEXT,
    expira_em         TIMESTAMPTZ   NOT NULL,
    ultimo_uso        TIMESTAMPTZ,
    ativo             BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_token_usuario_instituicao UNIQUE (id_usuario, instituicao)
);

COMMENT ON TABLE open_finance_tokens
    IS 'Tokens OAuth 2.0 das integrações Open Finance / Pluggy. Armazena conexões bancárias do usuário.';

-- ---------------------------------------------------------------------------
-- 2. ÍNDICE PARA BUSCA RÁPIDA DE TOKENS ATIVOS POR USUÁRIO
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tokens_usuario
    ON open_finance_tokens (id_usuario, ativo)
    WHERE ativo = TRUE;

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE open_finance_tokens ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para tornar o script re-executável
DROP POLICY IF EXISTS "tokens_select_own" ON open_finance_tokens;
DROP POLICY IF EXISTS "tokens_insert_own" ON open_finance_tokens;
DROP POLICY IF EXISTS "tokens_update_own" ON open_finance_tokens;
DROP POLICY IF EXISTS "tokens_delete_own" ON open_finance_tokens;

-- O usuário só pode VER seus próprios tokens
CREATE POLICY "tokens_select_own"
    ON open_finance_tokens FOR SELECT
    USING (auth.uid() = id_usuario);

-- O usuário só pode INSERIR tokens para si mesmo
CREATE POLICY "tokens_insert_own"
    ON open_finance_tokens FOR INSERT
    WITH CHECK (auth.uid() = id_usuario);

-- O usuário só pode ATUALIZAR seus próprios tokens
CREATE POLICY "tokens_update_own"
    ON open_finance_tokens FOR UPDATE
    USING (auth.uid() = id_usuario);

-- O usuário só pode DELETAR seus próprios tokens
CREATE POLICY "tokens_delete_own"
    ON open_finance_tokens FOR DELETE
    USING (auth.uid() = id_usuario);

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
