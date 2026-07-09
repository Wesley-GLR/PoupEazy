import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Calendar, RefreshCw } from 'lucide-react'
import { usePeriod } from '../../hooks/usePeriod'
import { MONTH_NAMES } from '../../lib/format'

// Controle visual do periodo global.
// Fica fixo no topo da area logada e governa o filtro das paginas que o consomem.
// Suporta modo "Mes" (navegacao rapida) e "Personalizado" (data inicial/final).
export default function PeriodSelector() {
  const {
    modo, setModo,
    mes, ano, setMes, setAno, prev, next,
    goToday, isCurrentMonth,
    dataInicio, dataFim, setDataInicio, setDataFim,
  } = usePeriod()

  const now = new Date()
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 4 + i)

  // Estados locais temporários para as datas do modo personalizado.
  // Evitam filtrar as tabelas/dashboard no meio da digitação ou seleção de datas,
  // permitindo que o usuário aplique o filtro de uma vez ao clicar no botão.
  const [tempInicio, setTempInicio] = useState(dataInicio)
  const [tempFim, setTempFim] = useState(dataFim)

  // Sincroniza os inputs locais quando o período global é alterado externamente
  // (ex: ao clicar em "Hoje", ao navegar pelo mês ou ao cadastrar um novo orçamento).
  useEffect(() => {
    setTempInicio(dataInicio)
    setTempFim(dataFim)
  }, [dataInicio, dataFim])

  // Aplica as datas temporárias ao contexto de período global
  const handleApplyFilter = () => {
    setDataInicio(tempInicio)
    setDataFim(tempFim)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden text-sm font-medium text-muted sm:inline">Período:</span>

      {/* Toggle Mês / Personalizado */}
      <div className="flex overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setModo('mes')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
            modo === 'mes'
              ? 'bg-primary text-white'
              : 'bg-white text-muted hover:bg-surface'
          }`}
        >
          <CalendarDays size={14} /> Mês
        </button>
        <button
          type="button"
          onClick={() => setModo('personalizado')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
            modo === 'personalizado'
              ? 'bg-primary text-white'
              : 'bg-white text-muted hover:bg-surface'
          }`}
        >
          <Calendar size={14} /> Personalizado
        </button>
      </div>

      {modo === 'mes' ? (
        /* ---- Modo Mês: seleção rápida ---- */
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
      ) : (
        /* ---- Modo Personalizado: data início/fim ---- */
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              De
              <input
                type="date"
                value={tempInicio}
                onChange={e => setTempInicio(e.target.value)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm font-semibold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Até
              <input
                type="date"
                value={tempFim}
                min={tempInicio}
                onChange={e => setTempFim(e.target.value)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm font-semibold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          {/* Botão Atualizar/Aplicar no modo personalizado */}
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-light"
            title="Aplicar datas selecionadas"
          >
            <RefreshCw size={15} />
            <span>Atualizar</span>
          </button>
        </div>
      )}

      {/* Botão Hoje: volta para o mês atual */}
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
