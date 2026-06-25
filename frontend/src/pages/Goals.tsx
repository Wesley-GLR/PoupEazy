import { useState, type FormEvent } from 'react'
import { useGoals } from '../hooks/useGoals'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency, formatDate } from '../lib/format'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Componente principal da tela de Metas.
 * 
 * Gerencia a exibição, criação, edição e exclusão de metas financeiras do usuário.
 * A interface divide automaticamente as metas entre "Ativas" (foco da operação diária) 
 * e "Finalizadas" (concluídas ou canceladas). Exibe barras de progresso baseadas no 
 * valor atual versus o objetivo, além de calcular os dias restantes para o vencimento.
 * 
 * @returns O componente da interface de gerenciamento de metas.
 */
export default function Goals() {
  const { user } = useAuth()
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorObjetivo, setValorObjetivo] = useState('')
  const [dataLimite, setDataLimite] = useState('')

  // Metas ativas ficam no topo com ações rápidas.
  const activeGoals = goals.filter(g => g.status === 'ativa')
  const completedGoals = goals.filter(g => g.status !== 'ativa')

  /**
   * Limpa todos os campos do formulário do modal e reseta o ID de edição.
   */
  function resetForm() {
    setNome('')
    setDescricao('')
    setValorObjetivo('')
    setDataLimite('')
    setEditingId(null)
  }

  /**
   * Prepara o estado inicial e abre o modal para a criação de uma nova meta.
   */
  function openNew() {
    resetForm()
    setModalOpen(true)
  }

  /**
   * Carrega as informações de uma meta existente para dentro do formulário 
   * e abre o modal em modo de edição.
   * 
   * @param id - O identificador único da meta a ser editada.
   */
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

  /**
   * Intercepta a submissão do formulário do modal para realizar a persistência no banco de dados.
   * Dependendo do estado de `editingId`, ele irá criar uma nova meta ou atualizar uma existente.
   * 
   * @param e - O evento de submissão nativo do formulário React.
   */
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

  /**
   * Altera rapidamente o status de uma meta (por exemplo, marcando-a como concluída ou cancelada)
   * sem precisar abrir o modal de edição.
   * 
   * @param id - O identificador único da meta.
   * @param status - O novo status que será aplicado à meta.
   */
  async function handleStatusChange(id: string, status: 'concluida' | 'cancelada') {
    const { error } = await updateGoal(id, { status })
    if (error) toast.error('Erro ao atualizar status.')
    else toast.success(status === 'concluida' ? 'Meta concluída!' : 'Meta cancelada.')
  }

  /**
   * Exclui permanentemente uma meta do banco de dados após solicitar a confirmação do usuário.
   * 
   * @param id - O identificador único da meta a ser excluída.
   */
  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return
    const { error } = await deleteGoal(id)
    if (error) toast.error('Erro ao excluir.')
    else toast.success('Meta excluída!')
  }

  /**
   * Calcula a diferença entre a data atual e a data limite da meta para gerar
   * um rótulo de urgência (quantos dias faltam, se vence hoje ou se está vencida).
   * 
   * @param dataLimite - A data de vencimento da meta no formato de string (YYYY-MM-DD).
   * @returns Uma string indicando o tempo restante.
   */
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
    </div>
  )
}
