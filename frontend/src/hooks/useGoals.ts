import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Meta } from '../types/database'
import { useAuth } from './useAuth'

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)

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

  return { goals, loading, refresh: fetch, addGoal, updateGoal, deleteGoal }
}
