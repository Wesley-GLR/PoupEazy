import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Orcamento } from '../types/database'
import { useAuth } from './useAuth'

// Hook de orçamento mensal:
// concentra leitura/escrita de orçamentos e a regra "obter ou criar" por mês/ano.
export function useBudget() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)

  // Busca sempre ordenada do mais recente para o mais antigo para facilitar exibição.
  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('orcamento')
      .select('*')
      .eq('id_usuario', user.id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })

    setBudgets((data as Orcamento[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addBudget(budget: Record<string, unknown>) {
    const { error, data } = await supabase.from('orcamento').insert(budget).select().single()
    if (!error) await fetch()
    return { error, data: data as Orcamento | null }
  }

  async function updateBudget(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('orcamento').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  async function getOrCreateBudget(mes: number, ano: number): Promise<Orcamento | null> {
    if (!user) return null

    // Evita roundtrip desnecessário quando orçamento já está em memória.
    const existing = budgets.find(b => b.mes === mes && b.ano === ano)
    if (existing) return existing

    // Upsert garante idempotência: se já existir pela chave única, reaproveita.
    const { data } = await supabase
      .from('orcamento')
      .upsert({
        id_usuario: user.id,
        mes,
        ano,
        valor_planejado: 0,
      }, { onConflict: 'id_usuario,mes,ano' })
      .select()
      .single()

    if (data) await fetch()
    return data as Orcamento | null
  }

  return { budgets, loading, refresh: fetch, addBudget, updateBudget, getOrCreateBudget }
}
