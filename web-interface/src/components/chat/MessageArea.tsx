import { useEffect, useRef, useState, useMemo } from 'react'
import { useChatStore, Message } from '../../store/chatStore'
import ForwardModal from './ForwardModal'
import {
  Check,
  CheckCheck,
  Star,
  Forward,
  Reply,
  Copy,
  Download,
  FileText,
  Play,
  ExternalLink,
  MessageSquare,
  Clock,
  Wand2,
  ShieldCheck,
  Share2,
  Trash2,
  Bookmark
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface MessageContextMenu {
  visible: boolean
  x: number
  y: number
  message: Message | null
}

interface MessageAreaProps {
  searchTerm?: string
}

export default function MessageArea({ searchTerm }: MessageAreaProps) {
  const { selectedConversation, messages, setReplyTo, toggleStarMessage } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<MessageContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    message: null
  })
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const conversationMessages = useMemo(() => {
    const allMessages = selectedConversation ? messages[selectedConversation.id] || [] : []
    if (!searchTerm) return allMessages
    const searchLower = searchTerm.toLowerCase()
    return allMessages.filter((m: Message) =>
      m.content?.toLowerCase().includes(searchLower)
    )
  }, [selectedConversation, messages, searchTerm])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages.length])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 280),
      y: Math.min(e.clientY, window.innerHeight - 400),
      message
    })
  }

  const handleForward = () => {
    if (contextMenu.message) setForwardMessage(contextMenu.message)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleCopyText = () => {
    if (contextMenu.message?.content) {
      navigator.clipboard.writeText(contextMenu.message.content)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleReply = () => {
    if (contextMenu.message) setReplyTo(contextMenu.message)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleStar = () => {
    if (contextMenu.message) {
      toggleStarMessage(contextMenu.message.id, !contextMenu.message.isStarred)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const msgDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (msgDate.toDateString() === today.toDateString()) return 'Hoje'
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Ontem'
    return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true
    return new Date(currentMsg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString()
  }

  const renderMessageStatus = (message: Message) => {
    if (!message.isFromMe) return null
    if (message.status.read) return <CheckCheck className="w-3.5 h-3.5 text-blue-500 drop-shadow-sm" />
    if (message.status.delivered) return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
    return <Check className="w-3.5 h-3.5 text-slate-400" />
  }

  const getMessageMediaUrl = (message: Message) => {
    if (message.mediaUrl) return message.mediaUrl;

    // If no mediaUrl, try the tunnel (Bridge Mode)
    if (message.whatsappMessageId && message.whatsappChatId) {
      const instId = message.instanceId || (selectedConversation as any)?.instanceId;
      if (instId) {
        return `/api/media/tunnel/${instId}/${message.whatsappChatId}/${message.whatsappMessageId}`;
      }
    }
    return '';
  }

  const renderMessageContent = (message: Message, isFromMe: boolean) => {
    const mediaUrl = getMessageMediaUrl(message);
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-4">
            <div className="relative group overflow-hidden rounded-[32px] border border-black/5 bg-slate-100 shadow-xl transition-all hover:scale-[1.02]">
              <img src={mediaUrl} alt="" loading="lazy" className="max-w-full h-auto object-cover group-hover:scale-110 transition-transform duration-1000 min-h-[120px]" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[4px]">
                <button className="w-16 h-16 bg-white/20 backdrop-blur-2xl rounded-[24px] text-white hover:bg-white/40 active:scale-90 transition-all shadow-2xl flex items-center justify-center border border-white/20">
                  <ExternalLink className="w-7 h-7" />
                </button>
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[9px] font-black text-white uppercase tracking-widest">HQ Visual</div>
            </div>
            {message.content && <p className="text-[15px] font-bold text-inherit leading-relaxed px-2 mt-4">{message.content}</p>}
          </div>
        )
      case 'video':
        return (
          <div className="space-y-4">
            <div className="rounded-[32px] overflow-hidden border border-black/10 bg-black shadow-2xl relative group">
              <video src={mediaUrl} controls className="w-full max-h-[450px]" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/10" />
            </div>
            {message.content && <p className="text-[15px] font-bold text-inherit leading-relaxed px-2 mt-4">{message.content}</p>}
          </div>
        )
      case 'audio':
        return (
          <div className="flex items-center gap-5 py-2 pr-6 min-w-[280px]">
            <button className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 group/play",
              isFromMe ? "bg-white text-slate-900" : "bg-emerald-500 text-white"
            )}>
              <Play className="w-6 h-6 fill-current ml-1 group-hover/play:scale-110 transition-transform" />
            </button>
            <div className="flex-1 space-y-3">
              <div className="flex gap-1 items-end h-8">
                {[20, 14, 28, 18, 22, 12, 32, 16, 26, 20, 30, 14, 24, 18, 16, 28, 12, 22, 24, 14].map((h, i) => (
                  <div key={i} className={cn("w-1.5 rounded-full transition-all hover:scale-x-150", isFromMe ? "bg-white/30" : "bg-emerald-500/20")} style={{ height: `${h}px` }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isFromMe ? "text-white/60" : "text-slate-400")}>00:42 PM</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isFromMe ? "bg-white/40" : "bg-emerald-500/40")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isFromMe ? "text-white/40" : "text-emerald-500/50")}>Audio Stream</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'document':
        return (
          <div className={cn(
            "flex items-center gap-5 p-5 rounded-[28px] border-2 transition-all hover:shadow-2xl active:scale-[0.98] group/doc",
            isFromMe ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:border-emerald-500/20"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-[22px] flex items-center justify-center flex-shrink-0 shadow-2xl transition-all group-hover/doc:rotate-3",
              isFromMe ? "bg-white text-slate-900" : "bg-red-500 text-white"
            )}>
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className={cn("text-[15px] font-black truncate leading-tight mb-1.5", isFromMe ? "text-white" : "text-slate-900")}>
                {message.content || 'Relatório de Operação'}
              </p>
              <div className="flex items-center gap-2">
                <div className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest", isFromMe ? "bg-white/10 text-white/60" : "bg-slate-200 text-slate-500")}>
                  {message.fileName?.split('.').pop() || 'PDF'}
                </div>
                <span className={cn("text-[10px] font-bold", isFromMe ? "text-white/40" : "text-slate-400")}>
                  {(message.fileSize ? (message.fileSize / 1024 / 1024).toFixed(1) : '2.4')} MB
                </span>
              </div>
            </div>
            <button className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", isFromMe ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-slate-900 shadow-xl hover:-translate-y-1")}>
              <Download className="w-5 h-5" />
            </button>
          </div>
        )
      case 'sticker':
        return <img src={mediaUrl} alt="sticker" className="w-48 h-48 object-contain animate-in zoom-in duration-700" />
      default:
        return <p className="text-[16px] font-bold leading-relaxed whitespace-pre-wrap tracking-tight">{message.content}</p>
    }
  }

  const findReplyMessage = (replyToId?: string) => {
    if (!replyToId) return null
    return conversationMessages.find(m => m.id === replyToId)
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-24 py-12 bg-slate-50/30 relative scroll-smooth custom-scrollbar-thin" ref={containerRef}>
      <div className="max-w-5xl mx-auto space-y-3">
        {conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-40 pb-20 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-[45px] shadow-2xl shadow-slate-200 flex items-center justify-center text-emerald-500 relative z-10 transition-transform hover:scale-110 duration-700">
                <MessageSquare className="w-12 h-12" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-[20px] flex items-center justify-center text-white shadow-xl animate-bounce">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="absolute inset-0 bg-emerald-500/10 rounded-[45px] translate-x-3 translate-y-3 -z-10" />
            </div>
            <div className="space-y-3 max-w-sm">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Ambiente de Transmissão</h3>
              <p className="text-slate-400 text-[13px] font-bold uppercase tracking-widest leading-relaxed">Pronto para iniciar uma jornada estratégica com seu contato?</p>
            </div>
            <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-emerald-500/10 border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Conexão Segura 256-bit
            </div>
          </div>
        ) : (
          conversationMessages.map((message: Message, index: number) => {
            const prevMessage = conversationMessages[index - 1]
            const showDate = shouldShowDateSeparator(message, prevMessage)
            const replyMessage = findReplyMessage(message.replyTo)
            const isNote = (message as any).isInternal
            const isFromMe = message.isFromMe

            return (
              <div key={message.id} className="group/msg">
                {showDate && (
                  <div className="flex justify-center my-16 animate-in fade-in slide-in-from-top-6 duration-1000">
                    <div className="flex items-center gap-6">
                      <div className="h-px w-12 bg-slate-200" />
                      <span className="px-8 py-3 bg-white shadow-xl shadow-slate-900/[0.02] rounded-full text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase border border-slate-100">
                        {formatDate(message.timestamp)}
                      </span>
                      <div className="h-px w-12 bg-slate-200" />
                    </div>
                  </div>
                )}

                <div className={cn(
                  "flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 mb-2 relative",
                  isFromMe ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "relative max-w-[88%] lg:max-w-[80%] px-7 py-5 shadow-2xl group transition-all duration-500",
                    isFromMe
                      ? "bg-white text-slate-900 rounded-[35px] rounded-tr-lg hover:shadow-slate-300/40 border border-slate-200"
                      : (isNote
                        ? "bg-amber-50/80 rounded-[35px] rounded-tl-lg border border-amber-200/50 shadow-amber-500/10"
                        : "bg-white text-slate-900 rounded-[35px] rounded-tl-lg border border-slate-100/70 shadow-slate-900/[0.04]"),
                    isNote && "ring-8 ring-amber-500/[0.03]"
                  )}
                    onContextMenu={(e) => handleContextMenu(e, message)}
                  >

                    {/* Quick Reaction Sidebar on Hover */}
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col gap-2 scale-75 group-hover:scale-100",
                      isFromMe ? "-left-16" : "-right-16"
                    )}>
                      <button onClick={() => setReplyTo(message)} className="w-11 h-11 flex items-center justify-center bg-white shadow-2xl rounded-2xl text-slate-400 hover:text-emerald-500 transition-all active:scale-95 border border-slate-50">
                        <Reply className="w-5 h-5" />
                      </button>
                      <button className="w-11 h-11 flex items-center justify-center bg-white shadow-2xl rounded-2xl text-slate-400 hover:text-blue-500 transition-all active:scale-95 border border-slate-50">
                        <Forward className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Header: Sender/Note Info */}
                    {(isNote || (!isFromMe && selectedConversation?.type === 'group')) && (
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", isNote ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em]",
                            isNote ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {isNote ? 'Ambiente Privado' : message.senderName}
                          </span>
                        </div>
                        {isNote && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 opacity-60" />}
                      </div>
                    )}

                    {/* Forwarded Badge */}
                    {message.isForwarded && (
                      <div className="flex items-center gap-2 mb-4 opacity-40 px-1 border-l-2 border-inherit pl-3">
                        <Forward className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Transmissão Direcionada</span>
                      </div>
                    )}

                    {/* Premium Reply Context */}
                    {replyMessage && (
                      <div className={cn(
                        "mb-5 p-5 rounded-[24px] border-l-[8px] text-[14px] flex flex-col gap-2 transition-all shadow-inner relative overflow-hidden",
                        isFromMe
                          ? "bg-white/[0.07] border-white/20"
                          : "bg-slate-50 border-emerald-500/30"
                      )}>
                        <div className="flex items-center justify-between font-black uppercase tracking-[0.15em] text-[9px] opacity-50 mb-1">
                          <div className="flex items-center gap-2">
                            <Reply className="w-3 h-3" />
                            <span>{replyMessage.isFromMe ? 'Origem Própria' : replyMessage.senderName}</span>
                          </div>
                          <span>{formatTime(replyMessage.timestamp)}</span>
                        </div>
                        <span className="font-bold opacity-80 line-clamp-2 leading-relaxed italic pr-4">
                          {replyMessage.content || 'Nível de Mídia não renderizável no preview'}
                        </span>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-current opacity-5" />
                      </div>
                    )}

                    <div className="min-w-[100px]">
                      {renderMessageContent(message, isFromMe)}
                    </div>

                    {/* Meta Footer */}
                    <div className={cn(
                      "flex items-center justify-end gap-3 mt-4 px-1",
                      isFromMe ? "text-white/40" : "text-slate-400"
                    )}>
                      {message.isStarred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />}
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] tabular-nums">{formatTime(message.timestamp)}</span>
                      {renderMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} className="h-12" />
      </div>

      {/* Modern Context Menu */}
      {contextMenu.visible && contextMenu.message && (
        <div
          ref={contextMenuRef}
          className="fixed z-[150] w-72 bg-white/98 backdrop-blur-3xl rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-200 p-4 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 mb-3">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operações</p>
            <Clock className="w-4 h-4 text-white/20" />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { icon: Reply, label: "Responder", action: handleReply, color: "hover:bg-emerald-500/20 text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Forward, label: "Encaminhar", action: handleForward, color: "hover:bg-blue-500/20 text-blue-400", bg: "bg-blue-500/10" },
              { icon: Bookmark, label: contextMenu.message.isStarred ? 'Remover Lab' : 'Adicionar Lab', action: handleStar, color: "hover:bg-amber-500/20 text-amber-400", bg: "bg-amber-500/10", active: contextMenu.message.isStarred },
              { icon: Copy, label: "Copiar Dados", action: handleCopyText, color: "hover:bg-white/10 text-white/90", bg: "bg-white/5" },
              { icon: Share2, label: "Compartilhar", action: () => { }, color: "hover:bg-purple-500/20 text-purple-400", bg: "bg-purple-500/10" }
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-5 px-6 py-4.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-[24px] group",
                  item.color
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", item.bg)}>
                  <item.icon className={cn("w-5 h-5", item.active && "fill-current")} />
                </div>
                {item.label}
              </button>
            ))}
          </div>
          <div className="my-3 border-t border-white/5" />
          <button
            onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            className="w-full h-14 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-[24px]"
          >
            <Trash2 className="w-4 h-4" />
            Cancelar Passo
          </button>
        </div>
      )}

      {/* Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
        />
      )}
    </div>
  )
}
