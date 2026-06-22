import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutTemplate,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Wand2,
  Info,
} from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { DropdownMenu } from '../components/DropdownMenu'
import { StatusBadge } from '../components/StatusBadge'
import api from '../services/api'
import { VisualBuilder } from '../components/builder/VisualBuilder'
import { Block, PageStyle as BuilderPageStyle } from '../components/builder/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  subject: string
  from?: string
  html?: string
  status?: 'draft' | 'published' | string
  created_at?: string
  updated_at?: string
}

type View = 'list' | 'editor'

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractList(raw: unknown): Template[] {
  if (!raw || typeof raw !== 'object') return []
  const r = raw as Record<string, unknown>
  if (Array.isArray(r.data)) return r.data as Template[]
  if (r.data && typeof r.data === 'object') {
    const inner = (r.data as Record<string, unknown>).data
    if (Array.isArray(inner)) return inner as Template[]
  }
  return []
}

function relativeTime(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `há ${Math.floor(diff / 86400)} d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusBadge(status?: string) {
  const s = (status || 'draft').toLowerCase()
  if (s === 'published')
    return <StatusBadge variant="success">Publicado</StatusBadge>
  return <StatusBadge variant="neutral">Rascunho</StatusBadge>
}

// ─── Builder Helpers ─────────────────────────────────────────────────────────

function encodeMetadata(data: any): string {
  try {
    const str = JSON.stringify(data)
    // UTF-8 safe base64 encoding
    return btoa(unescape(encodeURIComponent(str)))
  } catch (e) {
    console.error('Failed to encode metadata', e)
    return ''
  }
}

function decodeMetadata(encoded: string): any {
  try {
    // UTF-8 safe base64 decoding
    const str = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(str)
  } catch (e) {
    console.error('Failed to decode base64 metadata', e)
    return null
  }
}

function findDoubleBraces(html: string): string[] {
  // Regex to find precisely {{variable}} avoiding {{{variable}}}
  // Matches {{...}} that is not preceded by { or followed by }
  const regex = /(?<!\{)\{\{([^{}]+)\}\}(?!\})/g
  const matches = html.match(regex) || []
  return matches
}

function fixVariables(html: string): string {
  // Replace {{ var }} with {{{var}}} (Removing internal spaces)
  return html.replace(/(?<!\{)\{\{\s*([^{}]+?)\s*\}\}(?!\})/g, '{{{$1}}}')
}

function stripMetadata(html: string): string {
  if (!html) return ''
  // Use [\s\S] to match newlines within comments
  return html
    .replace(/<!-- BUILDER_METADATA_B64:[\s\S]*? -->/g, '')
    .replace(/<!-- BUILDER_METADATA:[\s\S]*? -->/g, '')
    .trim()
}

// ─── Components ───────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium shadow-dropdown ${
        type === 'success'
          ? 'border-success/20 bg-success/8 text-success'
          : 'border-danger/20 bg-danger/8 text-danger'
      }`}
    >
      {type === 'success' ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {message}
    </div>
  )
}

function ConfirmDialog({
  message, onConfirm, onCancel, loading,
}: { message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-modal">
        <p className="text-[13px] text-ink">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? 'Removendo…' : 'Excluir'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function VariableValidationDialog({
  variables, onConfirm, onCancel, loading,
}: { variables: string[]; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-modal animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-[16px] font-semibold text-ink">Formato de Variáveis</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          Detectamos que este template usa o formato <code className="rounded bg-canvas px-1 text-brand">{"{{variavel}}"}</code>. 
          A Resend exige o formato de chaves triplas <code className="rounded bg-canvas px-1 text-brand">{"{{{variavel}}}"}</code> para evitar erros de renderização.
        </p>
        
        <div className="mt-4 rounded-lg border border-line bg-canvas/50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Variáveis detectadas:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...new Set(variables)].slice(0, 8).map((v, i) => (
               <span key={i} className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-mono text-ink">
                {v}
              </span>
            ))}
            {variables.length > 8 && <span className="text-[11px] text-ink-faint">...e mais {variables.length - 8}</span>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="primary" onClick={onConfirm} disabled={loading} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            {loading ? 'Corrigir e Salvar' : 'Corrigir e Salvar'}
          </Button>
          <Button variant="secondary" onClick={onCancel} className="w-full">
            Manter e Tentar Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

function TemplatePreview({ template }: { template: Template }) {
  const [html, setHtml] = useState<string | null>(template.html || null)
  const [loading, setLoading] = useState(!template.html)

  useEffect(() => {
    if (template.html) return;
    let mounted = true;
    api.getTemplate(template.id).then(res => {
      if (mounted && res.data?.data?.html) {
        setHtml(res.data.data.html)
      }
    }).catch(e => console.error(e)).finally(() => {
      if (mounted) setLoading(false)
    });
    return () => { mounted = false }
  }, [template.id, template.html])

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center animate-pulse"><LayoutTemplate className="h-8 w-8 text-ink-faint" /></div>
  }

  if (html) {
    return (
      <div className="absolute inset-0 bg-white rounded-t-xl overflow-hidden pointer-events-none">
        <iframe
          srcDoc={`
            <html>
              <head>
                <style>
                  body { margin: 0; padding: 0; zoom: 0.25; transform-origin: 0 0; background: white; }
                  img { max-width: 100%; height: auto; }
                  ::-webkit-scrollbar { display: none; }
                </style>
              </head>
              <body>${html}</body>
            </html>
          `}
          title={template.name}
          className="pointer-events-none w-[400%] h-[400%]"
          sandbox="allow-same-origin"
          tabIndex={-1}
        />
      </div>
    )
  }

  return <LayoutTemplate className="h-8 w-8 text-ink-faint" strokeWidth={1} />
}

// ─── Dashboard (Grid of Cards) ────────────────────────────────────────────────

const PAGE_SIZE = 12

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<View>('list')
  const [editingTemplate, setEditingTemplate] = useState<Template | null | undefined>(undefined)
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [validationData, setValidationData] = useState<{
    html: string;
    blocks: Block[];
    pageStyle: BuilderPageStyle;
    name: string;
    subject: string;
    fromEmail: string;
    variables: string[];
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listTemplates()
      setTemplates(extractList(res.data))
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao carregar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      if (q && !t.name?.toLowerCase().includes(q) && !t.subject?.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && (t.status || 'draft').toLowerCase() !== statusFilter) return false
      return true
    })
  }, [templates, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages)
    return filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
  }, [filtered, page, totalPages])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const handleEdit = useCallback(async (template: Template) => {
    try {
      const res = await api.getTemplate(template.id)
      const data = res.data?.data ?? res.data
      setEditingTemplate(data)
    } catch {
      setEditingTemplate(template)
    }
    setView('editor')
  }, [])

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.duplicateTemplate(id)
      if (res.data?.success === false) throw new Error(res.data.error ?? 'Erro')
      showToast('Template duplicado!', 'success')
      await load()
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Erro ao duplicar', 'error')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const res = await api.publishTemplate(id)
      if (res.data?.success === false) throw new Error(res.data.error ?? 'Erro')
      showToast('Template publicado!', 'success')
      await load()
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Erro ao publicar', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm) return
    setConfirming(true)
    try {
      await api.deleteTemplate(confirm.id)
      showToast('Template excluído.', 'success')
      setConfirm(null)
      await load()
    } catch {
      showToast('Erro ao deletar', 'error')
      setConfirm(null)
    } finally {
      setConfirming(false)
    }
  }

  if (view === 'editor') {
    // Try to parse blocks from HTML metadata
    let initialBlocks: Block[] = []
    let initialPageStyle: BuilderPageStyle | undefined = undefined

    if (editingTemplate?.html) {
      // Try Base64 first
      const b64Match = editingTemplate.html.match(/<!-- BUILDER_METADATA_B64:(.*?) -->/)
      if (b64Match && b64Match[1]) {
        const decoded = decodeMetadata(b64Match[1])
        if (decoded) {
          initialBlocks = decoded.blocks || []
          initialPageStyle = decoded.pageStyle
        }
      } else {
        // Fallback to legacy JSON
        const legacyMatch = editingTemplate.html.match(/<!-- BUILDER_METADATA:(.*?) -->/)
        if (legacyMatch && legacyMatch[1]) {
          try {
            const meta = JSON.parse(legacyMatch[1])
            initialBlocks = meta.blocks || []
            initialPageStyle = meta.pageStyle
          } catch (e) {
            console.error('Failed to parse legacy builder metadata', e)
          }
        }
      }
    }

    const handleActualSave = async (
      html: string, 
      blocks: Block[], 
      pageStyle: BuilderPageStyle, 
      name: string, 
      subject: string, 
      fromEmail: string
    ) => {
      setSaving(true)
      // Strip old metadata first!
      const cleanedHtml = stripMetadata(html)
      
      // Use Base64 for new metadata
      const metadata = `<!-- BUILDER_METADATA_B64:${encodeMetadata({ blocks, pageStyle })} -->`
      const finalHtml = cleanedHtml + '\n' + metadata

      try {
        const payload = {
          name: name || editingTemplate?.name || 'Novo Template',
          subject: subject || editingTemplate?.subject || 'Assunto',
          html: finalHtml,
          from_email: fromEmail || editingTemplate?.from || undefined,
        }

        if (editingTemplate?.id) {
          await api.updateTemplate(editingTemplate.id, payload)
        } else {
          await api.createTemplate(payload)
        }
        
        showToast('Template salvo com sucesso!', 'success')
        await load()
        setView('list')
        setEditingTemplate(undefined)
        setValidationData(null)
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao salvar template'
        console.error('Error saving template:', err)
        showToast(msg, 'error')
      } finally {
        setSaving(false)
      }
    }

    return (
      <>
        <VisualBuilder
          initialBlocks={initialBlocks}
          initialPageStyle={initialPageStyle}
          name={editingTemplate?.name ?? 'Novo Template'}
          subject={editingTemplate?.subject ?? 'Assunto'}
          fromEmail={editingTemplate?.from ?? ''}
          initialHtml={editingTemplate?.html}
          onBack={() => { setView('list'); setEditingTemplate(undefined) }}
          onSave={async (html, blocks, pageStyle, editorName, editorSubject, editorFromEmail) => {
          const doubleBraces = findDoubleBraces(html)
          if (doubleBraces.length > 0) {
            setValidationData({
              html, blocks, pageStyle, 
              name: editorName, 
              subject: editorSubject, 
              fromEmail: editorFromEmail,
              variables: doubleBraces
            })
          } else {
            await handleActualSave(html, blocks, pageStyle, editorName, editorSubject, editorFromEmail)
          }
        }}
      />
      {validationData && (
        <VariableValidationDialog
          variables={validationData.variables}
          loading={saving}
          onConfirm={async () => {
            const fixedHtml = fixVariables(validationData.html)
            await handleActualSave(
              fixedHtml, 
              validationData.blocks, 
              validationData.pageStyle, 
              validationData.name, 
              validationData.subject, 
              validationData.fromEmail
            )
          }}
          onCancel={async () => {
            // User chose to "Try anyway"
            await handleActualSave(
              validationData.html, 
              validationData.blocks, 
              validationData.pageStyle, 
              validationData.name, 
              validationData.subject, 
              validationData.fromEmail
            )
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
      </>
    )
  }

  const currentPage = Math.min(Math.max(1, page), totalPages)

  return (
    <div>
      <Header title="Modelos" description="Crie belos modelos de e-mail com o novo construtor visual." />

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
          <input type="search" placeholder="Buscar modelos…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-primary w-full py-2 pl-9 pr-3 text-[13px]" />
        </div>
        <select value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="select-primary h-9 rounded-lg text-[13px]">
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={load} title="Atualizar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <Button variant="primary" size="sm" onClick={() => { setEditingTemplate(null); setView('editor') }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            Novo Modelo
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-muted">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-ink-faint" />
          <span className="text-[13px]">Carregando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-24">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink-faint">
            <LayoutTemplate className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <p className="mb-3 text-[13px] text-ink-muted">
            {templates.length === 0 ? 'Nenhum modelo ainda. Crie o seu primeiro!' : 'Nenhum modelo corresponde aos filtros.'}
          </p>
          {templates.length === 0 && (
            <Button variant="secondary" size="sm" onClick={() => { setEditingTemplate(null); setView('editor') }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Modelo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((t) => (
            <div key={t.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
              {/* Thumbnail */}
              <div
                role="button" tabIndex={0} onClick={() => handleEdit(t)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEdit(t)}
                className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden bg-surface-raised border-b border-line">
                <TemplatePreview template={t} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
                  <span className="flex translate-y-2 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white opacity-0 backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <Pencil className="h-3 w-3" /> Editar
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                    <p className="truncate text-[12px] text-ink-faint">{t.subject || '—'}</p>
                  </div>
                  <DropdownMenu
                    actions={[
                      { label: 'Editar', icon: <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />, onClick: () => handleEdit(t) },
                      { label: 'Duplicar', icon: <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />, onClick: () => handleDuplicate(t.id) },
                      ...((t.status || '').toLowerCase() !== 'published' ? [{
                        label: 'Publicar', icon: <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />, onClick: () => handlePublish(t.id)
                      }] : []),
                      { label: 'Excluir', icon: <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />, onClick: () => setConfirm({ id: t.id, name: t.name }), danger: true },
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  {statusBadge(t.status)}
                  <span className="text-[11px] text-ink-faint">{relativeTime(t.updated_at ?? t.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between text-[12px] text-ink-faint">
          <span>
            Página {currentPage} de {totalPages} — {filtered.length} modelo{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== templates.length && ` (de ${templates.length})`}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-faint hover:bg-white/[0.04] disabled:opacity-30">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-faint hover:bg-white/[0.04] disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Excluir "${confirm.name}"? Essa ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={confirming}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
