import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, LoaderCircle, MailCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import EmailVerificationNotice from '../auth/EmailVerificationNotice'

interface Preferences {
  alerta_orcamento_ativo: boolean
  alerta_orcamento_percentual: number
  alerta_despesa_ativo: boolean
  alerta_despesa_valor_minimo: number
  alerta_receita_ativo: boolean
  alerta_receita_valor_minimo: number
  alerta_meta_concluida_ativo: boolean
  email_verificado: boolean
}

function parseMinimum(value: string): number | null {
  const text = value.trim()
  let normalized: string
  if (/^\d+(?:,\d{1,2})?$/.test(text)) normalized = text.replace(',', '.')
  else if (/^[1-9]\d{0,2}(?:\.\d{3})+,\d{1,2}$/.test(text)) normalized = text.replace(/\./g, '').replace(',', '.')
  else if (/^\d+\.\d{1,2}$/.test(text)) normalized = text
  else return null
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents >= 1 && cents <= 999999999999 ? cents / 100 : null
}

const formatMinimum = (value = 100) => value.toFixed(2).replace('.', ',')
const minimumClass = 'w-full max-w-64 rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface'

export default function EmailPreferences() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [percentage, setPercentage] = useState('80')
  const [expenseEnabled, setExpenseEnabled] = useState(false)
  const [expenseMinimum, setExpenseMinimum] = useState('100,00')
  const [incomeEnabled, setIncomeEnabled] = useState(false)
  const [incomeMinimum, setIncomeMinimum] = useState('100,00')
  const [goalEnabled, setGoalEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [reload, setReload] = useState(0)
  const touched = useRef(false)
  const savingRef = useRef(false)
  const busy = loading || saving
  const hasChanges = preferences !== null && (enabled !== preferences.alerta_orcamento_ativo
    || percentage !== String(preferences.alerta_orcamento_percentual)
    || expenseEnabled !== (preferences.alerta_despesa_ativo ?? false)
    || parseMinimum(expenseMinimum) !== (preferences.alerta_despesa_valor_minimo ?? 100)
    || incomeEnabled !== (preferences.alerta_receita_ativo ?? false)
    || parseMinimum(incomeMinimum) !== (preferences.alerta_receita_valor_minimo ?? 100)
    || goalEnabled !== (preferences.alerta_meta_concluida_ativo ?? false))

  function applyPreferences(data: Preferences) {
    setEnabled(data.alerta_orcamento_ativo)
    setPercentage(String(data.alerta_orcamento_percentual))
    setExpenseEnabled(data.alerta_despesa_ativo ?? false)
    setExpenseMinimum(formatMinimum(data.alerta_despesa_valor_minimo))
    setIncomeEnabled(data.alerta_receita_ativo ?? false)
    setIncomeMinimum(formatMinimum(data.alerta_receita_valor_minimo))
    setGoalEnabled(data.alerta_meta_concluida_ativo ?? false)
  }

  function edit() { touched.current = true; setSaved(false); setError('') }

  useEffect(() => {
    let current = true
    setLoading(true)
    setLoadError('')
    api.get<Preferences>('/preferencias-email').then(data => {
      if (!current) return
      setPreferences(data)
      if (!touched.current) {
        applyPreferences(data)
      }
    }).catch(async reason => {
      if (!current) return
      if (reason instanceof ApiError && reason.status === 401) {
        await signOut()
        toast.error('Sua sessão expirou. Entre novamente.')
        navigate('/login', { replace: true })
        return
      }
      setLoadError('Não foi possível carregar suas preferências. Tente novamente.')
    }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
    // Recarregar os dados não substitui um formulário ainda não salvo.
  }, [user?.id, reload])

  useEffect(() => {
    const refresh = () => { if (!savingRef.current) setReload(value => value + 1) }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || savingRef.current || !preferences || !hasChanges) return
    setError('')
    setSaved(false)
    if (!/^\d{1,3}$/.test(percentage) || Number(percentage) < 1 || Number(percentage) > 100) {
      setError('Escolha um percentual inteiro entre 1 e 100.')
      return
    }
    const expenseAmount = parseMinimum(expenseMinimum)
    const incomeAmount = parseMinimum(incomeMinimum)
    if (expenseAmount === null || incomeAmount === null) {
      setError('Informe valores de R$ 0,01 a R$ 9.999.999.999,99, com até duas casas decimais (ex.: 100,00).')
      return
    }
    if ((enabled || expenseEnabled || incomeEnabled || goalEnabled) && !preferences.email_verificado) {
      setError('Confirme o e-mail da sua conta antes de ativar os alertas.')
      return
    }
    savingRef.current = true
    setSaving(true)
    try {
      const data = await api.patch<Preferences>('/preferencias-email', {
        alerta_orcamento_ativo: enabled,
        alerta_orcamento_percentual: Number(percentage),
        alerta_despesa_ativo: expenseEnabled,
        alerta_despesa_valor_minimo: expenseAmount,
        alerta_receita_ativo: incomeEnabled,
        alerta_receita_valor_minimo: incomeAmount,
        alerta_meta_concluida_ativo: goalEnabled,
      })
      setPreferences(data)
      applyPreferences(data)
      touched.current = false
      setSaved(true)
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        await signOut()
        toast.error('Sua sessão expirou. Entre novamente.')
        navigate('/login', { replace: true })
      } else if (reason instanceof ApiError && reason.code === 'EMAIL_NOT_VERIFIED') {
        setPreferences(value => value && { ...value, email_verificado: false })
        setError('Confirme o e-mail da sua conta antes de ativar os alertas.')
      } else {
        setError(reason instanceof ApiError && [400, 422].includes(reason.status)
          ? reason.message
          : 'Não foi possível salvar suas preferências. Suas escolhas foram mantidas. Tente novamente.')
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="email-preferences-title" className="min-w-0 rounded-lg border border-border bg-surface-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Bell size={22} aria-hidden="true" /></div>
        <div><h2 id="email-preferences-title" className="text-xl font-semibold">Preferências de e-mail</h2><p className="mt-1 text-sm text-muted">Escolha os avisos sobre orçamento, movimentações e metas.</p></div>
      </div>

      {loading && !preferences && <p role="status" className="flex items-center gap-2 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Carregando preferências...</p>}
      {loadError && <div role="alert" className="mb-5 rounded-lg bg-danger/10 p-4 text-sm text-red-800"><p>{loadError}</p><button type="button" disabled={busy} onClick={() => setReload(value => value + 1)} className="mt-2 font-semibold underline disabled:opacity-50">Tentar novamente</button></div>}

      {preferences && <>
        {!preferences.email_verificado && <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><MailCheck size={18} aria-hidden="true" />Confirme seu e-mail para receber alertas</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">Solicite o link, confirme no navegador e volte a esta página. Você pode continuar usando sua conta normalmente.</p>
          <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-primary">Solicitar confirmação de e-mail</summary><div className="mt-3"><EmailVerificationNotice key={user?.email} initialEmail={user?.email} readOnlyEmail /></div></details>
          <button type="button" disabled={busy} onClick={() => setReload(value => value + 1)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50"><RefreshCw size={15} aria-hidden="true" />{loading ? 'Atualizando...' : 'Já confirmei, atualizar'}</button>
        </div>}

        <form onSubmit={save} aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5">
            <p className="text-sm text-muted">Avisos enviados para <span className="break-all font-medium text-text-dark">{user?.email}</span>.</p>
            <h3 className="font-semibold text-text-dark">Orçamento mensal</h3>
            <label className="flex items-start gap-3 text-sm font-semibold text-text-dark">
              <input type="checkbox" checked={enabled} disabled={busy || (!preferences.email_verificado && !enabled)} onChange={event => { touched.current = true; setEnabled(event.target.checked); setSaved(false); setError('') }} className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed" />
              <span>Receber alertas de orçamento</span>
            </label>

            <div>
              <label htmlFor="budget-email-percentage" className="mb-2 block text-sm font-semibold">Avisar ao atingir (%)</label>
              <input id="budget-email-percentage" type="number" inputMode="numeric" required min={1} max={100} step={1} value={percentage} onChange={event => { touched.current = true; setPercentage(event.target.value); setSaved(false); setError('') }} aria-describedby="budget-email-rules" className="w-28 rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface" />
              <p className="mt-2 text-xs text-muted">Escolha um número inteiro de 1 a 100. Você pode ajustar o percentual mesmo com os alertas desligados.</p>
            </div>

            <div id="budget-email-rules" className="space-y-2 rounded-lg bg-surface p-4 text-sm leading-relaxed text-muted">
              <p>Considera despesas confirmadas do orçamento do mês atual, inclusive aportes em metas. Receitas não reduzem esse consumo.</p>
              <p>Você recebe um aviso no percentual escolhido e outro ao ultrapassar 100%. Se ambos forem atingidos juntos, enviamos um único aviso.</p>
              <p>Cada aviso acontece no máximo uma vez por mês. Alterar o percentual ou desligar e ligar os alertas não reinicia essa contagem.</p>
            </div>

            <div className="grid gap-6 border-t border-border pt-6 md:grid-cols-2">
              <section aria-labelledby="expense-email-title" className="min-w-0 space-y-4">
                <h3 id="expense-email-title" className="font-semibold text-text-dark">Débitos e despesas</h3>
                <label className="flex items-start gap-3 text-sm font-semibold text-text-dark">
                  <input type="checkbox" checked={expenseEnabled} disabled={busy || (!preferences.email_verificado && !expenseEnabled)} onChange={event => { edit(); setExpenseEnabled(event.target.checked) }} className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed" />
                  <span>Avisar sobre despesas a partir do valor escolhido</span>
                </label>
                <div><label htmlFor="expense-email-minimum" className="mb-2 block text-sm font-semibold">Valor mínimo da despesa (R$)</label>
                  <input id="expense-email-minimum" type="text" inputMode="decimal" maxLength={17} required value={expenseMinimum} onChange={event => { edit(); setExpenseMinimum(event.target.value) }} aria-describedby="movement-email-rules" className={minimumClass} placeholder="100,00" />
                </div>
              </section>
              <section aria-labelledby="income-email-title" className="min-w-0 space-y-4">
                <h3 id="income-email-title" className="font-semibold text-text-dark">Créditos e receitas</h3>
                <label className="flex items-start gap-3 text-sm font-semibold text-text-dark">
                  <input type="checkbox" checked={incomeEnabled} disabled={busy || (!preferences.email_verificado && !incomeEnabled)} onChange={event => { edit(); setIncomeEnabled(event.target.checked) }} className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed" />
                  <span>Avisar sobre receitas a partir do valor escolhido</span>
                </label>
                <div><label htmlFor="income-email-minimum" className="mb-2 block text-sm font-semibold">Valor mínimo da receita (R$)</label>
                  <input id="income-email-minimum" type="text" inputMode="decimal" maxLength={17} required value={incomeMinimum} onChange={event => { edit(); setIncomeMinimum(event.target.value) }} aria-describedby="movement-email-rules" className={minimumClass} placeholder="100,00" />
                </div>
              </section>
            </div>
            <div id="movement-email-rules" className="space-y-2 rounded-lg bg-surface p-4 text-sm leading-relaxed text-muted">
              <p>O limite é por lançamento e inclui o valor exato escolhido. Informe reais com até duas casas decimais, como 100,00 ou 1.000,50.</p>
              <p>Os avisos consideram novos lançamentos confirmados registrados no PoupEazy, inclusive importações e WhatsApp. Receber um aviso depende do registro ou da sincronização no app.</p>
              <p>Vários avisos do mesmo tipo avaliados juntos são agrupados em um e-mail. Ativar a opção não envia avisos dos registros já existentes.</p>
            </div>

            <section aria-labelledby="goal-email-title" className="space-y-3 border-t border-border pt-6">
              <h3 id="goal-email-title" className="font-semibold text-text-dark">Metas concluídas</h3>
              <label className="flex items-start gap-3 text-sm font-semibold text-text-dark">
                <input type="checkbox" checked={goalEnabled} disabled={busy || (!preferences.email_verificado && !goalEnabled)} onChange={event => { edit(); setGoalEnabled(event.target.checked) }} className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed" />
                <span>Avisar quando uma meta for concluída</span>
              </label>
              <p className="text-sm leading-relaxed text-muted">Um aviso por meta, ao atingir o valor objetivo ou ao marcá-la como concluída. Metas já concluídas ao ativar esta opção não geram avisos retroativos.</p>
            </section>

            {error && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-red-800">{error}</p>}
            {saved && <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 size={18} aria-hidden="true" />Preferências de e-mail atualizadas.</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy || !hasChanges} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar preferências'}</button>
              <button type="button" disabled={busy || !hasChanges} onClick={() => { touched.current = false; applyPreferences(preferences); setSaved(false); setError('') }} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text-dark hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50">Cancelar preferências</button>
            </div>
          </fieldset>
        </form>
        <p className="mt-5 text-xs leading-relaxed text-muted">Avisos de segurança, como alteração de senha, continuam sendo enviados independentemente desta preferência.</p>
      </>}
    </section>
  )
}
