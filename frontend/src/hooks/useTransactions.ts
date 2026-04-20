import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DespesaComCategoria } from '../types/database'
import { useAuth } from './useAuth'

// Hook de transações:
// resolve o encadeamento orçamento -> despesas e já traz categoria via join.
export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<DespesaComCategoria[]>([])
  const [loading, setLoading] = useState(true)

  // Fluxo de leitura:
  // 1) busca IDs de orçamentos do usuário
  // 2) busca despesas desses orçamentos com categoria agregada.
  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: orcamentos } = await supabase
      .from('orcamento')
      .select('id')
      .eq('id_usuario', user.id)

    if (!orcamentos?.length) {
      // Sem orçamento cadastrado, por regra não há transações vinculáveis.
      setTransactions([])
      setLoading(false)
      return
    }

    const orcIds = orcamentos.map((o: { id: string }) => o.id)

    const { data } = await supabase
      .from('despesas')
      .select('*, categoria(*)')
      .in('id_orcamento', orcIds)
      .order('data_transacao', { ascending: false })

    setTransactions((data as DespesaComCategoria[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addTransaction(tx: Record<string, unknown>) {
    const { error } = await supabase.from('despesas').insert(tx)
    if (!error) await fetch()
    return { error }
  }

  async function updateTransaction(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('despesas').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('despesas').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  return { transactions, loading, refresh: fetch, addTransaction, updateTransaction, deleteTransaction }
}
