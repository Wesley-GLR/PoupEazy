import {
  BarChart as RechartsBar,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency, formatCompactCurrency } from '../../lib/format'

interface BarChartProps {
  data: { name: string; planejado: number; gasto: number }[]
}

const COLOR_PLANEJADO = '#0E5787'
const COLOR_OK = '#26DE81'
const COLOR_OVER = '#FC5C65'

// Tooltip customizado: mostra planejado, gasto e o quanto sobrou/excedeu.
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { dataKey?: string; value?: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const planejado = Number(payload.find(p => p.dataKey === 'planejado')?.value ?? 0)
  const gasto = Number(payload.find(p => p.dataKey === 'gasto')?.value ?? 0)
  const diff = planejado - gasto

  return (
    <div className="rounded-lg border border-border bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold text-[#1E1E1E]">{label}</p>
      <p className="text-primary">Planejado: {formatCurrency(planejado)}</p>
      <p className={gasto > planejado ? 'text-danger' : 'text-success'}>Gasto: {formatCurrency(gasto)}</p>
      <p className="mt-1 border-t border-border/50 pt-1 text-muted">
        {diff >= 0 ? `Disponível: ${formatCurrency(diff)}` : `Excedido: ${formatCurrency(Math.abs(diff))}`}
      </p>
    </div>
  )
}

// Gráfico comparativo: orçamento planejado vs valor gasto (somente despesas).
// A barra de gasto fica verde dentro do limite e vermelha quando ultrapassa.
export default function BarChart({ data }: BarChartProps) {
  if (!data.length) {
    return <p className="py-8 text-center text-muted">Nenhum dado disponível</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBar data={data} barGap={6} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ECECEC" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickFormatter={(v) => formatCompactCurrency(Number(v))}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14,87,135,0.06)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="planejado" name="Planejado" fill={COLOR_PLANEJADO} radius={[6, 6, 0, 0]} maxBarSize={48} />
        <Bar dataKey="gasto" name="Gasto" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.gasto > entry.planejado ? COLOR_OVER : COLOR_OK} />
          ))}
        </Bar>
      </RechartsBar>
    </ResponsiveContainer>
  )
}
