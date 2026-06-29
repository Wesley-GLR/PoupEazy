import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Meta } from '../types/database'
import { useAuth } from './useAuth'

// Hook de metas financeiras (CRUD e sincronizacao local apos mutacoes).
export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.get<Meta[]>('/metas')
      setGoals(data ?? [])
    } catch {
      setGoals([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addGoal(goal: Record<string, unknown>) {
    try {
      await api.post('/metas', goal)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function updateGoal(id: string, data: Record<string, unknown>) {
    try {
      await api.patch(`/metas/${id}`, data)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function deleteGoal(id: string) {
    try {
      await api.delete(`/metas/${id}`)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Registra uma transacao (aporte/retirada) vinculada a meta.
  // O trigger fn_sync_metas_valor_atual no banco atualiza valor_atual automaticamente.
  // Requer id_orcamento valido (buscar/criar antes de chamar).
  async function addGoalTransaction(tx: {
    id_orcamento: string
    id_metas: string
    id_categoria: string
    valor: number
    data_transacao: string
    descricao: string
    tipo: 'despesa' | 'receita'
  }) {
    try {
      await api.post('/despesas', { ...tx, origem: 'manual', status: 'confirmada' })
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return { goals, loading, refresh: fetch, addGoal, updateGoal, deleteGoal, addGoalTransaction }
}
