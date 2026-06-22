import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, Globe, Loader2, Mail, Play } from 'lucide-react'
import { Button } from './Button'
import api from '../services/api'
import {
  domainStatusLabel,
  extractDomainDetail,
  formatDomainErrorMessage,
  formatRegionLabel,
  recordStatusLabel,
  regionFlag,
  relativeTimePt,
} from '../pages/domainUtils'

type Tab = 'records' | 'config'

interface DomainDetailViewProps {
  domainId: string
  onBack: () => void
  onVerified?: () => void
}

type ConfigOverride = {
  open_tracking?: boolean
  click_tracking?: boolean
  tls?: string
  capabilities?: { sending?: string; receiving?: string }
}

export function DomainDetailView({ domainId, onBack, onVerified }: DomainDetailViewProps) {
  const [domain, setDomain] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('records')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** A API GET por vezes omite open/click_tracking; guardamos o último PATCH aplicado para a UI não “saltar”. */
  const [configOverride, setConfigOverride] = useState<ConfigOverride>({})

  const copyDnsCell = useCallback(async (kind: 'Tipo' | 'Nome' | 'Valor', raw: unknown) => {
    const v = raw == null ? '' : String(raw).trim()
    if (!v) return
    try {
      await navigator.clipboard.writeText(v)
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current)
      setCopyFeedback(`${kind} copiado para a área de transferência`)
      copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2200)
    } catch {
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current)
      setCopyFeedback('Não foi possível copiar')
      copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2200)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getDomain(domainId)
      const d = extractDomainDetail(res.data)
      if (!d) {
        setError('Não foi possível ler os dados do domínio.')
        setDomain(null)
        return
      }
      setDomain(d)
    } catch (e: unknown) {
      const err = e as { response?: { data?: any } }
      setError(formatDomainErrorMessage(err.response?.data?.detail ?? err.response?.data))
      setDomain(null)
    } finally {
      setLoading(false)
    }
  }, [domainId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setConfigOverride({})
  }, [domainId])

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await api.verifyDomain(domainId)
      await load()
      onVerified?.()
    } catch (e: unknown) {
      const err = e as { response?: { data?: any } }
      setError(formatDomainErrorMessage(err.response?.data?.detail))
    } finally {
      setVerifying(false)
    }
  }

  const patchDomain = async (body: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.updateDomain(domainId, body)
      const payload = res.data as { data?: Record<string, unknown> }
      if (payload?.data && typeof payload.data === 'object') {
        setDomain((prev) => (prev ? { ...prev, ...payload.data } : null))
      }
      setConfigOverride((prev) => ({
        ...prev,
        ...(typeof body.open_tracking === 'boolean' ? { open_tracking: body.open_tracking } : {}),
        ...(typeof body.click_tracking === 'boolean' ? { click_tracking: body.click_tracking } : {}),
        ...(typeof body.tls === 'string' ? { tls: body.tls } : {}),
        ...(body.capabilities && typeof body.capabilities === 'object'
          ? {
              capabilities: body.capabilities as {
                sending?: string
                receiving?: string
              },
            }
          : {}),
      }))
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: any } }
      setError(formatDomainErrorMessage(err.response?.data?.detail ?? err.response?.data))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !domain) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-ink-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand" />
        Carregando domínio…
      </div>
    )
  }

  if (error && !domain) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos domínios
        </button>
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      </div>
    )
  }

  if (!domain) return null

  const name = String(domain.name || '')
  const status = String(domain.status || '')
  const region = domain.region as string | undefined
  const created = domain.created_at as string | undefined
  const records: any[] = Array.isArray(domain.records) ? domain.records : []
  const openTracking =
    configOverride.open_tracking !== undefined
      ? configOverride.open_tracking
      : Boolean(domain.open_tracking)
  const clickTracking =
    configOverride.click_tracking !== undefined
      ? configOverride.click_tracking
      : Boolean(domain.click_tracking)
  const tls = configOverride.tls ?? (domain.tls as string) ?? 'opportunistic'
  const cap = (configOverride.capabilities ??
    domain.capabilities) as { sending?: string; receiving?: string } | undefined
  const sendingOn = (cap?.sending ?? 'enabled') === 'enabled'
  const receivingOn = (cap?.receiving ?? 'disabled') === 'enabled'

  const pendingDns = status !== 'verified'

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos domínios
      </button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/5">
            <Globe className="h-5 w-5 text-brand" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Domínio</p>
            <h1 className="mt-0.5 break-all text-xl font-semibold tracking-[-0.04em] text-ink">
              {name}
            </h1>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Criado</p>
                <p className="mt-1 text-[13px] text-ink-muted">{relativeTimePt(created)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Status</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium ${
                      status === 'verified'
                        ? 'bg-success/10 text-success'
                        : 'bg-amber-400/10 text-amber-400'
                    }`}
                  >
                    {domainStatusLabel(status)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Região</p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {regionFlag(region)} {formatRegionLabel(region)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={handleVerify} disabled={verifying}>
            {verifying ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                A verificar…
              </>
            ) : (
              'Verificar DNS'
            )}
          </Button>
        </div>
      </div>

      {pendingDns && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-[13px] text-amber-300">
          <p className="flex items-start gap-2">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-400" />
            <span>
              A procurar registos DNS: pode demorar algumas horas, consoante a propagação no seu
              fornecedor DNS.
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-line pb-1">
        <button
          type="button"
          onClick={() => setTab('records')}
          className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
            tab === 'records'
              ? 'bg-white/[0.08] text-ink'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Registos
        </button>
        <button
          type="button"
          onClick={() => setTab('config')}
          className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
            tab === 'config'
              ? 'bg-white/[0.08] text-ink'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Configuração
        </button>
      </div>

      {error && (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}

      {tab === 'records' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold text-ink">Registos DNS</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] text-ink-faint">
                <Globe className="h-3.5 w-3.5" />
                Configuração no painel DNS do seu fornecedor
              </span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint hover:bg-white/[0.04] hover:text-ink-muted"
                title="Enviar teste"
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint hover:bg-white/[0.04] hover:text-ink-muted"
                title="Email"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>

          {copyFeedback && (
            <p
              className="border-b border-line bg-success/10 px-4 py-2 text-center text-[11px] text-success"
              role="status"
            >
              {copyFeedback}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">TTL</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-[13px] text-ink-muted">
                      Sem registos listados. Volte a carregar após verificar o domínio na Resend.
                    </td>
                  </tr>
                ) : (
                  records.map((row, idx) => {
                    const typeStr = row.type != null ? String(row.type).trim() : ''
                    const nameStr = row.name != null ? String(row.name).trim() : ''
                    const valueStr = row.value != null ? String(row.value).trim() : ''
                    const recordSt = String(row.status || '').toLowerCase()
                    const recordVerified = recordSt === 'verified'
                    const recordBadgeClass = recordVerified
                      ? 'bg-success/10 text-success'
                      : 'bg-amber-400/10 text-amber-400'
                    const cellCopy =
                      'cursor-pointer select-none transition-colors hover:bg-white/[0.06] hover:text-brand focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand/40'
                    return (
                    <tr
                      key={`${row.name}-${row.type}-${idx}`}
                      className="border-b border-line/80 transition-colors hover:bg-white/[0.02]"
                    >
                      <td
                        className={`px-4 py-3 font-mono text-[12px] text-ink ${typeStr ? cellCopy : ''}`}
                        title={typeStr ? 'Clique para copiar o tipo' : undefined}
                        role={typeStr ? 'button' : undefined}
                        tabIndex={typeStr ? 0 : undefined}
                        onClick={() => typeStr && copyDnsCell('Tipo', row.type)}
                        onKeyDown={(e) => {
                          if (!typeStr) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            copyDnsCell('Tipo', row.type)
                          }
                        }}
                      >
                        {row.type || '—'}
                      </td>
                      <td
                        className={`max-w-[140px] truncate px-4 py-3 font-mono text-[12px] text-ink-muted ${nameStr ? cellCopy : ''}`}
                        title={nameStr ? 'Clique para copiar o nome' : row.name}
                        role={nameStr ? 'button' : undefined}
                        tabIndex={nameStr ? 0 : undefined}
                        onClick={() => nameStr && copyDnsCell('Nome', row.name)}
                        onKeyDown={(e) => {
                          if (!nameStr) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            copyDnsCell('Nome', row.name)
                          }
                        }}
                      >
                        {row.name || '—'}
                      </td>
                      <td
                        className={`max-w-md px-4 py-3 font-mono text-[11px] text-ink-muted ${valueStr ? cellCopy : ''}`}
                        title={valueStr ? 'Clique para copiar o valor' : row.value}
                        role={valueStr ? 'button' : undefined}
                        tabIndex={valueStr ? 0 : undefined}
                        onClick={() => valueStr && copyDnsCell('Valor', row.value)}
                        onKeyDown={(e) => {
                          if (!valueStr) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            copyDnsCell('Valor', row.value)
                          }
                        }}
                      >
                        <span className="line-clamp-2">{row.value || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink-faint">{row.ttl ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-ink-faint">
                        {row.priority != null ? String(row.priority) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${recordBadgeClass}`}
                        >
                          {recordStatusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {records.length > 0 && (
            <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-faint">
              {records[0]?.record && (
                <>
                  Tipo de registo: <span className="text-ink-muted">{records[0].record}</span>
                  <a
                    href="https://resend.com/docs/dashboard/domains/introduction"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-0.5 text-brand hover:underline"
                  >
                    Documentação
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-6 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-[15px] font-semibold text-ink">Configuração</h2>

          <div className="space-y-6 border-t border-line pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <h3 className="text-[13px] font-medium text-ink">Rastreamento de cliques</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  Os links no HTML são reescritos para contabilizar cliques antes de redirecionar para
                  o destino.
                </p>
              </div>
              <Toggle
                checked={clickTracking}
                disabled={saving}
                onChange={(v) => patchDomain({ click_tracking: v })}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <h3 className="inline text-[13px] font-medium text-ink">Rastreamento de aberturas</h3>
                <span className="ml-2 inline-flex rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                  Não recomendado
                </span>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  Utiliza um GIF transparente; os resultados podem ser imprecisos em alguns clientes.
                </p>
              </div>
              <Toggle
                checked={openTracking}
                disabled={saving}
                onChange={(v) => patchDomain({ open_tracking: v })}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <h3 className="text-[13px] font-medium text-ink">TLS (segurança da camada de transporte)</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  <strong className="text-ink-muted">Oportunista:</strong> tenta TLS e pode enviar em
                  claro se o servidor remoto não suportar. <strong className="text-ink-muted">Forçado:</strong>{' '}
                  exige TLS.
                </p>
              </div>
              <select
                value={tls}
                disabled={saving}
                onChange={(e) => patchDomain({ tls: e.target.value })}
                className="select-primary min-w-[180px] shrink-0"
              >
                <option value="opportunistic">Oportunista</option>
                <option value="enforced">Forçado</option>
              </select>
            </div>

            <div className="border-t border-line pt-6">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                Capacidades
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-12">
                <div className="flex items-center justify-between gap-4 sm:min-w-[240px]">
                  <span className="text-[13px] text-ink-muted">Envio (sending)</span>
                  <Toggle
                    checked={sendingOn}
                    disabled={saving}
                    onChange={(v) =>
                      patchDomain({
                        capabilities: {
                          sending: v ? 'enabled' : 'disabled',
                          receiving: receivingOn ? 'enabled' : 'disabled',
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 sm:min-w-[240px]">
                  <span className="text-[13px] text-ink-muted">Receção (receiving)</span>
                  <Toggle
                    checked={receivingOn}
                    disabled={saving}
                    onChange={(v) =>
                      patchDomain({
                        capabilities: {
                          sending: sendingOn ? 'enabled' : 'disabled',
                          receiving: v ? 'enabled' : 'disabled',
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {saving && (
        <p className="text-[11px] text-ink-faint">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Salvando…
        </p>
      )}
    </div>
  )
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-success' : 'bg-line-strong'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
