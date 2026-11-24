import { useEffect, useState } from 'react'
import Modal from './ui/Modal'
import { api } from '../lib/api'

type LinkStatus = { habilitado: boolean; vinculado: boolean; url: string | null }

export default function WhatsAppLink({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<LinkStatus | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get<LinkStatus>('/whatsapp/vinculo')
      .then(result => { if (active) setStatus(result) })
      .catch(() => { if (active) setError('O WhatsApp está indisponível neste ambiente.') })
    return () => { active = false }
  }, [])

  async function updateLink(action: 'criar' | 'consultar' | 'remover') {
    setPending(true)
    setError('')
    try {
      if (action === 'criar') {
        const result = await api.post<{ url: string }>('/whatsapp/vinculo')
        setLink(result.url)
      } else {
        if (action === 'remover') await api.delete('/whatsapp/vinculo')
        const result = await api.get<LinkStatus>('/whatsapp/vinculo')
        setStatus(result)
        if (action === 'remover' || result.vinculado) setLink(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o vínculo.')
    } finally {
      setPending(false)
    }
  }

  const actionClass = 'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
  const secondaryClass = 'rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50'

  return (
    <Modal open onClose={onClose} title="Registrar via WhatsApp">
      <div className="space-y-4">
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {!status && !error && <p role="status" className="text-sm text-muted">Carregando…</p>}
        {status && !status.habilitado && <p className="text-sm text-muted">O WhatsApp está desativado neste ambiente.</p>}
        {status?.vinculado && status.url && (
          <>
            <p className="text-sm text-muted">WhatsApp vinculado. Envie <strong>cabelo 35</strong> para registrar um gasto ou <strong>relatório semanal</strong> para ver seu resumo.</p>
            <div className="flex flex-wrap gap-2">
              <a href={status.url} target="_blank" rel="noreferrer" className={actionClass}>Abrir WhatsApp</a>
              <button type="button" className={secondaryClass} disabled={pending} onClick={() => void updateLink('remover')}>
                Desvincular
              </button>
            </div>
          </>
        )}
        {status?.habilitado && !status.vinculado && (
          <>
            <p className="text-sm text-muted">
              Abra o WhatsApp com a mensagem preparada e envie-a pelo celular que você quer vincular. O link é de uso único e vence em 10 minutos.
            </p>
            <div className="flex flex-wrap gap-2">
              {link ? (
                <>
                  <a href={link} target="_blank" rel="noreferrer" className={actionClass}>Abrir WhatsApp para vincular</a>
                  <button type="button" className={secondaryClass} disabled={pending} onClick={() => void updateLink('consultar')}>
                    Já enviei a mensagem
                  </button>
                </>
              ) : (
                <button type="button" className={actionClass} disabled={pending} onClick={() => void updateLink('criar')}>
                  Gerar link de vínculo
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
