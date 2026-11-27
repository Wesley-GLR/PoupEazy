import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Mail, RefreshCw } from 'lucide-react'
import { useAuth, type AuthUser } from '../hooks/useAuth'
import { usePeriod } from '../hooks/usePeriod'
import { api, ApiError } from '../lib/api'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'

const sections = [
  { value: 'resumo', label: 'Resumo', detail: 'Receitas, despesas e resultado do período.' },
  { value: 'transacoes', label: 'Transações', detail: 'Lançamentos confirmados, com data, categoria e valor.' },
  { value: 'categorias', label: 'Categorias', detail: 'Receitas e despesas agrupadas por categoria.' },
  { value: 'orcamentos', label: 'Orçamentos', detail: 'Planejado mensal integral e despesas do recorte. Meses parciais serão identificados.' },
  { value: 'metas', label: 'Metas', detail: 'Posição atual e movimentações no período. Não representa uma posição histórica.' },
] as const
type Section = typeof sections[number]['value']
type Format = 'pdf' | 'csv'
const inputClass = 'w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface'

function dateStamp(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') return null
  const stamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null
}

export default function Reports() {
  const { user, signOut } = useAuth()
  const { dataInicio, dataFim } = usePeriod()
  const navigate = useNavigate()
  const [start, setStart] = useState(dataInicio)
  const [end, setEnd] = useState(dataFim)
  const [selected, setSelected] = useState<Section[]>(['resumo', 'categorias'])
  const [formats, setFormats] = useState<Format[]>(['pdf'])
  const [verified, setVerified] = useState(user?.email_verificado === true)
  const [checking, setChecking] = useState(true)
  const [checkError, setCheckError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  const [now, setNow] = useState(Date.now)
  const sendingRef = useRef(false)
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000))
  const selectedLabels = sections.filter(section => selected.includes(section.value)).map(section => section.label)

  useEffect(() => {
    let active = true
    setChecking(true)
    setCheckError('')
    api.get<{ user: AuthUser }>('/auth/me').then(data => {
      if (active) setVerified(data.user.email_verificado === true)
    }).catch(async reason => {
      if (!active) return
      if (reason instanceof ApiError && reason.status === 401) {
        await signOut()
        navigate('/login', { replace: true })
      } else setCheckError('Não foi possível conferir o e-mail da sua conta. Tente atualizar.')
    }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [user?.id, refresh])

  useEffect(() => {
    const onFocus = () => {
      setNow(Date.now())
      if (!sendingRef.current) setRefresh(value => value + 1)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    if (retryAt <= Date.now()) return
    const update = () => {
      const current = Date.now()
      setNow(current)
      if (current >= retryAt) window.clearInterval(timer)
    }
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [retryAt])

  function cooldown(seconds = 60) {
    const current = Date.now()
    setNow(current)
    setRetryAt(current + Math.max(1, Math.min(3600, seconds)) * 1000)
  }
  function edit() { setSuccess(false); setError('') }
  function chooseSection(section: Section) {
    edit()
    setSelected(values => values.includes(section) ? values.filter(value => value !== section) : [...values, section])
  }
  function chooseFormat(format: Format) {
    edit()
    setFormats(values => values.includes(format) ? values.filter(value => value !== format) : [...values, format])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendingRef.current || checking || checkError || Date.now() < retryAt) return
    setError(''); setSuccess(false)
    const from = dateStamp(start); const to = dateStamp(end)
    if (from === null || to === null || from > to || (to - from) / 86400000 + 1 > 366) {
      setError('Escolha datas válidas, com início até o fim e no máximo 366 dias, incluindo os dois dias.')
      return
    }
    if (!selected.length || !formats.length) {
      setError('Selecione pelo menos uma seção e um formato.')
      return
    }
    if (!verified) { setError('Confirme o e-mail da sua conta antes de solicitar o relatório.'); return }
    sendingRef.current = true; setSending(true)
    try {
      const result = await api.post<{ message: string; retry_after_seconds: number }>('/relatorios/email', {
        data_inicio: start, data_fim: end,
        secoes: sections.filter(section => selected.includes(section.value)).map(section => section.value),
        formatos: (['pdf', 'csv'] as const).filter(format => formats.includes(format)),
      }, { timeoutMs: 120000 })
      setSuccess(true)
      cooldown(result.retry_after_seconds || 60)
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        await signOut(); navigate('/login', { replace: true }); return
      }
      if (reason instanceof ApiError && reason.retryAfterSeconds !== undefined) cooldown(reason.retryAfterSeconds)
      if (reason instanceof ApiError && reason.code === 'EMAIL_NOT_VERIFIED') {
        setVerified(false)
        setError('Confirme o e-mail da sua conta antes de solicitar o relatório.')
      } else if (reason instanceof ApiError && reason.status === 429) {
        if (reason.retryAfterSeconds === undefined) cooldown(60)
        setError(reason.code === 'REPORT_BUSY' ? 'Há um relatório sendo preparado. Aguarde um pouco e tente novamente.' : 'Aguarde o intervalo indicado antes de solicitar outro relatório.')
      } else if (reason instanceof ApiError && reason.code === 'REPORT_LIMIT_EXCEEDED') {
        setError('O relatório ultrapassa o limite de dados ou tamanho. Reduza o período ou a quantidade de seções. O limite é de 1.000 transações confirmadas e 200 metas.')
      } else if (reason instanceof ApiError && reason.code === 'REPORT_REQUEST_INVALID') {
        setError('Confira as datas e selecione pelo menos uma seção e um formato.')
      } else if (reason instanceof ApiError && reason.status === 503) {
        setError('Não foi possível preparar ou enviar o relatório agora. Tente novamente mais tarde.')
      } else {
        cooldown(reason instanceof ApiError ? reason.retryAfterSeconds || 60 : 60)
        setError('Não foi possível confirmar se o relatório foi enviado. Confira a caixa de entrada e o spam antes de solicitar novamente. O envio não será repetido automaticamente.')
      }
    } finally { sendingRef.current = false; setSending(false) }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div><h1 className="text-3xl font-bold text-text-dark">Relatórios</h1><p className="mt-2 text-sm leading-relaxed text-muted">Escolha o período e as informações que deseja receber por e-mail.</p></div>

      {checkError && <div role="alert" className="rounded-lg border border-danger/20 bg-white p-5 text-sm text-red-800"><p>{checkError}</p><button type="button" disabled={checking || sending} onClick={() => setRefresh(value => value + 1)} className="mt-2 font-semibold underline">Atualizar dados da conta</button></div>}
      {!checking && !checkError && !verified && <section className="rounded-lg border border-primary/20 bg-white p-5" aria-label="Confirme o e-mail para receber relatórios">
        <h2 className="font-semibold text-primary">Confirme seu e-mail para receber o relatório</h2><p className="mt-2 text-sm text-muted">Solicite o link, confirme no site e volte a esta tela. Suas escolhas serão mantidas.</p>
        <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-primary">Solicitar link de confirmação</summary><div className="mt-3"><EmailVerificationNotice initialEmail={user?.email} readOnlyEmail /></div></details>
        <button type="button" onClick={() => setRefresh(value => value + 1)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><RefreshCw size={16} aria-hidden="true" />Já confirmei, atualizar</button>
      </section>}

      <form onSubmit={submit} aria-busy={sending}>
        <fieldset disabled={sending} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section className="min-w-0 space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm" aria-labelledby="report-content-title">
            <h2 id="report-content-title" className="text-xl font-semibold">Monte seu relatório</h2>
            <div><h3 className="mb-3 text-sm font-semibold">Período</h3><div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="report-start" className="mb-2 block text-sm font-medium">Data inicial</label><input id="report-start" type="date" required min="2000-01-01" max="2100-12-31" value={start} onChange={event => { edit(); setStart(event.target.value) }} className={inputClass} /></div>
              <div><label htmlFor="report-end" className="mb-2 block text-sm font-medium">Data final</label><input id="report-end" type="date" required min={start || '2000-01-01'} max="2100-12-31" value={end} onChange={event => { edit(); setEnd(event.target.value) }} className={inputClass} /></div>
            </div><p className="mt-3 text-xs leading-relaxed text-muted">Inclui as duas datas. Máximo de 366 dias e 1.000 transações confirmadas no período. A seção Metas permite até 200 metas.</p></div>
            <div><h3 className="mb-3 text-sm font-semibold">Seções do relatório</h3><div className="space-y-3">
              {sections.map(section => <label key={section.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${selected.includes(section.value) ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-surface'}`}>
                <input type="checkbox" checked={selected.includes(section.value)} onChange={() => chooseSection(section.value)} className="mt-1 h-4 w-4 shrink-0 accent-primary" />
                <span className="text-sm"><span className="block font-semibold">{section.label}</span><span className="mt-1 block leading-relaxed text-muted">{section.detail}</span></span>
              </label>)}
            </div></div>
            <p className="rounded-lg bg-surface p-4 text-sm leading-relaxed text-muted">Os valores consideram lançamentos confirmados. Aportes em metas entram como despesas e retiradas como receitas. O resultado do período é a diferença entre receitas e despesas.</p>
          </section>

          <section className="min-w-0 space-y-5 rounded-lg border border-border bg-white p-6 shadow-sm" aria-labelledby="report-delivery-title">
            <div className="flex items-center gap-3"><FileText size={24} className="text-primary" aria-hidden="true" /><h2 id="report-delivery-title" className="text-xl font-semibold">Receber por e-mail</h2></div>
            <div><label htmlFor="report-email" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Mail size={16} aria-hidden="true" />E-mail de recebimento</label><input id="report-email" readOnly type="email" value={user?.email ?? ''} className={`${inputClass} bg-surface`} /><p className="mt-2 text-xs text-muted">O relatório é enviado para o e-mail confirmado da sua conta.</p></div>
            <div><h3 className="mb-3 text-sm font-semibold">Formatos</h3><div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4"><input type="checkbox" checked={formats.includes('pdf')} onChange={() => chooseFormat('pdf')} className="mt-1 h-4 w-4 shrink-0 accent-primary" /><span className="text-sm"><span className="block font-semibold">PDF</span><span className="mt-1 block leading-relaxed text-muted">Um documento para leitura, com as seções selecionadas.</span></span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4"><input type="checkbox" checked={formats.includes('csv')} onChange={() => chooseFormat('csv')} className="mt-1 h-4 w-4 shrink-0 accent-primary" /><span className="text-sm"><span className="block font-semibold">CSV</span><span className="mt-1 block leading-relaxed text-muted">Um arquivo por seção, para abrir em planilhas.</span></span></label>
            </div></div>
            <p className="text-sm leading-relaxed text-muted">Selecionado: {selectedLabels.join(', ') || 'nenhuma seção'} · {formats.map(format => format.toUpperCase()).join(' + ') || 'nenhum formato'}.</p>
            {checking && <p role="status" className="text-sm text-muted">Conferindo e-mail da conta...</p>}
            {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-sm leading-relaxed text-red-800">{error}</p>}
            {success && <p role="status" className="flex items-start gap-2 rounded-lg bg-primary/5 p-4 text-sm leading-relaxed text-primary"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />O serviço de e-mail aceitou o relatório. Confira a caixa de entrada e o spam; a aceitação não garante a entrega.</p>}
            <button type="submit" disabled={sending || checking || !!checkError || !verified || remaining > 0} className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Preparando e enviando...' : remaining > 0 ? `Novo envio em ${remaining}s` : 'Enviar relatório por e-mail'}</button>
            <p className="text-xs leading-relaxed text-muted">A preparação pode levar alguns instantes. Aguarde o resultado antes de solicitar outro envio.</p>
          </section>
        </fieldset>
      </form>
    </div>
  )
}
