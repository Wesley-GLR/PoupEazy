import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria } from '../types/database'

/**
 * Hook customizado para o gerenciamento de Categorias de transação.
 * * Centraliza o acesso e as mutações das categorias financeiras. Graças às políticas 
 * de segurança (RLS - Row Level Security) configuradas no Supabase, a busca 
 * retorna automaticamente de forma segura a mescla das categorias globais (nativas do sistema) 
 * com as categorias personalizadas criadas especificamente pelo usuário logado.
 * * @returns Objeto contendo a lista de categorias (`categories`), estado de carregamento (`loading`), função de recarregamento (`refresh`) e os métodos de mutação (`addCategory`, `updateCategory`, `deleteCategory`).
 */
export function useCategories() {
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Busca todas as categorias acessíveis ao usuário atual diretamente do banco de dados.
   * * Aplica uma ordenação alfabética pelo campo `nome` de forma nativa na query.
   * Isso garante que listas e seletores (dropdowns) na UI permaneçam consistentes 
   * e previsíveis para o usuário final.
   */
  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categoria')
      .select('*')
      .order('nome')

    setCategories((data as Categoria[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  /**
   * Insere uma nova categoria personalizada no banco de dados.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param cat - Objeto contendo os dados essenciais da nova categoria.
   * @returns O objeto de erro retornado pela operação no Supabase, se houver.
   */
  async function addCategory(cat: Record<string, unknown>) {
    const { error } = await supabase.from('categoria').insert(cat)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Atualiza os dados de uma categoria personalizada existente.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param id - O identificador único da categoria a ser modificada.
   * @param data - Objeto contendo as chaves e valores a serem atualizados.
   * @returns O objeto de erro retornado pela operação no Supabase, se houver.
   */
  async function updateCategory(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('categoria').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  /**
   * Remove permanentemente uma categoria personalizada do banco de dados.
   * Em caso de sucesso, aciona o recarregamento automático (`fetch`) para atualizar o estado local.
   * * @param id - O identificador único da categoria a ser excluída.
   * @returns O objeto de erro retornado pela operação no Supabase, se houver.
   */
  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categoria').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  return { categories, loading, refresh: fetch, addCategory, updateCategory, deleteCategory }
}
