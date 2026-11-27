import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, RefreshCw, Grid3X3, ArrowUpRight, LogOut, Menu, X, DollarSign, Landmark, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logoHorizontal from '../../assets/logo-horizontal.png'

// Navegação principal da área logada.
// Em telas pequenas funciona como drawer com overlay.
const navItems = [
  { to: '/dashboard', label: 'Painel', icon: Home },
  { to: '/transacoes', label: 'Transações', icon: RefreshCw },
  { to: '/categorias', label: 'Categorias', icon: Grid3X3 },
  { to: '/metas', label: 'Metas', icon: ArrowUpRight },
  { to: '/orcamento', label: 'Orçamento', icon: DollarSign },
  { to: '/integracoes', label: 'Open Finance', icon: Landmark },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { signOut, profile } = useAuth()
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        aria-controls="app-sidebar"
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        id="app-sidebar"
        inert={!open && mobile}
        className={`fixed left-0 top-0 z-40 flex h-dvh w-72 shrink-0 flex-col items-center overflow-y-auto bg-white px-8 transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="my-auto flex w-full flex-col gap-10 py-10">
          <div className="flex flex-col items-center gap-2">
            <img src={logoHorizontal} alt="PoupEazy" className="h-16 w-auto" />
            {profile?.nome && (
              <NavLink to="/perfil" onClick={() => { if (open) onToggle() }} className="max-w-full break-words text-center text-sm text-muted hover:text-primary hover:underline">{profile.nome}</NavLink>
            )}
          </div>

          <nav aria-label="Navegação principal" className="flex w-full flex-col gap-3">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (window.innerWidth < 1024) onToggle() }}
                // Fecha drawer no mobile ao navegar para melhorar UX.
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium font-heading transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-dark hover:bg-surface'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}

            <button
              onClick={signOut}
              className="mt-8 flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-lg font-medium text-text-dark transition hover:bg-surface font-heading"
            >
              <LogOut size={18} />
              Sair
            </button>
          </nav>
        </div>
      </aside>
    </>
  )
}
