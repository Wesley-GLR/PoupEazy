import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthLayout from './components/layout/AuthLayout'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Goals from './pages/Goals'
import Budget from './pages/Budget'

// Guardião de rotas privadas:
// só libera a renderização quando o estado de autenticação já foi resolvido.
// Enquanto carrega, exibe um spinner para evitar "piscar" de páginas indevidas.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Guardião de rotas públicas:
// impede que usuário já autenticado volte para login/cadastro.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// Regra da home:
// usuário autenticado vai direto para o painel; visitante vê landing page.
function LandingRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

export default function App() {
  return (
    // AuthProvider disponibiliza sessão, usuário e perfil para toda a árvore.
    <AuthProvider>
      <Routes>
        {/* Rotas de autenticação (acessíveis apenas sem sessão ativa). */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
        </Route>

        {/* Rotas principais do produto (exigem sessão ativa). */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transactions />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/metas" element={<Goals />} />
          <Route path="/orcamento" element={<Budget />} />
        </Route>

        {/* Fallback de navegação: home inteligente + redirecionamento de rotas inválidas. */}
        <Route path="/" element={<LandingRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
