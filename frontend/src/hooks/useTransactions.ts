import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { DespesaComCategoria } from '../types/database'
import { useAuth } from './useAuth'

// Hook de transacoes:
// o backend ja retorna as despesas do usuario com a categoria aninhada.
export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<DespesaComCategoria[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.get<DespesaComCategoria[]>('/despesas')
      setTransactions(data ?? [])
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addTransaction(tx: Record<string, unknown>) {
    try {
      await api.post('/despesas', tx)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function updateTransaction(id: string, data: Record<string, unknown>) {
    try {
      await api.patch(`/despesas/${id}`, data)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function deleteTransaction(id: string) {
    try {
      await api.delete(`/despesas/${id}`)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return { transactions, loading, refresh: fetch, addTransaction, updateTransaction, deleteTransaction }
}
