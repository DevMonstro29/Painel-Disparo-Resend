import { useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
} from 'lucide-react'
import { Header } from '../components/Header'
import { FilterDropdown } from '../components/FilterDropdown'
import api from '../services/api'

import { StatusBadge, StatusVariant } from '../components/StatusBadge'

function getEmailRowStatus(email: any): { label: string; variant: StatusVariant } {
  const lastEvent = email.last_event?.toLowerCase?.() || ''
  if (lastEvent === 'delivered' || lastEvent === 'sent')
    return { label: 'Entregue', variant: 'success' }
  if (lastEvent === 'opened') return { label: 'Aberto', variant: 'info' }
  if (lastEvent === 'bounced' || lastEvent === 'complained')
    return { label: 'Falha', variant: 'danger' }
  return { label: 'Entregue', variant: 'neutral' }
}

export function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('15')
  const [statusFilter, setStatusFilter] = useState('all')
  const [keyFilter, setKeyFilter] = useState('all')

  const loadEmails = async () => {
    try {
      setLoading(true)
      const res = await api.listSentEmails(50, 0)
      setEmails(res.data?.data?.data || [])
    } catch (err) {
      console.error('Erro ao carregar emails:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [])

  return (
    <div>
      <Header title="E-mails" />

      {/* Tab */}
      <div className="mb-6">
        <button
          type="button"
          className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[13px] font-medium text-ink"
        >
          Enviando
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Procurar..."
            className="input-primary w-full py-2 pl-9 pr-3 text-[13px]"
          />
        </div>

        <FilterDropdown
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { value: '15', label: 'Últimos 15 dias' },
            { value: '30', label: 'Últimos 30 dias' },
          ]}
        />

        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'enviado', label: 'Entregue' },
            { value: 'aberto', label: 'Aberto' },
          ]}
        />

        <FilterDropdown
          value={keyFilter}
          onChange={setKeyFilter}
          options={[
            { value: 'all', label: 'Todas as chaves' },
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={loadEmails}
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
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Para</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Assunto</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-faint">Entregue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-ink-muted">
                    <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin text-ink-faint" />
                    <span className="text-[13px]">Carregando...</span>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <p className="text-[13px] font-medium text-ink-muted">Nenhum e-mail encontrado</p>
                    <p className="mt-1 text-[13px] text-ink-faint">
                      Sua lista de e-mails enviados aparecerá aqui.
                    </p>
                  </td>
                </tr>
              ) : (
                emails.map((email) => {
                  const { label, variant } = getEmailRowStatus(email)
                  const toDisplay = Array.isArray(email.to) ? email.to.join(', ') : email.to
                  return (
                    <tr
                      key={email.id}
                      className="border-t border-line transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-ink">{toDisplay}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={variant}>{label}</StatusBadge>
                      </td>
                      <td className="max-w-md truncate px-4 py-3 text-[13px] text-ink-muted">{email.subject}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-faint">
                        {new Date(email.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
