import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail, Trash2 } from 'lucide-react'
import logoHorizontal from '../assets/logo-horizontal.png'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

const supportEmail = 'poupeazy@gmail.com'
const supportLink = `mailto:${supportEmail}?subject=${encodeURIComponent('PoupEazy — exclusão de conta')}`

// Pública inclusive para quem já está conectado: não depende de reinstalar o app.
export default function DeleteAccount() {
  const { user, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || confirmation !== 'EXCLUIR') return
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/delete-account', {
        email: email.trim(),
        password,
        confirmacao: confirmation,
      }, { auth: false })

      // A página também pode ser usada para excluir uma conta diferente da sessão atual.
      if (user?.email.toLowerCase() === email.trim().toLowerCase()) await signOut()
      setPassword('')
      setConfirmation('')
      setDeleted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
        <Link to="/" aria-label="PoupEazy — página inicial">
          <img src={logoHorizontal} alt="PoupEazy" className="h-10 w-auto sm:h-12" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao início
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-4 sm:pt-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-primary">Sua conta e seus dados</p>
          <h1 className="text-3xl font-bold text-text-dark sm:text-4xl">Excluir conta do PoupEazy</h1>
          <p className="mt-4 leading-relaxed text-muted">
            Você pode concluir a exclusão por esta página, mesmo sem o aplicativo instalado.
            Para proteger sua conta, confirme o e-mail cadastrado e a senha atual.
          </p>
        </div>

        {deleted ? (
          <section className="rounded-2xl border border-primary/20 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="deleted-title" role="status">
            <CheckCircle2 size={36} className="mb-4 text-primary" aria-hidden="true" />
            <h2 id="deleted-title" className="text-2xl font-bold text-text-dark">Conta excluída</h2>
            <p className="mt-3 leading-relaxed text-muted">
              Sua conta e os dados associados foram removidos da base ativa do PoupEazy.
              As sessões dessa conta não poderão mais acessar a API.
            </p>
            <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-light">
              Voltar ao início
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border border-border/70 bg-white p-6 sm:p-8" aria-labelledby="data-title">
              <h2 id="data-title" className="text-xl font-bold text-text-dark">O que será removido</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                <li>Cadastro, senha armazenada e informações do perfil.</li>
                <li>Lançamentos financeiros, orçamentos, metas e categorias pessoais.</li>
                <li>Notificações e vínculos de integrações mantidos na base do PoupEazy, incluindo o vínculo com WhatsApp.</li>
              </ul>
              <p className="mt-5 rounded-xl bg-danger/5 p-4 text-sm font-medium leading-relaxed text-text-dark">
                A exclusão da base ativa é definitiva e não poderá ser desfeita pelo aplicativo.
                Salve as informações que quiser manter antes de continuar.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Mensagens já recebidas por e-mail ou WhatsApp e dados mantidos por serviços externos
                não são apagados por este formulário. Cópias de segurança dos provedores seguem os
                controles de retenção desses serviços. Para dúvidas sobre esses dados, fale com a equipe.
              </p>
            </section>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="confirm-title" aria-busy={loading}>
              <h2 id="confirm-title" className="text-xl font-bold text-text-dark">Confirmar exclusão</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Informe os dados da conta que deseja excluir. A exclusão acontece somente ao confirmar o formulário.
              </p>

              <fieldset disabled={loading} className="mt-6 space-y-5 disabled:opacity-60">
                <div>
                  <label htmlFor="delete-email" className="mb-2 block text-sm font-semibold text-text-dark">E-mail da conta</label>
                  <input id="delete-email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="delete-password" className="mb-2 block text-sm font-semibold text-text-dark">Senha atual</label>
                  <input id="delete-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="delete-confirmation" className="mb-2 block text-sm font-semibold text-text-dark">Digite EXCLUIR para confirmar</label>
                  <input id="delete-confirmation" name="confirmacao" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} required pattern="EXCLUIR" value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-describedby="delete-confirmation-help" className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <p id="delete-confirmation-help" className="mt-2 text-xs text-muted">Use letras maiúsculas para confirmar a exclusão permanente.</p>
                </div>
                {error && <p role="alert" className="rounded-xl bg-danger/10 p-4 text-sm font-medium text-red-800">{error}</p>}
                <button type="submit" disabled={loading || confirmation !== 'EXCLUIR'} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <Trash2 size={18} aria-hidden="true" />
                  {loading ? 'Excluindo conta...' : 'Excluir minha conta e meus dados'}
                </button>
              </fieldset>
            </form>
          </>
        )}

        <section className="mt-6 rounded-2xl bg-primary/5 p-6" aria-labelledby="support-title">
          <h2 id="support-title" className="font-bold text-text-dark">Precisa de ajuda para excluir a conta?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Envie sua solicitação a partir do e-mail cadastrado para a equipe do projeto acadêmico PoupEazy.
            Se perdeu o acesso à conta, explique a situação para verificarmos sua identidade.
            Nunca envie sua senha por e-mail.
          </p>
          <a href={supportLink} className="mt-4 inline-flex items-center gap-2 break-all text-sm font-semibold text-primary hover:underline">
            <Mail size={16} className="shrink-0" aria-hidden="true" />
            {supportEmail}
          </a>
        </section>
      </main>
    </div>
  )
}
