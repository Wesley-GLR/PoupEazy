import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS, formatCurrency } from '../../lib/format'

interface PieChartProps {
  data: { name: string; value: number }[]
}

// Agrupa as fatias menores em "Outros" para manter o gráfico legível.
const MAX_SLICES = 6

// Gráfico de participação por categoria (donut).
// Total no centro e legenda lateral com valores e percentuais.
export default function PieChart({ data }: PieChartProps) {
  if (!data.length) {
    return <p className="py-8 text-center text-muted">Nenhum dado disponível</p>
  }

  const sorted = [...data].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, MAX_SLICES)
  const rest = sorted.slice(MAX_SLICES)
  const chartData = rest.length
    ? [...top, { name: 'Outros', value: rest.reduce((s, d) => s + d.value, 0) }]
    : top

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[220px] w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-muted">Total</span>
          <span className="text-base font-bold text-[#1E1E1E]">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-2 sm:w-1/2">
        {chartData.map((d, index) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="truncate text-[#1E1E1E]">{d.name}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="font-medium text-[#1E1E1E]">{formatCurrency(d.value)}</span>
                <span className="ml-1 text-xs text-muted">{pct.toFixed(0)}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
