import { useEffect, useState } from 'react'
import { Key, Shield, Activity, Trash2, Plus } from 'lucide-react'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import api from '../services/api'
import { authService } from '../services/authService'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api-keys')
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'api-keys') {
        const res = await api.listApiKeys()
        setApiKeys(res.data?.data || [])
      } else if (activeTab === 'usage') {
        const res = await api.getUsage()
        setUsage(res.data?.data)
      } else if (activeTab === 'status') {
        const res = await api.getServerResendKeyConfigured()
        setServerConfigured(res.data?.configured)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKey = async () => {
    const key = prompt('Cole aqui sua nova chave da Resend (ex: re_...):')
    if (!key) return
    try {
      setLoading(true)
      const res = await api.updateResendKey(key)
      if (res.status === 200) {
        alert('Chave adicionada e atualizada com sucesso!')
        loadData()
      } else {
        throw new Error('Erro desconhecido')
      }
    } catch (err: any) {
      alert('Erro ao adicionar chave: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Deletar esta chave?')) return
    try {
      await api.deleteApiKey(id)
      loadData()
    } catch (err) {
      alert('Erro ao deletar chave')
    }
  }

  const tabs = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'usage', label: 'Uso & Quotas', icon: Activity },
    { id: 'status', label: 'Status do Servidor', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <Header
        title="Configurações"
        description="Gerencie chaves de acesso, limites de uso e segurança do sistema."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-line mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading && <div className="text-[13px] text-ink-muted animate-pulse">Carregando...</div>}

      {/* API Keys */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-ink">Suas Chaves de API</h3>
            <Button variant="primary" size="md" onClick={handleAddKey} loading={loading}>
              <Plus size={14} className="mr-2" /> Adicionar chave
            </Button>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-black/5">
                  <th className="px-4 py-3 font-medium text-ink-faint">Nome</th>
                  <th className="px-4 py-3 font-medium text-ink-faint">ID</th>
                  <th className="px-4 py-3 font-medium text-ink-faint">Criada em</th>
                  <th className="px-4 py-3 font-medium text-ink-faint">Ações</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink-muted italic">Nenhuma chave encontrada</td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr key={k.id} className="border-b border-line last:border-0 hover:bg-black/5">
                      <td className="px-4 py-3 font-medium text-ink">{k.name}</td>
                      <td className="px-4 py-3 text-ink-muted font-mono text-[11px]">{k.id}</td>
                      <td className="px-4 py-3 text-ink-muted">{new Date(k.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-ink-faint hover:text-danger hover:bg-danger/5 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage */}
      {activeTab === 'usage' && (
        <div className="grid gap-4 md:grid-cols-2">
          {!usage && !loading ? (
            <div className="md:col-span-2 rounded-xl border border-dashed border-line p-12 text-center">
              <Activity className="mx-auto h-8 w-8 text-ink-faint mb-3" strokeWidth={1} />
              <p className="text-[13px] text-ink-muted">Não foi possível carregar as cotas da API Resend.</p>
              <p className="text-[11px] text-ink-faint mt-1">Verifique se sua chave API possui as permissões necessárias.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={loadData}>Tentar novamente</Button>
            </div>
          ) : usage ? (
            <>
              <Card>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint mb-2">Rate Limit</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-serif text-ink">{usage.ratelimit_remaining}</span>
                  <span className="text-[13px] text-ink-muted">restantes de {usage.ratelimit_limit}</span>
                </div>
                <div className="w-full bg-line h-1 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-brand h-full transition-all" 
                      style={{ width: `${(usage.ratelimit_remaining / usage.ratelimit_limit) * 100}%` }}
                    />
                </div>
              </Card>
              
              <Card>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint mb-2">Cotas de Envio</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-muted">Cota Diária:</span>
                    <span className="font-medium text-ink">{usage.daily_quota} emails</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-muted">Cota Mensal:</span>
                    <span className="font-medium text-ink">{usage.monthly_quota} emails</span>
                  </div>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Status & Admin */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[13px] font-semibold text-ink">Conexão com a Resend</h4>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${serverConfigured ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {serverConfigured ? 'Ativa' : 'Inativa'}
                </div>
              </div>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                {serverConfigured 
                  ? 'O servidor está configurado corretamente com uma API Key mestre.' 
                  : 'Nenhuma API Key mestre foi detectada. Verifique o arquivo .env no backend.'}
              </p>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-brand" strokeWidth={1.5} />
              <h4 className="text-[13px] font-semibold text-ink">Alterar Credenciais do Painel</h4>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const username = fd.get('username') as string
                const password = fd.get('password') as string
                try {
                  await api.updateAdminCredentials({ username, password })
                  alert('Sucesso! Logue novamente.')
                  authService.logout()
                  window.dispatchEvent(new Event('auth-expired'))
                } catch (err) { alert('Erro ao atualizar') }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input name="username" type="text" className="input-primary w-full text-[13px]" placeholder="Novo Usuário" required />
                <input name="password" type="password" className="input-primary w-full text-[13px]" placeholder="Nova Senha" required />
              </div>
              <Button variant="primary" size="sm" type="submit">Salvar Alterações</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
