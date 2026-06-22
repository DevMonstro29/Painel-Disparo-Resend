import axios, { AxiosInstance } from 'axios'
import { authService } from './authService'

const API_URL = 'http://127.0.0.1:8000'

class ApiClient {
  public client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Injetar JWT em requisições
    this.client.interceptors.request.use(
      (config) => {
        const token = authService.getToken()
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    
    // Limpar o storage em caso de 401 Unauthorized
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          authService.logout()
          // Disparar evento para que a UI saiba (ou React state reload)
          window.dispatchEvent(new Event('auth-expired'))
        }
        return Promise.reject(error)
      }
    )
  }
  
  post<T = any>(url: string, data?: any) {
    return this.client.post<T>(url, data)
  }

  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config)
  }


  // Campanhas
  sendCampaign(data: any) {
    return this.client.post('/campaigns/send', data)
  }

  sendBatchCampaign(emails: any[]) {
    return this.client.post('/campaigns/send-batch', emails)
  }

  listCampaigns() {
    return this.client.get('/campaigns/list')
  }

  // Templates
  createTemplate(data: Record<string, unknown>) {
    return this.client.post('/templates', data)
  }

  listTemplates(limit = 50) {
    return this.client.get(`/templates?limit=${limit}`)
  }

  getTemplate(templateId: string) {
    return this.client.get(`/templates/${templateId}`)
  }

  updateTemplate(templateId: string, data: Record<string, unknown>) {
    return this.client.patch(`/templates/${templateId}`, data)
  }

  deleteTemplate(templateId: string) {
    return this.client.delete(`/templates/${templateId}`)
  }

  publishTemplate(templateId: string) {
    return this.client.post(`/templates/${templateId}/publish`)
  }

  duplicateTemplate(templateId: string) {
    return this.client.post(`/templates/${templateId}/duplicate`)
  }

  // Emails
  sendEmail(data: { to: string[]; subject: string; html: string; from_email: string; reply_to?: string }) {
    return this.client.post('/emails/send', data)
  }

  listSentEmails(limit = 50, offset = 0) {
    return this.client.get(`/emails/sent?limit=${limit}&offset=${offset}`)
  }

  getSentEmail(emailId: string) {
    return this.client.get(`/emails/sent/${emailId}`)
  }

  // Contatos
  createContact(data: any) {
    if (data.audience_id) {
      return this.client.post(`/audiences/${data.audience_id}/contacts`, data)
    }
    return this.client.post('/contacts/create', data)
  }

  listContacts(limit = 50) {
    return this.client.get(`/contacts/list?limit=${limit}`)
  }

  updateContact(audienceId: string, contactId: string, data: any) {
    return this.client.patch(`/contacts/${audienceId}/${contactId}`, data)
  }

  deleteContact(audienceId: string, contactId: string) {
    return this.client.delete(`/contacts/${audienceId}/${contactId}`)
  }

  addContactProperty(contactId: string, property: any) {
    return this.client.post(`/contacts/properties/add?contact_id=${contactId}`, property)
  }

  getContactProperties(contactId: string) {
    return this.client.get(`/contacts/properties/${contactId}`)
  }

  createSegment(data: any) {
    return this.client.post('/audiences/create', { name: data.name })
  }

  listSegments() {
    return this.client.get('/audiences/list')
  }

  addContactToSegment(segmentId: string, contactId: string) {
    return this.client.post(`/contacts/segments/${segmentId}/add-contact?contact_id=${contactId}`)
  }

  createTopic(data: any) {
    return this.client.post('/contacts/topics/create', data)
  }

  listTopics() {
    return this.client.get('/contacts/topics/list')
  }

  // Transmissões
  createBroadcast(data: any) {
    return this.client.post('/broadcasts', data)
  }

  listBroadcasts(limit = 50) {
    return this.client.get(`/broadcasts?limit=${limit}`)
  }

  getBroadcast(broadcastId: string) {
    return this.client.get(`/broadcasts/${broadcastId}`)
  }

  updateBroadcast(broadcastId: string, data: Record<string, unknown>) {
    return this.client.patch(`/broadcasts/${broadcastId}`, data)
  }

  deleteBroadcast(broadcastId: string) {
    return this.client.delete(`/broadcasts/${broadcastId}`)
  }

  sendBroadcast(broadcastId: string, scheduledAt?: string) {
    return this.client.post(`/broadcasts/${broadcastId}/send`, scheduledAt ? { scheduled_at: scheduledAt } : {})
  }

  // Domínios — espelho da API Resend via backend
  createDomain(data: {
    name: string
    region?: string
    custom_return_path?: string
  }) {
    return this.client.post('/domains/create', data)
  }

  listDomains() {
    return this.client.get('/domains/list')
  }

  getDomain(domainId: string) {
    return this.client.get(`/domains/${domainId}`)
  }

  verifyDomain(domainId: string) {
    return this.client.post(`/domains/${domainId}/verify`)
  }

  updateDomain(domainId: string, data: Record<string, unknown>) {
    return this.client.patch(`/domains/${domainId}`, data)
  }

  deleteDomain(domainId: string) {
    return this.client.delete(`/domains/${domainId}`)
  }

  createTrackingDomain(domainId: string, subdomain: string) {
    return this.client.post(`/domains/${domainId}/tracking-domains`, { subdomain })
  }

  listTrackingDomains(domainId: string) {
    return this.client.get(`/domains/${domainId}/tracking-domains`)
  }

  getTrackingDomain(domainId: string, trackingDomainId: string) {
    return this.client.get(`/domains/${domainId}/tracking-domains/${trackingDomainId}`)
  }

  verifyTrackingDomain(domainId: string, trackingDomainId: string) {
    return this.client.post(`/domains/${domainId}/tracking-domains/${trackingDomainId}/verify`)
  }

  deleteTrackingDomain(domainId: string, trackingDomainId: string) {
    return this.client.delete(`/domains/${domainId}/tracking-domains/${trackingDomainId}`)
  }

  // Webhooks
  createWebhook(data: any) {
    return this.client.post('/webhooks/', data)
  }

  listWebhooks() {
    return this.client.get('/webhooks/')
  }

  deleteWebhook(webhookId: string) {
    return this.client.delete(`/webhooks/${webhookId}`)
  }

  getWebhookHistory(limit = 50) {
    return this.client.get(`/webhooks/history?limit=${limit}`)
  }

  // Logs
  listLogs(limit = 50, offset = 0) {
    return this.client.get(`/logs/list?limit=${limit}&offset=${offset}`)
  }

  // Métricas
  getMetrics() {
    return this.client.get('/metrics/')
  }

  getServerResendKeyConfigured() {
    return this.client.get<{ configured: boolean }>('/settings/server-key-configured')
  }

  updateAdminCredentials(data: any) {
    return this.client.post('/settings/admin-credentials', data)
  }

  // Settings: API Keys
  listApiKeys() {
    return this.client.get('/settings/api-keys')
  }

  createApiKey(name: string) {
    return this.client.post(`/settings/api-keys?name=${name}`)
  }

  deleteApiKey(keyId: string) {
    return this.client.delete(`/settings/api-keys/${keyId}`)
  }

  // Settings: Usage
  getUsage() {
    return this.client.get('/settings/usage')
  }

  updateResendKey(key: string) {
    return this.client.post('/settings/resend-key', { api_key: key })
  }

  // Audiences (Novo)
  listAudiences() {
    return this.client.get('/audiences/')
  }

  createAudience(name: string) {
    return this.client.post(`/audiences/?name=${name}`)
  }

  deleteAudience(id: string) {
    return this.client.delete(`/audiences/${id}`)
  }

  // Batch Send Special
  sendBatchEmailsCSV(fromEmail: string, subject: string, html: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.client.post(
      `/emails/batch-send-csv?from_email=${fromEmail}&subject=${subject}&html=${html}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  }
}

export default new ApiClient()
