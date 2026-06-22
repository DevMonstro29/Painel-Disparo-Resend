import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Send,
  Pencil,
  Trash2,
  RefreshCw,
  Radio,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import api from '../services/api'
import ExportButton from '../components/ExportButton'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { FilterDropdown } from '../components/FilterDropdown'
import { DropdownMenu } from '../components/DropdownMenu'
import { StatusBadge } from '../components/StatusBadge'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Broadcast {
  id: string
  name: string
  subject: string
  from: string
  status: 'draft' | 'sent' | 'sending' | 'queued' | string
  created_at: string
  sent_at?: string | null
  audience_id?: string | null
  preview_text?: string | null
  html?: string | null
  reply_to?: string | null
}

interface BroadcastFormData {
  name: string
  from_email: string
  subject: string
  html: string
  reply_to: string
  preview_text: string
  audience_id: string
}

// ─── Hook useBroadcasts ───────────────────────────────────────────────────────

function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listBroadcasts()
      const raw = res.data
      const list: Broadcast[] =
        Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
          ? raw.data
          : []
      setBroadcasts(list)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Erro ao carregar transmissões'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: BroadcastFormData) => {
    const payload = {
      name: data.name,
      from_email: data.from_email,
      subject: data.subject,
      html: data.html || '<p>Conteúdo do e-mail</p>',
      ...(data.reply_to && { reply_to: data.reply_to }),
      ...(data.preview_text && { preview_text: data.preview_text }),
      ...(data.audience_id && { audience_id: data.audience_id }),
    }
    const res = await api.createBroadcast(payload)
    return res.data
  }, [])

  const update = useCallback(async (id: string, data: Partial<BroadcastFormData>) => {
    const payload = {
      ...(data.name && { name: data.name }),
      ...(data.from_email && { from_email: data.from_email }),
      ...(data.subject && { subject: data.subject }),
      ...(data.html && { html: data.html }),
      ...(data.reply_to && { reply_to: data.reply_to }),
      ...(data.preview_text && { preview_text: data.preview_text }),
      ...(data.audience_id && { audience_id: data.audience_id }),
    }
    const res = await api.updateBroadcast(id, payload)
    return res.data
  }, [])

  const remove = useCallback(async (id: string) => {
    const res = await api.deleteBroadcast(id)
    return res.data
  }, [])

  const send = useCallback(async (id: string) => {
    const res = await api.sendBroadcast(id)
    return res.data
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { broadcasts, loading, error, load, create, update, remove, send }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const s = (status || '').toLowerCase()
  
  if (s === 'sent') return <StatusBadge variant="success">Entregue</StatusBadge>
  if (s === 'sending') return <StatusBadge variant="info">Enviando</StatusBadge>
  if (s === 'queued') return <StatusBadge variant="warning">Na fila</StatusBadge>
  
  return <StatusBadge variant="neutral">Rascunho</StatusBadge>
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `há ${Math.floor(diff / 86400)} d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 10

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'create' | 'edit'
  initial?: Broadcast | null
  onClose: () => void
  onSubmit: (data: BroadcastFormData) => Promise<void>
  submitting: boolean
  formError: string | null
}

function BroadcastComposer({ mode, initial, onClose, onSubmit, submitting, formError }: ModalProps) {
  const [form, setForm] = useState<BroadcastFormData>(() => ({
    name: initial?.name ?? '',
    from_email: initial?.from ?? '',
    subject: initial?.subject ?? '',
    html: initial?.html ?? '',
    reply_to: initial?.reply_to ?? '',
    preview_text: initial?.preview_text ?? '',
    audience_id: initial?.audience_id ?? '',
  }))

  const [templates, setTemplates] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])

  useEffect(() => {
    api.listTemplates().then(res => setTemplates(res.data?.data?.data || []))
    api.listSegments().then(res => setSegments(res.data?.data || []))
  }, [])

  const set = (field: keyof BroadcastFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleTemplateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value
    if (!tId) return
    const res = await api.getTemplate(tId)
    if (res.data?.data?.html) {
      setForm(f => ({ ...f, html: res.data.data.html }))
    }
  }


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form.audience_id) {
      alert("⚠️ É obrigatório selecionar um Segmento/Destinatário para enviar uma transmissão.")
      return
    }
    if (!form.from_email || !form.from_email.includes('@')) {
      alert("⚠️ O e-mail do remetente é inválido ou está vazio.")
      return
    }
    await onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface-raised">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint hover:text-ink">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {mode === 'create' ? 'Novo E-mail (Transmissão)' : 'Editar Transmissão'}
            </h2>
            <p className="text-[12px] text-ink-faint">
               Configure sua campanha de e-mail e segmento de destinatários.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
            {mode === 'create' ? 'Criar Transmissão' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-ink">Remetente & Assunto</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Nome da Campanha</label>
                <input required value={form.name} onChange={set('name')} placeholder="Ex: Newsletter Jan" className="input-primary w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">De (Email)</label>
                  <input required value={form.from_email} onChange={set('from_email')} placeholder="equipe@..." className="input-primary w-full" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Reply-to</label>
                  <input value={form.reply_to} onChange={set('reply_to')} placeholder="suporte@..." className="input-primary w-full" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Assunto</label>
                <input required value={form.subject} onChange={set('subject')} className="input-primary w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Texto de Preview</label>
                <input value={form.preview_text} onChange={set('preview_text')} placeholder="Breve resumo visível antes de abrir" className="input-primary w-full" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-ink">Destinatários</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Segmento</label>
                <select value={form.audience_id} onChange={set('audience_id')} className="input-primary w-full">
                  <option value="">Selecione um segmento para enviar (Obrigatório)</option>
                  {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-5 h-full flex flex-col">
            <h3 className="mb-4 text-[13px] font-semibold text-ink">Design e Conteúdo</h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Copiar de um Template</label>
              <select onChange={handleTemplateSelect} className="input-primary w-full">
                <option value="">(Nenhum / Template em branco)</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">HTML</label>
              <textarea 
                required
                value={form.html} 
                onChange={set('html')} 
                className="textarea-primary w-full flex-1 min-h-[300px] resize-none font-mono text-[11px] leading-relaxed" 
                placeholder="<html><body><h1>Seu email...</h1></body></html>" 
              />
            </div>
            
            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-[13px] text-danger">{formError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'danger' | 'primary'
}

function ConfirmDialog({ message, onConfirm, onCancel, loading, variant = 'danger' }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-modal">
        <p className="text-[13px] text-ink">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? 'Processando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: 'success' | 'error' }

function Toast({ message, type }: ToastState) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium shadow-dropdown ${
        type === 'success'
          ? 'border-success/20 bg-success/8 text-success'
          : 'border-danger/20 bg-danger/8 text-danger'
      }`}
    >
      {type === 'success' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      )}
      {message}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BroadcastsPage() {
  const { broadcasts, loading, error, load, create, update, remove, send } = useBroadcasts()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'sending' | 'queued'>('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; broadcast?: Broadcast | null } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [confirm, setConfirm] = useState<{
    message: string
    action: () => Promise<void>
    variant?: 'danger' | 'primary'
  } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return broadcasts.filter((b) => {
      if (q && !b.name?.toLowerCase().includes(q) && !b.subject?.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && (b.status || 'draft').toLowerCase() !== statusFilter) return false
      return true
    })
  }, [broadcasts, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages)
    return filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
  }, [filtered, page, totalPages])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const parseApiError = (msg: string) => {
    try {
      const parsed = JSON.parse(msg)
      return parsed.message || parsed.name || msg
    } catch {
      return msg
    }
  }

  const handleCreate = async (data: BroadcastFormData) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await create(data)
      if (res?.success === false) { setFormError(parseApiError(res.error ?? 'Erro ao criar')); return }
      setModal(null)
      showToast('Transmissão criada!', 'success')
      await load()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(parseApiError(detail ?? 'Erro ao criar transmissão'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (data: BroadcastFormData) => {
    if (!modal?.broadcast) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await update(modal.broadcast.id, data)
      if (res?.success === false) { setFormError(parseApiError(res.error ?? 'Erro ao editar')); return }
      setModal(null)
      showToast('Transmissão atualizada!', 'success')
      await load()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(parseApiError(detail ?? 'Erro ao editar transmissão'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (broadcast: Broadcast) => {
    setConfirm({
      message: `Excluir "${broadcast.name}"? Essa ação não pode ser desfeita.`,
      variant: 'danger',
      action: async () => {
        const res = await remove(broadcast.id)
        if (res?.success === false) throw new Error(res.error ?? 'Erro')
        showToast('Transmissão excluída.', 'success')
        await load()
      },
    })
  }

  const handleSend = (broadcast: Broadcast) => {
    setConfirm({
      message: `Enviar "${broadcast.name}" agora? Isso vai disparar o e-mail para seu público.`,
      variant: 'primary',
      action: async () => {
        const res = await send(broadcast.id)
        if (res?.success === false) throw new Error(res.error ?? 'Erro')
        showToast('Transmissão enviada!', 'success')
        await load()
      },
    })
  }

  const runConfirm = async () => {
    if (!confirm) return
    setConfirming(true)
    try {
      await confirm.action()
      setConfirm(null)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Erro inesperado'
      showToast(parseApiError(msg), 'error')
      setConfirm(null)
    } finally {
      setConfirming(false)
    }
  }

  const currentPage = Math.min(Math.max(1, page), totalPages)

  return (
    <div>
      <Header title="Transmissões" description="Envie campanhas de e-mail para seus contatos e segmentos.">
        <div className="flex items-center gap-3">
          <ExportButton data={broadcasts} filename="resend-broadcasts" />
          <Button variant="primary" size="md" onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo E-mail</span>
          </Button>
        </div>
      </Header>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Procurar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-primary w-full py-2 pl-9 pr-3 text-[13px]"
          />
        </div>

        <FilterDropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as typeof statusFilter)}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'draft', label: 'Rascunho' },
            { value: 'queued', label: 'Na fila' },
            { value: 'sending', label: 'Enviando' },
            { value: 'sent', label: 'Entregue' },
          ]}
        />

        <FilterDropdown
          value={audienceFilter}
          onChange={setAudienceFilter}
          options={[
            { value: 'all', label: 'Todos os públicos' },
            { value: 'geral', label: 'Geral' },
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            title="Atualizar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Nome</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Assunto</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">De</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-faint">Criado</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                    <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin text-ink-faint" />
                    <span className="text-[13px]">Carregando...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                        <Radio className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <p className="text-[13px] text-ink-muted">
                        {broadcasts.length === 0
                          ? 'Nenhuma transmissão ainda. Crie a primeira!'
                          : 'Nenhum resultado corresponde aos filtros.'}
                      </p>
                      {broadcasts.length === 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setFormError(null); setModal({ mode: 'create' }) }}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Novo E-mail
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => {
                  return (
                    <tr
                      key={b.id}
                      className="border-t border-line transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-ink">{b.name}</span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-[13px] text-ink-muted">
                        {b.subject}
                      </td>
                      <td className="px-4 py-3">{statusBadge(b.status || 'draft')}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-ink-faint">{b.from || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-faint">
                        {relativeTime(b.created_at)}
                      </td>
                      <td className="px-2 py-3">
                        <DropdownMenu
                          actions={[
                            {
                              label: 'Enviar',
                              icon: <Send className="h-3.5 w-3.5" strokeWidth={1.5} />,
                              onClick: () => handleSend(b),
                            },
                            {
                              label: 'Editar',
                              icon: <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />,
                              onClick: () => { setFormError(null); setModal({ mode: 'edit', broadcast: b }) },
                            },
                            {
                              label: 'Excluir',
                              icon: <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />,
                              onClick: () => handleDelete(b),
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-ink-faint">
            <span>
              Página {currentPage} de {totalPages} — {filtered.length} transmissão{filtered.length !== 1 ? 'ões' : ''}
              {filtered.length !== broadcasts.length && ` (de ${broadcasts.length})`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-faint hover:bg-white/[0.04] disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-faint hover:bg-white/[0.04] disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BroadcastComposer
          mode={modal.mode}
          initial={modal.broadcast}
          onClose={() => setModal(null)}
          onSubmit={modal.mode === 'create' ? handleCreate : handleEdit}
          submitting={submitting}
          formError={formError}
        />
      )}

      {/* Confirm */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          variant={confirm.variant}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
          loading={confirming}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
