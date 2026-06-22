import React, { useEffect, useState } from 'react'
import { Link2, History, Settings, ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { FormInput } from '../components/FormInput'
import api from '../services/api'
import ExportButton from '../components/ExportButton'

export function WebhooksPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config')
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[]
  })

  const availableEvents = [
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked',
    'domain.verification_succeeded',
    'domain.verification_failed'
  ]

  useEffect(() => {
    if (activeTab === 'config') {
      loadWebhooks()
    } else {
      loadHistory()
    }
  }, [activeTab])

  const loadWebhooks = async () => {
    try {
      setLoading(true)
      const response = await api.listWebhooks()
      setWebhooks(response.data?.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await api.getWebhookHistory()
      setHistory(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.url || formData.events.length === 0) {
      alert('Preencha a URL e selecione pelo menos um evento')
      return
    }
    try {
      setLoading(true)
      await api.createWebhook(formData)
      alert('Webhook criado com sucesso!')
      setFormData({ url: '', events: [] })
      setShowForm(false)
      loadWebhooks()
    } catch (error) {
      console.error('Erro ao criar webhook:', error)
      alert('Erro ao criar webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja deletar este webhook?')) return
    try {
      setLoading(true)
      await api.deleteWebhook(webhookId)
      alert('Webhook deletado!')
      loadWebhooks()
    } catch (error) {
      console.error('Erro ao deletar webhook:', error)
      alert('Erro ao deletar webhook')
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({ ...formData, events: formData.events.filter(e => e !== event) })
    } else {
      setFormData({ ...formData, events: [...formData.events, event] })
    }
  }

  return (
    <div>
      <Header
        title="Webhooks"
        description="Configure webhooks e visualize o histórico de eventos recebidos."
      />

      <div className="mb-6 flex items-center justify-between border-b border-line">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'config' ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Settings size={16} /> Configuração
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'history' ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <History size={16} /> Histórico
          </button>
        </div>
        
        <div className="flex items-center gap-3 pb-3">
          <ExportButton data={activeTab === 'config' ? webhooks : history} filename={`webhooks-${activeTab}`} />
          {activeTab === 'config' && (
            <Button variant={showForm ? 'secondary' : 'primary'} size="md" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : '+ Novo Webhook'}
            </Button>
          )}
        </div>
      </div>

      {loading && activeTab === 'config' && webhooks.length === 0 && <p className="py-4 text-center text-sm text-ink-muted animate-pulse">Carregando endpoints...</p>}
      {loading && activeTab === 'history' && history.length === 0 && <p className="py-4 text-center text-sm text-ink-muted animate-pulse">Carregando histórico...</p>}

      {/* --- Tab: Config --- */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Create form */}
          {showForm && (
            <div className="rounded-xl border border-line bg-surface p-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="mb-4 text-sm font-semibold text-ink">Novo Webhook Endpoint</h3>
              <form onSubmit={handleCreateWebhook} className="space-y-6">
                <FormInput
                  label="URL do Endpoint"
                  placeholder="https://seu-servidor.com/webhook"
                  value={formData.url}
                  onChange={(e: any) => setFormData({ ...formData, url: e.target.value })}
                  required
                />

                <div>
                  <label className="mb-3 block text-[13px] font-medium text-ink-muted">Eventos para Notificar</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {availableEvents.map((event) => (
                      <label
                        key={event}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                          formData.events.includes(event)
                            ? 'border-brand bg-brand/5 text-ink'
                            : 'border-line hover:border-ink-faint text-ink-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.events.includes(event)}
                          onChange={() => toggleEvent(event)}
                        />
                        <div className={`h-3 w-3 rounded-full border ${formData.events.includes(event) ? 'bg-brand border-brand' : 'border-line'}`} />
                        <span className="text-[12px] font-mono">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={loading}>
                    Criar Endpoint
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-12 text-center">
                <Link2 className="mx-auto h-8 w-8 text-ink-faint" strokeWidth={1} />
                <p className="mt-2 text-[13px] text-ink-muted">Nenhum webhook configurado na Resend</p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook.id} className="rounded-xl border border-line bg-surface p-4 transition-all hover:border-ink-faint">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{webhook.url}</span>
                        <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success uppercase">Ativo</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {webhook.events.map((event: string) => (
                          <span key={event} className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-mono text-ink-muted">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-danger hover:bg-danger/5 hover:text-danger"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- Tab: History --- */}
      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-black/5">
                <th className="px-4 py-3 font-medium text-ink-faint">Tipo de Evento</th>
                <th className="px-4 py-3 font-medium text-ink-faint">ID do Evento</th>
                <th className="px-4 py-3 font-medium text-ink-faint">Recebido em</th>
                <th className="px-4 py-3 font-medium text-ink-faint">Data</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-ink-muted italic">
                    Nenhum evento capturado ainda localmente.<br/>
                    <span className="text-[11px] text-ink-faint">Aponte um webhook da Resend para o endpoint /webhooks/receive</span>
                  </td>
                </tr>
              ) : (
                history.map((event) => (
                  <tr key={event.id} className="border-b border-line last:border-0 hover:bg-black/5">
                    <td className="px-4 py-3">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[11px] font-mono font-medium text-brand">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">{event.id}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(event.received_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink" onClick={() => alert(event.data)}>
                        <ExternalLink size={12} /> Ver JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
