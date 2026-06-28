import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

// Tela acessada via link enviado por e-mail pelo Supabase Auth.
// O link traz tokens na URL; o cliente do Supabase reconhece e emite o evento PASSWORD_RECOVERY,
// liberando uma sessão temporária autorizada apenas a atualizar a senha.
export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [canReset, setCanReset] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // O Supabase pode demorar alguns ms para processar os tokens da URL.
    // Escutamos PASSWORD_RECOVERY e, como fallback, checamos a sessão atual.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setCanReset(true)
        setChecking(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCanReset(true)
      setChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (novaSenha !== confirmar) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(novaSenha)

    if (error) {
      toast.error(error.message || 'Não foi possível atualizar a senha.')
      setLoading(false)
      return
    }

    toast.success('Senha atualizada! Faça login com a nova senha.')
    // Encerra a sessão temporária criada pelo link de recuperação para forçar o login limpo.
    await supabase.auth.signOut()
    setLoading(false)
    navigate('/login', { replace: true })
  }

  if (checking) {
    return (
      <div className="rounded-xl bg-surface-form p-8 shadow-lg">
        <div className="flex items-center justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!canReset) {
    return (
      <div className="rounded-xl bg-surface-form p-8 shadow-lg">
        <h2 className="mb-1 text-center text-3xl font-bold text-primary underline">
          Link inválido
        </h2>
        <p className="mb-6 text-center text-sm text-muted">
          O link de recuperação expirou ou já foi utilizado. Solicite um novo para continuar.
        </p>
        <Link
          to="/esqueci-senha"
          className="block w-full rounded-2xl bg-primary py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-primary-light"
        >
          Solicitar novo link
        </Link>
        <p className="mt-4 text-center text-xs text-muted">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface-form p-8 shadow-lg">
      <h2 className="mb-1 text-center text-3xl font-bold text-primary underline">
        Nova senha
      </h2>
      <p className="mb-6 text-center text-sm text-muted">
        Defina uma nova senha para acessar sua conta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Nova senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              minLength={6}
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
          <label className="mb-1 block text-xs font-semibold text-muted">Confirmar nova senha</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
