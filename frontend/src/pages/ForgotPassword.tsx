import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { ArrowLeft, MailCheck } from 'lucide-react'

/**
 * Tela pública para solicitação de recuperação de senha.
 * * Permite que o usuário insira seu e-mail para receber um link de redefinição.
 * O envio é processado pelo Supabase Auth, que entrega o link já com os tokens de acesso.
 * A interface gerencia os estados de carregamento e sucesso, além de mapear os erros
 * retornados pelo servidor.
 * * @returns O componente de formulário para recuperação de senha.
 */
export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  /**
   * Processa o envio do formulário de recuperação de senha.
   * Interage com o serviço de autenticação para solicitar o e-mail de redefinição
   * e faz o tratamento detalhado de possíveis erros (limite de taxa, falha de SMTP, URL não permitida, etc).
   * * @param e - O evento de submissão nativo do formulário React.
   */
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      // Mantemos o erro original no console para facilitar diagnóstico em desenvolvimento.
      console.error('[ForgotPassword] resetPasswordForEmail falhou:', error)

      // Mapeia mensagens conhecidas do Supabase Auth para um texto mais útil em PT-BR.
      const msg = error.message?.toLowerCase() ?? ''
      let friendly = 'Não foi possível enviar o e-mail. Tente novamente em instantes.'

      if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
        friendly = 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.'
      } else if (msg.includes('redirect') || msg.includes('not allowed') || msg.includes('invalid url')) {
        friendly =
          'URL de redirecionamento não autorizada. Adicione a URL atual em Authentication → URL Configuration no Supabase.'
      } else if (msg.includes('smtp') || msg.includes('email service') || msg.includes('email provider')) {
        friendly = 'Serviço de e-mail do Supabase indisponível. Verifique o SMTP do projeto.'
      } else if (msg.includes('invalid') && msg.includes('email')) {
        friendly = 'E-mail inválido. Confira o endereço digitado.'
      } else if (error.message) {
        friendly = error.message
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
            Verifique a caixa de entrada de <span className="font-semibold">{email}</span>.
            Não esqueça de olhar também a pasta de spam.
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
