import { useState, useEffect, useMemo } from 'react'
import { useChatStore, Conversation } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import ContactCRM from './ContactCRM'
import AgentAssignment from './AgentAssignment'
import {
  X,
  User,
  Info,
  Star,
  Image as ImageIcon,
  FileText,
  Plus,
  Check,
  Trash2,
  Share2,
  ShieldAlert,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface ContactDetails {
  id: string
  name: string
  pushName?: string
  phoneNumber?: string
  profilePicture?: string
  status?: string
  isBusiness?: boolean
  notes?: string
  sharedMedia: {
    images: number
    videos: number
    documents: number
    audios: number
  }
}

interface SharedMedia {
  id: string
  type: string
  content: string
  media_url: string
  timestamp: string
}

interface ContactInfoProps {
  conversation: Conversation
  onClose: () => void
}

export default function ContactInfo({ conversation, onClose }: ContactInfoProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'starred' | 'media' | 'docs'>('info')
  const [contact, setContact] = useState<ContactDetails | null>(null)
  const [media, setMedia] = useState<SharedMedia[]>([])
  const [docs, setDocs] = useState<SharedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const { instanceId, labels, updateConversationLabels, messages } = useChatStore()

  const starredMessages = useMemo(() => {
    const convMessages = messages[conversation.id] || []
    return convMessages.filter(m => m.isStarred)
  }, [messages, conversation.id])

  useEffect(() => {
    loadContactInfo()
  }, [conversation.id])

  const loadContactInfo = async () => {
    if (!instanceId) return
    setLoading(true)
    try {
      setContact({
        id: conversation.id,
        name: conversation.name,
        profilePicture: conversation.profilePicture,
        phoneNumber: conversation.id.replace('@s.whatsapp.net', ''),
        sharedMedia: { images: 0, videos: 0, documents: 0, audios: 0 }
      })
      setNotes('')
    } catch (error) {
      console.error('Erro ao carregar contato:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMedia = async () => {
    if (!instanceId) return
    try {
      const response = await fetch(`/api/instances/${instanceId}/contacts/${conversation.id}/media?type=image`)
      const data = await response.json()
      if (data.success) setMedia(data.media || [])
    } catch (error) {
      console.error('Erro ao carregar mídia:', error)
    }
  }

  const loadDocs = async () => {
    if (!instanceId) return
    try {
      const response = await fetch(`/api/instances/${instanceId}/contacts/${conversation.id}/media?type=document`)
      const data = await response.json()
      if (data.success) setDocs(data.media || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'media' && media.length === 0) loadMedia()
    else if (activeTab === 'docs' && docs.length === 0) loadDocs()
  }, [activeTab])

  const handleSaveNotes = async () => {
    if (!instanceId) return
    try {
      await fetch(`/api/instances/${instanceId}/contacts/${conversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      setEditingNotes(false)
    } catch (error) {
      console.error('Erro ao salvar notas:', error)
    }
  }

  const handleToggleLabel = async (labelId: string) => {
    const currentLabelIds = conversation.labels.map(l => l.id)
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter(id => id !== labelId)
      : [...currentLabelIds, labelId]
    await updateConversationLabels(conversation.id, newLabelIds)
  }

  if (loading) {
    return (
      <div className="w-[420px] flex flex-col h-full bg-white border-l border-slate-100 animate-in slide-in-from-right duration-500 shadow-2xl z-20">
        <div className="h-24 flex items-center justify-between px-10 border-b border-slate-50">
          <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Info do Contato</span>
          <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all" onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-3xl border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[420px] flex flex-col h-full bg-white border-l border-slate-100 animate-in slide-in-from-right duration-700 overflow-hidden shadow-2xl z-30">

      {/* Header */}
      <div className="h-24 flex items-center justify-between px-10 border-b border-slate-50 flex-shrink-0 bg-white/80 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Detalhes</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"><Share2 className="w-5 h-5" /></button>
          <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Profile Card */}
        <div className="p-10 text-center relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-50 to-white/0 -z-10" />

          <div className="relative inline-block">
            <div className="w-40 h-40 rounded-[48px] overflow-hidden bg-white shadow-2xl p-1.5 ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-700 group-hover:rotate-1">
              {conversation.profilePicture ? (
                <img src={conversation.profilePicture} alt={conversation.name} className="w-full h-full object-cover rounded-[44px]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                  <User className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/30 border-4 border-white flex items-center justify-center animate-in zoom-in duration-500 delay-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-8 space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{conversation.name}</h2>
            {contact?.phoneNumber && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-xs font-bold text-slate-400">+{contact.phoneNumber}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 mt-8">
            <button className="flex flex-col items-center gap-2 group/btn">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:bg-indigo-50 group-hover/btn:text-indigo-500 transition-all active:scale-95 shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-indigo-500 transition-colors">Ligar</span>
            </button>
            <button className="flex flex-col items-center gap-2 group/btn">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:bg-emerald-50 group-hover/btn:text-emerald-500 transition-all active:scale-95 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-emerald-500 transition-colors">Chat</span>
            </button>
            <button className="flex flex-col items-center gap-2 group/btn">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:bg-amber-50 group-hover/btn:text-amber-500 transition-all active:scale-95 shadow-sm">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-amber-500 transition-colors">Favorito</span>
            </button>
          </div>
        </div>

        {/* Tabs Manager */}
        <div className="px-6 pb-2">
          <div className="flex p-1.5 gap-1bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/[0.02]">
            {[
              { id: 'info', icon: Info, label: 'Geral' },
              { id: 'starred', icon: Star, label: 'Itens' },
              { id: 'media', icon: ImageIcon, label: 'Mídia' },
              { id: 'docs', icon: FileText, label: 'Docs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-300 group",
                  activeTab === tab.id
                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                <tab.icon className={cn("w-4 h-4 transition-transform group-active:scale-90", activeTab === tab.id ? "scale-110" : "")} />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 pb-24 space-y-10">
          {activeTab === 'info' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Observações Internas</h3>
                  </div>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="px-3 py-1 bg-slate-50 hover:bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Editar
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 focus-within:bg-white focus-within:ring-8 ring-emerald-500/5 transition-all shadow-inner">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-32 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 resize-none placeholder:text-slate-300"
                      placeholder="Anote detalhes importantes aqui..."
                    />
                    <div className="flex justify-end gap-3 pt-4">
                      <button onClick={() => setEditingNotes(false)} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white rounded-xl transition-all">Cancelar</button>
                      <button onClick={handleSaveNotes} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingNotes(true)}
                    className="p-8 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 text-sm font-bold text-slate-400 cursor-pointer hover:bg-white hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all min-h-[80px] group/notes"
                  >
                    <p className="leading-relaxed group-hover/notes:text-slate-600 transition-colors">
                      {notes || 'Toque para adicionar uma anotação estratégica sobre este cliente...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Labels Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Star className="w-3.5 h-3.5 text-emerald-500" />
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Segmentações</h3>
                </div>
                <div className="flex flex-wrap gap-2.5 px-1">
                  {labels.map(label => {
                    const isSelected = conversation.labels.some(l => l.id === label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => handleToggleLabel(label.id)}
                        className={cn(
                          "px-5 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95",
                          isSelected
                            ? "bg-white shadow-xl shadow-slate-900/[0.03] ring-1 ring-slate-100"
                            : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        )}
                        style={{
                          borderColor: isSelected ? `${label.color}40` : undefined,
                          color: isSelected ? label.color : undefined
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shadow-inner ring-2 ring-white" style={{ backgroundColor: label.color }} />
                        {label.name}
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[4]" />}
                      </button>
                    )
                  })
                  }
                  <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-300 flex items-center justify-center hover:text-emerald-500 hover:border-emerald-500 transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Admin Assignment */}
              {instanceId && useAuthStore.getState().user?.role === 'admin' && (
                <div className="bg-white rounded-[40px] p-2 shadow-xl border border-slate-200 relative overflow-hidden group/assignment">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />
                  <div className="p-8">
                    <AgentAssignment
                      conversationId={conversation.id}
                      instanceId={instanceId}
                      currentAgentId={(conversation as any).assignedAgentId}
                    />
                  </div>
                </div>
              )}

              {/* CRM Integration */}
              <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                <ContactCRM
                  conversationId={conversation.id}
                  instanceId={instanceId!}
                  contactName={conversation.name}
                  contactPhone={contact?.phoneNumber}
                />
              </div>

              {/* Danger Zone */}
              <div className="pt-6 space-y-3 px-2">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Ações Críticas</h3>
                </div>
                <button className="w-full h-16 px-6 flex items-center justify-between text-red-500 font-black uppercase tracking-widest text-[11px] bg-red-50/50 hover:bg-red-50 rounded-[20px] transition-all group active:scale-[0.98]">
                  <span className="group-hover:translate-x-1 transition-transform">Bloquear Contato</span>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </button>
                <button className="w-full h-16 px-6 flex items-center justify-between text-slate-400 font-black uppercase tracking-widest text-[11px] bg-slate-50/50 hover:bg-slate-100 hover:text-slate-600 rounded-[20px] transition-all group active:scale-[0.98]">
                  <span className="group-hover:translate-x-1 transition-transform">Apagar Histórico</span>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Trash2 className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'starred' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-10 duration-500 h-full">
              {starredMessages.length === 0 ? (
                <div className="text-center py-32 space-y-8 bg-slate-50/50 rounded-[48px] border border-dashed border-slate-100">
                  <div className="w-24 h-24 bg-white rounded-[32px] inline-flex items-center justify-center text-slate-200 shadow-inner group transition-transform duration-500 hover:scale-110">
                    <Star className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Sem favoritos</p>
                    <p className="text-xs font-bold text-slate-400">Mensagens marcadas com estrela aparecerão aqui.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {starredMessages.map(m => (
                    <div key={m.id} className="p-6 bg-white rounded-[32px] border border-slate-100 hover:border-amber-200 transition-all hover:shadow-xl hover:shadow-amber-500/5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", m.isFromMe ? "bg-emerald-500" : "bg-indigo-500")} />
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{m.isFromMe ? 'Você' : m.senderName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <p className="text-[13px] font-medium text-slate-600 leading-relaxed pr-8">{m.content}</p>
                      <Star className="absolute top-6 right-6 w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fotos & Vídeos Recentes</h3>
                <button className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest hover:underline">Ver tudo</button>
              </div>

              {media.length === 0 ? (
                <div className="text-center py-32 bg-slate-50 rounded-[48px] border border-dashed border-slate-100">
                  <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma mídia</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {media.map(m => (
                    <div key={m.id} className="aspect-square rounded-[24px] overflow-hidden bg-slate-50 group cursor-pointer relative shadow-sm ring-1 ring-slate-100">
                      <img src={m.media_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Documentos de Fluxo</h3>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{docs.length} ARQUIVOS</span>
              </div>

              {docs.length === 0 ? (
                <div className="text-center py-32 bg-slate-50 rounded-[48px] border border-dashed border-slate-100">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sem documentos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map(d => (
                    <div key={d.id} className="p-5 bg-white rounded-[28px] border border-slate-100 flex items-center gap-5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group">
                      <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-105">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight">{d.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(d.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-200 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
