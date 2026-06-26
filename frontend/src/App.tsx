import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthLayout from './components/layout/AuthLayout'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Goals from './pages/Goals'
import Budget from './pages/Budget'
import Integrations from './pages/Integrations'

/**
 * Componente guardião para rotas privadas (Private Route).
 * * Intercepta o acesso a componentes que exigem autenticação. Exibe um indicador de 
 * carregamento (spinner) enquanto o estado da sessão do Supabase é resolvido, evitando 
 * o "piscar" de telas indevidas. Redireciona usuários não autenticados para a tela de login.
 * * @param props - Propriedades do componente.
 * @param props.children - Os elementos filhos que serão renderizados caso a autenticação seja válida.
 * @returns O componente filho (se autenticado), um redirecionamento (se não) ou um loader.
 */
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

/**
 * Componente guardião para rotas públicas (Public Route).
 * * Protege páginas de acesso restrito a visitantes (como Login e Cadastro) contra 
 * usuários que já possuem uma sessão ativa, redirecionando-os automaticamente 
 * para o painel principal (Dashboard).
 * * @param props - Propriedades do componente.
 * @param props.children - Os elementos filhos que serão renderizados caso o usuário seja um visitante.
 * @returns O componente filho (se visitante), um redirecionamento (se logado) ou um loader.
 */
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

/**
 * Controlador dinâmico da rota raiz ("/").
 * * Funciona como um roteador de tráfego inteligente: se o usuário já estiver
 * autenticado, ele é direcionado diretamente para o Dashboard. Caso contrário,
 * a regra o mantém na Landing Page de apresentação do produto.
 * * @returns O componente da Landing Page, um redirecionamento ou um loader.
 */
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

/**
 * Componente raiz de roteamento da aplicação.
 * * Configura a árvore de navegação utilizando o React Router DOM.
 * Envolve toda a aplicação no provedor de contexto de autenticação (AuthProvider)
 * e divide as rotas em três grandes grupos protegidos por seus respectivos guardiões e layouts:
 * 1. Públicas (AuthLayout) - Acessíveis apenas sem sessão.
 * 2. Redefinição de Senha - Caso especial fora da restrição pública devido à sessão temporária.
 * 3. Privadas (AppLayout) - Acessíveis estritamente por usuários logados.
 * Inclui roteamento de fallback de segurança para URLs inexistentes (404).
 * * @returns A árvore de rotas configurada para o aplicativo.
 */
export default function App() {
  return (
    // AuthProvider disponibiliza sessão, usuário e perfil para toda a árvore.
    <AuthProvider>
      <Routes>
        {/* Rotas de autenticação (acessíveis apenas sem sessão ativa). */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
        </Route>

        {/* Redefinição de senha: usa AuthLayout mas fica fora do PublicRoute,
            pois o link de recuperação do Supabase cria uma sessão temporária. */}
        <Route element={<AuthLayout />}>
          <Route path="/redefinir-senha" element={<ResetPassword />} />
        </Route>

        {/* Rotas principais do produto (exigem sessão ativa). */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transactions />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/metas" element={<Goals />} />
          <Route path="/orcamento" element={<Budget />} />
          <Route path="/integracoes" element={<Integrations />} />
        </Route>

        {/* Fallback de navegação: home inteligente + redirecionamento de rotas inválidas. */}
        <Route path="/" element={<LandingRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
