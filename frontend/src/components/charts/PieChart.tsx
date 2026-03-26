import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CATEGORY_COLORS, formatCurrency } from '../../lib/format'

interface PieChartProps {
  data: { name: string; value: number }[]
}

export default function PieChart({ data }: PieChartProps) {
  if (!data.length) {
    return <p className="py-8 text-center text-muted">Nenhum dado disponível</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsPie>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) =>
            `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Legend />
      </RechartsPie>
    </ResponsiveContainer>
  )
}
