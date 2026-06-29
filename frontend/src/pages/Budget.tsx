import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { useBudget } from '../hooks/useBudget'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { usePeriod } from '../hooks/usePeriod'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import BarChart from '../components/charts/BarChart'
import { formatCurrency, isInPeriod, MONTH_NAMES } from '../lib/format'
import { Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

// Tela de orçamento:
// compara planejado vs gasto (somente despesas) e respeita o período global.
// O percentual de consumo é gasto/planejado — não usamos valor_real do banco
// (que é saldo líquido despesas - receitas e pode ficar negativo).
export default function Budget() {
  const { user } = useAuth()
  const { budgets, loading, addBudget, updateBudget } = useBudget()
  const { transactions } = useTransactions()
  const { mes, ano } = usePeriod()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [mesForm, setMesForm] = useState(mes)
  const [anoForm, setAnoForm] = useState(ano)
  const [valorPlanejado, setValorPlanejado] = useState('')

  // Soma de despesas e receitas confirmadas para um mês/ano específico.
  function statsFor(m: number, a: number) {
    let gasto = 0
    let receitas = 0
    transactions.forEach(t => {
      if (t.status !== 'confirmada') return
      if (!isInPeriod(t.data_transacao, m, a)) return
      if (t.tipo === 'despesa') gasto += Number(t.valor)
      else if (t.tipo === 'receita') receitas += Number(t.valor)
    })
    return { gasto, receitas, saldo: receitas - gasto }
  }

  // Recorte anual para visão histórica e gráfico comparativo.
  const yearBudgets = useMemo(() =>
    budgets
      .filter(b => b.ano === ano)
      .sort((a, b) => a.mes - b.mes),
    [budgets, ano]
  )

  // Planejado vs gasto (despesas) por mês — base do gráfico de barras.
  const chartData = useMemo(() =>
    yearBudgets.map(b => ({
      name: MONTH_NAMES[b.mes - 1].substring(0, 3),
      planejado: Number(b.valor_planejado),
      gasto: statsFor(b.mes, b.ano).gasto,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yearBudgets, transactions]
  )

  const selectedBudget = budgets.find(b => b.mes === mes && b.ano === ano)
  const selectedStats = useMemo(() => statsFor(mes, ano), [mes, ano, transactions])
  const planejado = selectedBudget ? Number(selectedBudget.valor_planejado) : 0
  const disponivel = planejado - selectedStats.gasto
  const consumoPct = planejado > 0 ? (selectedStats.gasto / planejado) * 100 : 0

  // Breakdown de despesas confirmadas do mês selecionado.
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter(t => t.status === 'confirmada' && t.tipo === 'despesa' && isInPeriod(t.data_transacao, mes, ano))
      .forEach(t => {
        const name = t.categoria?.nome ?? 'Outros'
        map.set(name, (map.get(name) ?? 0) + Number(t.valor))
      })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, mes, ano])

  function resetForm() {
    setMesForm(mes)
    setAnoForm(ano)
    setValorPlanejado('')
    setEditingId(null)
  }

  // Mantém o formulário "Novo Orçamento" sincronizado com o período selecionado.
  useEffect(() => {
    if (!modalOpen) {
      setMesForm(mes)
      setAnoForm(ano)
    }
  }, [mes, ano, modalOpen])

  function openNew() {
    setMesForm(mes)
    setAnoForm(ano)
    setValorPlanejado('')
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const b = budgets.find(x => x.id === id)
    if (!b) return
    setMesForm(b.mes)
    setAnoForm(b.ano)
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
        mes: mesForm,
        ano: anoForm,
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
        <div>
          <h1 className="text-3xl font-bold text-black">Orçamento</h1>
          <p className="text-sm text-muted">{MONTH_NAMES[mes - 1]} de {ano}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
        >
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      {selectedBudget ? (
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E1E1E]">
              {MONTH_NAMES[mes - 1]} {ano}
            </h2>
            <button onClick={() => openEdit(selectedBudget.id)} className="rounded p-1 text-muted hover:text-primary">
              <Pencil size={16} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-muted">Planejado</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(planejado)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Gasto</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(selectedStats.gasto)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Receitas</p>
              <p className="text-xl font-bold text-success">{formatCurrency(selectedStats.receitas)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Disponível</p>
              <p className={`text-xl font-bold ${disponivel >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(disponivel)}
              </p>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Consumo do orçamento</span>
            <span>{formatCurrency(selectedStats.gasto)} de {formatCurrency(planejado)}</span>
          </div>
          <ProgressBar percent={consumoPct} />
          {selectedStats.gasto > planejado && planejado > 0 && (
            <p className="mt-2 text-xs font-medium text-danger">
              Orçamento excedido em {formatCurrency(selectedStats.gasto - planejado)}.
            </p>
          )}

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
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface-card p-8 text-center shadow-sm">
          <p className="mb-3 text-muted">
            Nenhum orçamento definido para {MONTH_NAMES[mes - 1]} de {ano}.
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
          >
            <Plus size={18} /> Criar orçamento para {MONTH_NAMES[mes - 1]}
          </button>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1E1E1E]">Planejado vs Gasto — {ano}</h2>
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
                <th className="px-4 py-3 text-right font-semibold">Gasto</th>
                <th className="px-4 py-3 text-right font-semibold">Disponível</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {yearBudgets.map(b => {
                const gasto = statsFor(b.mes, b.ano).gasto
                const disp = Number(b.valor_planejado) - gasto
                return (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{MONTH_NAMES[b.mes - 1]}</td>
                    <td className="px-4 py-3 text-right text-primary">{formatCurrency(Number(b.valor_planejado))}</td>
                    <td className="px-4 py-3 text-right text-danger">{formatCurrency(gasto)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${disp >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(disp)}
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
        <p className="py-12 text-center text-muted">Nenhum orçamento para {ano}. Crie o primeiro!</p>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editingId ? 'Editar Orçamento' : 'Novo Orçamento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Mês</label>
                <select
                  value={mesForm}
                  onChange={e => setMesForm(Number(e.target.value))}
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
                  value={anoForm}
                  onChange={e => setAnoForm(Number(e.target.value))}
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
