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
  Paperclip
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
    <div className="relative border-t border-slate-100 bg-[#F0F2F5]/40 backdrop-blur-xl px-4 py-3 z-40">

      {/* Reply Preview */}
      {replyTo && (
        <div className="absolute bottom-full left-0 right-0 p-3 bg-white border-t border-slate-100 flex gap-3 animate-in slide-in-from-bottom-2 duration-300 z-50">
          <div className="w-1.5 rounded-full bg-[#00A884]" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#00A884] mb-0.5">
              {replyTo.isFromMe ? 'Você' : replyTo.senderName}
            </p>
            <p className="text-[13px] text-[#667781] truncate">{replyTo.content}</p>
          </div>
          <button
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 self-center transition-all"
            onClick={() => setReplyTo(null)}
          >
            <X className="w-5 h-5" />
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
      <div className="max-w-6xl mx-auto flex items-end gap-2">
        <div className="flex items-center h-11">
          <div className="relative">
            <button
              className={cn(
                "p-2 rounded-full transition-all text-[#667781] hover:bg-slate-200/50",
                showAttachMenu && "text-[#00A884] bg-slate-200/50"
              )}
              onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu) }}
              title="Anexos"
            >
              <Paperclip className={cn("w-6 h-6 transition-all", showAttachMenu && "rotate-[-45deg]")} />
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-4 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[60] animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-1">
                  {[
                    { icon: FileText, label: "Documento", color: "text-blue-500", action: () => handleFileSelect('document') },
                    { icon: Image, label: "Fotos e Vídeos", color: "text-emerald-500", action: () => handleFileSelect('image') },
                    { icon: Camera, label: "Câmera", color: "text-purple-500", action: () => handleFileSelect('video') }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <item.icon className={cn("w-5 h-5", item.color)} />
                      <span className="text-[14px] font-medium text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className={cn(
                "p-2 rounded-full transition-all text-[#667781] hover:bg-slate-200/50",
                showEmojiPicker && "text-[#00A884] bg-slate-200/50"
              )}
              onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false) }}
              title="Emojis"
            >
              <Smile className="w-6 h-6" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-4 z-[60] animate-in zoom-in-95 duration-200">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>

          <button
            className={cn(
              "p-2 rounded-full transition-all",
              isInternalNote ? "text-amber-600 bg-amber-50" : "text-[#667781] hover:bg-slate-200/50"
            )}
            onClick={() => setIsInternalNote(!isInternalNote)}
            title="Nota Interna"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>

        {/* Input Text Area */}
        <div className={cn(
          "flex-1 relative rounded-xl border transition-all duration-200 overflow-hidden",
          isInternalNote
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-transparent focus-within:ring-1 focus-within:ring-slate-100"
        )}>
          <textarea
            ref={inputRef}
            className={cn(
              "w-full bg-transparent border-none focus:ring-0 text-[15px] font-normal text-[#111B21] placeholder:text-[#667781] py-3 px-4 resize-none leading-normal custom-scrollbar-thin",
              isInternalNote ? "text-amber-900" : "text-[#111B21]"
            )}
            placeholder={isInternalNote ? "Registrar nota interna..." : "Mensagem"}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        <div className="h-11 flex items-center">
          {message.trim() ? (
            <button
              className="w-11 h-11 bg-[#00A884] text-white rounded-full flex items-center justify-center transition-all active:scale-90"
              onClick={handleSend}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              className="w-11 h-11 bg-[#00A884] text-white rounded-full flex items-center justify-center transition-all active:scale-90"
              onClick={handleVoiceRecord}
            >
              <Mic className="w-5 h-5" />
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
