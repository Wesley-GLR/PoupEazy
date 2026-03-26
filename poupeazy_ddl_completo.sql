-- =============================================================================
--  POUPEAZY — Script DDL Completo (PostgreSQL)
--  Engenharia de Dados Sênior — Versão Otimizada para Produção
--  Gerado para: UNIFEI Itabira — Análise e Desenvolvimento de Software II
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES NECESSÁRIAS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- criptografia de tokens
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- busca fuzzy em descrições (NLP)

-- =============================================================================
-- 1. TABELA: USUARIOS
--    Armazena os dados de conta de cada usuário do Poupeazy.
--    A senha é armazenada EXCLUSIVAMENTE como hash bcrypt (nunca em texto puro).
-- =============================================================================
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario    SERIAL          PRIMARY KEY,
    nome          VARCHAR(150)    NOT NULL,
    email         VARCHAR(100)    NOT NULL
                  CONSTRAINT uq_usuarios_email UNIQUE,
    telefone      VARCHAR(20),
    senha_hash    VARCHAR(255)    NOT NULL,        -- bcrypt hash (custo mínimo 12)
    criado_em     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_usuarios_email_formato
        CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE  Usuarios                  IS 'Contas de usuário do Poupeazy. Senha armazenada como bcrypt hash.';
COMMENT ON COLUMN Usuarios.senha_hash       IS 'Hash bcrypt (custo >= 12). Gerado pela aplicação antes do INSERT.';
COMMENT ON COLUMN Usuarios.email            IS 'Identificador único de login. Validado por regex antes do INSERT.';

-- =============================================================================
-- 2. TABELA: METAS
--    Metas financeiras de longo prazo definidas pelo usuário.
--    O campo valor_atual é atualizado automaticamente via trigger (ver seção 6).
-- =============================================================================
CREATE TABLE IF NOT EXISTS Metas (
    id_metas       SERIAL          PRIMARY KEY,
    id_usuario     INT             NOT NULL
                   REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nome           VARCHAR(100)    NOT NULL,
    descricao      TEXT,
    valor_objetivo DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    valor_atual    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,  -- atualizado por trigger
    data_limite    DATE            NOT NULL,
    status         VARCHAR(20)     NOT NULL DEFAULT 'ativa'
                   CONSTRAINT ck_metas_status
                       CHECK (status IN ('ativa', 'concluida', 'cancelada')),
    criado_em      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_metas_valor_positivo
        CHECK (valor_objetivo > 0),
    CONSTRAINT ck_metas_data_futura
        CHECK (data_limite >= CURRENT_DATE)
);

COMMENT ON TABLE  Metas                     IS 'Metas financeiras por usuário (ex: viagem, fundo de emergência).';
COMMENT ON COLUMN Metas.valor_atual         IS 'Valor acumulado. Atualizado automaticamente pelo trigger trg_metas_valor_atual.';
COMMENT ON COLUMN Metas.data_limite         IS 'Prazo final da meta. Constraint impede datas no passado ao criar.';

-- =============================================================================
-- 3. TABELA: ORCAMENTO
--    Orçamento mensal por usuário. Combina valor planejado (definido pelo
--    usuário) e valor real (atualizado automaticamente via trigger).
--    A unicidade (usuario + mês + ano) evita orçamentos duplicados.
-- =============================================================================
CREATE TABLE IF NOT EXISTS Orcamento (
    id_orcamento    SERIAL          PRIMARY KEY,
    id_usuario      INT             NOT NULL
                    REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    mes             INT             NOT NULL
                    CONSTRAINT ck_orcamento_mes CHECK (mes BETWEEN 1 AND 12),
    ano             INT             NOT NULL
                    CONSTRAINT ck_orcamento_ano CHECK (ano BETWEEN 2000 AND 2100),
    valor_planejado DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    valor_real      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,  -- atualizado por trigger
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orcamento_usuario_mes_ano
        UNIQUE (id_usuario, mes, ano),
    CONSTRAINT ck_orcamento_valor_planejado
        CHECK (valor_planejado >= 0)
);

COMMENT ON TABLE  Orcamento                  IS 'Orçamento mensal por usuário. Um registro por mês/ano por usuário.';
COMMENT ON COLUMN Orcamento.valor_real       IS 'Soma real das despesas do mês. Atualizado por trg_orcamento_valor_real.';
COMMENT ON COLUMN Orcamento.valor_planejado  IS 'Teto de gastos que o usuário definiu para o mês.';

-- =============================================================================
-- 4. TABELA: CATEGORIA
--    Categorias de transação (Alimentação, Transporte, etc.).
--    O campo "sistema" distingue categorias nativas (TRUE) das criadas pelo
--    usuário (FALSE), permitindo proteção contra deleção acidental.
-- =============================================================================
CREATE TABLE IF NOT EXISTS Categoria (
    id_categoria  SERIAL        PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL,
    tipo          VARCHAR(20)   NOT NULL
                  CONSTRAINT ck_categoria_tipo
                      CHECK (tipo IN ('despesa_fixa', 'despesa_variavel', 'receita')),
    icone         VARCHAR(50),                    -- slug do ícone no front-end
    sistema       BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_categoria_nome_tipo UNIQUE (nome, tipo)
);

COMMENT ON TABLE  Categoria         IS 'Categorias de transação. Categorias do sistema não podem ser deletadas.';
COMMENT ON COLUMN Categoria.sistema IS 'TRUE = categoria nativa (ex: Alimentação). Protegida contra DELETE.';

-- Categorias padrão do sistema (seed data)
INSERT INTO Categoria (nome, tipo, icone, sistema) VALUES
    ('Alimentação',     'despesa_variavel', 'fork-knife',    TRUE),
    ('Transporte',      'despesa_variavel', 'car',           TRUE),
    ('Moradia',         'despesa_fixa',     'home',          TRUE),
    ('Saúde',           'despesa_variavel', 'heart-pulse',   TRUE),
    ('Lazer',           'despesa_variavel', 'music',         TRUE),
    ('Educação',        'despesa_variavel', 'book',          TRUE),
    ('Assinaturas',     'despesa_fixa',     'repeat',        TRUE),
    ('Outros',          'despesa_variavel', 'dots-horizontal', TRUE),
    ('Salário',         'receita',          'briefcase',     TRUE),
    ('Freelance',       'receita',          'zap',           TRUE),
    ('Investimentos',   'receita',          'trending-up',   TRUE)
ON CONFLICT (nome, tipo) DO NOTHING;

-- =============================================================================
-- 5. TABELA: DESPESAS
--    Tabela central de transações financeiras. Suporta três origens:
--    - 'open_finance': sincronizada automaticamente via API Open Finance
--    - 'chatbot':      registrada via WhatsApp/NLP
--    - 'manual':       registrada manualmente pelo usuário no app
--
--    O campo nlp_metadata (JSONB) armazena metadados brutos do NLP para
--    re-categorização e aprendizado do motor de categorização automática.
-- =============================================================================
CREATE TABLE IF NOT EXISTS Despesas (
    id_despesas      SERIAL        PRIMARY KEY,
    id_orcamento     INT           NOT NULL
                     REFERENCES Orcamento(id_orcamento) ON DELETE RESTRICT,
    id_categoria     INT           NOT NULL
                     REFERENCES Categoria(id_categoria) ON DELETE RESTRICT,
    id_metas         INT
                     REFERENCES Metas(id_metas) ON DELETE SET NULL,
    valor            DECIMAL(12,2) NOT NULL
                     CONSTRAINT ck_despesas_valor CHECK (valor > 0),
    data_transacao   DATE          NOT NULL,
    descricao        VARCHAR(255)  NOT NULL,
    tipo             VARCHAR(20)   NOT NULL
                     CONSTRAINT ck_despesas_tipo
                         CHECK (tipo IN ('despesa', 'receita')),
    origem           VARCHAR(20)   NOT NULL DEFAULT 'manual'
                     CONSTRAINT ck_despesas_origem
                         CHECK (origem IN ('manual', 'open_finance', 'chatbot')),
    status           VARCHAR(20)   NOT NULL DEFAULT 'confirmada'
                     CONSTRAINT ck_despesas_status
                         CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
    --
    -- nlp_metadata: metadados brutos para o motor de NLP do ChatBot.
    -- Estrutura esperada: { "raw_text": "...", "mcc_code": "...",
    --                       "estabelecimento": "...", "confianca": 0.95,
    --                       "tags": ["restaurante", "almoço"],
    --                       "categoria_sugerida": 1 }
    nlp_metadata     JSONB,

    criado_em        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Evita duplicação de transações vindas do Open Finance
    CONSTRAINT uq_despesas_open_finance
        UNIQUE NULLS NOT DISTINCT (id_orcamento, valor, data_transacao, descricao, origem)
);

COMMENT ON TABLE  Despesas               IS 'Transações financeiras. Suporta origem manual, Open Finance e ChatBot.';
COMMENT ON COLUMN Despesas.nlp_metadata  IS 'JSONB com texto bruto, MCC, estabelecimento, confiança e tags do NLP.';
COMMENT ON COLUMN Despesas.origem        IS 'Canal de entrada da transação: manual | open_finance | chatbot.';
COMMENT ON COLUMN Despesas.status        IS 'pendente = aguardando confirmação (chatbot). confirmada = efetivada.';

-- =============================================================================
-- 6. TABELA: OPEN_FINANCE_TOKENS
--    Armazena os tokens OAuth 2.0 de cada integração bancária do usuário.
--    SEGURANÇA CRÍTICA:
--    - Os tokens são criptografados com AES-256-GCM ANTES de serem inseridos.
--    - A chave de criptografia (POUPEAZY_ENCRYPTION_KEY) deve estar APENAS
--      em variável de ambiente no servidor da aplicação — nunca no banco.
--    - Tokens expirados devem ser rotacionados via refresh_token antes do uso.
--    - Auditoria de acesso via coluna ultimo_uso.
-- =============================================================================
CREATE TABLE IF NOT EXISTS Open_Finance_Tokens (
    id_token          SERIAL        PRIMARY KEY,
    id_usuario        INT           NOT NULL
                      REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    instituicao       VARCHAR(100)  NOT NULL,      -- ex: "Nubank", "Itaú", "Inter"
    access_token_enc  TEXT          NOT NULL,      -- AES-256-GCM + base64 na app
    refresh_token_enc TEXT,                        -- AES-256-GCM + base64 na app
    expira_em         TIMESTAMPTZ   NOT NULL,
    ultimo_uso        TIMESTAMPTZ,
    ativo             BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_token_usuario_instituicao
        UNIQUE (id_usuario, instituicao)
);

COMMENT ON TABLE  Open_Finance_Tokens                 IS 'Tokens OAuth 2.0 das integrações Open Finance. Criptografados pela aplicação.';
COMMENT ON COLUMN Open_Finance_Tokens.access_token_enc IS 'Token criptografado com AES-256-GCM. A chave NÃO está no banco de dados.';
COMMENT ON COLUMN Open_Finance_Tokens.expira_em        IS 'Verificar ANTES de usar. Fazer refresh se NOW() >= expira_em.';


-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 Atualizar atualizado_em automaticamente (Usuarios e Orcamento)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON Usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE OR REPLACE TRIGGER trg_orcamento_atualizado_em
    BEFORE UPDATE ON Orcamento
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- ---------------------------------------------------------------------------
-- 7.2 Recalcular valor_real no Orcamento ao INSERT/UPDATE/DELETE em Despesas
--     Garante que Orcamento.valor_real seja sempre a soma real das despesas
--     confirmadas do período, sem necessidade de queries manuais na aplicação.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_orcamento_valor_real()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_id_orcamento INT;
BEGIN
    -- Determina o orçamento afetado (INSERT/UPDATE usa NEW, DELETE usa OLD)
    IF TG_OP = 'DELETE' THEN
        v_id_orcamento := OLD.id_orcamento;
    ELSE
        v_id_orcamento := NEW.id_orcamento;
    END IF;

    UPDATE Orcamento
    SET valor_real = (
        SELECT COALESCE(SUM(
            CASE tipo
                WHEN 'despesa' THEN  valor
                WHEN 'receita' THEN -valor
            END
        ), 0.00)
        FROM Despesas
        WHERE id_orcamento = v_id_orcamento
          AND status = 'confirmada'
    )
    WHERE id_orcamento = v_id_orcamento;

    -- Ao UPDATE que muda de orçamento, recalcula o orçamento anterior também
    IF TG_OP = 'UPDATE' AND NEW.id_orcamento IS DISTINCT FROM OLD.id_orcamento THEN
        UPDATE Orcamento
        SET valor_real = (
            SELECT COALESCE(SUM(
                CASE tipo
                    WHEN 'despesa' THEN  valor
                    WHEN 'receita' THEN -valor
                END
            ), 0.00)
            FROM Despesas
            WHERE id_orcamento = OLD.id_orcamento
              AND status = 'confirmada'
        )
        WHERE id_orcamento = OLD.id_orcamento;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_orcamento_valor_real
    AFTER INSERT OR UPDATE OR DELETE ON Despesas
    FOR EACH ROW EXECUTE FUNCTION fn_sync_orcamento_valor_real();

-- ---------------------------------------------------------------------------
-- 7.3 Recalcular valor_atual nas Metas ao INSERT/UPDATE/DELETE em Despesas
--     Quando uma despesa é associada a uma meta, o progresso é atualizado
--     automaticamente. Apenas despesas confirmadas contam.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_metas_valor_atual()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_ids_metas INT[];
BEGIN
    -- Coleta todos os ids de meta afetados nesta operação
    IF TG_OP = 'DELETE' THEN
        v_ids_metas := ARRAY[OLD.id_metas];
    ELSIF TG_OP = 'UPDATE' THEN
        v_ids_metas := ARRAY[NEW.id_metas, OLD.id_metas];
    ELSE
        v_ids_metas := ARRAY[NEW.id_metas];
    END IF;

    -- Recalcula valor_atual para cada meta afetada (ignora NULLs)
    UPDATE Metas m
    SET valor_atual = (
        SELECT COALESCE(SUM(d.valor), 0.00)
        FROM Despesas d
        WHERE d.id_metas = m.id_metas
          AND d.status = 'confirmada'
          AND d.tipo = 'despesa'
    )
    WHERE m.id_metas = ANY(v_ids_metas)
      AND m.id_metas IS NOT NULL;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_metas_valor_atual
    AFTER INSERT OR UPDATE OR DELETE ON Despesas
    FOR EACH ROW EXECUTE FUNCTION fn_sync_metas_valor_atual();

-- ---------------------------------------------------------------------------
-- 7.4 Proteção contra deleção de categorias do sistema
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_protege_categoria_sistema()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.sistema = TRUE THEN
        RAISE EXCEPTION
            'Categoria "%" é nativa do sistema e não pode ser deletada.', OLD.nome
            USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_protege_categoria_sistema
    BEFORE DELETE ON Categoria
    FOR EACH ROW EXECUTE FUNCTION fn_protege_categoria_sistema();


-- =============================================================================
-- 8. ÍNDICES ESTRATÉGICOS
--    Focados nos padrões de acesso mais frequentes:
--    - Relatórios mensais/anuais por usuário
--    - Busca por categoria e origem
--    - Pesquisa full-text em descrições (NLP e filtros no app)
-- =============================================================================

-- Despesas: acesso por orçamento (join mais frequente nos relatórios)
CREATE INDEX IF NOT EXISTS idx_despesas_orcamento
    ON Despesas (id_orcamento, data_transacao DESC);

-- Despesas: filtro por categoria (tela "por categoria" e relatórios)
CREATE INDEX IF NOT EXISTS idx_despesas_categoria
    ON Despesas (id_categoria, data_transacao DESC);

-- Despesas: filtro por meta (tela de progresso de metas)
CREATE INDEX IF NOT EXISTS idx_despesas_metas
    ON Despesas (id_metas)
    WHERE id_metas IS NOT NULL;

-- Despesas: filtro por origem (Open Finance vs manual vs chatbot)
CREATE INDEX IF NOT EXISTS idx_despesas_origem
    ON Despesas (origem, status);

-- Despesas: busca full-text em descrições via trigram (NLP e filtro de busca)
CREATE INDEX IF NOT EXISTS idx_despesas_descricao_trgm
    ON Despesas USING GIN (descricao gin_trgm_ops);

-- Despesas: busca no JSONB de metadados NLP (tags e MCC)
CREATE INDEX IF NOT EXISTS idx_despesas_nlp_metadata
    ON Despesas USING GIN (nlp_metadata);

-- Orçamento: acesso por usuário e período
CREATE INDEX IF NOT EXISTS idx_orcamento_usuario_periodo
    ON Orcamento (id_usuario, ano DESC, mes DESC);

-- Metas: acesso por usuário e status
CREATE INDEX IF NOT EXISTS idx_metas_usuario_status
    ON Metas (id_usuario, status, data_limite ASC);

-- Tokens: acesso por usuário para verificar integrações ativas
CREATE INDEX IF NOT EXISTS idx_tokens_usuario_ativo
    ON Open_Finance_Tokens (id_usuario, ativo)
    WHERE ativo = TRUE;


-- =============================================================================
-- 9. VIEWS PARA RELATÓRIOS
--    Evitam que a camada de aplicação precise remontar lógica de agregação
--    a cada requisição. Otimizadas para as consultas mais frequentes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 Resumo mensal por usuário e categoria
--     Usada na tela "Relatórios > Análise por Categoria" e no ChatBot.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_resumo_mensal AS
SELECT
    u.id_usuario,
    u.nome                          AS usuario_nome,
    o.ano,
    o.mes,
    c.nome                          AS categoria_nome,
    c.tipo                          AS categoria_tipo,
    SUM(d.valor)                    AS total_gasto,
    COUNT(d.id_despesas)            AS qtd_transacoes,
    o.valor_planejado,
    o.valor_real,
    ROUND(
        (o.valor_real / NULLIF(o.valor_planejado, 0)) * 100, 2
    )                               AS pct_orcamento_consumido
FROM Despesas d
JOIN Orcamento  o ON o.id_orcamento = d.id_orcamento
JOIN Usuarios   u ON u.id_usuario   = o.id_usuario
JOIN Categoria  c ON c.id_categoria = d.id_categoria
WHERE d.status = 'confirmada'
  AND d.tipo   = 'despesa'
GROUP BY
    u.id_usuario, u.nome,
    o.id_orcamento, o.ano, o.mes, o.valor_planejado, o.valor_real,
    c.id_categoria, c.nome, c.tipo;

COMMENT ON VIEW vw_resumo_mensal IS
    'Resumo de gastos por usuário, mês e categoria. Base para relatórios e ChatBot.';

-- ---------------------------------------------------------------------------
-- 9.2 Progresso das metas por usuário
--     Usada na tela "Metas" e nos alertas de vencimento.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_progresso_metas AS
SELECT
    m.id_metas,
    m.id_usuario,
    m.nome                           AS meta_nome,
    m.valor_objetivo,
    m.valor_atual,
    ROUND(
        (m.valor_atual / NULLIF(m.valor_objetivo, 0)) * 100, 2
    )                                AS pct_concluido,
    m.data_limite,
    (m.data_limite - CURRENT_DATE)   AS dias_restantes,
    m.status,
    CASE
        WHEN m.valor_atual >= m.valor_objetivo THEN 'concluida'
        WHEN m.data_limite  <  CURRENT_DATE    THEN 'atrasada'
        WHEN (m.data_limite - CURRENT_DATE) <= 30  THEN 'proximidade'
        ELSE 'em_andamento'
    END                              AS situacao
FROM Metas m
WHERE m.status = 'ativa';

COMMENT ON VIEW vw_progresso_metas IS
    'Progresso e situação das metas ativas. Inclui alerta de atraso e proximidade do prazo.';

-- ---------------------------------------------------------------------------
-- 9.3 Histórico comparativo mensal (últimos 13 meses)
--     Usada na tela "Histórico" e nos relatórios completos exportáveis.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_historico_comparativo AS
SELECT
    o.id_usuario,
    o.ano,
    o.mes,
    TO_DATE(o.ano::TEXT || '-' || LPAD(o.mes::TEXT, 2, '0') || '-01', 'YYYY-MM-DD')
                                     AS data_referencia,
    o.valor_planejado,
    o.valor_real,
    o.valor_real - o.valor_planejado AS desvio,
    ROUND(
        (o.valor_real / NULLIF(o.valor_planejado, 0)) * 100 - 100, 2
    )                                AS pct_desvio,
    LAG(o.valor_real) OVER (
        PARTITION BY o.id_usuario
        ORDER BY o.ano, o.mes
    )                                AS valor_real_mes_anterior,
    ROUND(
        (o.valor_real / NULLIF(
            LAG(o.valor_real) OVER (
                PARTITION BY o.id_usuario ORDER BY o.ano, o.mes
            ), 0
        ) - 1) * 100, 2
    )                                AS pct_variacao_mom
FROM Orcamento o
ORDER BY o.id_usuario, o.ano DESC, o.mes DESC;

COMMENT ON VIEW vw_historico_comparativo IS
    'Comparativo mês-a-mês de orçado vs realizado com variação percentual (MoM).';


-- =============================================================================
-- 10. SEGURANÇA — NOTAS PARA O TIME DE DESENVOLVIMENTO
-- =============================================================================
/*
  SENHAS (Usuarios.senha_hash)
  ─────────────────────────────
  • Usar bcrypt com custo mínimo 12 na camada de aplicação (ex: bcryptjs, passlib).
  • NUNCA fazer INSERT com a senha em texto puro.
  • O banco JAMAIS deve receber ou armazenar a senha original.

  TOKENS OPEN FINANCE (Open_Finance_Tokens)
  ──────────────────────────────────────────
  • Fluxo OAuth 2.0 recomendado:
      1. App redireciona usuário ao portal da instituição (step 5 do caso de uso).
      2. Instituição retorna authorization_code para o back-end via redirect_uri.
      3. Back-end troca o code por access_token + refresh_token (server-to-server).
      4. Back-end criptografa ambos com AES-256-GCM usando POUPEAZY_ENCRYPTION_KEY
         (variável de ambiente — NUNCA hardcode).
      5. Cyphertext + nonce armazenados em access_token_enc / refresh_token_enc.
  • Antes de cada uso do token:
      a. Verificar: NOW() < expira_em.
      b. Se expirado: chamar endpoint de refresh, atualizar registro, continuar.
  • Rotacionar POUPEAZY_ENCRYPTION_KEY com re-encriptação periódica.
  • Auditar Open_Finance_Tokens.ultimo_uso em toda leitura de token.

  ROW-LEVEL SECURITY (recomendado para produção)
  ────────────────────────────────────────────────
  ALTER TABLE Despesas ENABLE ROW LEVEL SECURITY;
  CREATE POLICY pol_despesas_owner ON Despesas
      USING (id_orcamento IN (
          SELECT id_orcamento FROM Orcamento
          WHERE id_usuario = current_setting('app.current_user_id')::INT
      ));
  -- Repetir para Metas, Orcamento e Open_Finance_Tokens.
  -- Exige que a aplicação faça SET LOCAL app.current_user_id = X antes de cada query.

  DADOS SENSÍVEIS EM nlp_metadata
  ─────────────────────────────────
  • Não armazenar número de cartão, CPF ou dados bancários completos no JSONB.
  • O campo é para metadados de categorização (MCC, palavras-chave, confiança).
  • Aplicar máscara de PII antes de persistir qualquer dado bruto do Open Finance.
*/

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
