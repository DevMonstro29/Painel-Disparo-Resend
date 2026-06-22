import {
  Inbox,
  Satellite,
  FileText,
  Users,
  BarChart2,
  Globe,
  Clipboard,
  Link2,
  Activity,
  LogOut,
} from 'lucide-react'
import { authService } from '../services/authService'

interface SidebarProps {
  onNavigate: (page: string) => void
  activePage: string
}

export function Sidebar({ onNavigate, activePage }: SidebarProps) {
  const menuItems = [
    { id: 'emails', label: 'Emails', icon: Inbox },
    { id: 'broadcasts', label: 'Transmissões', icon: Satellite },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'contacts', label: 'Público', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: BarChart2 },
    { id: 'domains', label: 'Domínios', icon: Globe },
    { id: 'logs', label: 'Logs', icon: Clipboard },
    { id: 'api-keys', label: 'Configurações', icon: Activity },
    { id: 'webhooks', label: 'Webhooks', icon: Link2 },
  ]

  const username = authService.getUser() || 'admin'
  const initial = username.charAt(0).toUpperCase()

  const handleLogout = () => {
    authService.logout()
    window.dispatchEvent(new Event('auth-expired'))
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-line bg-surface px-3 py-4">
      {/* Logo / Brand */}
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
          <Inbox className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">Resend</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] font-highlight font-medium transition-colors ${
                active
                  ? 'bg-white/[0.06] text-ink'
                  : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brand" />
              )}
              <Icon
                strokeWidth={1.5}
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-muted'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User area */}
      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/8 text-[11px] font-semibold text-brand">
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{username}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-white/[0.05] hover:text-ink-muted"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
