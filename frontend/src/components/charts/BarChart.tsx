import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '../../lib/format'

interface BarChartProps {
  data: { name: string; planejado: number; real: number }[]
}

// Gráfico comparativo de orçamento planejado vs realizado.
export default function BarChart({ data }: BarChartProps) {
  if (!data.length) {
    return <p className="py-8 text-center text-muted">Nenhum dado disponível</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBar data={data} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D9D9D9" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Legend />
        <Bar dataKey="planejado" name="Planejado" fill="#0E5787" radius={[4, 4, 0, 0]} />
        <Bar dataKey="real" name="Real" fill="#87E078" radius={[4, 4, 0, 0]} />
      </RechartsBar>
    </ResponsiveContainer>
  )
}
