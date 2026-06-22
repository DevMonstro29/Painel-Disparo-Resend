/** Labels e formatação para a página de domínios (alinhado à UI Resend). */

/** Erros Resend / FastAPI em texto legível. */
export function formatDomainErrorMessage(raw: unknown): string {
  if (raw == null) return 'Erro desconhecido.'
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { message?: string }
      if (parsed?.message && typeof parsed.message === 'string') return parsed.message
    } catch {
      /* not JSON */
    }
    return raw
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg)
        }
        return ''
      })
      .filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  if (typeof raw === 'object' && raw !== null && 'message' in raw) {
    const m = (raw as { message: unknown }).message
    if (typeof m === 'string') return m
  }
  return 'Não foi possível concluir a operação.'
}

const REGION_LABELS: Record<string, string> = {
  'sa-east-1': 'São Paulo (sa-east-1)',
  'us-east-1': 'N. Virginia (us-east-1)',
  'eu-west-1': 'Dublin (eu-west-1)',
  'ap-northeast-1': 'Tóquio (ap-northeast-1)',
}

const REGION_FLAGS: Record<string, string> = {
  'sa-east-1': '🇧🇷',
  'us-east-1': '🇺🇸',
  'eu-west-1': '🇮🇪',
  'ap-northeast-1': '🇯🇵',
}

export function formatRegionLabel(region: string | undefined): string {
  if (!region) return '—'
  return REGION_LABELS[region] || region
}

export function regionFlag(region: string | undefined): string {
  if (!region) return ''
  return REGION_FLAGS[region] || '🌐'
}

export function domainStatusLabel(status: string | undefined): string {
  const s = (status || '').toLowerCase()
  if (s === 'verified') return 'Verificado'
  if (s === 'not_started' || s === 'pending') return 'Pendente'
  if (s === 'failed') return 'Falhou'
  if (s === 'partially_verified') return 'Parcialmente verificado'
  if (s === 'partially_failed') return 'Parcialmente falhou'
  if (s === 'temporary_failure') return 'Falha temporária'
  return status || '—'
}

export function recordStatusLabel(status: string | undefined): string {
  const s = (status || '').toLowerCase()
  if (s === 'verified') return 'Verificado'
  if (s === 'not_started' || s === 'pending') return 'Pendente'
  if (s === 'failed') return 'Falhou'
  return status || 'Pendente'
}

export function relativeTimePt(iso: string | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const now = Date.now()
  const diffSec = Math.round((now - t) / 1000)
  if (diffSec < 10) return 'agora'
  if (diffSec < 60) return `há ${diffSec} segundos`
  const min = Math.floor(diffSec / 60)
  if (min < 60) return min === 1 ? '1 minuto atrás' : `${min} minutos atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return h === 1 ? '1 hora atrás' : `${h} horas atrás`
  const d = Math.floor(h / 24)
  if (d < 30) return d === 1 ? '1 dia atrás' : `${d} dias atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** Extrai array de domínios da resposta list (axios body = { success, data: resend }). */
export function extractDomainList(payload: unknown): any[] {
  const p = payload as { data?: { data?: unknown[] } | unknown[] }
  if (!p?.data) return []
  const inner = p.data
  if (Array.isArray(inner)) return inner as any[]
  const nested = (inner as { data?: unknown[] }).data
  if (Array.isArray(nested)) return nested as any[]
  return []
}

/** Objeto domínio da GET /domains/:id (axios body = { success, data: domain }). */
export function extractDomainDetail(payload: unknown): Record<string, any> | null {
  const p = payload as { data?: Record<string, any> }
  const d = p?.data
  if (d?.id && d?.name) return d
  return null
}
