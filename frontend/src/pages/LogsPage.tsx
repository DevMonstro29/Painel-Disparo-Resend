import { useEffect, useState } from 'react'
import { Clipboard, RefreshCw } from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import api from '../services/api'

export function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await api.listLogs()
      setLogs(response.data?.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header title="Logs" description="Visualize todo o histórico de ações da API" />

      <div className="mb-6 flex items-center justify-end">
        <Button variant="secondary" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="max-h-[32rem] space-y-0 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                <Clipboard className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <p className="text-[13px] text-ink-muted">Nenhum log registrado</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="rounded-md bg-brand/10 px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide text-brand">
                    {log.event_type}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-muted">{log.message}</p>
                {log.data && (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-faint">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
