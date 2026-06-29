import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Categoria } from '../types/database'
import { useAuth } from './useAuth'

// Hook de categorias:
// o backend retorna categorias do sistema + as personalizadas do usuario.
export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.get<Categoria[]>('/categorias')
      setCategories(data ?? [])
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addCategory(cat: Record<string, unknown>) {
    try {
      await api.post('/categorias', cat)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function updateCategory(id: string, data: Record<string, unknown>) {
    try {
      await api.patch(`/categorias/${id}`, data)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function deleteCategory(id: string) {
    try {
      await api.delete(`/categorias/${id}`)
      await fetch()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return { categories, loading, refresh: fetch, addCategory, updateCategory, deleteCategory }
}
