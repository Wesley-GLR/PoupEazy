-- =============================================================================
--  POUPEAZY — Script DDL para Supabase (PostgreSQL 15+)
--  Adaptado para Supabase Auth + Row Level Security
--  UNIFEI Itabira — Análise e Desenvolvimento de Software II
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 1. TABELA: PROFILES
--    Dados complementares do usuário. A autenticação (email/senha) é gerenciada
--    pelo Supabase Auth (auth.users). Esta tabela apenas estende com dados extras.
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id            UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome          VARCHAR(150)  NOT NULL DEFAULT '',
    telefone      VARCHAR(20),
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Dados complementares do usuário. Auth gerenciado por Supabase Auth.';

-- =============================================================================
-- 2. TABELA: METAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS metas (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nome          VARCHAR(100)    NOT NULL,
    descricao     TEXT,
    valor_objetivo DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    valor_atual   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    data_limite   DATE            NOT NULL,
    status        VARCHAR(20)     NOT NULL DEFAULT 'ativa'
                  CONSTRAINT ck_metas_status CHECK (status IN ('ativa', 'concluida', 'cancelada')),
    criado_em     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_metas_valor_positivo CHECK (valor_objetivo > 0)
);

COMMENT ON TABLE metas IS 'Metas financeiras por usuário.';

-- =============================================================================
-- 3. TABELA: ORCAMENTO
-- =============================================================================
CREATE TABLE IF NOT EXISTS orcamento (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mes           INT             NOT NULL CONSTRAINT ck_orcamento_mes CHECK (mes BETWEEN 1 AND 12),
    ano           INT             NOT NULL CONSTRAINT ck_orcamento_ano CHECK (ano BETWEEN 2000 AND 2100),
    valor_planejado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    valor_real    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    criado_em     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orcamento_usuario_mes_ano UNIQUE (id_usuario, mes, ano),
    CONSTRAINT ck_orcamento_valor_planejado CHECK (valor_planejado >= 0)
);

COMMENT ON TABLE orcamento IS 'Orçamento mensal por usuário.';

-- =============================================================================
-- 4. TABELA: CATEGORIA
-- =============================================================================
CREATE TABLE IF NOT EXISTS categoria (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID          REFERENCES profiles(id) ON DELETE CASCADE,
    nome          VARCHAR(100)  NOT NULL,
    tipo          VARCHAR(20)   NOT NULL
                  CONSTRAINT ck_categoria_tipo CHECK (tipo IN ('despesa_fixa', 'despesa_variavel', 'receita')),
    icone         VARCHAR(50),
    sistema       BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_categoria_nome_tipo_usuario UNIQUE (nome, tipo, id_usuario)
);

COMMENT ON TABLE categoria IS 'Categorias de transação. sistema=true são nativas e protegidas.';
COMMENT ON COLUMN categoria.id_usuario IS 'NULL = categoria do sistema, NOT NULL = categoria personalizada do usuário.';

-- Categorias padrão do sistema (seed)
INSERT INTO categoria (id_usuario, nome, tipo, icone, sistema) VALUES
    (NULL, 'Alimentação',   'despesa_variavel', 'utensils',       TRUE),
    (NULL, 'Transporte',    'despesa_variavel', 'car',            TRUE),
    (NULL, 'Moradia',       'despesa_fixa',     'home',           TRUE),
    (NULL, 'Saúde',         'despesa_variavel', 'heart-pulse',    TRUE),
    (NULL, 'Lazer',         'despesa_variavel', 'music',          TRUE),
    (NULL, 'Educação',      'despesa_variavel', 'book-open',      TRUE),
    (NULL, 'Assinaturas',   'despesa_fixa',     'repeat',         TRUE),
    (NULL, 'Outros',        'despesa_variavel', 'ellipsis',       TRUE),
    (NULL, 'Salário',       'receita',          'briefcase',      TRUE),
    (NULL, 'Freelance',     'receita',          'zap',            TRUE),
    (NULL, 'Investimentos', 'receita',          'trending-up',    TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. TABELA: DESPESAS (TRANSAÇÕES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS despesas (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_orcamento  UUID          NOT NULL REFERENCES orcamento(id) ON DELETE RESTRICT,
    id_categoria  UUID          NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    id_metas      UUID          REFERENCES metas(id) ON DELETE SET NULL,
    valor         DECIMAL(12,2) NOT NULL CONSTRAINT ck_despesas_valor CHECK (valor > 0),
    data_transacao DATE         NOT NULL,
    descricao     VARCHAR(255)  NOT NULL,
    tipo          VARCHAR(20)   NOT NULL
                  CONSTRAINT ck_despesas_tipo CHECK (tipo IN ('despesa', 'receita')),
    origem        VARCHAR(20)   NOT NULL DEFAULT 'manual'
                  CONSTRAINT ck_despesas_origem CHECK (origem IN ('manual', 'open_finance', 'chatbot')),
    status        VARCHAR(20)   NOT NULL DEFAULT 'confirmada'
                  CONSTRAINT ck_despesas_status CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
    nlp_metadata  JSONB,
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE despesas IS 'Transações financeiras. Suporta origem manual, Open Finance e ChatBot.';

-- =============================================================================
-- 6. TABELA: OPEN_FINANCE_TOKENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS open_finance_tokens (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instituicao   VARCHAR(100)  NOT NULL,
    access_token_enc  TEXT      NOT NULL,
    refresh_token_enc TEXT,
    expira_em     TIMESTAMPTZ   NOT NULL,
    ultimo_uso    TIMESTAMPTZ,
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_token_usuario_instituicao UNIQUE (id_usuario, instituicao)
);

COMMENT ON TABLE open_finance_tokens IS 'Tokens OAuth 2.0 das integrações Open Finance.';

-- =============================================================================
-- 7. TABELA: NOTIFICACOES
-- =============================================================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tipo          VARCHAR(30)   NOT NULL
                  CONSTRAINT ck_notificacoes_tipo CHECK (tipo IN ('alerta_limite', 'meta_proxima', 'meta_concluida', 'dica', 'relatorio')),
    titulo        VARCHAR(200)  NOT NULL,
    mensagem      TEXT          NOT NULL,
    lida          BOOLEAN       NOT NULL DEFAULT FALSE,
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notificacoes IS 'Notificações e alertas para o usuário (RF07).';

-- =============================================================================
-- 8. TRIGGERS
-- =============================================================================

-- 8.1 Atualizar atualizado_em
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_atualizado_em
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE OR REPLACE TRIGGER trg_orcamento_atualizado_em
    BEFORE UPDATE ON orcamento
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- 8.2 Recalcular valor_real no Orcamento
-- Regra de negócio:
-- - despesas confirmadas somam positivamente;
-- - receitas confirmadas reduzem o "gasto real" (subtração),
-- permitindo que valor_real represente saldo líquido de execução do orçamento.
CREATE OR REPLACE FUNCTION fn_sync_orcamento_valor_real()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_id_orcamento UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_id_orcamento := OLD.id_orcamento;
    ELSE
        v_id_orcamento := NEW.id_orcamento;
    END IF;

    UPDATE orcamento
    SET valor_real = (
        SELECT COALESCE(SUM(
            CASE tipo WHEN 'despesa' THEN valor WHEN 'receita' THEN -valor END
        ), 0.00)
        FROM despesas
        WHERE id_orcamento = v_id_orcamento AND status = 'confirmada'
    )
    WHERE id = v_id_orcamento;

    -- Quando uma transação muda de orçamento, também recalcula o orçamento antigo
    -- para evitar inconsistência de agregação entre meses.
    IF TG_OP = 'UPDATE' AND NEW.id_orcamento IS DISTINCT FROM OLD.id_orcamento THEN
        UPDATE orcamento
        SET valor_real = (
            SELECT COALESCE(SUM(
                CASE tipo WHEN 'despesa' THEN valor WHEN 'receita' THEN -valor END
            ), 0.00)
            FROM despesas
            WHERE id_orcamento = OLD.id_orcamento AND status = 'confirmada'
        )
        WHERE id = OLD.id_orcamento;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_orcamento_valor_real
    AFTER INSERT OR UPDATE OR DELETE ON despesas
    FOR EACH ROW EXECUTE FUNCTION fn_sync_orcamento_valor_real();

-- 8.3 Recalcular valor_atual nas Metas
-- Regra de negócio:
-- `metas.valor_atual` é a soma das despesas confirmadas vinculadas à meta.
-- Isso garante que o progresso mostrado na UI seja sempre derivado de transações reais.
CREATE OR REPLACE FUNCTION fn_sync_metas_valor_atual()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_ids_metas UUID[];
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_ids_metas := ARRAY[OLD.id_metas];
    ELSIF TG_OP = 'UPDATE' THEN
        v_ids_metas := ARRAY[NEW.id_metas, OLD.id_metas];
    ELSE
        v_ids_metas := ARRAY[NEW.id_metas];
    END IF;

    UPDATE metas m
    SET valor_atual = (
        SELECT COALESCE(SUM(d.valor), 0.00)
        FROM despesas d
        WHERE d.id_metas = m.id AND d.status = 'confirmada' AND d.tipo = 'despesa'
    )
    WHERE m.id = ANY(v_ids_metas) AND m.id IS NOT NULL;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_metas_valor_atual
    AFTER INSERT OR UPDATE OR DELETE ON despesas
    FOR EACH ROW EXECUTE FUNCTION fn_sync_metas_valor_atual();

-- 8.4 Proteção de categorias do sistema
CREATE OR REPLACE FUNCTION fn_protege_categoria_sistema()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.sistema = TRUE THEN
        RAISE EXCEPTION 'Categoria "%" é nativa do sistema e não pode ser deletada.', OLD.nome
            USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_protege_categoria_sistema
    BEFORE DELETE ON categoria
    FOR EACH ROW EXECUTE FUNCTION fn_protege_categoria_sistema();

-- 8.5 Criar profile automaticamente ao registrar usuário
-- Objetivo:
-- evitar usuário autenticado sem registro correspondente em `profiles`.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO profiles (id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 9. ÍNDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_despesas_orcamento    ON despesas (id_orcamento, data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria    ON despesas (id_categoria, data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_metas        ON despesas (id_metas) WHERE id_metas IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_despesas_origem       ON despesas (origem, status);
CREATE INDEX IF NOT EXISTS idx_despesas_descricao    ON despesas USING GIN (descricao gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_despesas_nlp          ON despesas USING GIN (nlp_metadata);
CREATE INDEX IF NOT EXISTS idx_orcamento_usuario     ON orcamento (id_usuario, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_metas_usuario         ON metas (id_usuario, status, data_limite ASC);
CREATE INDEX IF NOT EXISTS idx_tokens_usuario        ON open_finance_tokens (id_usuario, ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario  ON notificacoes (id_usuario, lida, criado_em DESC);

-- =============================================================================
-- 10. VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW vw_resumo_mensal AS
SELECT
    p.id         AS id_usuario,
    p.nome       AS usuario_nome,
    o.ano, o.mes,
    c.nome       AS categoria_nome,
    c.tipo       AS categoria_tipo,
    SUM(d.valor) AS total_gasto,
    COUNT(d.id)  AS qtd_transacoes,
    o.valor_planejado,
    o.valor_real,
    ROUND((o.valor_real / NULLIF(o.valor_planejado, 0)) * 100, 2) AS pct_orcamento_consumido
FROM despesas d
JOIN orcamento o ON o.id = d.id_orcamento
JOIN profiles  p ON p.id = o.id_usuario
JOIN categoria c ON c.id = d.id_categoria
WHERE d.status = 'confirmada' AND d.tipo = 'despesa'
GROUP BY p.id, p.nome, o.id, o.ano, o.mes, o.valor_planejado, o.valor_real, c.id, c.nome, c.tipo;

CREATE OR REPLACE VIEW vw_progresso_metas AS
SELECT
    m.id AS id_meta,
    m.id_usuario,
    m.nome       AS meta_nome,
    m.valor_objetivo,
    m.valor_atual,
    ROUND((m.valor_atual / NULLIF(m.valor_objetivo, 0)) * 100, 2) AS pct_concluido,
    m.data_limite,
    (m.data_limite - CURRENT_DATE) AS dias_restantes,
    m.status,
    CASE
        WHEN m.valor_atual >= m.valor_objetivo THEN 'concluida'
        WHEN m.data_limite < CURRENT_DATE      THEN 'atrasada'
        WHEN (m.data_limite - CURRENT_DATE) <= 30 THEN 'proximidade'
        ELSE 'em_andamento'
    END AS situacao
FROM metas m WHERE m.status = 'ativa';

CREATE OR REPLACE VIEW vw_historico_comparativo AS
SELECT
    o.id_usuario, o.ano, o.mes,
    TO_DATE(o.ano::TEXT || '-' || LPAD(o.mes::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') AS data_referencia,
    o.valor_planejado, o.valor_real,
    o.valor_real - o.valor_planejado AS desvio,
    ROUND((o.valor_real / NULLIF(o.valor_planejado, 0)) * 100 - 100, 2) AS pct_desvio,
    LAG(o.valor_real) OVER (PARTITION BY o.id_usuario ORDER BY o.ano, o.mes) AS valor_real_mes_anterior,
    ROUND((o.valor_real / NULLIF(LAG(o.valor_real) OVER (PARTITION BY o.id_usuario ORDER BY o.ano, o.mes), 0) - 1) * 100, 2) AS pct_variacao_mom
FROM orcamento o
ORDER BY o.id_usuario, o.ano DESC, o.mes DESC;

-- =============================================================================
-- 11. ROW LEVEL SECURITY
-- =============================================================================
-- Observação importante de segurança:
-- as policies abaixo são a principal barreira de isolamento entre usuários.
-- Qualquer alteração incorreta aqui pode expor dados de terceiros.

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Metas
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metas_select_own" ON metas FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "metas_insert_own" ON metas FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "metas_update_own" ON metas FOR UPDATE USING (auth.uid() = id_usuario);
CREATE POLICY "metas_delete_own" ON metas FOR DELETE USING (auth.uid() = id_usuario);

-- Orcamento
ALTER TABLE orcamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orcamento_select_own" ON orcamento FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "orcamento_insert_own" ON orcamento FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "orcamento_update_own" ON orcamento FOR UPDATE USING (auth.uid() = id_usuario);
CREATE POLICY "orcamento_delete_own" ON orcamento FOR DELETE USING (auth.uid() = id_usuario);

-- Categoria (sistema = visível para todos, personalizada = só dono)
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categoria_select" ON categoria FOR SELECT USING (sistema = TRUE OR auth.uid() = id_usuario);
CREATE POLICY "categoria_insert_own" ON categoria FOR INSERT WITH CHECK (auth.uid() = id_usuario AND sistema = FALSE);
CREATE POLICY "categoria_update_own" ON categoria FOR UPDATE USING (auth.uid() = id_usuario AND sistema = FALSE);
CREATE POLICY "categoria_delete_own" ON categoria FOR DELETE USING (auth.uid() = id_usuario AND sistema = FALSE);

-- Despesas (via orçamento do usuário)
-- Estratégia:
-- em vez de gravar id_usuario direto em despesas, o vínculo de posse é derivado
-- pela tabela de orçamento. Assim, a policy valida propriedade via id_orcamento.
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "despesas_select_own" ON despesas FOR SELECT
    USING (id_orcamento IN (SELECT id FROM orcamento WHERE id_usuario = auth.uid()));
CREATE POLICY "despesas_insert_own" ON despesas FOR INSERT
    WITH CHECK (id_orcamento IN (SELECT id FROM orcamento WHERE id_usuario = auth.uid()));
CREATE POLICY "despesas_update_own" ON despesas FOR UPDATE
    USING (id_orcamento IN (SELECT id FROM orcamento WHERE id_usuario = auth.uid()));
CREATE POLICY "despesas_delete_own" ON despesas FOR DELETE
    USING (id_orcamento IN (SELECT id FROM orcamento WHERE id_usuario = auth.uid()));

-- Open Finance Tokens
ALTER TABLE open_finance_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tokens_select_own" ON open_finance_tokens FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "tokens_insert_own" ON open_finance_tokens FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "tokens_update_own" ON open_finance_tokens FOR UPDATE USING (auth.uid() = id_usuario);
CREATE POLICY "tokens_delete_own" ON open_finance_tokens FOR DELETE USING (auth.uid() = id_usuario);

-- Notificações
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notificacoes_select_own" ON notificacoes FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "notificacoes_update_own" ON notificacoes FOR UPDATE USING (auth.uid() = id_usuario);
CREATE POLICY "notificacoes_delete_own" ON notificacoes FOR DELETE USING (auth.uid() = id_usuario);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
