interface ProgressBarProps {
  percent: number
  color?: string
  className?: string
}

// Barra de progresso percentual.
// A largura é limitada a 0–100 para não estourar o layout, mas o rótulo mostra
// o percentual real (ex.: "145%") para deixar claro quando o orçamento foi excedido.
export default function ProgressBar({ percent, color, className = '' }: ProgressBarProps) {
  const safe = Number.isFinite(percent) ? Math.max(0, percent) : 0
  const width = Math.min(100, safe)

  const barColor = color
    ? color
    : safe >= 100
      ? 'bg-danger'
      : safe >= 80
        ? 'bg-[#FF9F43]'
        : 'bg-success-bar'

  return (
    <div className={`relative h-5 w-full overflow-hidden rounded-full bg-[#E9E9E9] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${width}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#1E1E1E]">
        {Math.round(safe)}%
      </span>
    </div>
  )
}
