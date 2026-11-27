import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'

// Tela de cadastro com validações mínimas antes de criar conta no Auth.
export default function Register() {
  const { signUp } = useAuth()
  const [created, setCreated] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return

    // Validação local para evitar roundtrip desnecessário quando as senhas divergem.
    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, senha, nome, telefone)

    if (error) {
      toast.error(error.message || 'Erro ao criar conta.')
    } else {
      setSenha('')
      setConfirmarSenha('')
      setCreated(true)
    }
    setLoading(false)
  }

  if (created) {
    return (
      <div className="rounded-xl bg-surface-form p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-primary">Confirme seu e-mail</h1>
        <p className="my-4 text-sm leading-relaxed text-muted">Sua conta foi criada. Confirme o endereço de e-mail para fazer o primeiro login.</p>
        <EmailVerificationNotice initialEmail={email} initialWait />
        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">Ir para o login</Link>
        <button type="button" onClick={() => setCreated(false)} className="mt-3 w-full text-center text-xs text-muted hover:underline">Usar outro e-mail no cadastro</button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface-form p-8 shadow-lg">
      <h2 className="mb-1 text-center text-3xl font-bold text-primary underline">Registre-se</h2>
      <p className="mb-6 text-center text-sm text-muted">
        Crie sua conta e comece a economizar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Nome completo</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="João da Silva"
          />
        </div>

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
          <label className="mb-1 block text-xs font-semibold text-muted">Telefone</label>
          <input
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="(31) 99999-9999"
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
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Digite a senha novamente</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            required
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Enviar'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Faça login
        </Link>
      </p>
    </div>
  )
}
