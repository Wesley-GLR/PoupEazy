import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Orcamento } from '../types/database'
import { useAuth } from './useAuth'

/**
 * Hook customizado para o gerenciamento de Orçamentos mensais.
 * * Centraliza as operações de leitura e escrita de orçamentos do usuário.
 * Destaca-se por encapsular a regra de negócio central do aplicativo que garante 
 * a existência de um orçamento pai para cada transação através da função `getOrCreateBudget`.
 * * @returns Objeto contendo a lista de orçamentos (`budgets`), estado de carregamento (`loading`), função de recarregamento (`refresh`) e os métodos de mutação (`addBudget`, `updateBudget`, `getOrCreateBudget`).
 */
export function useBudget() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Busca todos os orçamentos vinculados ao usuário autenticado.
   * * Aplica uma ordenação decrescente dupla (primeiro pelo `ano`, depois pelo `mes`),
   * garantindo que os orçamentos mais recentes sejam sempre os primeiros na lista,
   * facilitando a renderização histórica na UI.
   */
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

  /**
   * Insere um novo orçamento manual no banco de dados.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param budget - Objeto contendo os dados do orçamento a ser criado.
   * @returns Objeto contendo o erro (se houver) e os dados inseridos (`data`).
   */
  async function addBudget(budget: Record<string, unknown>) {
    const { error, data } = await supabase.from('orcamento').insert(budget).select().single()
    if (!error) await fetch()
    return { error, data: data as Orcamento | null }
  }

  /**
   * Atualiza os dados de um orçamento existente (ex: alteração do valor planejado).
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param id - O identificador único do orçamento a ser modificado.
   * @param data - Objeto contendo os campos a serem atualizados.
   * @returns O objeto de erro retornado pela operação no Supabase, se houver.
   */
  async function updateBudget(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('orcamento').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Garante a existência de um orçamento para um determinado mês e ano.
   * * Implementa um fluxo otimizado:
   * 1. Verifica a memória local (`budgets`) para evitar roundtrips desnecessários ao banco.
   * 2. Se não existir localmente, realiza um `upsert` no banco de dados, utilizando a chave 
   * única composita (`id_usuario,mes,ano`) para garantir a idempotência da operação 
   * (cria se não existir, ignora se já existir).
   * * @param mes - O número do mês (1 a 12).
   * @param ano - O ano de referência (ex: 2026).
   * @returns O objeto do orçamento correspondente, seja ele recém-criado ou recuperado.
   */
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
