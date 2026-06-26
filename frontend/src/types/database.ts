/**
 * Contrato tipado do schema `public` usado no frontend.
 * * Este arquivo é a "fonte de verdade" para o formato de dados vindos do Supabase.
 * Ele mapeia todas as tabelas e views do banco, definindo a estrutura exata 
 * esperada para operações de leitura (Row), criação (Insert) e atualização (Update).
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Profile, 'id' | 'criado_em'>>
      }
      metas: {
        Row: Meta
        Insert: Omit<Meta, 'id' | 'valor_atual' | 'criado_em'> & { id?: string }
        Update: Partial<Omit<Meta, 'id' | 'criado_em'>>
      }
      orcamento: {
        Row: Orcamento
        Insert: Omit<Orcamento, 'id' | 'valor_real' | 'criado_em' | 'atualizado_em'> & { id?: string }
        Update: Partial<Omit<Orcamento, 'id' | 'criado_em'>>
      }
      categoria: {
        Row: Categoria
        Insert: Omit<Categoria, 'id'> & { id?: string }
        Update: Partial<Omit<Categoria, 'id'>>
      }
      despesas: {
        Row: Despesa
        Insert: Omit<Despesa, 'id' | 'criado_em'> & { id?: string }
        Update: Partial<Omit<Despesa, 'id' | 'criado_em'>>
      }
      notificacoes: {
        Row: Notificacao
        Insert: Omit<Notificacao, 'id' | 'criado_em'> & { id?: string }
        Update: Partial<Omit<Notificacao, 'id' | 'criado_em'>>
      }
      open_finance_tokens: {
        Row: OpenFinanceToken
        Insert: Omit<OpenFinanceToken, 'id' | 'criado_em'> & { id?: string }
        Update: Partial<Omit<OpenFinanceToken, 'id' | 'criado_em'>>
      }
    }
    Views: {
      vw_resumo_mensal: { Row: ResumoMensal }
      vw_progresso_metas: { Row: ProgressoMeta }
      vw_historico_comparativo: { Row: HistoricoComparativo }
    }
  }
}

/**
 * Perfil complementar do usuário.
 * * O campo `id` é obrigatoriamente o mesmo identificador do usuário gerado 
 * pelo Supabase Auth (tabela auth.users).
 */
export interface Profile {
  id: string
  nome: string
  telefone: string | null
  criado_em: string
  atualizado_em: string
}

/**
 * Meta financeira definida pelo usuário.
 * * O campo `valor_atual` é calculado e atualizado automaticamente via trigger
 * no banco de dados, com base nas transações/despesas associadas a esta meta.
 */
export interface Meta {
  id: string
  id_usuario: string
  nome: string
  descricao: string | null
  valor_objetivo: number
  valor_atual: number
  data_limite: string
  status: 'ativa' | 'concluida' | 'cancelada'
  criado_em: string
}

/**
 * Orçamento mensal consolidado do usuário.
 * * A chave lógica de unicidade é a combinação de `id_usuario` + `mes` + `ano`.
 * O `valor_real` é derivado de forma automática através das transações confirmadas
 * vinculadas a este orçamento.
 */
export interface Orcamento {
  id: string
  id_usuario: string
  mes: number
  ano: number
  valor_planejado: number
  valor_real: number
  criado_em: string
  atualizado_em: string
}

/**
 * Categoria de classificação de transações.
 * * Se `sistema` for true, trata-se de uma categoria nativa e protegida contra edição/exclusão.
 * * Se `id_usuario` estiver preenchido, trata-se de uma categoria personalizada criada pelo usuário.
 */
export interface Categoria {
  id: string
  id_usuario: string | null
  nome: string
  tipo: 'despesa_fixa' | 'despesa_variavel' | 'receita'
  icone: string | null
  sistema: boolean
}

/**
 * Registro individual de uma transação financeira (podendo ser despesa ou receita).
 * * Os campos `origem` e `status` fornecem rastreabilidade e abrem caminho para 
 * integrações futuras (como importação automática do Open Finance) e fluxos 
 * de conciliação bancária.
 */
export interface Despesa {
  id: string
  id_orcamento: string
  id_categoria: string
  id_metas: string | null
  valor: number
  data_transacao: string
  descricao: string
  tipo: 'despesa' | 'receita'
  origem: 'manual' | 'open_finance' | 'chatbot'
  status: 'pendente' | 'confirmada' | 'cancelada'
  nlp_metadata: Record<string, unknown> | null
  criado_em: string
}

/**
 * Notificação assíncrona gerada para alertar ou informar o usuário.
 * * Utilizada para eventos como atingimento de limite de orçamento (`alerta_limite`), 
 * proximidade do prazo de uma meta (`meta_proxima`), dicas financeiras ou relatórios gerados.
 */
export interface Notificacao {
  id: string
  id_usuario: string
  tipo: 'alerta_limite' | 'meta_proxima' | 'meta_concluida' | 'dica' | 'relatorio'
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

/**
 * Gerenciamento de credenciais da integração via Open Finance (Pluggy).
 * * Estrutura preparada para armazenar os tokens de acesso e de atualização (refresh token) 
 * de forma segura, garantindo a sincronização contínua com as instituições bancárias.
 */
export interface OpenFinanceToken {
  id: string
  id_usuario: string
  instituicao: string
  access_token_enc: string
  refresh_token_enc: string | null
  expira_em: string
  ultimo_uso: string | null
  ativo: boolean
  criado_em: string
}

/**
 * View analítica (SQL View).
 * * Consolida de forma agregada as despesas confirmadas agrupando-as por categoria e mês,
 * facilitando a plotagem de gráficos na interface sem processamento pesado no frontend.
 */
export interface ResumoMensal {
  id_usuario: string
  usuario_nome: string
  ano: number
  mes: number
  categoria_nome: string
  categoria_tipo: string
  total_gasto: number
  qtd_transacoes: number
  valor_planejado: number
  valor_real: number
  pct_orcamento_consumido: number | null
}

/**
 * View analítica (SQL View).
 * * Retorna em tempo real o progresso percentual e a situação operacional (dias restantes)
 * de todas as metas financeiras ativas do usuário.
 */
export interface ProgressoMeta {
  id_meta: string
  id_usuario: string
  meta_nome: string
  valor_objetivo: number
  valor_atual: number
  pct_concluido: number | null
  data_limite: string
  dias_restantes: number
  status: string
  situacao: string
}

/**
 * View analítica (SQL View).
 * * Oferece uma comparação histórica entre o orçamento planejado e o valor real gasto
 * ao longo dos meses. Fornece métricas de desvio percentual e variação Mês-a-Mês (MoM).
 */
export interface HistoricoComparativo {
  id_usuario: string
  ano: number
  mes: number
  data_referencia: string
  valor_planejado: number
  valor_real: number
  desvio: number
  pct_desvio: number | null
  valor_real_mes_anterior: number | null
  pct_variacao_mom: number | null
}

/**
 * Tipo auxiliar para a UI (Interface de Usuário).
 * * Representa o formato dos dados quando uma requisição traz o registro da despesa
 * acompanhado dos detalhes completos da sua respectiva Categoria via `join`.
 */
export interface DespesaComCategoria extends Despesa {
  categoria?: Categoria
}
