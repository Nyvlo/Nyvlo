import { useState, useEffect, useMemo } from 'react'
import { useChatStore } from '../../store/chatStore'
import { Zap, Command } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export interface QuickMessage {
  id: string
  shortcut: string
  title: string
  content: string
  variables: string[]
}

interface QuickMessagesProps {
  searchQuery: string
  onSelect: (content: string) => void
  onClose: () => void
}

export default function QuickMessages({ searchQuery, onSelect, onClose }: QuickMessagesProps) {
  const { quickMessages, selectedConversation } = useChatStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return quickMessages
    const query = searchQuery.toLowerCase().replace('/', '')
    return quickMessages.filter(
      msg => msg.shortcut.toLowerCase().includes(query) ||
        msg.title.toLowerCase().includes(query)
    )
  }, [quickMessages, searchQuery])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredMessages])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredMessages.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filteredMessages.length > 0) {
        e.preventDefault()
        handleSelect(filteredMessages[selectedIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredMessages, selectedIndex, onClose])

  const handleSelect = (msg: QuickMessage) => {
    let content = msg.content

    // Replace variables with actual values
    if (selectedConversation) {
      content = content.replace(/\{nome\}/gi, selectedConversation.name)
      content = content.replace(/\{numero\}/gi, selectedConversation.phoneNumber || '')
    }

    // Replace date/time variables
    const now = new Date()
    content = content.replace(/\{data\}/gi, now.toLocaleDateString('pt-BR'))
    content = content.replace(/\{hora\}/gi, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

    onSelect(content)
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[24px] shadow-2xl border border-slate-100 p-8 text-center animate-in slide-in-from-bottom-2 duration-300">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-600">Nenhuma mensagem rápida</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tente outro atalho</p>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full left-0 mb-4 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 z-50">
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Mensagens Rápidas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Command className="w-3 h-3" />
            <span>NAVIGAÇÃO</span>
          </div>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto scrollbar-hide py-2">
        {filteredMessages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              "group px-6 py-4 cursor-pointer transition-all flex items-start gap-4",
              index === selectedIndex ? "bg-emerald-50" : "hover:bg-slate-50"
            )}
            onClick={() => handleSelect(msg)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={cn(
              "flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-colors mt-0.5",
              index === selectedIndex ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-500 group-hover:bg-white"
            )}>
              /{msg.shortcut}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "text-[13px] font-bold truncate transition-colors",
                  index === selectedIndex ? "text-emerald-900" : "text-slate-900"
                )}>{msg.title}</span>
              </div>
              <p className={cn(
                "text-[12px] font-medium line-clamp-2 leading-relaxed transition-colors",
                index === selectedIndex ? "text-emerald-700/70" : "text-slate-400"
              )}>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 italic">Pressione ENTER para inserir</span>
        <span className="text-[9px] font-black text-slate-300 uppercase">{filteredMessages.length} RESULTADOS</span>
      </div>
    </div>
  )
}
