import { useMemo, useState, useRef, useEffect } from 'react'
import { useChatStore, Conversation } from '../../store/chatStore'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { instancesApi } from '../../services/api'
import LabelManager from './LabelManager'
import QuickMessagesManager from './QuickMessagesManager'
import {
  Search,
  X,
  Pin,
  Archive,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Tag,
  Zap,
  ArrowLeft,
  MessageCircle,
  Check,
  CheckCheck,
  PinOff,
  Inbox,
  Loader2,
  ChevronRight,
  Filter,
  Monitor
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface WhatsAppInstance {
  id: string
  name: string
  phoneNumber?: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  conversation: Conversation | null
}

export default function ConversationSidebar() {
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    conversation: null
  })
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const {
    conversations,
    selectedConversation,
    selectConversation,
    searchQuery,
    setSearchQuery,
    typingUsers,
    isLoading,
    instanceId,
    archiveConversation,
    pinConversation,
  } = useChatStore()

  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [showInstanceSwitcher, setShowInstanceSwitcher] = useState(false)
  const [showLabelsModal, setShowLabelsModal] = useState(false)
  const [showQuickMessagesModal, setShowQuickMessagesModal] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const { user, logout, updateStatus } = useAuthStore()

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await instancesApi.list()
        if (response.success && response.data) {
          setInstances(response.data.instances)
        }
      } catch (error) {
        console.error('Erro ao carregar instâncias:', error)
      }
    }
    fetchInstances()
  }, [])

  const currentInstance = useMemo(() => {
    return instances.find(inst => inst.id === instanceId)
  }, [instances, instanceId])

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(query) ||
        (conv.lastMessage?.content || '').toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  const { pinnedConversations, regularConversations, archivedConversations } = useMemo(() => {
    const pinned = filteredConversations.filter(c => c.isPinned && !c.isArchived)
    const regular = filteredConversations.filter(c => !c.isPinned && !c.isArchived)
    const archived = filteredConversations.filter(c => c.isArchived)
    return { pinnedConversations: pinned, regularConversations: regular, archivedConversations: archived }
  }, [filteredConversations])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, conv: Conversation) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 256),
      y: Math.min(e.clientY, window.innerHeight - 200),
      conversation: conv
    })
  }

  const handleArchive = async () => {
    if (!contextMenu.conversation || !instanceId) return
    await archiveConversation(contextMenu.conversation.id, !contextMenu.conversation.isArchived)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handlePin = async () => {
    if (!contextMenu.conversation || !instanceId) return
    await pinConversation(contextMenu.conversation.id, !contextMenu.conversation.isPinned)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleStatusChange = async (status: string) => {
    await updateStatus(status)
    setShowStatusDropdown(false)
  }

  const getStatusColorClass = (status?: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500'
      case 'away': return 'bg-amber-400'
      case 'break': return 'bg-orange-500'
      case 'lunch': return 'bg-blue-500'
      case 'offline': return 'bg-slate-400'
      default: return 'bg-emerald-500'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'away': return 'Ausente'
      case 'break': return 'Pausa'
      case 'lunch': return 'Almoço'
      case 'offline': return 'Offline'
      default: return 'Disponível'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const msgDate = new Date(date)
    const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return msgDate.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
      return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  const getLastMessagePreview = (conv: Conversation) => {
    if (typingUsers[conv.id]) {
      return <span className="text-emerald-500 font-black animate-pulse text-[11px] uppercase tracking-widest italic">digitando...</span>
    }
    if (!conv.lastMessage) return <span className="text-slate-300 italic text-[13px]">Nenhuma mensagem</span>

    const prefix = conv.lastMessage.isFromMe ? 'Você: ' : ''
    let content = conv.lastMessage.content

    if (conv.lastMessage.type === 'image') content = '📷 Foto'
    if (conv.lastMessage.type === 'video') content = '🎥 Vídeo'
    if (conv.lastMessage.type === 'audio') content = '🎵 Áudio'
    if (conv.lastMessage.type === 'document') content = '📄 Documento'
    if (conv.lastMessage.type === 'sticker') content = '🎭 Sticker'

    return (
      <span className="flex items-center gap-1.5 min-w-0">
        {conv.lastMessage.isFromMe && (
          conv.lastMessage.status.read ? <CheckCheck className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <Check className="w-4 h-4 text-slate-300 flex-shrink-0" />
        )}
        <span className="truncate text-slate-500 font-medium">{prefix + content}</span>
      </span>
    )
  }

  const renderConversationItem = (conv: Conversation) => (
    <div
      key={conv.id}
      className={cn(
        "group relative flex items-center gap-4 px-6 py-5 cursor-pointer transition-all border-b border-slate-50/50",
        selectedConversation?.id === conv.id
          ? "bg-emerald-50/60"
          : "bg-white hover:bg-slate-50/80 active:scale-[0.99]",
      )}
      onClick={() => selectConversation(conv)}
      onContextMenu={(e) => handleContextMenu(e, conv)}
    >
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 transition-transform group-hover:scale-105 duration-300",
          selectedConversation?.id === conv.id ? "border-emerald-200/50" : "border-white shadow-sm"
        )}>
          {conv.profilePicture ? (
            <img src={conv.profilePicture} alt={conv.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              {conv.type === 'group' ? <Monitor className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </div>
          )}
        </div>
        {conv.isPinned && (
          <div className="absolute -top-1.5 -right-1.5 bg-white p-1.5 rounded-xl border border-slate-100 shadow-xl text-emerald-500">
            <Pin className="w-3 h-3 fill-emerald-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn(
            "text-[15px] truncate tracking-tight",
            conv.unreadCount > 0 ? "font-black text-slate-900" : "font-bold text-slate-800"
          )}>{conv.name}</h4>
          {conv.lastMessage && (
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
              conv.unreadCount > 0 ? "text-emerald-500" : "text-slate-400"
            )}>
              {formatTime(conv.lastMessage.timestamp)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 text-[13px]">
            {getLastMessagePreview(conv)}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {conv.labels?.slice(0, 2).map(label => (
              <div key={label.id} className="w-2.5 h-2.5 rounded-full ring-2 ring-white border border-black/5" style={{ backgroundColor: label.color }} title={label.name} />
            ))}
            {conv.unreadCount > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black min-w-[22px] h-5.5 px-2 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in">
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white select-none border-r border-slate-100 relative z-30">

      {/* Sidebar Header Section */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="group flex items-center gap-3 p-1.5 rounded-[22px] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-100",
                  getStatusColorClass(user?.status)
                )} />
              </div>
              <div className="text-left hidden lg:block overflow-hidden pr-2">
                <p className="text-[13px] font-black text-slate-900 leading-none truncate">{user?.name?.split(' ')[0]}</p>
                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{getStatusLabel(user?.status)}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showStatusDropdown && "rotate-180")} />
            </button>

            {showStatusDropdown && (
              <div className="absolute top-[calc(100%+12px)] left-0 w-60 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-100 p-3 z-[100] animate-in zoom-in-95 duration-200 origin-top-left">
                <div className="px-4 py-3 mb-2 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ALTERAR MEU STATUS</p>
                </div>
                {['available', 'away', 'break', 'lunch', 'offline'].map((s) => (
                  <button
                    key={s}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-2xl group",
                      user?.status === s ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    onClick={() => handleStatusChange(s)}
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full group-hover:scale-125 transition-transform", getStatusColorClass(s))} />
                    {getStatusLabel(s)}
                    {user?.status === s && <Check className="w-4 h-4 ml-auto text-emerald-500 stroke-[4]" />}
                  </button>
                ))}
                <div className="my-2 border-t border-slate-50" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all rounded-2xl"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sair do Sistema
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { icon: LayoutDashboard, color: "hover:bg-slate-50 hover:text-slate-900", action: () => navigate('/dashboard'), title: "Dashboard" },
              { icon: Tag, color: "hover:bg-emerald-50 hover:text-emerald-600", action: () => setShowLabelsModal(true), title: "Etiquetas" },
              { icon: Zap, color: "hover:bg-blue-50 hover:text-blue-600", action: () => setShowQuickMessagesModal(true), title: "Atalhos" }
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className={cn("p-3.5 text-slate-400 transition-all rounded-[18px] active:scale-90", btn.color)}
                title={btn.title}
              >
                <btn.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Instance Selector */}
        <div className="relative">
          <button
            onClick={() => setShowInstanceSwitcher(!showInstanceSwitcher)}
            className={cn(
              "w-full flex items-center justify-between p-4 bg-slate-100 rounded-[28px] transition-all border border-slate-200/50 active:scale-[0.98]",
              showInstanceSwitcher && "bg-white border-emerald-500 ring-4 ring-emerald-500/5 shadow-xl"
            )}
          >
            <div className="flex items-center gap-4 min-w-0 pr-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-0.5">DISPOSITIVO</p>
                <p className="text-sm font-black truncate text-slate-900">{currentInstance?.name || 'Selecione...'}</p>
              </div>
            </div>
            <div className={cn(
              "p-2 bg-white rounded-xl text-slate-400 transition-transform duration-300",
              showInstanceSwitcher && "rotate-180 bg-emerald-50 text-emerald-500 shadow-sm"
            )}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {showInstanceSwitcher && (
            <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl border border-slate-100 p-4 z-[100] animate-in slide-in-from-top-4 duration-300">
              <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">SUAS INSTÂNCIAS</p>
                </div>
                {instances.map(inst => (
                  <button
                    key={inst.id}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-[28px] transition-all group",
                      inst.id === instanceId ? "bg-emerald-50 text-emerald-900 border border-emerald-100/50" : "hover:bg-slate-50 text-slate-700 hover:text-slate-950"
                    )}
                    onClick={() => {
                      if (inst.id !== instanceId) navigate(`/chat/${inst.id}`)
                      setShowInstanceSwitcher(false)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                        inst.status === 'connected' ? "bg-emerald-100 text-emerald-600" : "bg-red-50 text-red-500"
                      )}>
                        {inst.status === 'connected' ? <Check className="w-4 h-4 stroke-[4]" /> : <X className="w-4 h-4 stroke-[4]" />}
                      </div>
                      <div>
                        <span className="block text-sm font-black tracking-tight leading-none">{inst.name}</span>
                        <span className={cn(
                          "text-[10px] uppercase font-black tracking-widest mt-1 block opacity-60",
                          inst.status === 'connected' ? "text-emerald-600" : "text-red-500"
                        )}>{inst.status === 'connected' ? 'Ativo' : 'Offline'}</span>
                      </div>
                    </div>
                    {inst.id === instanceId && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-500/10" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="px-6 pb-6">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-slate-300 group-focus-within:text-emerald-500 group-focus-within:shadow-emerald-500/10 transition-all border border-slate-100">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar conversa ou mensagem..."
            className="w-full h-14 pl-16 pr-12 bg-slate-50 border border-transparent rounded-[24px] text-[13px] font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-red-50 rounded-xl transition-all text-slate-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-200">
              <Filter className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Conversations Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8 border border-slate-100/50">
              <Inbox className="w-10 h-10" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Sem resultados</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-[160px]">Nenhuma conversa encontrada para sua busca hoje.</p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Archived Section Access */}
            {archivedConversations.length > 0 && !showArchived && (
              <button
                onClick={() => setShowArchived(true)}
                className="flex items-center gap-5 px-8 py-6 hover:bg-emerald-50/50 transition-all border-b border-slate-50 group active:scale-[0.98]"
              >
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
                  <Archive className="w-5 h-5" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900">Conversas Arquivadas</h4>
                  <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mt-0.5 opacity-60">Visualizar arquivos</p>
                </div>
                <span className="bg-emerald-500 text-white text-[10px] font-black h-6 px-2.5 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  {archivedConversations.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            )}

            {/* List Mode Indicator */}
            {showArchived ? (
              <div className="sticky top-0 z-40 bg-emerald-600 px-8 py-6 flex items-center justify-between shadow-xl shadow-emerald-500/20 backdrop-blur-md">
                <button onClick={() => setShowArchived(false)} className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Voltar</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">ARQUIVOS</span>
                </div>
              </div>
            ) : null}

            {/* Conversation Items Rendering */}
            {showArchived ? (
              <div className="animate-in slide-in-from-left duration-500">
                {archivedConversations.map(renderConversationItem)}
              </div>
            ) : (
              <>
                {pinnedConversations.length > 0 && (
                  <div className="bg-white border-b-4 border-slate-50/50">
                    <div className="px-8 py-4 bg-slate-50/30 flex items-center gap-3">
                      <Pin className="w-3.5 h-3.5 text-slate-300 fill-slate-300" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mt-0.5">Prioritários</span>
                    </div>
                    {pinnedConversations.map(renderConversationItem)}
                  </div>
                )}
                {regularConversations.length > 0 && (
                  <div className="px-8 py-4 flex items-center gap-3">
                    <MessageCircle className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mt-0.5">Recentes</span>
                  </div>
                )}
                <div className="animate-in fade-in slide-in-from-bottom duration-700">
                  {regularConversations.map(renderConversationItem)}
                </div>
              </>
            )}

            {/* Safe Area Padding */}
            <div className="h-20" />
          </div>
        )}
      </div>

      {/* Context Menu (Modern Floating Design) */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] w-64 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-slate-100 p-3 animate-in zoom-in-95 duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-5 py-3 border-b border-slate-50 mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</p>
          </div>
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-emerald-500 hover:text-white transition-all rounded-2xl group"
          >
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-white/20 transition-colors">
              <Archive className="w-4 h-4" />
            </div>
            {contextMenu.conversation?.isArchived ? 'Desarquivar' : 'Arquivar'}
          </button>
          <button
            onClick={handlePin}
            className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-500 hover:text-white transition-all rounded-2xl group"
          >
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-white/20 transition-colors">
              {contextMenu.conversation?.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </div>
            {contextMenu.conversation?.isPinned ? 'Desafixar' : 'Fixar no topo'}
          </button>
          <div className="my-2 border-t border-slate-50" />
          <button
            onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all rounded-2xl group"
          >
            <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
              <X className="w-4 h-4" />
            </div>
            Cancelar
          </button>
        </div>
      )}

      {/* Modals Container */}
      {showLabelsModal && (
        <LabelManager onClose={() => setShowLabelsModal(false)} />
      )}

      {showQuickMessagesModal && (
        <QuickMessagesManager onClose={() => setShowQuickMessagesModal(false)} />
      )}
    </div>
  )
}
