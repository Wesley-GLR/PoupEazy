import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DespesaComCategoria } from '../types/database'
import { useAuth } from './useAuth'

/**
 * Hook customizado para gerenciamento centralizado de Transações.
 * * Responsável por orquestrar o estado e as operações de CRUD das despesas/receitas
 * na base de dados do Supabase. Implementa uma lógica de encadeamento relacional: 
 * primeiro identifica todos os orçamentos pertencentes ao usuário autenticado e, 
 * em seguida, busca as transações atreladas a eles, já efetuando o `join` para 
 * trazer os dados detalhados da Categoria associada.
 * * @returns Um objeto contendo a lista de transações (`transactions`), estado de carregamento (`loading`), função de recarregamento manual (`refresh`) e os métodos de mutação (`addTransaction`, `updateTransaction`, `deleteTransaction`).
 */
export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<DespesaComCategoria[]>([])
  const [loading, setLoading] = useState(true)

 /**
   * Fluxo principal de leitura de dados.
   * 1. Busca os IDs de todos os orçamentos vinculados ao usuário ativo.
   * 2. Se houver orçamentos, busca as despesas/receitas com o relacionamento de categoria `categoria(*)`.
   * Atualiza o estado local `transactions` e desativa o `loading`.
   */
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

  /**
   * Insere uma nova transação no banco de dados.
   * Em caso de sucesso, aciona o recarregamento (`fetch`) para sincronizar a interface.
   * * @param tx - Objeto contendo os dados da transação a ser inserida.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function addTransaction(tx: Record<string, unknown>) {
    const { error } = await supabase.from('despesas').insert(tx)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Atualiza os dados de uma transação existente.
   * Em caso de sucesso, aciona o recarregamento (`fetch`) para sincronizar a interface.
   * * @param id - O identificador único da transação.
   * @param data - Objeto contendo os campos a serem atualizados.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function updateTransaction(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('despesas').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Remove permanentemente uma transação do banco de dados.
   * Em caso de sucesso, aciona o recarregamento (`fetch`) para sincronizar a interface.
   * * @param id - O identificador único da transação a ser deletada.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('despesas').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  return { transactions, loading, refresh: fetch, addTransaction, updateTransaction, deleteTransaction }
}
