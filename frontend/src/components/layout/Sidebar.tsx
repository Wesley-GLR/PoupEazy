import { NavLink } from 'react-router-dom'
import { Home, RefreshCw, Grid3X3, ArrowUpRight, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Painel', icon: Home },
  { to: '/transacoes', label: 'Transações', icon: RefreshCw },
  { to: '/categorias', label: 'Categorias', icon: Grid3X3 },
  { to: '/metas', label: 'Metas', icon: ArrowUpRight },
  { to: '/orcamento', label: 'Orçamento', icon: ArrowUpRight },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { signOut, profile } = useAuth()

  return (
    <>
      <button
        onClick={onToggle}
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col items-center justify-center gap-16 bg-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white font-heading">
            P
          </div>
          <span className="text-3xl font-bold text-black">PoupEazy</span>
          {profile?.nome && (
            <span className="text-sm text-muted">{profile.nome}</span>
          )}
        </div>

        <nav className="flex w-56 flex-col gap-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) onToggle() }}
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
            className="mt-20 flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-lg font-medium text-text-dark transition hover:bg-surface font-heading"
          >
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>
    </>
  )
}
