import React, { useState } from 'react'
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Youtube, 
  Twitter, 
  MousePointer2, 
  Minus, 
  Square, 
  Columns, 
  Share2, 
  ExternalLink, 
  Code, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  ArrowLeft,
  Eye,
  FileCode,
  Save,
  Upload,
  X,
  PlusCircle,
  Settings,
  Palette,
  Layers,
  Variable,
  Monitor,
  Smartphone
} from 'lucide-react'
import { Button } from '../Button'
import { Block, BlockType, PageStyle } from './types'
import { blocksToHtml } from './html-generator'
import { ShadowPreview } from './ShadowPreview'

interface VisualBuilderProps {
  initialBlocks?: Block[]
  initialPageStyle?: PageStyle
  onSave: (html: string, blocks: Block[], pageStyle: PageStyle, name: string, subject: string, fromEmail: string) => void
  onBack: () => void
  name: string
  subject: string
  fromEmail: string
  initialHtml?: string
}

export function VisualBuilder({ 
  initialBlocks = [], 
  initialPageStyle, 
  onSave, 
  onBack,
  name: initialName,
  subject: initialSubject,
  fromEmail: initialFromEmail,
  initialHtml
}: VisualBuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  // If we have initialBlocks, we use visual mode. 
  // If initialBlocks is empty but we have initialHtml, we start in manual mode.
  const [manualHtml, setManualHtml] = useState<string | null>(
    initialBlocks.length === 0 && initialHtml ? initialHtml : null
  )

  // (postMessage height listener removed — now using ShadowPreview which auto-sizes)

  const [pageStyle, setPageStyle] = useState<PageStyle>(initialPageStyle || {
    backgroundColor: '#f9f9f9',
    contentWidth: '600px',
    padding: '40px',
    fontFamily: 'sans-serif'
  })
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual')
  const [activeMenu, setActiveMenu] = useState<'text' | 'image' | 'components' | 'variables' | null>(null)
  
  const [name, setName] = useState(initialName)
  const [subject, setSubject] = useState(initialSubject)
  const [fromEmail, setFromEmail] = useState(initialFromEmail)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const [variables] = useState([
    { label: 'First name', value: '{{contact.first_name}}' },
    { label: 'Last name', value: '{{contact.last_name}}' },
    { label: 'Email', value: '{{contact.email}}' },
    { label: 'Unsubscribe URL', value: '{{{unsubscribe_url}}}' },
  ])

  // Helper to add block
  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getDefaultContent(type),
      style: getDefaultStyle(type),
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
    setActiveMenu(null)
  }

  const getDefaultContent = (type: BlockType): string => {
    switch(type) {
      case 'title': return 'Seu Título Aqui'
      case 'subtitle': return 'Seu Subtítulo'
      case 'heading': return 'Cabeçalho de Seção'
      case 'text': return 'Comece a digitar seu texto aqui...'
      case 'button': return 'Clique Aqui'
      case 'unsubscribe-footer': return ''
      default: return ''
    }
  }

  const getDefaultStyle = (type: BlockType): any => {
    const base = {
      paddingTop: '10px',
      paddingBottom: '10px',
      paddingLeft: '20px',
      paddingRight: '20px',
    }
    switch(type) {
      case 'title': return { ...base, fontSize: '28px', fontWeight: 'bold', textAlign: 'center' }
      case 'button': return { ...base, backgroundColor: '#000000', color: '#ffffff', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }
      case 'divider': return { ...base, paddingTop: '20px', paddingBottom: '20px', borderColor: '#e5e7eb', borderWidth: '1px', borderStyle: 'solid' }
      default: return base
    }
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return
    const newBlocks = [...blocks]
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]]
    setBlocks(newBlocks)
  }

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const updateBlockStyle = (id: string, styleUpdates: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, style: { ...b.style, ...styleUpdates } } : b))
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const generatedHtml = blocksToHtml(blocks, pageStyle)
  const currentHtml = manualHtml !== null ? manualHtml : generatedHtml

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-canvas text-ink selection:bg-brand/20">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-white/[0.05] rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5 text-ink-muted" />
          </button>
          <div className="flex flex-col">
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-transparent text-[14px] font-semibold focus:outline-none"
              placeholder="Nome do Template"
            />
            <span className="text-[11px] text-ink-faint">Editando agora</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-4 flex items-center rounded-lg border border-line p-0.5 bg-canvas-muted">
            <button 
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${activeTab === 'visual' ? 'bg-surface shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              <Layers className="h-3.5 w-3.5" /> Visual
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${activeTab === 'code' ? 'bg-surface shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              <FileCode className="h-3.5 w-3.5" /> Code
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${activeTab === 'preview' ? 'bg-surface shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
          </div>

          <Button variant="secondary" size="sm">
            <Upload className="mr-2 h-3.5 w-3.5" /> Publicar
          </Button>
          <Button variant="primary" size="sm" onClick={() => onSave(currentHtml, blocks, pageStyle, name, subject, fromEmail)}>
            <Save className="mr-2 h-3.5 w-3.5" /> Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Floating Toolbar Style */}
        <aside className="relative flex w-[72px] flex-col items-center border-r border-line bg-surface py-6">
          <div className="flex flex-col gap-4 rounded-full border border-line bg-canvas-muted p-2 shadow-sm">
            <ToolbarItem 
              icon={<Type className="h-5 w-5" />} 
              active={activeMenu === 'text'} 
              onClick={() => setActiveMenu(activeMenu === 'text' ? null : 'text')}
              title="Texto"
            />
            <ToolbarItem 
              icon={<ImageIcon className="h-5 w-5" />} 
              active={activeMenu === 'image'} 
              onClick={() => setActiveMenu(activeMenu === 'image' ? null : 'image')}
              title="Imagens"
            />
            <ToolbarItem 
              icon={<Square className="h-5 w-5" />} 
              active={activeMenu === 'components'} 
              onClick={() => setActiveMenu(activeMenu === 'components' ? null : 'components')}
              title="Componentes"
            />
            <ToolbarItem 
              icon={<Variable className="h-5 w-5" />} 
              active={activeMenu === 'variables'} 
              onClick={() => setActiveMenu(activeMenu === 'variables' ? null : 'variables')}
              title="Variáveis"
            />
          </div>

          {/* Submenus based on ActiveMenu */}
          {activeMenu && (
            <div className="absolute left-[84px] top-6 z-[70] w-56 animate-in slide-in-from-left-2 rounded-xl border border-line bg-surface p-2 shadow-modal">
              {activeMenu === 'text' && (
                <div className="flex flex-col gap-1">
                  <MenuButton icon={<Type className="h-3.5 w-3.5" />} label="Text" onClick={() => addBlock('text')} />
                  <MenuButton icon={<Heading1 className="h-3.5 w-3.5" />} label="Title" onClick={() => addBlock('title')} />
                  <MenuButton icon={<Heading2 className="h-3.5 w-3.5" />} label="Subtitle" onClick={() => addBlock('subtitle')} />
                  <MenuButton icon={<Heading3 className="h-3.5 w-3.5" />} label="Heading" onClick={() => addBlock('heading')} />
                  <MenuButton icon={<List className="h-3.5 w-3.5" />} label="Bullet List" onClick={() => addBlock('bullet-list')} />
                  <MenuButton icon={<ListOrdered className="h-3.5 w-3.5" />} label="Numbered List" onClick={() => addBlock('numbered-list')} />
                </div>
              )}
              {activeMenu === 'image' && (
                <div className="flex flex-col gap-1">
                  <MenuButton icon={<ImageIcon className="h-3.5 w-3.5" />} label="Image" onClick={() => addBlock('image')} />
                  <MenuButton icon={<Youtube className="h-3.5 w-3.5" />} label="YouTube" onClick={() => addBlock('youtube')} />
                  <MenuButton icon={<Twitter className="h-3.5 w-3.5" />} label="X (Twitter)" onClick={() => addBlock('twitter')} />
                </div>
              )}
              {activeMenu === 'components' && (
                <div className="flex flex-col gap-1 h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  <MenuButton icon={<MousePointer2 className="h-3.5 w-3.5" />} label="Botão" onClick={() => addBlock('button')} />
                  <MenuButton icon={<Minus className="h-3.5 w-3.5" />} label="Divisor" onClick={() => addBlock('divider')} />
                  <MenuButton icon={<Square className="h-3.5 w-3.5" />} label="Section" onClick={() => addBlock('section')} />
                  <MenuButton icon={<Columns className="h-3.5 w-3.5" />} label="2 Columns" onClick={() => addBlock('columns-2')} />
                  <MenuButton icon={<Columns className="h-3.5 w-3.5 rotate-90" />} label="3 Columns" onClick={() => addBlock('columns-3')} />
                  <MenuButton icon={<Columns className="h-3.5 w-3.5" />} label="4 Columns" onClick={() => addBlock('columns-4')} />
                  <MenuButton icon={<Share2 className="h-3.5 w-3.5" />} label="Social Links" onClick={() => addBlock('social-links')} />
                  <MenuButton icon={<ExternalLink className="h-3.5 w-3.5" />} label="Unsubscribe Footer" onClick={() => addBlock('unsubscribe-footer')} />
                  <MenuButton icon={<Code className="h-3.5 w-3.5" />} label="HTML" onClick={() => addBlock('html')} />
                  <MenuButton icon={<FileCode className="h-3.5 w-3.5" />} label="Code" onClick={() => addBlock('code')} />
                </div>
              )}
              {activeMenu === 'variables' && (
                <div className="flex flex-col gap-1">
                  {variables.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[12px] text-ink-faint italic">No variables available.</p>
                  ) : (
                    variables.map(v => (
                       <button key={v.value} 
                         className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
                         onClick={() => {
                           if (selectedBlockId) {
                             const b = blocks.find(x => x.id === selectedBlockId);
                             if (b) updateBlock(selectedBlockId, { content: (b.content || '') + v.value })
                           }
                           setActiveMenu(null)
                         }}
                       >
                         <span className="font-mono">{v.value}</span>
                         <span className="text-[10px] text-ink-faint">{v.label}</span>
                       </button>
                    ))
                  )}
                  <div className="my-1 border-t border-line mx-2" />
                  <MenuButton icon={<PlusCircle className="h-3.5 w-3.5" />} label="Create variable" onClick={() => {}} />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {/* Editor Header - Context Actions */}
          <div className="flex h-10 items-center justify-between border-b border-line bg-surface/50 px-6 backdrop-blur">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">Subject</span>
                 <input value={subject} onChange={e => setSubject(e.target.value)} className="bg-transparent text-[12px] font-medium outline-none" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">From</span>
                 <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="bg-transparent text-[12px] font-medium outline-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 no-scrollbar scroll-smooth">
            {activeTab === 'visual' && (
              <div 
                className="mx-auto min-h-[600px] rounded-xl border border-line bg-white shadow-xl ring-1 ring-black/5"
                style={{ width: pageStyle.contentWidth, padding: pageStyle.padding }}
              >
                {blocks.length === 0 ? (
                  manualHtml !== null ? (
                    <div className="flex flex-col bg-white rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between border-b border-line bg-canvas-muted px-4 py-2">
                        <span className="text-[11px] font-medium text-ink-muted flex items-center gap-2">
                          <FileCode className="h-3.5 w-3.5" /> Template HTML Customizado
                        </span>
                        <button 
                          onClick={() => setManualHtml(null)}
                          className="text-[11px] text-brand hover:underline font-medium"
                        >
                          Usar Construtor Visual
                        </button>
                      </div>
                      <ShadowPreview html={manualHtml} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center py-40 text-ink-muted/30">
                      <Layers className="mb-4 h-12 w-12" strokeWidth={1} />
                      <p className="text-[14px]">Arraste ou clique em um elemento para começar o design</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-0">
                    {blocks.map((block, idx) => (
                      <div 
                        key={block.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                        className={`group relative min-h-[20px] transition-all ${selectedBlockId === block.id ? 'ring-2 ring-brand ring-offset-2' : 'hover:ring-1 hover:ring-brand/30'}`}
                      >
                        {/* Block Actions Toolbar */}
                        {selectedBlockId === block.id && (
                          <div className="absolute -left-12 top-0 flex flex-col gap-1 rounded-lg border border-line bg-surface p-1 shadow-md animate-in slide-in-from-right-1">
                            <button onClick={() => moveBlock(block.id, 'up')} className="p-1.5 hover:bg-white/[0.05] rounded-md text-ink-muted disabled:opacity-20" disabled={idx === 0}><MoveUp className="h-3.5 w-3.5" /></button>
                            <button onClick={() => moveBlock(block.id, 'down')} className="p-1.5 hover:bg-white/[0.05] rounded-md text-ink-muted disabled:opacity-20" disabled={idx === blocks.length-1}><MoveDown className="h-3.5 w-3.5" /></button>
                            <button onClick={() => removeBlock(block.id)} className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-md text-ink-muted"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        
                        <div className="p-1" dangerouslySetInnerHTML={{ __html: renderBlockPreview(block) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'code' && (
              <div className="h-full w-full max-w-4xl mx-auto rounded-xl border border-line bg-canvas p-6 shadow-sm overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">HTML do Template</span>
                      {manualHtml !== null && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand animate-pulse">Editado Manualmente</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {manualHtml !== null && (
                        <button 
                          onClick={() => setManualHtml(null)}
                          className="text-[11px] text-danger hover:underline font-medium"
                        >
                          Descartar alterações e voltar ao Visual
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(currentHtml)
                          // Optional: show toast
                        }}
                        className="text-[11px] text-brand hover:underline font-medium"
                      >
                        Copiar Código
                      </button>
                    </div>
                 </div>
                 <textarea 
                    value={currentHtml}
                    onChange={(e) => setManualHtml(e.target.value)}
                    spellCheck={false}
                    className="flex-1 overflow-auto rounded-lg bg-black/20 p-6 font-mono text-[13px] leading-relaxed text-ink-muted custom-scrollbar outline-none focus:ring-1 focus:ring-brand/30 resize-none border-none"
                 />
                 <div className="mt-4 px-2 text-[11px] text-ink-faint">
                   Pode colar seu próprio HTML aqui. Note que alterações manuais podem não ser refletidas perfeitamente na aba "Visual" caso a estrutura seja muito diferente.
                 </div>
              </div>
            )}

            {activeTab === 'preview' && (
               <div className="flex flex-col items-center pb-20">
                 {/* Preview Toolbar */}
                 <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-full border border-line mb-8">
                   <button 
                     onClick={() => setPreviewMode('desktop')}
                     className={`p-2 rounded-full transition-all ${previewMode === 'desktop' ? 'bg-brand text-white shadow-sm' : 'text-ink-muted hover:text-ink hover:bg-white/5'}`}
                     title="Desktop"
                   >
                     <Monitor className="h-4 w-4" />
                   </button>
                   <button 
                     onClick={() => setPreviewMode('mobile')}
                     className={`p-2 rounded-full transition-all ${previewMode === 'mobile' ? 'bg-brand text-white shadow-sm' : 'text-ink-muted hover:text-ink hover:bg-white/5'}`}
                     title="Mobile"
                   >
                     <Smartphone className="h-4 w-4" />
                   </button>
                 </div>

                 <div 
                   className={`mx-auto w-full transition-all duration-300 rounded-xl border border-line bg-white shadow-2xl ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl'}`}
                 >
                   <ShadowPreview html={currentHtml} />
                 </div>
                </div>
            )}
          </div>
        </main>

        {/* Right Panel - Properties */}
        {activeTab === 'visual' && (
          <aside className="w-80 shrink-0 border-l border-line bg-surface overflow-y-auto no-scrollbar">
            {!selectedBlockId ? (
              <div className="p-6">
                <div className="mb-8 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-brand" />
                  <h3 className="text-[13px] font-bold uppercase tracking-widest">Estilo da Página</h3>
                </div>
                <PageStylePanel style={pageStyle} onChange={setPageStyle} />
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-brand" />
                    <h3 className="text-[13px] font-bold uppercase tracking-widest">Propriedades</h3>
                  </div>
                  <button onClick={() => setSelectedBlockId(null)} className="p-1 hover:bg-white/[0.05] rounded-md"><X className="h-4 w-4 text-ink-faint" /></button>
                </div>
                <p className="mb-6 text-[11px] text-ink-faint italic">{selectedBlock?.type.replace('-', ' ')}</p>
                
                <PropertiesPanel block={selectedBlock!} onChange={(up) => updateBlock(selectedBlock!.id, up)} onStyleChange={(st) => updateBlockStyle(selectedBlock!.id, st)} />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

function ToolbarItem({ icon, active, onClick, title }: { icon: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all ${active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-ink-muted hover:bg-white/[0.05] hover:text-ink'}`}
    >
      {icon}
      {!active && (
        <span className="absolute left-[54px] hidden rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink shadow-sm group-hover:block whitespace-nowrap z-50">
          {title}
        </span>
      )}
    </button>
  )
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left text-[12px] text-ink-muted transition-all hover:bg-white/[0.04] hover:text-ink"
    >
      <span className="flex h-5 w-5 items-center justify-center text-ink-faint">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function PropertiesPanel({ block, onChange, onStyleChange }: { block: Block; onChange: (up: Partial<Block>) => void; onStyleChange: (st: any) => void }) {
  const isText = ['title', 'subtitle', 'heading', 'text', 'button'].includes(block.type)
  
  return (
    <div className="flex flex-col gap-6">
      {/* Content Editor */}
      {(isText || block.type === 'image' || block.type === 'youtube' || block.type === 'twitter') && (
        <div>
           <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Conteúdo</label>
           {block.type === 'text' ? (
             <textarea 
               value={block.content} 
               onChange={e => onChange({ content: e.target.value })} 
               className="input-primary min-h-[100px] w-full py-2 text-[12px]" 
             />
           ) : (
             <input 
               type="text" 
               value={block.content || ''} 
               onChange={e => onChange({ content: e.target.value })} 
               className="input-primary w-full py-2 text-[12px]" 
             />
           )}
        </div>
      )}

      {/* Link Editor */}
      {(block.type === 'button' || block.type === 'image' || block.type === 'youtube' || block.type === 'twitter') && (
        <div>
           <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">URL / Link</label>
           <input 
             type="text" 
             value={block.link || ''} 
             onChange={e => onChange({ link: e.target.value })} 
             placeholder={block.type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
             className="input-primary w-full py-2 text-[12px]" 
           />
        </div>
      )}

      {block.type === 'image' && (
        <div>
           <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Image Source</label>
           <input 
             type="text" 
             value={block.src || ''} 
             onChange={e => onChange({ src: e.target.value })} 
             className="input-primary w-full py-2 text-[12px]" 
           />
        </div>
      )}

      {/* Styling Controls */}
      <div className="border-t border-line pt-6">
        <label className="mb-4 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Design</label>
        
        <div className="grid grid-cols-2 gap-4">
          {isText && (
            <>
              <div>
                <label className="mb-1 block text-[10px] text-ink-faint">Font Size</label>
                <input type="text" value={block.style.fontSize} onChange={e => { const v = e.target.value; onStyleChange({ fontSize: /^\d+$/.test(v) ? v + 'px' : v }) }} className="input-primary w-full py-1.5 text-[11px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-ink-faint">Weight</label>
                <select value={block.style.fontWeight} onChange={e => onStyleChange({ fontWeight: e.target.value })} className="select-primary w-full py-1.5 text-[11px]">
                   <option value="400">Normal</option>
                   <option value="600">Semi-Bold</option>
                   <option value="700">Bold</option>
                   <option value="800">Black</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="mb-1 block text-[10px] text-ink-faint">Text Align</label>
            <div className="flex rounded-md border border-line bg-canvas-muted">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => onStyleChange({ textAlign: a })} className={`flex flex-1 items-center justify-center py-1.5 transition-colors ${block.style.textAlign === a ? 'bg-surface text-brand shadow-sm' : 'text-ink-faint hover:text-ink-muted'}`}>
                  {a === 'left' ? <AlignLeftIcon /> : a === 'center' ? <AlignCenterIcon /> : <AlignRightIcon />}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="mb-1 block text-[10px] text-ink-faint">Text Color</label>
             <div className="flex items-center gap-2">
                <input type="color" value={block.style.color || '#000000'} onChange={e => onStyleChange({ color: e.target.value })} className="h-7 w-12 cursor-pointer border-none bg-transparent" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">{block.style.color || '#000000'}</span>
             </div>
          </div>

          {block.type === 'button' && (
            <div>
              <label className="mb-1 block text-[10px] text-ink-faint">BG Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={block.style.backgroundColor || '#000000'} onChange={e => onStyleChange({ backgroundColor: e.target.value })} className="h-7 w-12 cursor-pointer border-none bg-transparent" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">{block.style.backgroundColor}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[10px] text-ink-faint">Padding Y</label>
            <input type="text" value={block.style.paddingTop} onChange={e => { const v = e.target.value; const val = /^\d+$/.test(v) ? v + 'px' : v; onStyleChange({ paddingTop: val, paddingBottom: val }) }} className="input-primary w-full py-1.5 text-[11px]" />
          </div>
          
          <div>
            <label className="mb-1 block text-[10px] text-ink-faint">Radius</label>
            <input type="text" value={block.style.borderRadius} onChange={e => { const v = e.target.value; onStyleChange({ borderRadius: /^\d+$/.test(v) ? v + 'px' : v }) }} className="input-primary w-full py-1.5 text-[11px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PageStylePanel({ style, onChange }: { style: PageStyle; onChange: (s: PageStyle) => void }) {
  const set = (f: keyof PageStyle) => (val: string) => onChange({ ...style, [f]: val })
  
  return (
    <div className="space-y-6">
       <div>
         <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Cor de Fundo</label>
         <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-2.5">
           <input type="color" value={style.backgroundColor} onChange={e => set('backgroundColor')(e.target.value)} className="h-8 w-12 cursor-pointer rounded border-none bg-transparent" />
           <span className="font-mono text-[12px] text-ink-muted uppercase">{style.backgroundColor}</span>
         </div>
       </div>
       
       <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Largura do Conteúdo</label>
          <select value={style.contentWidth} onChange={e => set('contentWidth')(e.target.value)} className="select-primary w-full py-2.5 text-[12px]">
             <option value="500px">500px (Mobile Friendly)</option>
             <option value="600px">600px (Default)</option>
             <option value="700px">700px (Wide)</option>
             <option value="800px">800px (Max)</option>
          </select>
       </div>

       <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Padding Interno</label>
          <input type="text" value={style.padding} onChange={e => set('padding')(e.target.value)} className="input-primary w-full py-2.5 text-[12px]" />
       </div>

       <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Fonte Principal</label>
          <select value={style.fontFamily} onChange={e => set('fontFamily')(e.target.value)} className="select-primary w-full py-2.5 text-[12px]">
             <option value="sans-serif">Modern Sans-serif</option>
             <option value="serif">Classic Serif</option>
             <option value="monospace">Clean Monospace</option>
          </select>
       </div>
    </div>
  )
}

// Minimal Icons for Align
function AlignLeftIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg> }
function AlignCenterIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg> }
function AlignRightIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg> }

// Renderer for the internal Canvas preview (simplified CSS)
function renderBlockPreview(block: Block): string {
  const s = {
    color: block.style.color || 'inherit',
    textAlign: block.style.textAlign || 'left',
    fontSize: block.style.fontSize || 'inherit',
    fontWeight: block.style.fontWeight || 'normal',
    padding: `${block.style.paddingTop || '0'} ${block.style.paddingRight || '0'} ${block.style.paddingBottom || '0'} ${block.style.paddingLeft || '0'}`,
    borderRadius: block.style.borderRadius || '0',
    backgroundColor: block.style.backgroundColor || 'transparent',
    border: `${block.style.borderWidth || '0'} ${block.style.borderStyle || 'solid'} ${block.style.borderColor || 'transparent'}`,
    width: block.type === 'button' ? 'auto' : '100%',
    display: block.type === 'button' ? 'inline-block' : 'block'
  }
  
  const styleString = Object.entries(s).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';')

  switch (block.type) {
    case 'title': return `<h1 style="${styleString}">${block.content}</h1>`
    case 'subtitle': return `<h2 style="${styleString}">${block.content}</h2>`
    case 'heading': return `<h3 style="${styleString}">${block.content}</h3>`
    case 'text': return `<p style="${styleString}">${block.content}</p>`
    case 'button': return `<span style="${styleString}">${block.content}</span>`
    case 'divider': return `<div style="${styleString};border:none;border-top:1px solid ${block.style.borderColor || '#eee'}"></div>`
    case 'unsubscribe-footer': return `<div style="${styleString};font-size:11px;color:#aaa;text-align:center">Unsubscribe Footer <br/> {{{unsubscribe_url}}}</div>`
    case 'image': return `<div style="${styleString};background:#eee;height:120px;display:flex;align-items:center;justify-center;color:#999;font-size:12px">${block.src ? `<img src="${block.src}" style="max-height:100%"/>` : 'Image Placeholder'}</div>`
    case 'youtube': return `<div style="${styleString};background:#000;color:white;padding:20px;text-align:center;font-size:12px">YouTube Video: ${block.link || '(no link)'}</div>`
    case 'twitter': return `<div style="${styleString};background:#f7f7f7;border:1px solid #ddd;padding:20px;font-size:12px">X (Twitter) Post: ${block.link || '(no link)'}</div>`
    default: return `<div style="${styleString}">${block.content || block.type}</div>`
  }
}
