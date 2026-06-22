import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  Globe,
  Search,
} from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { DomainDetailView } from '../components/DomainDetailView'
import api from '../services/api'
import {
  domainStatusLabel,
  extractDomainList,
  formatDomainErrorMessage,
  formatRegionLabel,
  relativeTimePt,
  regionFlag,
} from './domainUtils'

const PLACEHOLDER_DOMAIN = 'atualizações.exemplo.com'
const PREVIEW_FALLBACK_DOMAIN = 'exemplo.com'

function normalizeDomainInput(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('@')) s = s.slice(1).trim()
  const low = s.toLowerCase()
  if (low.startsWith('https://')) s = s.slice(8)
  else if (low.startsWith('http://')) s = s.slice(7)
  s = s.trim()
  if (s.includes('/')) s = s.split('/')[0]!
  s = s.split('?')[0]!.split('#')[0]!
  if (s.includes(':') && !s.startsWith('[')) {
    const i = s.lastIndexOf(':')
    const port = s.slice(i + 1)
    if (/^\d+$/.test(port)) s = s.slice(0, i)
  }
  return s.trim()
}

function domainPreviewValue(input: string): string {
  const t = normalizeDomainInput(input)
  if (t) return t.replace(/^@+/, '')
  return PREVIEW_FALLBACK_DOMAIN
}

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'verified', label: 'Verificado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'failed', label: 'Falhou' },
]

const REGION_FILTERS = [
  { value: 'all', label: 'Todas as regiões' },
  { value: 'sa-east-1', label: 'São Paulo' },
  { value: 'us-east-1', label: 'N. Virginia' },
  { value: 'eu-west-1', label: 'Dublin' },
  { value: 'ap-northeast-1', label: 'Tóquio' },
]

export function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [view, setView] = useState<'list' | 'add'>('list')

  const [domainName, setDomainName] = useState('')
  const [region, setRegion] = useState('sa-east-1')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [returnPath, setReturnPath] = useState('send')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      setLoading(true)
      const response = await api.listDomains()
      setDomains(extractDomainList(response.data))
    } catch (error) {
      console.error('Erro ao carregar domínios:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDomains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return domains.filter((d) => {
      if (q && !String(d.name || '').toLowerCase().includes(q)) return false
      if (statusFilter !== 'all') {
        const st = String(d.status || '').toLowerCase()
        if (statusFilter === 'pending') {
          if (!['not_started', 'pending'].includes(st)) return false
        } else if (st !== statusFilter) return false
      }
      if (regionFilter !== 'all' && d.region !== regionFilter) return false
      return true
    })
  }, [domains, searchQuery, statusFilter, regionFilter])

  const totalPages = Math.max(1, Math.ceil(filteredDomains.length / PAGE_SIZE) || 1)
  const pagedDomains = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages)
    const start = (p - 1) * PAGE_SIZE
    return filteredDomains.slice(start, start + PAGE_SIZE)
  }, [filteredDomains, page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, regionFilter])

  const exportCsv = () => {
    const rows = filteredDomains.map((d) => ({
      name: d.name,
      status: domainStatusLabel(d.status),
      region: formatRegionLabel(d.region),
      created: d.created_at || '',
    }))
    const header = ['Domínio', 'Estado', 'Região', 'Criado']
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [r.name, r.status, r.region, r.created]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ]
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dominios-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const resetAddForm = () => {
    setDomainName('')
    setRegion('sa-east-1')
    setAdvancedOpen(false)
    setReturnPath('send')
    setFormError(null)
  }

  const handleAddDomain = async () => {
    const name = normalizeDomainInput(domainName)
    if (!name) {
      setFormError('Informe o nome do domínio.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const response = await api.createDomain({
        name: name,
        region: region,
        custom_return_path: returnPath.trim() || 'send',
      })
      const body = response.data
      if (body?.success) {
        resetAddForm()
        setView('list')
        await loadDomains()
      } else {
        setFormError(formatDomainErrorMessage(body?.error))
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { detail?: unknown; error?: unknown; message?: string } }
      }
      const data = err.response?.data
      const detail =
        data?.detail ?? data?.error ?? (data?.message != null ? data : undefined)
      setFormError(formatDomainErrorMessage(detail ?? data))
    } finally {
      setSubmitting(false)
    }
  }

  const previewDomain = domainPreviewValue(domainName)

  // ─── Add Domain View ──
  if (view === 'add') {
    return (
      <div>
        <button
          type="button"
          onClick={() => { resetAddForm(); setView('list') }}
          className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Voltar aos domínios
        </button>

        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-ink">Adicionar domínio</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Use um domínio que você possui para enviar e receber e-mails.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 space-y-5">
            <div>
              <label htmlFor="domain-name" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Domínio
              </label>
              <input
                id="domain-name"
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder={PLACEHOLDER_DOMAIN}
                className="input-primary w-full"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="domain-region" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Região
              </label>
              <select
                id="domain-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="select-primary w-full"
              >
                <option value="sa-east-1">🇧🇷 São Paulo (sa-east-1)</option>
                <option value="us-east-1">🇺🇸 N. Virginia (us-east-1)</option>
                <option value="eu-west-1">🇮🇪 Dublin (eu-west-1)</option>
                <option value="ap-northeast-1">🇯🇵 Tóquio (ap-northeast-1)</option>
              </select>
            </div>

            <div className="border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-brand transition-colors hover:text-brand-light"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? '' : '-rotate-90'}`} strokeWidth={2} />
                Opções avançadas
              </button>
              {advancedOpen && (
                <div className="mt-4">
                  <label htmlFor="return-path" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                    Caminho de retorno
                  </label>
                  <input
                    id="return-path"
                    type="text"
                    value={returnPath}
                    onChange={(e) => setReturnPath(e.target.value)}
                    className="input-primary w-full font-mono text-[12px]"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>

            {formError && (
              <p className="text-[13px] text-danger" role="alert">{formError}</p>
            )}

            <Button variant="primary" size="md" type="button" disabled={submitting} onClick={handleAddDomain}>
              {submitting ? 'Adicionando…' : 'Adicionar domínio'}
            </Button>
          </div>

          {/* Email preview */}
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start gap-3 border-b border-line pb-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-line-strong text-[12px] font-semibold text-ink-muted">
                Y
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">
                  Your Name{' '}
                  <span className="font-normal text-ink-muted">
                    &lt;youremail@{previewDomain}&gt;
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-faint">to me</p>
              </div>
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-2 w-full rounded bg-line" />
              <div className="h-2 w-[92%] rounded bg-line" />
              <div className="h-2 w-[75%] rounded bg-line" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Domain Detail View ──
  if (selectedDomainId) {
    return (
      <DomainDetailView
        domainId={selectedDomainId}
        onBack={() => { setSelectedDomainId(null); loadDomains() }}
        onVerified={loadDomains}
      />
    )
  }

  // ─── Domain List ──
  const currentPage = Math.min(Math.max(1, page), totalPages)

  return (
    <div>
      <Header title="Domínios" />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Procurar…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-primary w-full py-2 pl-9 pr-3 text-[13px]"
            autoComplete="off"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-primary h-9 rounded-lg text-[13px]"
        >
          {STATUS_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="select-primary h-9 rounded-lg text-[13px]"
        >
          {REGION_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredDomains.length === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted disabled:opacity-30"
            title="Exportar CSV"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted"
            title="Documentação da API"
            onClick={() => window.open('https://resend.com/docs/api-reference/domains/create-domain', '_blank')}
          >
            <Code className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>

          <Button variant="primary" size="sm" onClick={() => setView('add')}>
            + Adicionar domínio
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Domínio</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Região</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-faint">Criado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-[13px] text-ink-muted">
                    Carregando…
                  </td>
                </tr>
              ) : filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                        <Globe className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <p className="text-[13px] text-ink-muted">
                        {domains.length === 0
                          ? 'Nenhum domínio adicionado'
                          : 'Nenhum resultado com os filtros atuais'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedDomains.map((domain) => {
                  const st = String(domain.status || '').toLowerCase()
                  const verified = st === 'verified'
                  return (
                    <tr
                      key={domain.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDomainId(domain.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedDomainId(domain.id)
                        }
                      }}
                      className="cursor-pointer border-t border-line transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-ink">{domain.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        {verified ? (
                          <StatusBadge variant="success">Verificado</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Pendente</StatusBadge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-muted">
                        {regionFlag(domain.region)} {formatRegionLabel(domain.region)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-faint">
                        {relativeTimePt(domain.created_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredDomains.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-ink-faint">
            <span>
              Página {currentPage} de {totalPages} — {filteredDomains.length} domínio{filteredDomains.length !== 1 ? 's' : ''}
              {filteredDomains.length !== domains.length && ` (de ${domains.length})`}
            </span>
            {totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
