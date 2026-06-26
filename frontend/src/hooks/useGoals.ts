import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Meta } from '../types/database'
import { useAuth } from './useAuth'

/**
 * Hook customizado para o gerenciamento de Metas Financeiras.
 * * Centraliza o estado e as operações de CRUD relacionadas às metas do usuário
 * no Supabase. Garante que a interface esteja sempre atualizada, forçando uma 
 * nova busca de dados local (sincronização) automaticamente após cada mutação 
 * bem-sucedida no banco de dados.
 * * @returns Objeto contendo a lista de metas (`goals`), estado de carregamento (`loading`), função para busca manual (`refresh`) e os métodos de mutação (`addGoal`, `updateGoal`, `deleteGoal`).
 */
export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Busca todas as metas atreladas ao usuário autenticado.
   * * Aplica uma ordenação crescente baseada na `data_limite`, garantindo que as metas
   * mais urgentes (próximas do vencimento) apareçam primeiro na interface para 
   * facilitar a priorização pelo usuário.
   */
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

  /**
   * Insere uma nova meta no banco de dados.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param goal - Objeto contendo os dados necessários para criar a meta.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function addGoal(goal: Record<string, unknown>) {
    const { error } = await supabase.from('metas').insert(goal)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Atualiza os dados de uma meta existente.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param id - O identificador único da meta a ser editada.
   * @param data - Objeto contendo apenas os campos que devem ser atualizados.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function updateGoal(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('metas').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Exclui permanentemente uma meta do banco de dados.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param id - O identificador único da meta a ser deletada.
   * @returns O objeto de erro retornado pela requisição, se houver.
   */
  async function deleteGoal(id: string) {
    const { error } = await supabase.from('metas').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  return { goals, loading, refresh: fetch, addGoal, updateGoal, deleteGoal }
}
