import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Orcamento } from '../types/database'
import { useAuth } from './useAuth'

// Hook de orcamento mensal:
// concentra leitura/escrita de orcamentos e a regra "obter ou criar" por mes/ano.
export function useBudget() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.get<Orcamento[]>('/orcamentos')
      setBudgets(data ?? [])
    } catch {
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addBudget(budget: Record<string, unknown>) {
    try {
      const data = await api.post<Orcamento>('/orcamentos', budget)
      await fetch()
      return { error: null, data }
    } catch (err) {
      return { error: err as Error, data: null }
    }
  }

  async function updateBudget(id: string, data: Record<string, unknown>) {
    try {
      await api.patch(`/orcamentos/${id}`, data)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function getOrCreateBudget(mes: number, ano: number): Promise<Orcamento | null> {
    if (!user) return null

    // Evita roundtrip desnecessario quando o orcamento ja esta em memoria.
    const existing = budgets.find(b => b.mes === mes && b.ano === ano)
    if (existing) return existing

    try {
      const data = await api.post<Orcamento>('/orcamentos/get-or-create', { mes, ano })
      await fetch()
      return data
    } catch {
      return null
    }
  }

  return { budgets, loading, refresh: fetch, addBudget, updateBudget, getOrCreateBudget }
}
