import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { instancesApi } from '../services/api'
import MainLayout from '../components/layout/MainLayout'
import {
  Plus,
  Smartphone,
  RefreshCw,
  Trash2,
  Power,
  ExternalLink,
  X,
  Loader2,
  QrCode,
  Wifi,
  WifiOff
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
  qrCode?: string
  lastSeen?: string
}

export default function InstancesPage() {
  const [filteredInstances, setFilteredInstances] = useState<WhatsAppInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [creating, setCreating] = useState(false)
  const isPollingRef = useRef(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const fetchInstances = useCallback(async () => {
    try {
      const response = await instancesApi.list()
      if (response.success && response.data) {
        const allInstances = response.data.instances || []

        if (user?.role === 'admin') {
          setFilteredInstances(allInstances)
        } else {
          const allowed = user?.allowedInstances || []
          const filtered = allInstances.filter(inst =>
            allowed.includes(inst.id) || allowed.includes('*')
          )
          setFilteredInstances(filtered)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchInstances()
    const interval = setInterval(() => {
      fetchInstances()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchInstances])

  const handleSelectInstance = (instance: WhatsAppInstance) => {
    if (instance.status === 'connected') {
      navigate(`/chat/${instance.id}`)
    } else {
      handleConnectInstance(instance)
    }
  }

  const handleConnectInstance = async (instance: WhatsAppInstance) => {
    try {
      await instancesApi.connect(instance.id)
      setSelectedInstance(instance)
      setShowQRModal(true)
      pollQRCode(instance.id)
    } catch (error) {
      console.error('Erro ao conectar instância:', error)
    }
  }

  const pollQRCode = async (instanceId: string) => {
    if (isPollingRef.current) return
    isPollingRef.current = true

    const checkQR = async () => {
      if (!isPollingRef.current) return

      try {
        const response = await instancesApi.getQR(instanceId)

        if (response.success && response.data?.qrCode) {
          setSelectedInstance(prev => {
            if (prev?.id === instanceId) {
              return { ...prev, qrCode: response.data!.qrCode }
            }
            return prev
          })
        }

        const statusResponse = await instancesApi.get(instanceId)
        if (statusResponse.success && statusResponse.data?.instance) {
          const inst = statusResponse.data.instance
          if (inst.status === 'connected') {
            isPollingRef.current = false
            setShowQRModal(false)
            fetchInstances()
            return
          }
        }
      } catch (e) {
        console.error('Erro no polling do QR:', e)
      }

      if (isPollingRef.current) {
        setTimeout(checkQR, 2500)
      }
    }
    checkQR()
  }

  const handleCloseQRModal = () => {
    setShowQRModal(false)
    isPollingRef.current = false
    setSelectedInstance(null)
  }

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) return

    setCreating(true)
    try {
      const response = await instancesApi.create(newInstanceName.trim())
      if (response.success) {
        setShowCreateModal(false)
        setNewInstanceName('')
        fetchInstances()
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteInstance = async (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await instancesApi.delete(instanceId)
      if (response.success) {
        fetchInstances()
      }
    } catch (error) {
      console.error('Erro ao excluir instância:', error)
    }
  }

  const handleDisconnect = async (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Deseja realmente desconectar esta instância?')) return

    try {
      await instancesApi.disconnect(instanceId)
      fetchInstances()
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Instâncias <span className="text-emerald-600">WhatsApp</span>
            </h2>
            <p className="text-slate-500 font-medium">Gerencie suas conexões e status em tempo real</p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Nova Instância
            </button>
          )}
        </div>

        {/* Instances Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Carregando instâncias...</p>
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center text-center space-y-6">
            <div className="p-6 bg-slate-50 rounded-full">
              <Smartphone className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Nenhuma instância ativa</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Conecte o WhatsApp para começar a disparar suas automações.</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-emerald-600 font-bold hover:underline"
              >
                Criar minha primeira instância →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInstances.map((instance) => (
              <div
                key={instance.id}
                onClick={() => handleSelectInstance(instance)}
                className={cn(
                  "group relative bg-white border border-slate-200 rounded-[32px] p-7 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all cursor-pointer overflow-hidden",
                  instance.status === 'connected' && "hover:translate-y-[-4px]"
                )}
              >
                {/* Background Decor */}
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-0 group-hover:opacity-5 transition-opacity",
                  instance.status === 'connected' ? "bg-emerald-500" : "bg-slate-500"
                )} />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-4 rounded-2xl relative",
                      instance.status === 'connected' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      <Smartphone className="w-8 h-8" />
                      {instance.status === 'connected' && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                        {instance.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5 tracking-wide">
                        ID: {instance.id.split('_').pop()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Status</span>
                    <div className={cn(
                      "flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest",
                      instance.status === 'connected' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {instance.status === 'connected' ? (
                        <> <Wifi className="w-3 h-3" /> Conectado</>
                      ) : (
                        <> <WifiOff className="w-3 h-3" /> Offline</>
                      )}
                    </div>
                  </div>

                  {instance.phoneNumber && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Número</span>
                      <span className="text-slate-900 font-bold">{instance.phoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    {instance.status === 'connected' ? (
                      <span className="text-emerald-600 text-sm font-black flex items-center gap-1.5">
                        Gerenciar Chat <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm font-black flex items-center gap-1.5">
                        Conectar Agora <RefreshCw className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {instance.status === 'connected' && (
                      <button
                        onClick={(e) => handleDisconnect(instance.id, e)}
                        className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                        title="Desconectar"
                      >
                        <Power className="w-5 h-5" />
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => handleDeleteInstance(instance.id, e)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir Instância"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QR Code Modal (Glassmorphism) */}
        {showQRModal && selectedInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/20 animate-in fade-in duration-300">
            <div
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 pb-4 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900">Vincular Dispositivo</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedInstance.name}</p>
                </div>
                <button onClick={handleCloseQRModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 text-center">
                <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] border border-slate-100 relative group">
                  {selectedInstance.qrCode ? (
                    <>
                      <div className="bg-white p-4 rounded-3xl shadow-xl border border-emerald-500/20 relative">
                        <img
                          src={selectedInstance.qrCode.startsWith('data:')
                            ? selectedInstance.qrCode
                            : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedInstance.qrCode)}`}
                          alt="QR Code"
                          className="w-56 h-56 rounded-xl"
                        />
                        <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg ring-4 ring-white">
                          <QrCode className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="mt-8 space-y-2 animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin-slow" />
                          Aguardando leitura...
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                      <p className="text-slate-400 font-bold">Gerando sessão segura...</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">1</div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">Abra o WhatsApp no seu celular</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">2</div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">Toque em <b>Configurações</b> e selecione <b>Dispositivos Conectados</b></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">3</div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">Toque em <b>Conectar um dispositivo</b> e aponte para a tela</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4">
                <button
                  onClick={() => pollQRCode(selectedInstance.id)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Instance Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/20 animate-in fade-in duration-300">
            <div
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 pb-4">
                <h3 className="text-2xl font-black text-slate-900">Nova Instância</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Dê um nome para esta conexão</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={e => setNewInstanceName(e.target.value)}
                    placeholder="Ex: Comercial WhatsApp"
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all uppercase tracking-tight"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCreateInstance}
                    disabled={!newInstanceName.trim() || creating}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center disabled:opacity-50 active:scale-95"
                  >
                    {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Criar Conexão"}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full h-14 text-slate-400 font-bold hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
