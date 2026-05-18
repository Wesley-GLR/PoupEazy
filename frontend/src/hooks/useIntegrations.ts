import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase' 
import { useAuth } from './useAuth'

export interface OpenFinanceToken {
  id: string
  id_usuario: string
  instituicao: string
  access_token_enc: string
  expira_em: string
  ativo: boolean
}

export function useIntegrations() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState<OpenFinanceToken[]>([])
  const [loading, setLoading] = useState(true)

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

  const connectBank = async (instituicao: string) => {
    if (!user) return { error: 'Usuário não autenticado' }
    
    const mockToken = `sbx_${Math.random().toString(36).substring(2)}`
    const expiraEm = new Date()
    expiraEm.setDate(expiraEm.getDate() + 30)

    const { data, error } = await supabase
      .from('open_finance_tokens')
      .insert({
        id_usuario: user.id,
        instituicao,
        access_token_enc: mockToken,
        expira_em: expiraEm.toISOString(),
      })
      .select()
      .single()

    if (!error && data) setTokens(prev => [data, ...prev])
    return { data, error }
  }

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