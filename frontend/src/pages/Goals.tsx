import { useState, type FormEvent } from 'react'
import { useGoals } from '../hooks/useGoals'
import { useAuth } from '../hooks/useAuth'
import { useBudget } from '../hooks/useBudget'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency, formatDate } from '../lib/format'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

// Tela de metas:
// separa metas ativas e finalizadas para facilitar operação diária.
// Permite registrar aportes (entradas) e retiradas (saídas) por meta.
export default function Goals() {
  const { user } = useAuth()
  const { goals, loading, addGoal, updateGoal, deleteGoal, addGoalTransaction } = useGoals()
  const { categories } = useCategories()
  const { transactions } = useTransactions()
  const { budgets, getOrCreateBudget } = useBudget()

  // --- Modal de criar/editar meta ---
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorObjetivo, setValorObjetivo] = useState('')
  const [dataLimite, setDataLimite] = useState('')

  // --- Modal de aporte/retirada ---
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [txGoalId, setTxGoalId] = useState<string | null>(null)
  const [txTipo, setTxTipo] = useState<'despesa' | 'receita'>('receita')
  const [txValor, setTxValor] = useState('')
  const [txData, setTxData] = useState(new Date().toISOString().slice(0, 10))
  const [txDescricao, setTxDescricao] = useState('')
  const [txCategoriaId, setTxCategoriaId] = useState('')

  // --- Cards expandidos (mostrar histórico da meta) ---
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Metas ativas ficam no topo com ações rápidas.
  const activeGoals = goals.filter(g => g.status === 'ativa')
  const completedGoals = goals.filter(g => g.status !== 'ativa')

  // Transações vinculadas a cada meta
  function goalTransactions(goalId: string) {
    return transactions
      .filter(t => t.id_metas === goalId)
      .slice(0, 5)
  }

  function resetForm() {
    setNome('')
    setDescricao('')
    setValorObjetivo('')
    setDataLimite('')
    setEditingId(null)
  }

  function openNew() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    setNome(goal.nome)
    setDescricao(goal.descricao ?? '')
    setValorObjetivo(String(goal.valor_objetivo))
    setDataLimite(goal.data_limite)
    setEditingId(id)
    setModalOpen(true)
  }

  function openTxModal(goalId: string) {
    setTxGoalId(goalId)
    setTxTipo('receita')
    setTxValor('')
    setTxData(new Date().toISOString().slice(0, 10))
    setTxDescricao('')
    setTxCategoriaId(categories[0]?.id ?? '')
    setTxModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    if (editingId) {
      const { error } = await updateGoal(editingId, {
        nome,
        descricao: descricao || null,
        valor_objetivo: parseFloat(valorObjetivo),
        data_limite: dataLimite,
      })
      if (error) toast.error('Erro ao atualizar meta.')
      else toast.success('Meta atualizada!')
    } else {
      const { error } = await addGoal({
        id_usuario: user.id,
        nome,
        descricao: descricao || null,
        valor_objetivo: parseFloat(valorObjetivo),
        data_limite: dataLimite,
        status: 'ativa',
      })
      if (error) toast.error('Erro ao criar meta.')
      else toast.success('Meta criada!')
    }

    setModalOpen(false)
    resetForm()
  }

  // Submete um aporte ou retirada vinculado à meta selecionada.
  async function handleTxSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !txGoalId) return

    const now = new Date()
    // Obtém ou cria orçamento do mês corrente para vincular a transação.
    const budget = await getOrCreateBudget(now.getMonth() + 1, now.getFullYear())
    if (!budget) {
      toast.error('Não foi possível obter o orçamento do mês.')
      return
    }

    if (!txCategoriaId) {
      toast.error('Selecione uma categoria.')
      return
    }

    const { error } = await addGoalTransaction({
      id_orcamento: budget.id,
      id_metas: txGoalId,
      id_categoria: txCategoriaId,
      valor: parseFloat(txValor),
      data_transacao: txData,
      descricao: txDescricao || (txTipo === 'receita' ? 'Aporte na meta' : 'Retirada da meta'),
      tipo: txTipo,
    })

    if (error) toast.error('Erro ao registrar movimentação.')
    else toast.success(txTipo === 'receita' ? 'Aporte registrado!' : 'Retirada registrada!')

    setTxModalOpen(false)
  }

  async function handleStatusChange(id: string, status: 'concluida' | 'cancelada') {
    const { error } = await updateGoal(id, { status })
    if (error) toast.error('Erro ao atualizar status.')
    else toast.success(status === 'concluida' ? 'Meta concluída!' : 'Meta cancelada.')
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return
    const { error } = await deleteGoal(id)
    if (error) toast.error('Erro ao excluir.')
    else toast.success('Meta excluída!')
  }

  // Texto auxiliar para urgência de prazo.
  function getDaysLabel(dataLimite: string) {
    const diff = Math.ceil((new Date(dataLimite + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Vencida'
    if (diff === 0) return 'Vence hoje'
    return `${diff} dias restantes`
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
        <h1 className="text-3xl font-bold text-black">Metas</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
        >
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <p className="py-12 text-center text-muted">Nenhuma meta cadastrada ainda. Crie sua primeira meta!</p>
      )}

      {activeGoals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeGoals.map(goal => {
            const pct = goal.valor_objetivo > 0
              ? (Number(goal.valor_atual) / Number(goal.valor_objetivo)) * 100
              : 0
            const isExpanded = expandedId === goal.id
            const txs = goalTransactions(goal.id)

            return (
              <div key={goal.id} className="rounded-lg border border-border bg-surface-card p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1E1E1E]">{goal.nome}</h3>
                    {goal.descricao && (
                      <p className="text-xs text-muted">{goal.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {/* Botão de aporte/retirada */}
                    <button
                      onClick={() => openTxModal(goal.id)}
                      className="rounded p-1 text-muted hover:text-primary"
                      title="Registrar aporte ou retirada"
                    >
                      <Plus size={16} />
                    </button>
                    <button onClick={() => handleStatusChange(goal.id, 'concluida')} className="rounded p-1 text-muted hover:text-success" title="Concluir">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => openEdit(goal.id)} className="rounded p-1 text-muted hover:text-primary">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleStatusChange(goal.id, 'cancelada')} className="rounded p-1 text-muted hover:text-danger" title="Cancelar">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>

                <p className="mb-2 text-sm text-[#1E1E1E]">
                  {formatCurrency(Number(goal.valor_atual))} de {formatCurrency(Number(goal.valor_objetivo))}
                </p>

                <ProgressBar percent={pct} />

                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>Prazo: {formatDate(goal.data_limite)}</span>
                  <span>{getDaysLabel(goal.data_limite)}</span>
                </div>

                {/* Histórico de movimentações da meta */}
                {txs.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                      className="flex w-full items-center justify-between text-xs text-muted hover:text-primary"
                    >
                      <span>Movimentações ({txs.length})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5">
                        {txs.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              {tx.tipo === 'receita'
                                ? <ArrowDownCircle size={13} className="text-success" />
                                : <ArrowUpCircle size={13} className="text-danger" />}
                              <span className="text-[#1E1E1E]">{tx.descricao}</span>
                            </div>
                            <div className="text-right">
                               <span className={tx.tipo === 'receita' ? 'text-success' : 'text-danger'}>
                                {tx.tipo === 'receita' ? '+' : '-'}{formatCurrency(Number(tx.valor))}
                              </span>
                              <span className="ml-1 text-muted">{formatDate(tx.data_transacao)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted">Metas Finalizadas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {completedGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-card/50 px-4 py-3 opacity-70">
                <div>
                  <p className="text-sm font-medium text-[#1E1E1E]">{goal.nome}</p>
                  <p className="text-xs text-muted">
                    {goal.status === 'concluida' ? 'Concluída' : 'Cancelada'} — {formatCurrency(Number(goal.valor_atual))} / {formatCurrency(Number(goal.valor_objetivo))}
                  </p>
                </div>
                <button onClick={() => handleDelete(goal.id)} className="rounded p-1 text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal criar/editar meta */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editingId ? 'Editar Meta' : 'Nova Meta'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Nome da meta</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Viagem em família"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Valor objetivo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valorObjetivo}
                onChange={e => setValorObjetivo(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Data limite</label>
              <input
                type="date"
                value={dataLimite}
                onChange={e => setDataLimite(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition hover:bg-primary-light"
          >
            {editingId ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      </Modal>

      {/* Modal de aporte / retirada */}
      <Modal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Registrar Movimentação na Meta"
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTxTipo('receita')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition ${txTipo === 'receita' ? 'border-success bg-success/10 text-success' : 'border-border text-muted hover:border-success/60'}`}
              >
                <ArrowDownCircle size={16} /> Aporte
              </button>
              <button
                type="button"
                onClick={() => setTxTipo('despesa')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition ${txTipo === 'despesa' ? 'border-danger bg-danger/10 text-danger' : 'border-border text-muted hover:border-danger/60'}`}
              >
                <ArrowUpCircle size={16} /> Retirada
              </button>
            </div>
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={txValor}
                onChange={e => setTxValor(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Data</label>
              <input
                type="date"
                value={txData}
                onChange={e => setTxData(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Descrição (opcional)</label>
            <input
              type="text"
              value={txDescricao}
              onChange={e => setTxDescricao(e.target.value)}
              placeholder="Ex: Depósito poupança"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Categoria</label>
            <select
              value={txCategoriaId}
              onChange={e => setTxCategoriaId(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition hover:bg-primary-light"
          >
            Confirmar
          </button>
        </form>
      </Modal>
    </div>
  )
}