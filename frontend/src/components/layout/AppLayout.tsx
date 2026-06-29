import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import PeriodSelector from './PeriodSelector'
import { PeriodProvider } from '../../hooks/usePeriod'

// Layout base da área autenticada.
// `Outlet` renderiza a página atual mantendo navegação lateral fixa.
// O PeriodProvider compartilha o período (mês/ano) com todas as páginas,
// e a barra de topo expõe o seletor global de período.
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <PeriodProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex items-center justify-end gap-4 border-b border-border bg-surface/80 px-6 py-3 pl-16 backdrop-blur lg:pl-8">
            <PeriodSelector />
          </header>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </PeriodProvider>
  )
}
