import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, KeyRound, Trash2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import EmailPreferences from '../components/profile/EmailPreferences'

const inputClass = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface disabled:text-muted'
const buttonClass = 'inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'

export default function Profile() {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [telefone, setTelefone] = useState(profile?.telefone ?? '')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [saved, setSaved] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const busy = saving || changingPassword
  const hasChanges = nome.trim() !== (profile?.nome ?? '') || telefone.trim() !== (profile?.telefone ?? '')

  useEffect(() => {
    setNome(profile?.nome ?? '')
    setTelefone(profile?.telefone ?? '')
  }, [profile?.nome, profile?.telefone])

  async function handleExpiredSession(error: unknown) {
    if (!(error instanceof ApiError) || error.status !== 401) return false
    await signOut()
    toast.error('Sua sessão expirou. Entre novamente.')
    navigate('/login', { replace: true })
    return true
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !hasChanges) return
    setProfileError('')
    setSaved(false)
    if (!nome.trim()) {
      setProfileError('Informe seu nome.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ nome: nome.trim(), telefone: telefone.trim() || null })
      setSaved(true)
    } catch (error) {
      if (await handleExpiredSession(error)) return
      setProfileError(error instanceof ApiError && [400, 422].includes(error.status)
        ? error.message
        : 'Não foi possível salvar seu perfil. Seus dados preenchidos foram mantidos. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setPasswordError('')
    if (novaSenha.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (new TextEncoder().encode(novaSenha).length > 72) {
      setPasswordError('A senha é muito longa. Use uma senha menor.')
      return
    }
    if (novaSenha !== confirmacao) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await updatePassword(novaSenha)
      if (error) throw error
      setNovaSenha('')
      setConfirmacao('')
      toast.success('Senha alterada. Entre novamente com a nova senha.', { duration: 6000 })
      navigate('/login', { replace: true })
    } catch (error) {
      if (await handleExpiredSession(error)) return
      setPasswordError(error instanceof ApiError && [400, 422].includes(error.status)
        ? error.message
        : error instanceof ApiError && error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : 'Não foi possível alterar a senha. Tente novamente em instantes.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-dark">Meu perfil</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">Atualize seus dados e gerencie o acesso à sua conta.</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-border bg-surface-card p-6 shadow-sm" aria-labelledby="personal-data-title">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><UserRound size={22} aria-hidden="true" /></div>
            <div><h2 id="personal-data-title" className="text-xl font-semibold">Dados pessoais</h2><p className="mt-1 text-sm text-muted">Como você aparece no PoupEazy.</p></div>
          </div>
          <form onSubmit={saveProfile} aria-busy={saving}>
            <fieldset disabled={busy} className="space-y-5">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">Nome</label>
                <input id="profile-name" name="name" autoComplete="name" required maxLength={150} value={nome} onChange={event => { setNome(event.target.value); setSaved(false) }} className={inputClass} />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold">E-mail de acesso</label>
                <input id="profile-email" name="email" type="email" autoComplete="username" readOnly value={user?.email ?? ''} aria-describedby="profile-email-info" className={`${inputClass} bg-surface text-muted`} />
                <p id="profile-email-info" className="mt-2 text-xs leading-relaxed text-muted">Este é o e-mail usado para entrar na sua conta.</p>
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-2 block text-sm font-semibold">Telefone <span className="font-normal text-muted">(opcional)</span></label>
                <input id="profile-phone" name="tel" type="tel" autoComplete="tel" maxLength={20} value={telefone} onChange={event => { setTelefone(event.target.value); setSaved(false) }} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              {profileError && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-red-800">{profileError}</p>}
              {saved && <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 size={18} aria-hidden="true" />Perfil atualizado com sucesso.</p>}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy || !hasChanges} className={buttonClass}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
                <button type="button" disabled={busy || !hasChanges} onClick={() => { setNome(profile?.nome ?? ''); setTelefone(profile?.telefone ?? ''); setProfileError(''); setSaved(false) }} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text-dark hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="min-w-0 rounded-lg border border-border bg-surface-card p-6 shadow-sm" aria-labelledby="password-title">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><KeyRound size={22} aria-hidden="true" /></div>
            <div><h2 id="password-title" className="text-xl font-semibold">Alterar senha</h2><p className="mt-1 text-sm text-muted">Proteja o acesso à sua conta.</p></div>
          </div>
          <p id="password-help" className="mb-5 rounded-lg bg-surface p-4 text-sm leading-relaxed text-muted">Após alterar a senha, você precisará entrar novamente no site e nos outros dispositivos.</p>
          <form onSubmit={changePassword} aria-busy={changingPassword} aria-describedby="password-help">
            <fieldset disabled={busy} className="space-y-5">
              <div>
                <label htmlFor="profile-new-password" className="mb-2 block text-sm font-semibold">Nova senha</label>
                <div className="relative">
                  <input id="profile-new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={72} value={novaSenha} onChange={event => setNovaSenha(event.target.value)} aria-describedby="password-minimum" className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
                </div>
                <p id="password-minimum" className="mt-2 text-xs text-muted">Use pelo menos 6 caracteres.</p>
              </div>
              <div>
                <label htmlFor="profile-confirm-password" className="mb-2 block text-sm font-semibold">Confirmar nova senha</label>
                <input id="profile-confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={72} value={confirmacao} onChange={event => setConfirmacao(event.target.value)} className={inputClass} />
              </div>
              {passwordError && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-red-800">{passwordError}</p>}
              <button type="submit" disabled={busy} className={buttonClass}>{changingPassword ? 'Alterando...' : 'Alterar senha'}</button>
            </fieldset>
          </form>
        </section>
      </div>

      <EmailPreferences />

      <p className="text-sm leading-relaxed text-muted">Consulte como tratamos suas informações na <Link to="/privacidade" className="font-semibold text-primary underline underline-offset-4">Política de Privacidade</Link>.</p>

      <section className="flex flex-col items-start gap-5 rounded-lg border border-border bg-surface-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-labelledby="delete-account-title">
        <div className="flex items-start gap-3">
          <Trash2 size={20} className="mt-1 shrink-0 text-danger" aria-hidden="true" />
          <div><h2 id="delete-account-title" className="text-lg font-semibold">Excluir conta</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Para remover sua conta e os dados associados, continue para a página de exclusão e confirme sua identidade.</p></div>
        </div>
        <Link to="/excluir-conta" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-danger/40 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-danger/5">Continuar para exclusão</Link>
      </section>
    </div>
  )
}
