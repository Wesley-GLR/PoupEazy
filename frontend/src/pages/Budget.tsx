import { useState, useMemo, type FormEvent } from 'react'
import { useBudget } from '../hooks/useBudget'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import BarChart from '../components/charts/BarChart'
import { formatCurrency, MONTH_NAMES } from '../lib/format'
import { Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Budget() {
  const { user } = useAuth()
  const { budgets, loading, addBudget, updateBudget } = useBudget()
  const { transactions } = useTransactions()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [valorPlanejado, setValorPlanejado] = useState('')

  const yearBudgets = useMemo(() =>
    budgets
      .filter(b => b.ano === selectedYear)
      .sort((a, b) => a.mes - b.mes),
    [budgets, selectedYear]
  )

  const chartData = useMemo(() =>
    yearBudgets.map(b => ({
      name: MONTH_NAMES[b.mes - 1].substring(0, 3),
      planejado: Number(b.valor_planejado),
      real: Number(b.valor_real),
    })),
    [yearBudgets]
  )

  const currentMonthBudget = yearBudgets.find(b => b.mes === now.getMonth() + 1 && b.ano === now.getFullYear())

  const categoryBreakdown = useMemo(() => {
    if (!currentMonthBudget) return []
    const monthTx = transactions.filter(t => {
      const d = new Date(t.data_transacao + 'T00:00:00')
      return d.getMonth() + 1 === now.getMonth() + 1
        && d.getFullYear() === now.getFullYear()
        && t.tipo === 'despesa'
        && t.status === 'confirmada'
    })

    const map = new Map<string, number>()
    monthTx.forEach(t => {
      const name = t.categoria?.nome ?? 'Outros'
      map.set(name, (map.get(name) ?? 0) + Number(t.valor))
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, currentMonthBudget, now])

  function resetForm() {
    setMes(now.getMonth() + 1)
    setAno(now.getFullYear())
    setValorPlanejado('')
    setEditingId(null)
  }

  function openNew() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const b = budgets.find(x => x.id === id)
    if (!b) return
    setMes(b.mes)
    setAno(b.ano)
    setValorPlanejado(String(b.valor_planejado))
    setEditingId(id)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    if (editingId) {
      const { error } = await updateBudget(editingId, { valor_planejado: parseFloat(valorPlanejado) })
      if (error) toast.error('Erro ao atualizar orçamento.')
      else toast.success('Orçamento atualizado!')
    } else {
      const { error } = await addBudget({
        id_usuario: user.id,
        mes,
        ano,
        valor_planejado: parseFloat(valorPlanejado),
      })
      if (error) toast.error('Erro ao criar orçamento. Já existe um para este mês?')
      else toast.success('Orçamento criado!')
    }

    setModalOpen(false)
    resetForm()
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
        <h1 className="text-3xl font-bold text-black">Orçamento</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
          >
            <Plus size={18} /> Novo Orçamento
          </button>
        </div>
      </div>

      {currentMonthBudget && (
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E1E1E]">
              {MONTH_NAMES[currentMonthBudget.mes - 1]} {currentMonthBudget.ano}
            </h2>
            <button onClick={() => openEdit(currentMonthBudget.id)} className="rounded p-1 text-muted hover:text-primary">
              <Pencil size={16} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted">Planejado</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(Number(currentMonthBudget.valor_planejado))}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Real</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(Number(currentMonthBudget.valor_real))}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Disponível</p>
              <p className={`text-xl font-bold ${Number(currentMonthBudget.valor_planejado) - Number(currentMonthBudget.valor_real) >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(Number(currentMonthBudget.valor_planejado) - Number(currentMonthBudget.valor_real))}
              </p>
            </div>
          </div>

          <ProgressBar
            percent={currentMonthBudget.valor_planejado > 0
              ? (Number(currentMonthBudget.valor_real) / Number(currentMonthBudget.valor_planejado)) * 100
              : 0
            }
          />

          {categoryBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-muted">Despesas por categoria neste mês</h3>
              <div className="space-y-2">
                {categoryBreakdown.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <span className="text-[#1E1E1E]">{cat.name}</span>
                    <span className="font-medium text-danger">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1E1E1E]">Planejado vs Real — {selectedYear}</h2>
          <BarChart data={chartData} />
        </div>
      )}

      {yearBudgets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-semibold">Mês</th>
                <th className="px-4 py-3 text-right font-semibold">Planejado</th>
                <th className="px-4 py-3 text-right font-semibold">Real</th>
                <th className="px-4 py-3 text-right font-semibold">Desvio</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {yearBudgets.map(b => {
                const desvio = Number(b.valor_real) - Number(b.valor_planejado)
                return (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{MONTH_NAMES[b.mes - 1]}</td>
                    <td className="px-4 py-3 text-right text-primary">{formatCurrency(Number(b.valor_planejado))}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(b.valor_real))}</td>
                    <td className={`px-4 py-3 text-right font-medium ${desvio > 0 ? 'text-danger' : 'text-success'}`}>
                      {desvio > 0 ? '+' : ''}{formatCurrency(desvio)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(b.id)} className="rounded p-1 text-muted hover:text-primary">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {yearBudgets.length === 0 && (
        <p className="py-12 text-center text-muted">Nenhum orçamento para {selectedYear}. Crie o primeiro!</p>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editingId ? 'Editar Orçamento' : 'Novo Orçamento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Mês</label>
                <select
                  value={mes}
                  onChange={e => setMes(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Ano</label>
                <input
                  type="number"
                  value={ano}
                  onChange={e => setAno(Number(e.target.value))}
                  min={2000}
                  max={2100}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Valor planejado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorPlanejado}
              onChange={e => setValorPlanejado(e.target.value)}
              required
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
