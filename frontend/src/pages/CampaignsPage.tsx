import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import api from '../services/api'

export function CampaignsPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [recipients, setRecipients] = useState<string>('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.listTemplates()
      setTemplates(response.data?.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!selectedTemplate || !recipients) {
      alert('Selecione um template e adicione contatos')
      return
    }

    try {
      setLoading(true)
      const recipientList = recipients.split(',').map(r => r.trim())
      
      await api.sendCampaign({
        to: recipientList,
        subject: 'Campanha de Email',
        html: '<p>Conteúdo da campanha</p>',
        from_email: 'onboarding@resend.dev'
      })

      alert('Campanha enviada com sucesso!')
      setRecipients('')
      setSelectedTemplate('')
    } catch (error) {
      console.error('Erro ao enviar campanha:', error)
      alert('Erro ao enviar campanha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div>
        <Header
          title="Campanhas"
          description="Crie e envie campanhas de email usando seus templates"
        />

        <Card className="w-[700px]">
          <h3 className="mb-5 text-lg font-semibold tracking-tight text-ink">Nova campanha</h3>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-ink-muted">Selecionar template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="select-primary w-full"
            >
              <option value="">Escolha um template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-ink-muted">
              Contatos (separados por vírgula)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="textarea-primary h-32 w-full resize-y"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSendCampaign}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Enviando...' : 'Enviar Campanha'}
          </Button>
        </Card>
      </div>

      <Card className="my-[30px]">
        <h3 className="mb-5 text-lg font-semibold tracking-tight text-ink">Templates disponíveis</h3>

        {templates.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum template disponível</p>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-line bg-surface-raised/50 p-3 transition-colors hover:border-line-strong"
              >
                <p className="font-medium text-ink">{template.name}</p>
                <p className="mt-1 font-mono text-2xs text-ink-faint">De: {template.from}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
