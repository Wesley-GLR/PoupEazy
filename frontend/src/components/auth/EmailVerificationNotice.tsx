import { useEffect, useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { api, ApiError } from '../../lib/api'

interface Props {
  initialEmail?: string
  initialWait?: boolean
  readOnlyEmail?: boolean
}

export default function EmailVerificationNotice({ initialEmail = '', initialWait = false, readOnlyEmail = false }: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [retryAt, setRetryAt] = useState(() => Date.now() + (initialWait ? 60000 : 0))
  const [now, setNow] = useState(Date.now)
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000))
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (retryAt <= Date.now()) return
    const update = () => {
      const current = Date.now()
      setNow(current)
      if (current >= retryAt) window.clearInterval(interval)
    }
    const interval = window.setInterval(update, 1000)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', update) }
  }, [retryAt])

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || Date.now() < retryAt) return
    setLoading(true)
    setError('')
    setSent(false)
    try {
      await api.post('/auth/resend-verification', { email: email.trim() }, { auth: false })
      setSent(true)
      const requestedAt = Date.now()
      setNow(requestedAt)
      setRetryAt(requestedAt + 60000)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429
        ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        : err instanceof ApiError && err.status === 503
          ? 'O envio de e-mails está indisponível no momento. Tente novamente mais tarde.'
          : 'Não foi possível solicitar o link. Confira o endereço e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5" aria-label="Confirmação de e-mail">
      <MailCheck size={28} className="mb-3 text-primary" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-text-dark">
        Confira a caixa de entrada e o spam. Abra o link recebido e clique em confirmar no site.
        Depois da confirmação, volte ao PoupEazy.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        O link vale por 24 horas. Um novo envio substitui o link anterior.
      </p>
      <form onSubmit={resend} className="mt-4 space-y-3" aria-busy={loading}>
        <label className="block text-xs font-semibold text-text-dark">
          E-mail para reenviar a confirmação
          <input type="email" autoComplete="email" required maxLength={254} value={email} readOnly={readOnlyEmail} disabled={loading} onChange={event => { setEmail(event.target.value); setSent(false) }} className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </label>
        {sent && <p role="status" className="text-sm leading-relaxed text-primary">Se houver uma conta pendente para esse endereço, você receberá um novo link de confirmação.</p>}
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={loading || remaining > 0} className="w-full rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Solicitando...' : remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar confirmação'}
        </button>
      </form>
    </section>
  )
}
