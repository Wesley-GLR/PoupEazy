import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuth } from './useAuth'

export interface OpenFinanceToken {
  id: string
  id_usuario: string
  instituicao: string
  access_token_enc: string
  expira_em: string
  ativo: boolean
  criado_em: string
}

export function useIntegrations() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState<OpenFinanceToken[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTokens = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.get<OpenFinanceToken[]>('/integracoes')
      setTokens(data ?? [])
    } catch {
      setTokens([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  // Salva a conexao bancaria no backend.
  // `itemId` e o identificador retornado pelo Widget da Pluggy apos autenticacao.
  const connectBank = async (instituicao: string, itemId: string) => {
    if (!user) return { error: 'Usuario nao autenticado' as unknown as Error, data: null }
    try {
      const data = await api.post<OpenFinanceToken>('/integracoes', { instituicao, itemId })
      setTokens(prev => [data, ...prev.filter(t => t.id !== data.id)])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  const disconnectBank = async (id: string) => {
    try {
      await api.delete(`/integracoes/${id}`)
      setTokens(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return { tokens, loading, connectBank, disconnectBank }
}
