import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

interface PeriodContextValue {
  mes: number
  ano: number
  setMes: (mes: number) => void
  setAno: (ano: number) => void
  prev: () => void
  next: () => void
  goToday: () => void
  isCurrentMonth: boolean
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

// Provedor de periodo (mes/ano) compartilhado por todas as telas da area logada.
// Centraliza o estado para que o seletor de topo filtre Dashboard, Transacoes,
// Categorias e Orcamento de uma so vez.
export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const prev = useCallback(() => {
    setMes(prevMes => {
      if (prevMes === 1) {
        setAno(a => a - 1)
        return 12
      }
      return prevMes - 1
    })
  }, [])

  const next = useCallback(() => {
    setMes(prevMes => {
      if (prevMes === 12) {
        setAno(a => a + 1)
        return 1
      }
      return prevMes + 1
    })
  }, [])

  const goToday = useCallback(() => {
    const d = new Date()
    setMes(d.getMonth() + 1)
    setAno(d.getFullYear())
  }, [])

  const value = useMemo<PeriodContextValue>(() => {
    const d = new Date()
    return {
      mes,
      ano,
      setMes,
      setAno,
      prev,
      next,
      goToday,
      isCurrentMonth: mes === d.getMonth() + 1 && ano === d.getFullYear(),
    }
  }, [mes, ano, prev, next, goToday])

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod deve ser usado dentro de PeriodProvider')
  return ctx
}
