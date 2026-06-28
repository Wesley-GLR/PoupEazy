import { Link } from 'react-router-dom'
import logoHorizontal from '../assets/logo-horizontal.png'

// Página pública de apresentação do produto com CTA para cadastro/login.
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <img src={logoHorizontal} alt="PoupEazy" className="h-12 w-auto" />
        <nav className="flex items-center gap-6">
          <Link to="/login" className="text-lg font-medium text-black hover:text-primary transition">
            Login
          </Link>
          <span className="text-border-light">|</span>
          <Link to="/cadastro" className="text-lg font-medium text-black hover:text-primary transition">
            Cadastrar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-12 text-center">
        <div className="mx-auto max-w-3xl rounded-2xl bg-surface-form px-8 py-16 shadow-sm">
          <h1 className="text-4xl font-black leading-tight text-black md:text-5xl">
            A plataforma completa para sua gestão financeira, direto no navegador.
          </h1>
          <p className="mt-6 text-lg font-light text-muted">
            Organize suas contas, planeje seu futuro e alcance a tranquilidade financeira sem precisar baixar nada.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/cadastro"
              className="rounded-xl bg-primary px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-primary-light"
            >
              Começar agora
            </Link>
            <Link
              to="/login"
              className="rounded-xl border-2 border-primary px-8 py-3 text-lg font-bold text-primary transition hover:bg-primary hover:text-white"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Midline Text */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-3xl font-light text-black">Faça compras.</p>
        <h2 className="mt-2 text-4xl font-black text-primary drop-shadow-sm md:text-5xl">
          Nosso sistema organiza seus gastos.
        </h2>
        <p className="mt-2 text-3xl font-light text-black">Fique despreocupado.</p>
      </section>

      {/* Info Cards */}
      <section className="mx-auto grid max-w-5xl gap-8 px-6 pb-20 md:grid-cols-2">
        <div className="rounded-2xl bg-[#F8FAFC] p-10 text-center">
          <h3 className="text-2xl font-extrabold text-primary md:text-3xl">Como funciona?</h3>
          <p className="mt-4 text-base font-medium leading-relaxed text-black">
            Nosso sistema categoriza seus gastos, fique por dentro de todos os seus gastos de maneira organizada!
          </p>
        </div>
        <div className="rounded-2xl bg-[#F8FAFC] p-10 text-center">
          <h3 className="text-2xl font-extrabold text-primary md:text-3xl">Mas é seguro?</h3>
          <p className="mt-4 text-base font-medium leading-relaxed text-black">
            Sim! Nós não salvamos nenhum dado confidencial e não termos acesso a sua conta bancária.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light bg-[#F8FAFC]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <img src={logoHorizontal} alt="PoupEazy" className="h-10 w-auto" />
            <p className="mt-1 text-sm font-medium text-muted">Sua vida financeira, organizada.</p>
          </div>
          <div className="text-sm text-muted">
            <p className="font-extrabold">Contato</p>
            <p>contato@poupeazy.com</p>
          </div>
        </div>
        <div className="border-t border-border-light py-4 text-center text-xs font-bold text-black/60">
          &copy; 2025 PoupEazy. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
