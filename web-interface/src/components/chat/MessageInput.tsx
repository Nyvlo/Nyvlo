import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useChatStore } from '../../store/chatStore'
import EmojiPicker from './EmojiPicker'
import MediaUpload from './MediaUpload'
import AudioRecorder from './AudioRecorder'
import QuickMessages from './QuickMessages'
import { MediaUploadResult } from '../../services/api'
import {
  Smile,
  Send,
  Mic,
  X,
  Image,
  FileText,
  Camera,
  Lock,
  Paperclip,
  MessageSquare,
  Zap,
  Video
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export default function MessageInput() {
  const [message, setMessage] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const [mediaUpload, setMediaUpload] = useState<{ type: 'image' | 'video' | 'document'; file?: File } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isInternalNote, setIsInternalNote] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    sendMessage,
    sendMediaMessage,
    sendAudioMessage,
    startTyping,
    stopTyping,
    selectedConversation,
    replyTo,
    setReplyTo
  } = useChatStore()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + 'px'
    }
  }, [message])

  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    const handleClickOutside = () => setShowAttachMenu(false)
    if (showAttachMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showAttachMenu])

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length
        input.focus()
      }, 0)
    } else {
      setMessage(prev => prev + emoji)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)
    if (value.startsWith('/')) {
      setShowQuickMessages(true)
      setShowEmojiPicker(false)
      setShowAttachMenu(false)
    } else {
      setShowQuickMessages(false)
    }

    startTyping()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000)
  }

  const handleQuickMessageSelect = (content: string) => {
    setMessage(content)
    setShowQuickMessages(false)
    inputRef.current?.focus()
  }

  const handleSend = () => {
    if (!message.trim() || !selectedConversation) return

    sendMessage(message.trim(), 'text', undefined, replyTo?.id, isInternalNote)
    setMessage('')
    setReplyTo(null)
    setShowQuickMessages(false)
    setIsInternalNote(false)
    stopTyping()

    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (type: 'image' | 'video' | 'document') => {
    const input = document.createElement('input')
    input.type = 'file'
    switch (type) {
      case 'image': input.accept = 'image/*'; break
      case 'video': input.accept = 'video/*'; break
      case 'document': input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'; break
    }
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) setMediaUpload({ type, file: files[0] })
    }
    input.click()
    setShowAttachMenu(false)
  }

  const handleMediaUpload = (media: MediaUploadResult, caption?: string) => {
    if (sendMediaMessage) sendMediaMessage(media, caption)
    setMediaUpload(null)
  }

  const handleVoiceRecord = () => {
    setIsRecording(true)
    setShowEmojiPicker(false)
    setShowAttachMenu(false)
  }

  const handleAudioSend = (mediaId: string, duration: number) => {
    if (sendAudioMessage) sendAudioMessage(mediaId, duration)
    setIsRecording(false)
  }

  if (isRecording) {
    return (
      <AudioRecorder
        onSend={handleAudioSend}
        onCancel={() => setIsRecording(false)}
      />
    )
  }

  return (
    <div className="relative border-t border-slate-100 bg-white/70 backdrop-blur-2xl px-6 lg:px-12 py-8 z-40 lg:py-10">

      {/* Reply Preview (Premium Card) */}
      {replyTo && (
        <div className="absolute bottom-[calc(100%+16px)] left-8 right-8 p-6 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex gap-5 animate-in slide-in-from-bottom-6 duration-500 z-50 overflow-hidden">
          <div className="w-2 h-full absolute left-0 top-0 bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="flex-1 min-w-0 pr-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em]">
                {replyTo.isFromMe ? 'Refinando sua resposta' : `Respondendo a ${replyTo.senderName}`}
              </span>
            </div>
            <p className="text-[13px] font-bold text-slate-500 truncate leading-relaxed">"{replyTo.content}"</p>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 self-center transition-all active:scale-95 group"
            onClick={() => setReplyTo(null)}
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      )}

      {/* Quick Messages Search List */}
      {showQuickMessages && (
        <div className="absolute bottom-[calc(100%+16px)] left-8 right-8 z-50">
          <QuickMessages
            searchQuery={message}
            onSelect={handleQuickMessageSelect}
            onClose={() => setShowQuickMessages(false)}
          />
        </div>
      )}

      {/* Main Input Controls */}
      <div className="max-w-5xl mx-auto flex items-end gap-3 lg:gap-4">
        <div className="flex items-center gap-1.5 mb-1.5 bg-slate-50/80 p-1.5 rounded-[30px] border border-slate-200 shadow-inner">
          <div className="relative">
            <button
              className={cn(
                "w-13 h-13 rounded-[24px] flex items-center justify-center transition-all active:scale-90 group",
                showAttachMenu ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/10" : "text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-lg"
              )}
              onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu) }}
              title="Anexos"
            >
              <Paperclip className={cn("w-6 h-6 transition-all duration-700", showAttachMenu && "rotate-[-45deg] scale-110")} />
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-8 w-72 bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] border border-slate-100 p-4 z-[60] animate-in zoom-in-95 slide-in-from-bottom-6 duration-500">
                <div className="px-6 py-4 border-b border-slate-50 mb-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestão de Mídia</p>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { icon: FileText, label: "Documento", desc: "PDF, DOCX, XLS", color: "bg-blue-50 text-blue-600", action: () => handleFileSelect('document') },
                    { icon: Image, label: "Galeria", desc: "Fotos em alta qualidade", color: "bg-emerald-50 text-emerald-600", action: () => handleFileSelect('image') },
                    { icon: Camera, label: "Câmera", desc: "Capturar agora", color: "bg-purple-50 text-purple-600", action: () => handleFileSelect('video') },
                    { icon: Video, label: "Vídeo", desc: "Mídia dinâmica", color: "bg-rose-50 text-rose-600", action: () => handleFileSelect('video') }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 rounded-[28px] transition-all group active:scale-95"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6", item.color)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className={cn(
                "w-13 h-13 rounded-[24px] flex items-center justify-center transition-all active:scale-90",
                showEmojiPicker ? "text-amber-500 bg-white shadow-xl ring-2 ring-amber-100" : "text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-lg"
              )}
              onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false) }}
              title="Expressão / Emojis"
            >
              <Smile className="w-6 h-6" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-8 z-[60] animate-in zoom-in-95 slide-in-from-bottom-6 duration-500">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>

          <button
            className={cn(
              "w-13 h-13 rounded-[24px] flex items-center justify-center transition-all active:scale-90 group",
              isInternalNote ? "text-amber-600 bg-amber-50 shadow-2xl ring-2 ring-amber-200" : "text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-lg"
            )}
            onClick={() => setIsInternalNote(!isInternalNote)}
            title={isInternalNote ? "Canal Privado" : "Habilitar Nota Interna"}
          >
            <Lock className={cn("w-6 h-6 transition-all duration-500", isInternalNote && "scale-110 rotate-12")} />
          </button>
        </div>

        {/* Input Text Area (Premium Design) */}
        <div className={cn(
          "flex-1 relative rounded-[35px] border transition-all duration-700 shadow-2xl overflow-hidden",
          isInternalNote
            ? "bg-amber-50/50 border-amber-300 ring-8 ring-amber-500/5"
            : "bg-slate-50/50 border-slate-200 focus-within:border-emerald-500/50 focus-within:ring-[15px] focus-within:ring-emerald-500/[0.03] focus-within:bg-white focus-within:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"
        )}>
          {isInternalNote && (
            <div className="absolute top-4 right-6 flex items-center gap-2 opacity-50 select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Criptografado</span>
            </div>
          )}

          <div className="relative pt-1">
            <textarea
              ref={inputRef}
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 text-[16px] font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] py-6 px-8 resize-none leading-relaxed transition-all custom-scrollbar-thin",
                isInternalNote ? "text-amber-900" : "text-slate-800"
              )}
              placeholder={isInternalNote ? "Registrar observação técnica privada..." : "Sua mensagem aqui... (/ para comandos)"}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <div className="absolute bottom-4 right-8 flex items-center gap-4">
              {message.length > 500 && (
                <span className="text-[9px] font-black text-slate-300 uppercase tabular-nums">{message.length}/2000</span>
              )}
              {message.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="mb-1.5 ml-1">
          {message.trim() ? (
            <button
              className="w-15 h-15 bg-emerald-500 text-white rounded-[26px] shadow-2xl shadow-emerald-500/40 hover:bg-emerald-600 hover:-translate-y-1 hover:shadow-emerald-500/50 transition-all duration-500 active:scale-90 flex items-center justify-center group relative overflow-hidden"
              onClick={handleSend}
              title="Transmitir Dados (Enter)"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
            </button>
          ) : (
            <button
              className="w-15 h-15 bg-emerald-500 text-white rounded-[26px] shadow-2xl shadow-emerald-500/40 hover:bg-emerald-600 hover:-translate-y-1 hover:shadow-emerald-500/50 transition-all duration-500 active:scale-90 flex items-center justify-center group relative overflow-hidden"
              onClick={handleVoiceRecord}
              title="Canal de Voz"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Mic className="w-7 h-7 group-hover:scale-125 transition-transform duration-500 stroke-[2.5]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-150 transition-transform">
                <Zap className="w-2 h-2 text-white fill-current" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Media Upload Modal */}
      {mediaUpload && (
        <MediaUpload
          type={mediaUpload.type}
          file={mediaUpload.file}
          onUpload={handleMediaUpload}
          onCancel={() => setMediaUpload(null)}
        />
      )}
    </div>
  )
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
