import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase' 
import { useAuth } from './useAuth'

/**
 * Interface que representa as credenciais de uma conexão bancária via Open Finance.
 */
export interface OpenFinanceToken {
  id: string
  id_usuario: string
  instituicao: string
  access_token_enc: string
  expira_em: string
  ativo: boolean
  criado_em: string
}

/**
 * Hook customizado para o gerenciamento de integrações bancárias (Open Finance).
 * * Responsável por orquestrar o estado e as operações de vínculo de contas via 
 * a plataforma da Pluggy. Fornece métodos para buscar conexões ativas, registrar 
 * um novo vínculo seguro (com cálculo automático de expiração) e revogar o acesso 
 * através de uma exclusão lógica (soft delete).
 * * @returns Objeto contendo os tokens ativos, estado de carregamento e funções de mutação (`connectBank`, `disconnectBank`).
 */
export function useIntegrations() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState<OpenFinanceToken[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Busca no banco de dados todas as conexões bancárias ativas do usuário,
   * ordenando-as pela data de criação (das mais recentes para as mais antigas).
   */
  const fetchTokens = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('open_finance_tokens')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })

    if (!error && data) setTokens(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  /**
   * Registra uma nova conexão bancária no Supabase após autenticação bem-sucedida.
   * Define automaticamente uma validade de 30 dias corridos para o acesso concedido.
   * * @param instituicao - O nome da instituição bancária (ex: Nubank, Itaú).
   * @param itemId - O identificador de acesso retornado pelo Widget da Pluggy.
   * @returns Um objeto contendo os dados inseridos ou a mensagem de erro.
   */
  const connectBank = async (instituicao: string, itemId: string) => {
    if (!user) return { error: 'Usuário não autenticado' }

    const expiraEm = new Date()
    expiraEm.setDate(expiraEm.getDate() + 30)

    const { data, error } = await supabase
      .from('open_finance_tokens')
      .insert({
        id_usuario: user.id,
        instituicao,
        access_token_enc: itemId,
        expira_em: expiraEm.toISOString(),
      })
      .select()
      .single()

    if (!error && data) setTokens(prev => [data, ...prev])
    return { data, error }
  }

  /**
   * Revoga o acesso a uma instituição bancária específica.
   * Utiliza exclusão lógica (soft delete), atualizando a flag `ativo` para `false` 
   * em vez de apagar o registro permanentemente, mantendo a consistência do histórico.
   * * @param id - O identificador único da conexão (OpenFinanceToken.id) a ser desativada.
   * @returns O objeto de erro retornado pela operação no Supabase, se houver.
   */
  const disconnectBank = async (id: string) => {
    const { error } = await supabase
      .from('open_finance_tokens')
      .update({ ativo: false })
      .eq('id', id)

    if (!error) setTokens(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { tokens, loading, connectBank, disconnectBank }
}