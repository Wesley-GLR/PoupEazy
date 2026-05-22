// Contrato tipado do schema `public` usado no frontend.
// Este arquivo é a "fonte de verdade" para shape de dados vindos do Supabase.
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

// Perfil complementar do usuário autenticado.
// O id é o mesmo usuário do Supabase Auth (auth.users).
export interface Profile {
  id: string
  nome: string
  telefone: string | null
  criado_em: string
  atualizado_em: string
}

// Meta financeira definida pelo usuário.
// `valor_atual` é atualizado por trigger com base nas despesas associadas.
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

// Orçamento mensal por usuário (chave lógica: usuário + mês + ano).
// `valor_real` é derivado automaticamente das transações confirmadas.
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

// Categoria de transação:
// - sistema=true: categoria nativa protegida;
// - id_usuario preenchido: categoria personalizada do usuário.
export interface Categoria {
  id: string
  id_usuario: string | null
  nome: string
  tipo: 'despesa_fixa' | 'despesa_variavel' | 'receita'
  icone: string | null
  sistema: boolean
}

// Registro de transação financeira (despesa/receita).
// Campos `origem` e `status` permitem integrações futuras e fluxo de confirmação.
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

// Notificação exibida ao usuário (limite, meta, dica, relatório).
export interface Notificacao {
  id: string
  id_usuario: string
  tipo: 'alerta_limite' | 'meta_proxima' | 'meta_concluida' | 'dica' | 'relatorio'
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

// Tokens para integração Open Finance (armazenamento preparado para evolução futura).
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

// View analítica: consolida despesas confirmadas por categoria e mês.
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

// View analítica: progresso e situação operacional das metas ativas.
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

// View analítica: comparação entre planejado vs real ao longo dos meses.
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

// Shape usado na UI quando a transação precisa vir com dados da categoria em join.
export interface DespesaComCategoria extends Despesa {
  categoria?: Categoria
}
