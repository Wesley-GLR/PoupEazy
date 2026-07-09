import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { firstDayOfMonth, lastDayOfMonth } from '../lib/format'

export type PeriodMode = 'mes' | 'personalizado'

interface PeriodContextValue {
  // Modo de filtragem atual.
  modo: PeriodMode
  setModo: (modo: PeriodMode) => void

  // Seleção rápida de mês/ano (modo 'mes').
  mes: number
  ano: number
  setMes: (mes: number) => void
  setAno: (ano: number) => void
  prev: () => void
  next: () => void
  goToday: () => void
  isCurrentMonth: boolean

  // Intervalo efetivo usado por todas as telas para filtrar dados.
  // No modo 'mes' é derivado automaticamente; no modo 'personalizado' é livre.
  dataInicio: string
  dataFim: string
  setDataInicio: (d: string) => void
  setDataFim: (d: string) => void
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

// Provedor de periodo compartilhado por todas as telas da area logada.
// Centraliza o estado para que o seletor de topo filtre Dashboard, Transacoes,
// Categorias e Orcamento de uma so vez.
// Suporta dois modos: selecao por mes/ano e intervalo personalizado de datas.
export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [mes, setMesRaw] = useState(now.getMonth() + 1)
  const [ano, setAnoRaw] = useState(now.getFullYear())
  const [modo, setModo] = useState<PeriodMode>('mes')

  // Datas livres para o modo personalizado.
  const [customInicio, setCustomInicio] = useState(firstDayOfMonth(now.getMonth() + 1, now.getFullYear()))
  const [customFim, setCustomFim] = useState(lastDayOfMonth(now.getMonth() + 1, now.getFullYear()))

  // Ao trocar mês/ano no modo 'mes', recalcula o intervalo automaticamente.
  const setMes = useCallback((m: number) => {
    setMesRaw(m)
  }, [])

  const setAno = useCallback((a: number) => {
    setAnoRaw(a)
  }, [])

  const prev = useCallback(() => {
    setMesRaw(prevMes => {
      if (prevMes === 1) {
        setAnoRaw(a => a - 1)
        return 12
      }
      return prevMes - 1
    })
  }, [])

  const next = useCallback(() => {
    setMesRaw(prevMes => {
      if (prevMes === 12) {
        setAnoRaw(a => a + 1)
        return 1
      }
      return prevMes + 1
    })
  }, [])

  const goToday = useCallback(() => {
    const d = new Date()
    const m = d.getMonth() + 1
    const a = d.getFullYear()
    setMesRaw(m)
    setAnoRaw(a)
    setModo('mes')
  }, [])

  // Intervalo efetivo: derivado do mês/ano ou das datas customizadas.
  const dataInicio = modo === 'mes' ? firstDayOfMonth(mes, ano) : customInicio
  const dataFim = modo === 'mes' ? lastDayOfMonth(mes, ano) : customFim

  const value = useMemo<PeriodContextValue>(() => {
    const d = new Date()
    return {
      modo,
      setModo,
      mes,
      ano,
      setMes,
      setAno,
      prev,
      next,
      goToday,
      isCurrentMonth: mes === d.getMonth() + 1 && ano === d.getFullYear() && modo === 'mes',
      dataInicio,
      dataFim,
      setDataInicio: setCustomInicio,
      setDataFim: setCustomFim,
    }
  }, [modo, mes, ano, setMes, setAno, prev, next, goToday, dataInicio, dataFim])

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod deve ser usado dentro de PeriodProvider')
  return ctx
}
