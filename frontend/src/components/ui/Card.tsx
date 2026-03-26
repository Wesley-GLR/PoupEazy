import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string | ReactNode
  children?: ReactNode
  className?: string
}

export default function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface-card p-6 shadow-sm ${className}`}>
      {title && <h3 className="text-xl font-semibold text-[#1E1E1E]">{title}</h3>}
      {subtitle && (
        <p className="mt-1 text-lg font-bold text-muted">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
