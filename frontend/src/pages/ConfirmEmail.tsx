import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MailCheck } from 'lucide-react'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'
import { api, ApiError } from '../lib/api'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [error, setError] = useState('')
  const canConfirm = /^[a-f0-9]{64}$/.test(token) && !invalid

  async function confirm() {
    if (loading || !canConfirm) return
    setLoading(true)
    setError('')
    try {
      // Confirmacao explicita: abrir o link (ou um scanner visita-lo) nao consome o token.
      await api.post('/auth/confirm-email', { token }, { auth: false })
      setConfirmed(true)
      window.history.replaceState(window.history.state, '', window.location.pathname)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_VERIFICATION_TOKEN_INVALID') {
        setInvalid(true)
        window.history.replaceState(window.history.state, '', window.location.pathname)
      } else {
        setError(err instanceof ApiError && err.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : 'Não foi possível confirmar o e-mail agora. Tente novamente em instantes.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-surface-form p-8 shadow-lg">
      {confirmed ? (
        <div className="text-center" role="status">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-primary">E-mail confirmado</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">Você já pode voltar ao aplicativo e entrar com seu e-mail e senha, ou continuar pelo navegador.</p>
        </div>
      ) : canConfirm ? (
        <div className="text-center" aria-busy={loading}>
          <MailCheck size={40} className="mx-auto mb-4 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-primary">Confirme seu e-mail</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">Clique no botão abaixo para confirmar seu endereço de e-mail no PoupEazy.</p>
          {error && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-red-800">{error}</p>}
          <button type="button" onClick={() => void confirm()} disabled={loading} className="mt-6 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-light disabled:opacity-50">{loading ? 'Confirmando...' : 'Confirmar meu e-mail'}</button>
        </div>
      ) : (
        <>
          <h1 className="mb-3 text-center text-3xl font-bold text-primary">{invalid || token ? 'Link inválido' : 'Confirmar e-mail'}</h1>
          <p className="mb-5 text-sm leading-relaxed text-muted">{invalid || token ? 'Este link é inválido, expirou ou já foi utilizado. Se já confirmou, você pode entrar. Caso contrário, solicite um novo link abaixo.' : 'Informe seu e-mail para solicitar um novo link de confirmação.'}</p>
          <EmailVerificationNotice />
        </>
      )}
      <Link to="/login" replace className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">{confirmed ? 'Ir para o login' : 'Voltar para o login'}</Link>
    </div>
  )
}
