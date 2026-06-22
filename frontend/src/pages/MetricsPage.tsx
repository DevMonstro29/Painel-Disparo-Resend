import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Info } from 'lucide-react'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import api from '../services/api'
import ExportButton from '../components/ExportButton'

export function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const response = await api.getMetrics()
      setMetrics(response.data?.data)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ label, value, unit = '%' }: { label: string; value: number; unit?: string }) => (
    <Card>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mb-4 text-3xl font-semibold tracking-[-0.04em] text-ink">
        {value.toFixed(2)}
        <span className="ml-0.5 text-lg font-normal text-ink-muted">{unit}</span>
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </Card>
  )

  return (
    <div>
      <Header title="Métricas" description="Acompanhe o desempenho de seus emails">
        <ExportButton data={metrics ? [metrics] : []} filename="resend-metrics" />
      </Header>

      {loading && !metrics ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-16">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
            <BarChart2 className="h-4 w-4 animate-pulse" strokeWidth={1.5} />
          </span>
          <p className="text-[13px] text-ink-muted">Carregando métricas...</p>
        </div>
      ) : !metrics ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-16">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
            <BarChart2 className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <p className="text-[13px] text-ink-muted">Sem dados de métricas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard label="Taxa de entregabilidade" value={metrics.deliverability_rate || 99.9} />
          <MetricCard label="Taxa de rejeição" value={metrics.bounce_rate || 0.0} />
          <MetricCard label="Taxa de reclamação" value={metrics.complaint_rate || 0.0} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand" />
            <h3 className="text-[13px] font-semibold text-ink">Uso e Limites da API</h3>
          </div>
          <div className="space-y-0">
            {[
              ['Limite de Requisições', metrics?.rate_limit || '0'],
              ['Requisições Restantes', metrics?.remaining || '0'],
              ['Cota Diária', metrics?.daily_usage || '0'],
              ['Cota Mensal', metrics?.monthly_usage || '0'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                <span className="text-[13px] text-ink-muted">{k}</span>
                <span className="font-mono text-[13px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-brand" />
            <h3 className="text-[13px] font-semibold text-ink">Informações das Métricas</h3>
          </div>
          <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
            <p>Estas métricas são obtidas diretamente dos headers da API Resend em tempo real.</p>
            <p>
              <span className="text-ink">Entregabilidade:</span> Percentual de emails que chegaram ao destino sem erros.
            </p>
            <p>
              <span className="text-ink">Rate Limit:</span> Limite de requisições que você pode fazer por segundo/minuto.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
