import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'

// Tela de redefinicao de senha.
// O link de recuperacao traz o token na query string (?token=...).
// O token vem somente pelo e-mail e e validado/consumido pela API.
export default function ResetPassword() {
  const { signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const canReset = /^[a-f0-9]{64}$/.test(token) && !invalidToken

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')

    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (new TextEncoder().encode(novaSenha).length > 72) {
      setError('A senha é muito longa. Use uma senha menor.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, novaSenha }, { auth: false })
      await signOut()
      setNovaSenha('')
      setConfirmar('')
      setDone(true)
      // Remove o segredo do historico/URL assim que ele for consumido.
      window.history.replaceState(window.history.state, '', window.location.pathname)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RESET_TOKEN_INVALID') {
        setInvalidToken(true)
        setNovaSenha('')
        setConfirmar('')
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.')
      } else if (err instanceof ApiError && err.status === 422) {
        setError(err.message)
      } else {
        setError('Não foi possível atualizar a senha. Tente novamente em instantes.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-surface-form p-8 text-center shadow-lg" role="status">
        <CheckCircle2 size={40} className="mx-auto mb-4 text-primary" aria-hidden="true" />
        <h2 className="text-3xl font-bold text-primary">Senha atualizada</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Você já pode voltar ao aplicativo e entrar com a nova senha.
          Para continuar pelo navegador, acesse o login abaixo.
        </p>
        <Link to="/login" replace className="mt-6 block rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-light">
          Ir para o login
        </Link>
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

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="new-password" className="mb-1 block text-xs font-semibold text-muted">Nova senha</label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              minLength={6}
              maxLength={72}
              disabled={loading}
              className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="mb-1 block text-xs font-semibold text-muted">Confirmar nova senha</label>
          <input
            id="confirm-new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            required
            minLength={6}
            maxLength={72}
            disabled={loading}
            className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-red-800">{error}</p>}
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
