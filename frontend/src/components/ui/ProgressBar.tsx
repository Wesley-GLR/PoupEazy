interface ProgressBarProps {
  percent: number
  color?: string
  className?: string
}

export default function ProgressBar({ percent, color, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  const barColor = color
    ? color
    : clamped >= 100
      ? 'bg-danger'
      : clamped >= 80
        ? 'bg-[#FF0000]'
        : 'bg-success-bar'

  return (
    <div className={`relative h-5 w-full overflow-hidden rounded-full bg-[#D9D9D9] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}
