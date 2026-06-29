import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { usePeriod } from '../../hooks/usePeriod'
import { MONTH_NAMES } from '../../lib/format'

// Controle visual do periodo global (mes/ano).
// Fica fixo no topo da area logada e governa o filtro de todas as paginas.
export default function PeriodSelector() {
  const { mes, ano, setMes, setAno, prev, next, goToday, isCurrentMonth } = usePeriod()

  const now = new Date()
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 4 + i)

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-medium text-muted sm:inline">Período:</span>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 shadow-sm">
        <button
          onClick={prev}
          aria-label="Mês anterior"
          className="rounded-md p-1.5 text-muted transition hover:bg-surface hover:text-primary"
        >
          <ChevronLeft size={18} />
        </button>

        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          className="cursor-pointer rounded-md border-0 bg-transparent px-1 py-1 text-sm font-semibold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-primary"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>

        <select
          value={ano}
          onChange={e => setAno(Number(e.target.value))}
          className="cursor-pointer rounded-md border-0 bg-transparent px-1 py-1 text-sm font-semibold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-primary"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={next}
          aria-label="Próximo mês"
          className="rounded-md p-1.5 text-muted transition hover:bg-surface hover:text-primary"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={goToday}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-surface"
        >
          <CalendarDays size={15} /> Hoje
        </button>
      )}
    </div>
  )
}
