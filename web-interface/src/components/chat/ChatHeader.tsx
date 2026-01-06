import { useChatStore } from '../../store/chatStore'
import {
  Search,
  Info,
  MoreVertical,
  ChevronLeft,
  Zap,
  Users,
  Monitor,
  ShieldCheck,
  Star
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface ChatHeaderProps {
  onBackClick?: () => void
  onInfoClick?: () => void
  onQuickMessagesClick?: () => void
  onSearchToggle?: () => void
  instanceName?: string
}

export default function ChatHeader({ onBackClick, onInfoClick, onQuickMessagesClick, onSearchToggle, instanceName }: ChatHeaderProps) {
  const { selectedConversation, typingUsers } = useChatStore()

  if (!selectedConversation) return null

  const isTyping = typingUsers[selectedConversation.id]

  return (
    <div className="h-28 flex items-center justify-between px-10 bg-white/70 backdrop-blur-3xl border-b border-slate-200/50 z-40 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-8">
        {onBackClick && (
          <button className="lg:hidden w-12 h-12 flex items-center justify-center -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-[20px] transition-all active:scale-90 group" onClick={onBackClick}>
            <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        <div
          className="flex items-center gap-6 cursor-pointer group"
          onClick={onInfoClick}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-[28px] overflow-hidden bg-slate-100 ring-2 ring-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-emerald-500/10">
              {selectedConversation.profilePicture ? (
                <img src={selectedConversation.profilePicture} alt={selectedConversation.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  {selectedConversation.type === 'group' ? <Users className="w-7 h-7" /> : <Monitor className="w-7 h-7" />}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[4px] border-white shadow-lg animate-in zoom-in-50 duration-700" title="Online" />
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center gap-3">
              <h3 className="text-[19px] font-black text-slate-900 leading-none tracking-tighter">
                {selectedConversation.name}
              </h3>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <Star className="w-3 h-3 text-amber-400 fill-current" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isTyping ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] italic animate-pulse">Transmitindo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-slate-100 rounded-md">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      {instanceName ? instanceName : 'CONEXÃO ATIVA'}
                    </span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] opacity-80">
                    Detalhes do Cliente
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-2">
        <div className="hidden xl:flex items-center gap-2 mr-4">
          {selectedConversation.labels && selectedConversation.labels.length > 0 && (
            <div className="flex -space-x-2">
              {selectedConversation.labels.slice(0, 3).map(label => (
                <div
                  key={label.id}
                  className="w-10 h-10 rounded-[14px] ring-[4px] ring-white shadow-xl flex items-center justify-center text-[10px] font-black text-white uppercase group/tag cursor-help transition-all hover:z-10 hover:-translate-y-1"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                >
                  {label.name.charAt(0)}
                </div>
              ))}
              {selectedConversation.labels.length > 3 && (
                <div className="w-10 h-10 rounded-[14px] ring-[4px] ring-white bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                  +{selectedConversation.labels.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center bg-slate-50/50 p-2 rounded-[28px] border border-slate-100/50 shadow-inner">
          {[
            { icon: Zap, color: "text-slate-400 hover:text-blue-600 hover:bg-white", action: onQuickMessagesClick, title: "Inteligência / Atalhos" },
            { icon: Search, color: "text-slate-400 hover:text-slate-900 hover:bg-white", action: onSearchToggle, title: "Explorar Mensagens" },
            { icon: Info, color: "text-slate-400 hover:text-emerald-600 hover:bg-white", action: onInfoClick, title: "Perfil Estratégico" }
          ].map((btn, i) => (
            <button
              key={i}
              className={cn("w-12 h-12 flex items-center justify-center transition-all rounded-[20px] active:scale-95 group shadow-sm hover:shadow-xl", btn.color)}
              title={btn.title}
              onClick={btn.action}
            >
              <btn.icon className="w-5.5 h-5.5 group-hover:scale-110 transition-transform duration-300" />
            </button>
          ))}
        </div>

        <div className="w-px h-10 bg-slate-200/60 mx-4" />

        <button className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all rounded-[24px] bg-slate-50/30 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-2xl active:scale-95 group" title="Configurações Avançadas">
          <MoreVertical className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  )
}
