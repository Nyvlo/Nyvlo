import { useState, useMemo } from 'react'
import { useChatStore, Message } from '../../store/chatStore'
import {
  X,
  Search,
  Send,
  User,
  Users,
  Check,
  Loader2,
  ChevronRight,
  Share2
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface ForwardModalProps {
  message: Message
  onClose: () => void
}

export default function ForwardModal({ message, onClose }: ForwardModalProps) {
  const { conversations, forwardMessage, instanceId } = useChatStore()
  const [selectedConversations, setSelectedConversations] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [forwarding, setForwarding] = useState(false)

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations.filter(c => !c.isArchived)
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      c => !c.isArchived && c.name.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  const toggleConversation = (convId: string) => {
    setSelectedConversations(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    )
  }

  const handleForward = async () => {
    if (selectedConversations.length === 0 || !instanceId) return
    setForwarding(true)
    try {
      await forwardMessage(message.id, selectedConversations)
      onClose()
    } catch (error) {
      console.error('Erro ao encaminhar:', error)
    } finally {
      setForwarding(false)
    }
  }

  const getMessagePreview = () => {
    switch (message.type) {
      case 'image': return '📷 Foto'
      case 'video': return '🎥 Vídeo'
      case 'audio': return '🎵 Áudio'
      case 'document': return '📄 Documento'
      case 'sticker': return '🎭 Sticker'
      default: return message.content.length > 50
        ? message.content.substring(0, 50) + '...'
        : message.content
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">Encaminhar</h3>
              <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Selecione os destinatários</p>
            </div>
          </div>
          <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-900" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-10 py-6">
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <Search className="w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <div className="w-[1px] h-3 bg-slate-200" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar conversas ou grupos..."
              className="w-full h-14 bg-slate-50/50 border border-slate-100 rounded-2xl pl-14 pr-6 text-[15px] font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none shadow-inner"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Preview Bar */}
        <div className="px-10 py-4 bg-emerald-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex-shrink-0">Mensagem:</span>
            <span className="text-xs font-bold text-slate-600 truncate">{getMessagePreview()}</span>
          </div>
          <div className="flex -space-x-2 overflow-hidden px-2">
            {selectedConversations.slice(0, 3).map(id => {
              const conv = conversations.find(c => c.id === id)
              if (!conv) return null
              return (
                <div key={id} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                  {conv.profilePicture ? (
                    <img src={conv.profilePicture} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                </div>
              )
            })}
            {selectedConversations.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center z-10">
                +{selectedConversations.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto text-slate-200 animate-in zoom-in duration-500 shadow-inner">
                <Search className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-900 uppercase tracking-widest">Nenhuma conversa</p>
                <p className="text-xs font-bold text-slate-400">Não encontramos resultados para sua busca.</p>
              </div>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  "p-4 rounded-[28px] cursor-pointer transition-all flex items-center gap-5 group relative overflow-hidden active:scale-[0.98]",
                  selectedConversations.includes(conv.id)
                    ? "bg-emerald-50 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-100"
                    : "hover:bg-slate-50"
                )}
                onClick={() => toggleConversation(conv.id)}
              >
                {selectedConversations.includes(conv.id) && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-full" />
                )}

                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl overflow-hidden transition-all duration-500 shadow-md ring-2 ring-transparent",
                    selectedConversations.includes(conv.id) ? "ring-emerald-500 scale-95" : "group-hover:scale-105"
                  )}>
                    {conv.profilePicture ? (
                      <img src={conv.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        {conv.type === 'group' ? <Users className="w-7 h-7" /> : <User className="w-7 h-7" />}
                      </div>
                    )}
                  </div>
                  {selectedConversations.includes(conv.id) && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-xl border-2 border-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-black text-slate-900 truncate tracking-tight uppercase">{conv.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                      conv.type === 'group' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {conv.type === 'group' ? 'Grupo' : 'Contato'}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[10px] font-bold text-slate-300 truncate">Sincronizado</span>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                  selectedConversations.includes(conv.id)
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-white text-slate-200 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                )}>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className={cn(
          "p-10 bg-white border-t border-slate-50 transition-all duration-500 transform",
          selectedConversations.length > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group">
                <span className="text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform">
                  {selectedConversations.length}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destinatários</span>
                <span className="block text-[11px] font-bold text-slate-900">Confirmados para envio</span>
              </div>
            </div>

            <button
              className={cn(
                "h-16 flex-1 max-w-[280px] bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3 group overflow-hidden relative",
                forwarding && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleForward}
              disabled={forwarding || selectedConversations.length === 0}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {forwarding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>PROCESSANDO...</span>
                </>
              ) : (
                <>
                  <span>ENVIAR AGORA</span>
                  <Send className="w-4 h-4 fill-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
