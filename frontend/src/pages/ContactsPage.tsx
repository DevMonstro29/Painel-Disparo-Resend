import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { Users, Layers, Tag as TagIcon, Settings2, Upload, X, Save, Trash2, UserMinus, Plus } from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import api from '../services/api'
import ExportButton from '../components/ExportButton'

export function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState('contacts')
  const [showForm, setShowForm] = useState<string | null>(null)
  const [uploadingCsv, setUploadingCsv] = useState(false)
  
  // Modal states
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  
  // Sidebar states
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarData, setSidebarData] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [contactsRes, segmentsRes, topicsRes, propertiesRes] = await Promise.allSettled([
        api.listContacts(),
        api.listSegments(),
        api.listTopics(),
        api.get('/settings/usage') 
      ])
      
      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value.data?.data?.data || [])
      if (segmentsRes.status === 'fulfilled') setSegments(segmentsRes.value.data?.data || [])
      if (topicsRes.status === 'fulfilled') setTopics(topicsRes.value.data?.data || [])
      if (propertiesRes.status === 'fulfilled') setProperties(propertiesRes.value.data?.data?.properties || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showForm) return

    setSubmitting(true)
    try {
      if (showForm === 'contacts') {
        if (!formData.audience_id) {
          alert('Por favor, selecione ao menos um Segmento/Público destino.');
          setSubmitting(false);
          return;
        }
        await api.createContact(formData)
      } else if (showForm === 'segments') {
        await api.createSegment({ name: formData.name })
      } else if (showForm === 'topics') {
        await api.createTopic({ name: formData.name })
      } else if (showForm === 'properties') {
        await api.addContactProperty('default', { key: formData.key, value: '' })
      }
      
      alert(`${tabs.find(t => t.id === showForm)?.label.slice(0, -1)} criado com sucesso!`)
      setShowForm(null)
      setFormData({})
      loadData()
    } catch (err) {
      alert('Erro ao criar item. Verifique se sua chave API tem permissões suficientes.')
    } finally {
      setSubmitting(false)
    }
  }

  const openForm = () => {
    setFormData({})
    setShowForm(activeTab)
  }

  const handleEditClick = (contact: any) => {
    setSelectedContact(contact)
    setSidebarData({
      ...contact,
      audience_id: contact.audience_id || segments[0]?.id // Default to first segment if not set
    })
    setIsSidebarOpen(true)
  }

  const handleSidebarSave = async () => {
    if (!selectedContact) return
    setSubmitting(true)
    try {
      const audienceId = sidebarData.audience_id || selectedContact.audience_id
      if (!audienceId) {
        alert('Selecione um público para o contato')
        return
      }

      await api.updateContact(audienceId, selectedContact.id, {
        first_name: sidebarData.first_name,
        last_name: sidebarData.last_name,
        email: sidebarData.email,
        unsubscribed: sidebarData.unsubscribed,
        properties: sidebarData.properties
      })

      alert('Contato atualizado com sucesso!')
      setIsSidebarOpen(false)
      loadData()
    } catch (err) {
      alert('Erro ao atualizar contato')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!selectedContact) return
    if (!confirm('Tem certeza que deseja excluir este contato? Esta ação é permanente na Resend.')) return
    
    setSubmitting(true)
    try {
      const audienceId = selectedContact.audience_id || sidebarData.audience_id
      await api.deleteContact(audienceId, selectedContact.id)
      alert('Contato excluído com sucesso!')
      setIsSidebarOpen(false)
      loadData()
    } catch (err) {
      alert('Erro ao excluir contato')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickUnsubscribe = async () => {
    if (!selectedContact) return
    setSubmitting(true)
    try {
      const audienceId = selectedContact.audience_id || sidebarData.audience_id
      await api.updateContact(audienceId, selectedContact.id, {
        unsubscribed: true
      })
      alert('Contato desinscrito com sucesso!')
      setSidebarData({ ...sidebarData, unsubscribed: true })
      loadData()
    } catch (err) {
      alert('Erro ao desinscrever contato')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;
    setUploadingCsv(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const contactsList = results.data;
          let successCount = 0;
          for (const row of contactsList as any[]) {
             const email = row.email || row.Email || row.EMAIL
             if (!email) continue
             await api.createContact({ 
               email, 
               first_name: row.first_name || row.nome || row.name || row.FirstName,
               last_name: row.last_name || row.sobrenome || row.LastName,
               audience_id: formData.csv_audience_id
             }).catch(() => {}) // Ignore individual failures
             successCount++;
          }
          alert(`${successCount} contatos importados com sucesso!`)
          loadData()
        } catch(err) {
          alert('Erro ao importar CSV')
        } finally {
          setUploadingCsv(false)
          // Reset file input target
          e.target.value = ''
        }
      }
    })
  }

  const tabs = [
    { id: 'contacts', label: 'Contatos', addLabel: '+ Novo Contato' },
    { id: 'segments', label: 'Segmentos', addLabel: '+ Novo Segmento' },
    { id: 'topics', label: 'Tópicos', addLabel: '+ Novo Tópico' },
    { id: 'properties', label: 'Propriedades', addLabel: '+ Nova Propriedade' },
  ]

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0]

  const getActiveData = () => {
    if (activeTab === 'contacts') return contacts;
    if (activeTab === 'segments') return segments;
    if (activeTab === 'topics') return topics;
    if (activeTab === 'properties') return properties;
    return [];
  };

  return (
    <div>
      <Header
        title="Público"
        description="Gerencie seus contatos, segmentos, tópicos e propriedades personalizadas"
      >
        <div className="flex items-center gap-3">
          {activeTab === 'contacts' && (
            <div className="flex items-center gap-2">
              <select 
                value={formData.csv_audience_id || ''} 
                onChange={e => setFormData({ ...formData, csv_audience_id: e.target.value })} 
                className="input-primary h-9 px-2 text-[12px] bg-surface"
              >
                <option value="">(Alvo do CSV)</option>
                {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={uploadingCsv || !formData.csv_audience_id} />
                <div title={!formData.csv_audience_id ? "Selecione um segmento primeiro" : ""} className={`btn-secondary h-9 px-4 text-[13px] flex items-center gap-1.5 transition-colors ${uploadingCsv || !formData.csv_audience_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{uploadingCsv ? 'Importando...' : 'Importar CSV'}</span>
                </div>
              </label>
            </div>
          )}
          <ExportButton data={getActiveData()} filename={`resend-${activeTab}`} />
          <Button variant="primary" size="md" onClick={openForm}>

            {activeTabData.addLabel}
          </Button>
        </div>
      </Header>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-0.5 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-ink after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-full after:bg-brand'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contacts Table */}
      {activeTab === 'contacts' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Email</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Nome</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                          <Users className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <p className="text-[13px] text-ink-muted">Nenhum contato adicionado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact: any) => (
                    <tr key={contact.id} className="border-b border-line last:border-0 hover:bg-black/5 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-medium text-ink">{contact.email}</td>
                      <td className="px-4 py-3 text-[13px] text-ink-muted">
                        {contact.first_name} {contact.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(contact)}>Editar</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Segments Table */}
      {activeTab === 'segments' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Nome</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Contatos</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Ações</th>
                </tr>
              </thead>
              <tbody>
                {segments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                          <Layers className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <p className="text-[13px] text-ink-muted">Nenhum segmento criado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  segments.map((segment: any) => (
                    <tr key={segment.id} className="border-b border-line last:border-0 hover:bg-black/5">
                      <td className="px-4 py-3 text-[13px] font-medium text-ink">{segment.name}</td>
                      <td className="px-4 py-3 text-[13px] text-ink-muted">{segment.contacts?.length || 0}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">Gerenciar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Topics Table */}
      {activeTab === 'topics' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Tópico</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Status</th>
                </tr>
              </thead>
              <tbody>
                {topics.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                          <TagIcon className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <p className="text-[13px] text-ink-muted">Nenhum tópico disponível</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  topics.map((topic: any) => (
                    <tr key={topic.id} className="border-b border-line last:border-0 hover:bg-black/5">
                      <td className="px-4 py-3 text-[13px] font-medium text-ink">{topic.name}</td>
                      <td className="px-4 py-3 text-[13px] text-ink-muted">
                        {topic.unsubscribed ? 'Desativado' : 'Ativo'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Properties Table */}
      {activeTab === 'properties' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Chave</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Tipo</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Ações</th>
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint">
                          <Settings2 className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <p className="text-[13px] text-ink-muted">Nenhuma propriedade personalizada</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  properties.map((prop: any) => (
                    <tr key={prop.id} className="border-b border-line last:border-0 hover:bg-black/5">
                      <td className="px-4 py-3 text-[13px] font-medium text-ink">{prop.key}</td>
                      <td className="px-4 py-3 text-[13px] text-ink-muted">{prop.type || 'Texto'}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">Remover</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(null) }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-modal">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold text-ink">Adicionar {tabs.find(t => t.id === showForm)?.label.slice(0, -1) || 'Item'}</h2>
              <button onClick={() => setShowForm(null)} className="text-ink-faint hover:text-ink transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6">
              {showForm === 'contacts' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
                    <input 
                      type="email" 
                      required 
                      className="input-primary w-full" 
                      placeholder="exemplo@email.com"
                      value={formData.email || ''} 
                      onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Segmento Destino</label>
                    <select required className="input-primary w-full" value={formData.audience_id || ''} onChange={e => setFormData({ ...formData, audience_id: e.target.value })}>
                      <option value="">Selecione um segmento</option>
                      {segments.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Primeiro Nome</label>
                    <input 
                      type="text" 
                      className="input-primary w-full" 
                      placeholder="João"
                      value={formData.first_name || ''} 
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Último Nome</label>
                    <input 
                      type="text" 
                      className="input-primary w-full" 
                      placeholder="Silva"
                      value={formData.last_name || ''} 
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {(showForm === 'segments' || showForm === 'topics') && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Nome</label>
                    <input 
                      type="text" 
                      required 
                      className="input-primary w-full" 
                      placeholder={`Nome do ${showForm === 'segments' ? 'segmento' : 'tópico'}`}
                      value={formData.name || ''} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {showForm === 'properties' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Chave (Key)</label>
                    <input 
                      type="text" 
                      required 
                      className="input-primary w-full" 
                      placeholder="user_id"
                      value={formData.key || ''} 
                      onChange={e => setFormData({ ...formData, key: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 text-[13px]">
                <Button variant="secondary" size="md" onClick={() => setShowForm(null)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="md" loading={submitting}>
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar de Detalhes do Contato */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
          <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-[450px] transform border-l border-line bg-surface shadow-2xl transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex h-full flex-col">
              {/* Header da Sidebar */}
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Detalhes do Contato</h2>
                  <p className="text-[11px] text-ink-faint uppercase tracking-wider mt-0.5">ID: {selectedContact?.id}</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 text-ink-faint hover:bg-black/5 hover:text-ink transition-all">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Conteúdo da Sidebar */}
              <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="space-y-8">
                  {/* Informações Básicas */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Dados Cadastrais</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Email</label>
                        <input 
                          type="email" 
                          value={sidebarData.email || ''} 
                          onChange={e => setSidebarData({ ...sidebarData, email: e.target.value })}
                          className="input-primary w-full bg-black/5" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Primeiro Nome</label>
                          <input 
                            type="text" 
                            value={sidebarData.first_name || ''} 
                            onChange={e => setSidebarData({ ...sidebarData, first_name: e.target.value })}
                            className="input-primary w-full bg-black/5" 
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Último Nome</label>
                          <input 
                            type="text" 
                            value={sidebarData.last_name || ''} 
                            onChange={e => setSidebarData({ ...sidebarData, last_name: e.target.value })}
                            className="input-primary w-full bg-black/5" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Público (Audience)</label>
                        <select 
                          value={sidebarData.audience_id || ''} 
                          onChange={e => setSidebarData({ ...sidebarData, audience_id: e.target.value })}
                          className="input-primary w-full bg-black/5"
                        >
                          <option value="">Selecione um público</option>
                          {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Propriedades Personalizadas (Variables) */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Propriedades Técnicas</h3>
                      <button 
                        onClick={() => {
                          const key = prompt('Nome da propriedade (ex: cargo, empresa):')
                          if (key) {
                            setSidebarData({
                              ...sidebarData,
                              properties: { ...sidebarData.properties, [key.toLowerCase().replace(/\s+/g, '_')]: '' }
                            })
                          }
                        }}
                        className="text-[11px] text-brand hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    </div>
                    
                    <div className="rounded-lg border border-line bg-black/5 overflow-hidden">
                      {Object.keys(sidebarData.properties || {}).length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-ink-faint italic">
                          Nenhuma propriedade definida
                        </div>
                      ) : (
                        <div className="divide-y divide-line">
                          {Object.entries(sidebarData.properties || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 p-3">
                              <div className="w-1/3 text-[12px] font-medium text-ink-muted truncate" title={key}>{key}</div>
                              <input 
                                className="w-full bg-transparent border-none p-0 text-[12px] focus:ring-0 text-ink"
                                value={String(value)}
                                onChange={e => {
                                  const newProps = { ...sidebarData.properties, [key]: e.target.value }
                                  setSidebarData({ ...sidebarData, properties: newProps })
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Status e Ações Rápidas */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Status de Inscrição</h3>
                    <div className="flex items-center justify-between rounded-xl border border-line p-4 bg-black/5">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${sidebarData.unsubscribed ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-[13px] font-medium text-ink">
                          {sidebarData.unsubscribed ? 'Desinscrito' : 'Ativo na Lista'}
                        </span>
                      </div>
                      {!sidebarData.unsubscribed && (
                        <button 
                          onClick={handleQuickUnsubscribe}
                          className="text-[12px] font-medium text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1.5"
                        >
                          <UserMinus className="h-4 w-4" /> Desinscrever
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer da Sidebar com Ações Finais */}
              <div className="border-t border-line bg-black/[0.02] p-6 space-y-3">
                <Button variant="primary" size="lg" className="w-full h-12 gap-2" onClick={handleSidebarSave} loading={submitting}>
                  <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="md" className="flex-1" onClick={() => setIsSidebarOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="ghost" size="md" className="flex-1 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={handleDeleteContact}>
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
