import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import { Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'
import api from '../services/api'

export function StatusPage() {
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServerResendKeyConfigured()
      .then((r) => setServerConfigured(r.data?.configured))
      .catch(() => setServerConfigured(false))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <Header
        title="Status do Sistema"
        description="Estado da conexão com a API da Resend e configurações do servidor."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Resend Connection */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Conexão Resend</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">
                {loading ? 'Verificando...' : serverConfigured ? 'Conectado' : 'Não Configurado'}
              </h3>
            </div>
            <div className={`rounded-lg p-2 ${serverConfigured ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {serverConfigured ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${serverConfigured ? 'bg-success' : 'bg-danger'}`} />
              {serverConfigured ? 'API Key detectada no servidor' : 'Nenhuma API Key encontrada'}
            </div>
          </div>
        </Card>

        {/* Backend */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Servidor Backend</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">Online</h3>
            </div>
            <div className="rounded-lg bg-brand/10 p-2 text-brand">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-6 text-[13px] leading-relaxed text-ink-muted">
            O backend está processando requisições em{' '}
            <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink-muted">http://127.0.0.1:8000</code>.
          </p>
        </Card>
      </div>

      {/* Credentials */}
      <Card>
        <div className="mb-5 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-brand" strokeWidth={1.5} />
          <h4 className="text-[13px] font-semibold text-ink">Credenciais Locais de Acesso</h4>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const username = fd.get('username') as string
            const password = fd.get('password') as string
            if (!username || !password) return alert('Preencha os campos')
            try {
              await api.updateAdminCredentials({ username, password })
              alert('Credenciais alteradas com sucesso! Faça login novamente.')
              const { authService } = await import('../services/authService')
              authService.logout()
              window.dispatchEvent(new Event('auth-expired'))
            } catch (err: any) {
              alert('Erro ao atualizar: ' + err.message)
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Novo Usuário</label>
              <input
                name="username"
                type="text"
                className="input-primary w-full"
                placeholder="Por ex: felipe"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Nova Senha</label>
              <input
                name="password"
                type="password"
                className="input-primary w-full"
                placeholder="Sua senha secreta"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-canvas transition-colors hover:bg-brand-light"
          >
            Salvar e relogar
          </button>
        </form>
      </Card>

      {/* Instructions */}
      <Card>
        <div className="mb-5 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-brand" strokeWidth={1.5} />
          <h4 className="text-[13px] font-semibold text-ink">Como configurar a chave</h4>
        </div>
        <div className="space-y-4 text-[13px] leading-relaxed text-ink-muted">
          <p>
            Para que o painel funcione corretamente, configure a chave de API da Resend no servidor.
            O gerenciamento de chaves via navegador foi desativado por segurança.
          </p>
          <div className="rounded-lg border border-line bg-canvas p-4 font-mono text-[12px]">
            <p className="text-brand/70"># No arquivo backend/.env</p>
            <p className="mt-1 text-ink-muted">RESEND_API_KEY=re_sua_chave_aqui</p>
          </div>
          <p className="text-[12px] italic text-ink-faint">
            * Após alterar as variáveis de ambiente, reinicie o servidor backend.
          </p>
        </div>
      </Card>
    </div>
  )
}
