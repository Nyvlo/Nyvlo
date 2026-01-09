import { useChatStore } from '../../store/chatStore'
import {
  Search,
  MoreVertical,
  ChevronLeft,
  Users,
  Monitor,
  Power
} from 'lucide-react'


interface ChatHeaderProps {
  onBackClick?: () => void
  onInfoClick?: () => void
  onQuickMessagesClick?: () => void
  onSearchToggle?: () => void
  instanceName?: string
}

export default function ChatHeader({ onBackClick, onInfoClick, onSearchToggle, instanceName }: ChatHeaderProps) {
  const { selectedConversation, typingUsers, closeConversation } = useChatStore()

  if (!selectedConversation) return null

  const isTyping = typingUsers[selectedConversation.id]

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-200 z-40 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3">
        {onBackClick && (
          <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all" onClick={onBackClick}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onInfoClick}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 transition-all duration-300 group-hover:scale-105">
              {selectedConversation.profilePicture ? (
                <img src={selectedConversation.profilePicture} alt={selectedConversation.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-[#DFE5E7]">
                  {selectedConversation.type === 'group' ? <Users className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-[#111B21] leading-tight truncate max-w-[200px] lg:max-w-md">
                {selectedConversation.name}
              </h3>
            </div>

            <div className="flex items-center h-4">
              {isTyping ? (
                <span className="text-[13px] text-[#00A884] font-normal">digitando...</span>
              ) : (
                <span className="text-[13px] text-[#667781] font-normal truncate">
                  {instanceName || 'Online'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-2">
        <div className="hidden xl:flex items-center gap-2 mr-4">
          {selectedConversation.labels && selectedConversation.labels.length > 0 && (
            <div className="flex -space-x-1.5">
              {selectedConversation.labels.slice(0, 2).map(label => (
                <div
                  key={label.id}
                  className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center text-[8px] font-bold text-white uppercase"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                >
                  {label.name.charAt(0)}
                </div>
              ))}
              {selectedConversation.labels.length > 2 && (
                <div className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  +{selectedConversation.labels.length - 2}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {[
            { icon: Search, action: onSearchToggle, title: "Pesquisar" },
            { icon: MoreVertical, action: onInfoClick, title: "Mais opções" }
          ].map((btn, i) => (
            <button
              key={i}
              className="p-2 text-[#667781] hover:bg-slate-100 rounded-full transition-all"
              title={btn.title}
              onClick={btn.action}
            >
              <btn.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <button
          onClick={() => {
            if (confirm('Tem certeza que deseja encerrar este atendimento?')) {
              closeConversation(selectedConversation.id)
            }
          }}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
          title="Encerrar"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
