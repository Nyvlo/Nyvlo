import { useState, useEffect, useMemo } from 'react'
import { useChatStore, Conversation } from '../../store/chatStore'
import {
  X,
  Users,
  Image as ImageIcon,
  FileText,
  Search,
  ShieldCheck,
  Share2,
  LogOut,
  Trash2
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface Participant {
  id: string
  whatsappId: string
  name: string
  phoneNumber?: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

interface GroupDetails {
  id: string
  name: string
  profilePicture?: string
  description?: string
  createdAt?: string
  participants: Participant[]
  participantCount: number
  sharedMedia: {
    images: number
    videos: number
    documents: number
  }
}

interface SharedMedia {
  id: string
  type: string
  content: string
  media_url: string
  timestamp: string
  sender_name: string
}

interface GroupInfoProps {
  conversation: Conversation
  onClose: () => void
}

export default function GroupInfo({ conversation, onClose }: GroupInfoProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'docs'>('members')
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [media, setMedia] = useState<SharedMedia[]>([])
  const [docs, setDocs] = useState<SharedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParticipant, setSearchParticipant] = useState('')
  const { instanceId, labels, updateConversationLabels } = useChatStore()

  useEffect(() => {
    loadGroupInfo()
  }, [conversation.id])

  const loadGroupInfo = async () => {
    if (!instanceId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}/groups/${conversation.id}`)
      const data = await response.json()
      if (data.success) {
        setGroup(data.group)
      } else {
        setGroup({
          id: conversation.id,
          name: conversation.name,
          profilePicture: conversation.profilePicture,
          participants: [],
          participantCount: 0,
          sharedMedia: { images: 0, videos: 0, documents: 0 }
        })
      }
    } catch (error) {
      console.error('Erro ao carregar grupo:', error)
      setGroup({
        id: conversation.id,
        name: conversation.name,
        profilePicture: conversation.profilePicture,
        participants: [],
        participantCount: 0,
        sharedMedia: { images: 0, videos: 0, documents: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMedia = async () => {
    if (!instanceId) return
    try {
      const response = await fetch(`/api/instances/${instanceId}/groups/${conversation.id}/media?type=image`)
      const data = await response.json()
      if (data.success) setMedia(data.media || [])
    } catch (error) {
      console.error('Erro ao carregar mídia:', error)
    }
  }

  const loadDocs = async () => {
    if (!instanceId) return
    try {
      const response = await fetch(`/api/instances/${instanceId}/groups/${conversation.id}/media?type=document`)
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

  const filteredParticipants = useMemo(() => {
    return group?.participants.filter(p =>
      p.name?.toLowerCase().includes(searchParticipant.toLowerCase()) ||
      p.phoneNumber?.includes(searchParticipant)
    ) || []
  }, [group?.participants, searchParticipant])

  const handleToggleLabel = async (labelId: string) => {
    const currentLabelIds = conversation.labels.map(l => l.id)
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter(id => id !== labelId)
      : [...currentLabelIds, labelId]
    await updateConversationLabels(conversation.id, newLabelIds)
  }

  if (loading) {
    return (
      <div className="w-96 flex flex-col h-full bg-white border-l border-slate-100 animate-in slide-in-from-right duration-300">
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
          <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Info do grupo</span>
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 flex flex-col h-full bg-white border-l border-slate-100 animate-in slide-in-from-right duration-500 overflow-hidden shadow-2xl z-20">

      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50 flex-shrink-0">
        <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Info do grupo</span>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><Share2 className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Profile Card */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="relative inline-block group">
            <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-white shadow-2xl p-1 group-hover:scale-105 transition-transform duration-500 border border-slate-100">
              {conversation.profilePicture ? (
                <img src={conversation.profilePicture} alt={conversation.name} className="w-full h-full object-cover rounded-[36px]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <Users className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-2xl shadow-lg border-4 border-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="mt-6 text-xl font-black text-slate-900 tracking-tight">{conversation.name}</h2>
          <p className="mt-1 text-xs font-black text-slate-400 uppercase tracking-widest">{group?.participantCount || 0} PARTICIPANTES</p>

          <div className="flex flex-wrap justify-center gap-1.5 mt-6">
            {labels.map(label => {
              const isSelected = conversation.labels.some(l => l.id === label.id)
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggleLabel(label.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                    isSelected ? "bg-white shadow-sm ring-1" : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                  )}
                  style={{ borderColor: isSelected ? label.color : undefined, color: isSelected ? label.color : undefined }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </button>
              )
            })
            }
          </div>
        </div>

        {/* Tabs Manager */}
        <div className="flex p-2 gap-1 bg-slate-50/50 mx-4 mt-6 rounded-2xl border border-slate-100/50">
          {[
            { id: 'members', icon: Users, label: 'Membros' },
            { id: 'media', icon: ImageIcon, label: 'Mídia' },
            { id: 'docs', icon: FileText, label: 'Docs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
                activeTab === tab.id ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 pb-20 space-y-8">
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Pesquisar participantes..."
                  value={searchParticipant}
                  onChange={(e) => setSearchParticipant(e.target.value)}
                  className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all"
                />
              </div>

              <div className="space-y-2">
                {filteredParticipants.map(participant => (
                  <div key={participant.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                        {participant.name?.substring(0, 2).toUpperCase() || 'P'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{participant.name || participant.phoneNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400">+{participant.phoneNumber}</span>
                      </div>
                    </div>
                    {participant.isAdmin && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-emerald-100">Admin</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Group Policy Info */}
              <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold leading-tight uppercase tracking-widest">Segurança de Grupo</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Apenas administradores podem gerenciar participantes e alterar as configurações do grupo. Mensagens são protegidas de ponta a ponta.
                </p>
              </div>

              {/* Danger Actions */}
              <div className="pt-4 space-y-2">
                <button className="w-full p-4 flex items-center justify-between text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors">
                  <span className="text-sm">Sair do Grupo</span>
                  <LogOut className="w-5 h-5" />
                </button>
                <button className="w-full p-4 flex items-center justify-between text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors">
                  <span className="text-sm">Apagar Histórico</span>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-300">
              {media.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-slate-400 text-xs font-bold">NENHUMA MÍDIA ENCONTRADA</div>
              ) : media.map(m => (
                <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 group cursor-pointer relative">
                  <img src={m.media_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/40 backdrop-blur-sm text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {m.sender_name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-2 animate-in fade-in duration-300">
              {docs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest">Vazio</div>
              ) : docs.map(d => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-white transition-all cursor-pointer">
                  <div className="p-2 bg-red-100 text-red-500 rounded-lg"><FileText className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{d.content}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{d.sender_name} • {new Date(d.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
