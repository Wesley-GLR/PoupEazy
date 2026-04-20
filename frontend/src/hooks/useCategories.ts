import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria } from '../types/database'

// Hook de categorias:
// inclui categorias do sistema e personalizadas conforme políticas RLS.
export function useCategories() {
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  // Ordena alfabeticamente para manter select/listagens previsíveis na UI.
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

  async function addCategory(cat: Record<string, unknown>) {
    const { error } = await supabase.from('categoria').insert(cat)
    if (!error) await fetch()
    return { error }
  }

  async function updateCategory(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from('categoria').update(data).eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categoria').delete().eq('id', id)
    if (!error) await fetch()
    return { error }
  }

  return { categories, loading, refresh: fetch, addCategory, updateCategory, deleteCategory }
}
