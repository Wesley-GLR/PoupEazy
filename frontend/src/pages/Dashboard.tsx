import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useBudget } from '../hooks/useBudget'
import Card from '../components/ui/Card'
import PieChart from '../components/charts/PieChart'
import { formatCurrency, formatDate } from '../lib/format'
import { TrendingDown, TrendingUp, Wallet, Target } from 'lucide-react'

// Painel consolidado do mês atual:
// usa transações confirmadas para evitar distorção de dados pendentes/cancelados.
export default function Dashboard() {
  const { profile } = useAuth()
  const { transactions, loading: txLoading } = useTransactions()
  const { budgets, loading: budgetLoading } = useBudget()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const currentBudget = budgets.find(b => b.mes === currentMonth && b.ano === currentYear)

  // Recorte mensal da movimentação confirmada (base para cards e gráficos).
  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.data_transacao + 'T00:00:00')
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && t.status === 'confirmada'
    }),
    [transactions, currentMonth, currentYear]
  )

  const totalReceitas = monthTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const totalDespesas = monthTx.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  const saldo = totalReceitas - totalDespesas

  // Agregação por categoria de despesa para visualização em pizza.
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    monthTx.filter(t => t.tipo === 'despesa').forEach(t => {
      const name = t.categoria?.nome ?? 'Outros'
      map.set(name, (map.get(name) ?? 0) + Number(t.valor))
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx])

  const recentTx = transactions.slice(0, 5)
  const loading = txLoading || budgetLoading

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-black">Painel principal</h1>
        <p className="text-lg font-semibold text-muted">
          Bem-vindo de volta{profile?.nome ? `, ${profile.nome}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-start gap-4">
          <div className="rounded-lg bg-success/20 p-2">
            <TrendingUp size={24} className="text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Receita Total</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalReceitas)}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="rounded-lg bg-danger/20 p-2">
            <TrendingDown size={24} className="text-danger" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Despesa Total</p>
            <p className="text-2xl font-bold text-danger">{formatCurrency(totalDespesas)}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/20 p-2">
            <Wallet size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Saldo</p>
            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="rounded-lg bg-info/20 p-2">
            <Target size={24} className="text-info" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Orçamento</p>
            <p className="text-2xl font-bold text-[#1E1E1E]">
              {currentBudget ? formatCurrency(currentBudget.valor_planejado) : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#1E1E1E]">Transações Recentes</h2>
          {recentTx.length === 0 ? (
            <p className="py-8 text-center text-muted">Nenhuma transação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-sm ${tx.tipo === 'receita' ? 'bg-success' : 'bg-danger'}`}>
                      {tx.tipo === 'receita' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E1E1E]">{tx.descricao}</p>
                      <p className="text-xs text-muted">{formatDate(tx.data_transacao)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                      {tx.tipo === 'receita' ? '+ ' : '- '}{formatCurrency(Number(tx.valor))}
                    </p>
                    {tx.categoria && (
                      <span className="inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">
                        {tx.categoria.nome}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#1E1E1E]">Despesas por Categoria</h2>
          <PieChart data={categoryData} />
        </div>
      </div>
    </div>
  )
}
