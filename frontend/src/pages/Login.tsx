import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { ApiError } from '../lib/api'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'

// Login por e-mail/senha usando a API propria.
export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setPendingEmail('')

    const { error } = await signIn(email, senha)
    if (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setSenha('')
        setPendingEmail(email.trim())
      } else {
        toast.error('E-mail ou senha incorretos.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="rounded-xl bg-surface-form p-8 shadow-lg">
      <h2 className="mb-1 text-center text-3xl font-bold text-primary underline">Entre</h2>
      <p className="mb-6 text-center text-sm text-muted">
        Acesse sua conta e controle suas finanças.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-1 text-right">
            <Link
              to="/esqueci-senha"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {pendingEmail && <div className="mt-5"><h3 className="mb-3 text-sm font-bold text-primary">Confirme seu e-mail antes de entrar</h3><EmailVerificationNotice key={pendingEmail} initialEmail={pendingEmail} /></div>}

      <Link to="/confirmar-email" className="mt-4 block text-center text-xs font-semibold text-primary hover:underline">Reenviar confirmação de e-mail</Link>

      <p className="mt-4 text-center text-xs text-muted">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
