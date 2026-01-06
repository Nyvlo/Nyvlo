import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import ConversationSidebar from '../components/chat/ConversationSidebar'
import MessageArea from '../components/chat/MessageArea'
import MessageInput from '../components/chat/MessageInput'
import ChatHeader from '../components/chat/ChatHeader'
import ContactInfo from '../components/chat/ContactInfo'
import GroupInfo from '../components/chat/GroupInfo'
import {
  Search,
  X,
  Loader2,
  Layers,
  Rocket,
  ShieldCheck
} from 'lucide-react'
import Logo from '../components/common/Logo'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
} export default function ChatPage() {
  const { instanceId: urlInstanceId } = useParams<{ instanceId: string }>()
  const navigate = useNavigate()
  const {
    setInstanceId,
    selectedConversation,
    isLoading,
    setSearchQuery,
    conversations,
    selectConversation
  } = useChatStore()
  const location = useLocation()
  const { user } = useAuthStore()
  const [showInfo, setShowInfo] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [currentInstanceName, setCurrentInstanceName] = useState('')
  const [noInstancesError, setNoInstancesError] = useState(false)

  useEffect(() => {
    // Se não tiver ID na URL, carregar a primeira instância disponível
    if (!urlInstanceId) {
      const loadDefaultInstance = async () => {
        try {
          const { instancesApi } = await import('../services/api')
          const response = await instancesApi.list()
          if (response.success && response.data) {
            const allInstances = response.data.instances || []

            // Filtra se não for admin
            const allowed = user?.allowedInstances || []
            const validInstances = user?.role === 'admin'
              ? allInstances
              : allInstances.filter((i: any) => allowed.includes(i.id) || allowed.includes('*'))

            if (validInstances.length > 0) {
              navigate(`/chat/${validInstances[0].id}`, { replace: true })
              return
            }
          }
          // Se não encontrou nenhuma instância válida ou falhou
          console.warn('Nenhuma instância disponível para este usuário')
          setNoInstancesError(true)
        } catch (error) {
          console.error('Erro ao buscar instância padrão:', error)
          setNoInstancesError(true)
        }
      }
      loadDefaultInstance()
      return
    }

    const allowed = user?.allowedInstances || []
    if (user?.role !== 'admin' && !allowed.includes(urlInstanceId) && !allowed.includes('*')) {
      setNoInstancesError(true)
      return
    }

    setInstanceId(urlInstanceId)

    const fetchInstanceInfo = async () => {
      try {
        const { instancesApi } = await import('../services/api')
        const response = await instancesApi.get(urlInstanceId)
        if (response.success && response.data) {
          setCurrentInstanceName(response.data.instance.name)
        }
      } catch (err) {
        console.error('Erro ao buscar info da instância', err)
      }
    }
    fetchInstanceInfo()

    // Socket connection is handled by MainLayout

    return () => {
      // Socket cleanup handled globally or by MainLayout
    }
  }, [urlInstanceId, setInstanceId, user, navigate])

  // Handle auto-selection from search query
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const search = params.get('search')
    if (search && conversations.length > 0) {
      setSearchQuery(search)
      // Try to find the conversation and select it
      const match = conversations.find(c =>
        c.phoneNumber?.includes(search) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
      if (match) {
        selectConversation(match)
      }
    }
  }, [location.search, conversations, setSearchQuery, selectConversation])

  const handleBack = () => {
    // Implementar lógica de voltar para mobile se necessário
  }

  if (noInstancesError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8 text-center select-none animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10 ring-1 ring-amber-100">
            <ShieldCheck className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Acesso Restrito</h2>
          <p className="text-slate-500 font-medium max-w-md mb-8 leading-relaxed">
            Seu usuário não possui nenhuma conexão de WhatsApp vinculada.
            <br />
            Solicite ao administrador para atribuir uma instância ao seu perfil.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout hideSidebar={true}>
      <div className="h-full flex overflow-hidden bg-slate-50 animate-in fade-in duration-500">
        <div className="flex h-full w-full max-w-[1800px] mx-auto overflow-hidden shadow-2xl">

          {/* Left Column: Conversation List */}
          <div className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 bg-white">
            <ConversationSidebar />
          </div>

          {/* Middle Column: Chat Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] relative">
            {isLoading && !selectedConversation ? (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">Sincronizando conversas...</p>
              </div>
            ) : !selectedConversation ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
                <div className="relative mb-10 group">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 rounded-full group-hover:opacity-20 transition-opacity" />
                  <div className="relative p-10 bg-slate-50/50 rounded-[48px] border border-slate-100 shadow-sm backdrop-blur-sm">
                    <Logo size={100} />
                  </div>
                </div>

                <div className="max-w-md space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    Nyvlo Omnichannel
                  </h2>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed">
                    {currentInstanceName ? `Conectado à instância ${currentInstanceName}` : 'Selecione uma conversa para iniciar o atendimento.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-2xl">
                  {[
                    { icon: Rocket, label: 'Agilidade', desc: 'Respostas em tempo real', color: 'text-orange-500 bg-orange-50' },
                    { icon: ShieldCheck, label: 'Segurança', desc: 'Dados criptografados', color: 'text-blue-500 bg-blue-50' },
                    { icon: Layers, label: 'Escala', desc: 'Múltiplas conexões', color: 'text-emerald-500 bg-emerald-50' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:shadow-xl hover:border-emerald-500/20 transition-all cursor-default group">
                      <div className={cn("inline-flex p-3 rounded-2xl group-hover:scale-110 transition-transform", item.color)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm tracking-tight">{item.label}</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 flex items-center gap-2 px-12 py-3 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest shadow-xl border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sistema Operacional e Pronto
                </div>
              </div>
            ) : (
              /* Active Chat Area */
              <>
                <ChatHeader
                  onBackClick={handleBack}
                  onInfoClick={() => setShowInfo(!showInfo)}
                  onSearchToggle={() => setShowSearch(!showSearch)}
                  instanceName={currentInstanceName}
                />

                {showSearch && (
                  <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-4 animate-in slide-in-from-top duration-300">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar histórico de conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent border-none text-slate-900 font-medium placeholder:text-slate-300 focus:ring-0 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => { setShowSearch(false); setSearchTerm('') }}
                      className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <MessageArea searchTerm={searchTerm} />
                <MessageInput />
              </>
            )}
          </div>

          {/* Right Column: Info Panel */}
          {selectedConversation && showInfo && (
            <div className="w-80 lg:w-96 flex-shrink-0 border-l border-slate-200 bg-white animate-in slide-in-from-right duration-300">
              {selectedConversation.type === 'group' ? (
                <GroupInfo conversation={selectedConversation} onClose={() => setShowInfo(false)} />
              ) : (
                <ContactInfo conversation={selectedConversation} onClose={() => setShowInfo(false)} />
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
