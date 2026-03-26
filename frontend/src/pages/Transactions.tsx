import { useState, useMemo, type FormEvent } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useBudget } from '../hooks/useBudget'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDate } from '../lib/format'
import { Plus, Pencil, Trash2, Search, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Transactions() {
  const { user } = useAuth()
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { categories } = useCategories()
  const { getOrCreateBudget } = useBudget()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'despesa' | 'receita'>('todos')

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [categoriaId, setCategoriaId] = useState('')
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split('T')[0])

  const filteredTx = useMemo(() =>
    transactions.filter(tx => {
      const matchSearch = tx.descricao.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'todos' || tx.tipo === filterType
      return matchSearch && matchType
    }),
    [transactions, search, filterType]
  )

  const filteredCategories = useMemo(() =>
    categories.filter(c => {
      if (tipo === 'receita') return c.tipo === 'receita'
      return c.tipo === 'despesa_fixa' || c.tipo === 'despesa_variavel'
    }),
    [categories, tipo]
  )

  function resetForm() {
    setDescricao('')
    setValor('')
    setTipo('despesa')
    setCategoriaId('')
    setDataTransacao(new Date().toISOString().split('T')[0])
    setEditingId(null)
  }

  function openNew() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    setDescricao(tx.descricao)
    setValor(String(tx.valor))
    setTipo(tx.tipo)
    setCategoriaId(tx.id_categoria)
    setDataTransacao(tx.data_transacao)
    setEditingId(id)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const d = new Date(dataTransacao + 'T00:00:00')
    const budget = await getOrCreateBudget(d.getMonth() + 1, d.getFullYear())
    if (!budget) {
      toast.error('Erro ao criar orçamento do mês.')
      return
    }

    const payload = {
      descricao,
      valor: parseFloat(valor),
      tipo,
      id_categoria: categoriaId,
      id_orcamento: budget.id,
      data_transacao: dataTransacao,
      origem: 'manual' as const,
      status: 'confirmada' as const,
      id_metas: null,
      nlp_metadata: null,
    }

    if (editingId) {
      const { error } = await updateTransaction(editingId, payload)
      if (error) toast.error('Erro ao atualizar transação.')
      else toast.success('Transação atualizada!')
    } else {
      const { error } = await addTransaction(payload)
      if (error) toast.error('Erro ao criar transação.')
      else toast.success('Transação criada!')
    }

    setModalOpen(false)
    resetForm()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    const { error } = await deleteTransaction(id)
    if (error) toast.error('Erro ao excluir.')
    else toast.success('Transação excluída!')
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
        <h1 className="text-3xl font-bold text-black">Transações</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
        >
          <Plus size={18} /> Nova Transação
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transações..."
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as 'todos' | 'despesa' | 'receita')}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="todos">Todos</option>
          <option value="despesa">Despesas</option>
          <option value="receita">Receitas</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-semibold text-[#1E1E1E]">Data</th>
              <th className="px-4 py-3 text-left font-semibold text-[#1E1E1E]">Descrição</th>
              <th className="px-4 py-3 text-left font-semibold text-[#1E1E1E]">Categoria</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1E1E1E]">Valor</th>
              <th className="px-4 py-3 text-center font-semibold text-[#1E1E1E]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              filteredTx.map(tx => (
                <tr key={tx.id} className="border-b border-border/50 transition hover:bg-surface/50">
                  <td className="px-4 py-3 text-muted">{formatDate(tx.data_transacao)}</td>
                  <td className="px-4 py-3 font-medium text-[#1E1E1E]">{tx.descricao}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.tipo === 'receita'
                        ? 'bg-success/20 text-green-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}>
                      {tx.categoria?.nome ?? '—'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${tx.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                    {tx.tipo === 'receita' ? '+ ' : '- '}{formatCurrency(Number(tx.valor))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(tx.id)} className="rounded p-1 text-muted hover:bg-surface hover:text-primary">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="rounded p-1 text-muted hover:bg-surface hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:opacity-90"
      >
        <MessageCircle size={18} /> Registrar via WhatsApp
      </a>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editingId ? 'Editar Transação' : 'Nova Transação'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${tipo === 'despesa' ? 'bg-danger text-white' : 'bg-surface text-muted'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setTipo('receita')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${tipo === 'receita' ? 'bg-success text-white' : 'bg-surface text-muted'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Data</label>
              <input
                type="date"
                value={dataTransacao}
                onChange={e => setDataTransacao(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Categoria</label>
            <select
              value={categoriaId}
              onChange={e => setCategoriaId(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
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
