import { useState, useMemo, type FormEvent } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/ui/Modal'
import PieChart from '../components/charts/PieChart'
import { formatCurrency } from '../lib/format'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPO_LABELS: Record<string, string> = {
  despesa_fixa: 'Despesa Fixa',
  despesa_variavel: 'Despesa Variável',
  receita: 'Receita',
}

export default function Categories() {
  const { user } = useAuth()
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories()
  const { transactions } = useTransactions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'despesa_fixa' | 'despesa_variavel' | 'receita'>('despesa_variavel')
  const [icone, setIcone] = useState('')

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter(t => t.tipo === 'despesa' && t.status === 'confirmada')
      .forEach(t => {
        const name = t.categoria?.nome ?? 'Outros'
        map.set(name, (map.get(name) ?? 0) + Number(t.valor))
      })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalDespesas = chartData.reduce((s, d) => s + d.value, 0)

  function resetForm() {
    setNome('')
    setTipo('despesa_variavel')
    setIcone('')
    setEditingId(null)
  }

  function openNew() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const cat = categories.find(c => c.id === id)
    if (!cat || cat.sistema) return
    setNome(cat.nome)
    setTipo(cat.tipo)
    setIcone(cat.icone ?? '')
    setEditingId(id)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const payload = {
      nome,
      tipo,
      icone: icone || null,
      sistema: false,
      id_usuario: user.id,
    }

    if (editingId) {
      const { error } = await updateCategory(editingId, payload)
      if (error) toast.error('Erro ao atualizar categoria.')
      else toast.success('Categoria atualizada!')
    } else {
      const { error } = await addCategory(payload)
      if (error) toast.error('Erro ao criar categoria.')
      else toast.success('Categoria criada!')
    }

    setModalOpen(false)
    resetForm()
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id)
    if (cat?.sistema) {
      toast.error('Categorias do sistema não podem ser excluídas.')
      return
    }
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    const { error } = await deleteCategory(id)
    if (error) toast.error('Erro ao excluir. A categoria pode estar em uso.')
    else toast.success('Categoria excluída!')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-black">Categorias</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1E1E1E]">Despesas por Categoria</h2>
          <PieChart data={chartData} />
          {totalDespesas > 0 && (
            <p className="mt-2 text-center text-sm text-muted">
              Total: {formatCurrency(totalDespesas)}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1E1E1E]">Todas as Categorias</h2>
          <div className="space-y-2">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 transition hover:bg-surface/50"
              >
                <div className="flex items-center gap-3">
                  {cat.sistema && <ShieldCheck size={14} className="text-primary" />}
                  <div>
                    <p className="text-sm font-medium text-[#1E1E1E]">{cat.nome}</p>
                    <p className="text-xs text-muted">{TIPO_LABELS[cat.tipo]}</p>
                  </div>
                </div>
                {!cat.sistema && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat.id)} className="rounded p-1 text-muted hover:text-primary">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="rounded p-1 text-muted hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editingId ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Tipo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as typeof tipo)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="despesa_variavel">Despesa Variável</option>
              <option value="despesa_fixa">Despesa Fixa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Ícone (opcional)</label>
            <input
              type="text"
              value={icone}
              onChange={e => setIcone(e.target.value)}
              placeholder="ex: car, home, music"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition hover:bg-primary-light"
          >
            {editingId ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
