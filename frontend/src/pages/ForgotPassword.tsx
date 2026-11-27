import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, MailCheck } from 'lucide-react'

// Tela pública para o usuário solicitar um e-mail com link de recuperação de senha.
// A API própria gera o link e solicita o envio pela Gmail API.
export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      let friendly = 'Não foi possível solicitar a recuperação. Tente novamente em instantes.'
      if (error instanceof ApiError && error.status === 429) {
        friendly = 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.'
      } else if (error instanceof ApiError && error.status === 503) {
        friendly = 'A recuperação por e-mail está indisponível no momento. Tente novamente mais tarde.'
      } else if (error instanceof ApiError && error.status === 400) {
        friendly = 'Confira se o endereço de e-mail foi digitado corretamente.'
      }

      toast.error(friendly)
    } else {
      setSent(true)
      toast.success('Se o e-mail estiver cadastrado, enviaremos as instruções.')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-xl bg-surface-form p-8 shadow-lg">
      <h2 className="mb-1 text-center text-3xl font-bold text-primary underline">
        Recuperar senha
      </h2>
      <p className="mb-6 text-center text-sm text-muted">
        Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
      </p>

      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck size={28} />
          </div>
          <p className="text-sm text-muted">
            Se <span className="font-semibold">{email}</span> estiver cadastrado, você receberá as instruções.
            Confira a caixa de entrada e a pasta de spam. Aguarde pelo menos um minuto antes de solicitar outro link.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Enviar para outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recovery-email" className="mb-1 block text-xs font-semibold text-muted">E-mail</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              maxLength={254}
              className="w-full rounded-2xl bg-[#D4D4D4] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="seu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
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
