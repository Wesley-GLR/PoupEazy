import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Meta } from '../types/database'
import { useAuth } from './useAuth'

// Hook de metas financeiras (CRUD, sincronização local e registro de aportes).
export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)

  // Ordenação por prazo facilita priorização de metas mais próximas do vencimento.
  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('metas')
      .select('*')
      .eq('id_usuario', user.id)
      .order('data_limite', { ascending: true })

    setGoals((data as Meta[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addGoal(goal: Record<string, unknown>) {
    const { error } = await supabase.from('metas').insert(goal)
    if (!error) await fetch()
    return { error }
  }

  async function updateGoal(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('metas').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from('metas').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  // Registra uma transação (aporte ou retirada) vinculada à meta.
  // O trigger fn_sync_metas_valor_atual no banco atualiza valor_atual automaticamente.
  // Requer id_orcamento válido — deve ser buscado ou criado antes de chamar esta função.
  async function addGoalTransaction(tx: {
    id_orcamento: string
    id_metas: string
    id_categoria: string
    valor: number
    data_transacao: string
    descricao: string
    tipo: 'despesa' | 'receita'
  }) {
    const { error } = await supabase.from('despesas').insert({
      ...tx,
      origem: 'manual',
      status: 'confirmada',
    })
    if (!error) await fetch()   // re-fetch para refletir novo valor_atual
    return { error }
  }

  return { goals, loading, refresh: fetch, addGoal, updateGoal, deleteGoal, addGoalTransaction }
}