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
  Wand2,
  ShieldCheck,
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
            <div className="relative group overflow-hidden rounded-[20px] border border-black/5 bg-slate-100 shadow-sm transition-all hover:scale-[1.01]">
              <img src={mediaUrl} alt="" loading="lazy" className="max-w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 min-h-[120px]" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 active:scale-90 transition-all shadow-xl flex items-center justify-center border border-white/20">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
            {message.content && <p className="text-[15px] font-medium text-inherit leading-relaxed px-1 mt-2">{message.content}</p>}
          </div>
        )
      case 'video':
        return (
          <div className="space-y-4">
            <div className="rounded-[20px] overflow-hidden border border-black/5 bg-black shadow-lg relative group">
              <video src={mediaUrl} controls className="w-full max-h-[450px]" />
            </div>
            {message.content && <p className="text-[15px] font-medium text-inherit leading-relaxed px-1 mt-2">{message.content}</p>}
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
            "flex items-center gap-4 p-4 rounded-[18px] border transition-all active:scale-[0.98] group/doc",
            isFromMe ? "bg-black/5 border-transparent" : "bg-slate-50 border-slate-100"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all",
              isFromMe ? "bg-white text-slate-900" : "bg-red-500 text-white"
            )}>
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className={cn("text-[14px] font-semibold truncate leading-tight mb-1", isFromMe ? "text-slate-900" : "text-slate-900")}>
                {message.fileName || 'Arquivo'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500">
                  {message.fileName?.split('.').pop()?.toUpperCase() || 'DOCUMENTO'} • {(message.fileSize ? (message.fileSize / 1024 / 1024).toFixed(1) : '2.4')} MB
                </span>
              </div>
            </div>
            <button className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm", isFromMe ? "bg-white text-slate-900 hover:bg-slate-50" : "bg-white text-slate-900 shadow-md hover:bg-slate-50")}>
              <Download className="w-4 h-4" />
            </button>
          </div>
        )
      case 'sticker':
        return <img src={mediaUrl} alt="sticker" className="w-48 h-48 object-contain animate-in zoom-in duration-700" />
      default:
        return <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap tracking-tight">{message.content}</p>
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
                  "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1 relative",
                  isFromMe ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "relative max-w-[85%] lg:max-w-[70%] px-4 py-2.5 shadow-sm group transition-all duration-300",
                    isFromMe
                      ? "bg-[#D9FDD3] text-[#111B21] rounded-[18px] rounded-tr-none border border-[#CBD9C7]/30"
                      : (isNote
                        ? "bg-amber-50 rounded-[18px] rounded-tl-none border border-amber-200/50"
                        : "bg-white text-[#111B21] rounded-[18px] rounded-tl-none border border-slate-200/50 shadow-sm")
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
                      "flex items-center justify-end gap-1.5 mt-1 opacity-70",
                      isFromMe ? "text-[#667781]" : "text-[#667781]"
                    )}>
                      {message.isStarred && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
                      <span className="text-[11px] font-normal tabular-nums">{formatTime(message.timestamp)}</span>
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
          className="fixed z-[150] w-60 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="flex flex-col">
            {[
              { icon: Reply, label: "Responder", action: handleReply },
              { icon: Forward, label: "Encaminhar", action: handleForward },
              { icon: Bookmark, label: contextMenu.message.isStarred ? 'Remover Lab' : 'Adicionar Lab', action: handleStar },
              { icon: Copy, label: "Copiar Texto", action: handleCopyText }
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full h-11 flex items-center gap-3 px-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-all rounded-xl"
              >
                <item.icon className="w-4 h-4 text-slate-400" />
                {item.label}
              </button>
            ))}
            <div className="my-1.5 h-px bg-slate-100" />
            <button
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              className="w-full h-11 flex items-center gap-3 px-3 text-[14px] font-medium text-[#EA0038] hover:bg-red-50 transition-all rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
              Cancelar
            </button>
          </div>
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
