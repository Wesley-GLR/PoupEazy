import { Link, Outlet } from 'react-router-dom'
import logoVertical from '../../assets/logo-vertical.png'

// Layout das telas públicas de autenticação (login/cadastro).
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoVertical} alt="PoupEazy" className="h-40 w-auto" />
        </div>
        <Outlet />
        <nav aria-label="Privacidade e conta" className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-5 text-center text-xs font-semibold text-primary">
          <Link to="/privacidade" className="hover:underline">Política de Privacidade</Link>
          <Link to="/excluir-conta" className="hover:underline">Excluir conta e dados</Link>
        </nav>
      </div>
    </div>
  )
}
