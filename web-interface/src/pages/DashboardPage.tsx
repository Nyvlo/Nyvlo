import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLabels } from '../hooks/useLabels'
import { api } from '../services/api'
import MainLayout from '../components/layout/MainLayout'
import {
  MessageSquare,
  Users,
  LineChart,
  Bot,
  Calendar,
  Calendar as CalendarIcon,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Package,
  CreditCard,
  Building2,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Activity,
  History,
  ShieldCheck,
  Send,
  UserCheck,
  Download,
  Brain,
  DollarSign,
  BarChart,
  Target,
  Star,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface DashboardMetrics {
  messagesReceived: number
  messagesProcessed: number
  activeChats: number
  waitingChats: number
}

interface FinancialMetrics {
  mrr: number
  activeClients: number
  trialClients: number
  projectedRevenue: number
  averageTicket: number
  growthRate?: number
}

const weeklyDataStub = [
  { day: 'Seg', val: 65 },
  { day: 'Ter', val: 80 },
  { day: 'Qua', val: 45 },
  { day: 'Qui', val: 90 },
  { day: 'Sex', val: 75 },
  { day: 'Sáb', val: 30 },
  { day: 'Dom', val: 20 },
]

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [operationalStats, setOperationalStats] = useState<any>(null)
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'operational' | 'financial' | 'evaluation'>('operational')
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [moduleStatus, setModuleStatus] = useState<any>({ ai_evaluation: false })
  const [isTogglingModule, setIsTogglingModule] = useState(false)

  // States for Dash Detail Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailConfig, setDetailConfig] = useState<{ title: string, type: string, color: string } | null>(null)
  const [detailData, setDetailData] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const { user } = useAuthStore()
  const labels = useLabels()
  const navigate = useNavigate()
  const [todayDate, setTodayDate] = useState('')

  const fetchModuleStatus = async () => {
    try {
      const response = await api.get<any>('/api/settings/modules');
      if (response.success && response.data) {
        setModuleStatus(response.data.modules || { ai_evaluation: false });
      }
    } catch (error) {
      console.error('Error fetching module status:', error);
    }
  }

  const fetchEvaluations = async () => {
    try {
      const response = await api.get<any>('/api/dashboard/service-evaluations');
      if (response.success && response.data) {
        setEvaluations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  }

  const fetchOperationalStats = async () => {
    try {
      const response = await api.get<any>('/api/dashboard/operational-stats');
      if (response.success && response.data) {
        setOperationalStats(response.data);
        if (response.data.metrics) {
          setMetrics(prev => ({
            messagesReceived: prev?.messagesReceived || 142,
            messagesProcessed: prev?.messagesProcessed || 98,
            activeChats: response.data.metrics.activeConversations,
            waitingChats: prev?.waitingChats || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching operational stats:', error);
    }
  }

  useEffect(() => {
    console.log('[DEBUG] DashboardPage mounted');
    const now = new Date()
    setTodayDate(now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))

    const fetchOperationalMetrics = async () => {
      try {
        const response = await api.get<any>('/api/metrics')
        if (response.success && response.data) {
          setMetrics({
            messagesReceived: response.data.messagesReceived || 142,
            messagesProcessed: response.data.messagesProcessed || 98,
            activeChats: response.data.activeChats || 8,
            waitingChats: response.data.waitingChats || 3
          })
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false)
      }
    }

    const fetchUsage = async () => {
      try {
        const response = await api.get<any>('/api/tenants/me/usage');
        if (response.success && response.data) {
          setUsage(response.data.usage);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    }

    fetchOperationalMetrics()
    fetchUsage()
    fetchOperationalStats()
    fetchModuleStatus()
    fetchEvaluations()

    const interval = setInterval(fetchOperationalStats, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (viewMode === 'financial' && !financialMetrics) {
      const fetchFinancial = async () => {
        try {
          const res = await api.get<any>('/api/finance/overview')
          if (res.success && res.data && res.data.data) {
            setFinancialMetrics(res.data.data)
          } else if (res.success && res.data) {
            setFinancialMetrics(res.data)
          }
        } catch (e) {
          console.error("Error fetching financial data", e)
        }
      }
      fetchFinancial()
    }
    if (viewMode === 'evaluation') {
      fetchEvaluations()
      fetchModuleStatus()
    }
  }, [viewMode])

  const handleToggleModule = async () => {
    setIsTogglingModule(true)
    try {
      const response = await api.post<any>('/api/settings/modules/toggle', {
        module: 'ai_evaluation',
        enabled: !moduleStatus.ai_evaluation
      })
      if (response.success && response.data) {
        setModuleStatus({ ai_evaluation: !!response.data.enabled })
      }
    } catch (error) {
      console.error('Error toggling module:', error)
      alert('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setIsTogglingModule(false)
    }
  }

  const handleOpenDetail = async (title: string, type: string, color: string) => {
    setDetailConfig({ title, type, color })
    setIsDetailModalOpen(true)
    setLoadingDetail(true)
    setDetailData([])

    try {
      const response = await api.get<any>(`/api/dashboard/detail/${type}`)
      if (response.success && response.data) {
        setDetailData(response.data.data || response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, colorClass, subText, active, onClick }: any) => (
    <div
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
        onClick && "cursor-pointer active:scale-95",
        active && "ring-2 ring-emerald-500 shadow-emerald-100"
      )}>
      <div className={cn("absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform", colorClass)} />

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-3xl font-black text-slate-900">
            {loading && value === undefined ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg" /> : (value ?? 0)}
          </h3>
        </div>
        <div className={cn("p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform", colorClass.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600'))}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 relative z-10 text-xs font-bold transition-all">
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
        <span className="text-slate-400">{subText || 'vs. período anterior'}</span>
      </div>
    </div>
  )

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-8 space-y-10">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Olá, {user?.name?.split(' ')[0] || 'Gestor'}! 👋
            </h2>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {todayDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-[20px]">
            <button
              onClick={() => setViewMode('operational')}
              className={cn(
                "px-6 py-2.5 rounded-[14px] text-sm font-black transition-all",
                viewMode === 'operational' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Operacional
            </button>
            <button
              onClick={() => setViewMode('financial')}
              className={cn(
                "px-6 py-2.5 rounded-[14px] text-sm font-black transition-all",
                viewMode === 'financial' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Financeiro
            </button>
            <button
              onClick={() => setViewMode('evaluation')}
              className={cn(
                "px-6 py-2.5 rounded-[14px] text-sm font-black transition-all flex items-center gap-2",
                viewMode === 'evaluation' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Brain size={16} />
              Auditoria IA
            </button>
          </div>
        </div>

        {viewMode === 'operational' && (
          <div className="space-y-10">
            {usage && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 tracking-tight">Status do Plano</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Controle de Recursos</p>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div>
                        <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tighter">
                          <span className="text-slate-500">Instâncias</span>
                          <span className="text-slate-800">{usage.instances.current} / {usage.instances.limit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-500", (usage.instances.current / usage.instances.limit) > 0.8 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (usage.instances.current / usage.instances.limit) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tighter">
                          <span className="text-slate-500">Agentes</span>
                          <span className="text-slate-800">{usage.agents.current} / {usage.agents.limit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-500", (usage.agents.current / usage.agents.limit) > 0.8 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (usage.agents.current / usage.agents.limit) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        {usage.expiresAt && <p className="text-[10px] font-bold text-slate-400">Expira em {new Date(usage.expiresAt).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <StatCard
                title={labels.dash_stat_messages || "Mensagens Recebidas"}
                value={metrics?.messagesReceived}
                icon={MessageSquare}
                trend="+12%"
                colorClass="bg-blue-500"
                onClick={() => handleOpenDetail('Mensagens Recebidas', 'messages-received', 'blue')}
              />
              <StatCard
                title={labels.dash_stat_automation || "Automação Ativa"}
                value={metrics?.messagesProcessed}
                icon={Bot}
                trend="+84%"
                colorClass="bg-emerald-500"
                onClick={() => handleOpenDetail('Automação IA', 'automation-active', 'emerald')}
              />
              <StatCard
                title={labels.dash_stat_active || "Em Atendimento"}
                value={metrics?.activeChats}
                icon={Users}
                trend="+5%"
                colorClass="bg-indigo-500"
                onClick={() => handleOpenDetail('Em Atendimento', 'active-chats', 'indigo')}
              />
              <StatCard
                title={labels.dash_stat_waiting || "Fila de Espera"}
                value={metrics?.waitingChats}
                icon={Clock}
                trend={metrics?.waitingChats === 0 ? "Ideal" : undefined}
                colorClass={metrics?.waitingChats && metrics.waitingChats > 5 ? "bg-red-500" : "bg-orange-500"}
                onClick={() => handleOpenDetail('Fila de Espera', 'waiting-chats', 'orange')}
              />
              <StatCard
                title="Funcionários Online"
                value={operationalStats?.metrics?.activeAgents}
                icon={Smartphone}
                colorClass="bg-emerald-600"
                subText="Disponíveis agora"
                onClick={() => handleOpenDetail('Funcionários Online', 'online-agents', 'emerald')}
              />
              <StatCard
                title="Ativos na Última Hora"
                value={operationalStats?.metrics?.lastHourConversations}
                icon={TrendingUp}
                colorClass="bg-violet-500"
                subText="Novas interações"
                onClick={() => handleOpenDetail('Interações Última Hora', 'last-hour-chats', 'violet')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Volume Semanal</h3>
                <div className="flex items-end justify-between h-64 gap-2 px-4">
                  {weeklyDataStub.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="w-full relative flex flex-col justify-end h-full">
                        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-slate-50 rounded-t-xl" />
                        <div className={cn("relative w-full rounded-t-xl transition-all duration-700 ease-out", i === 6 ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-emerald-200 group-hover:bg-emerald-300")} style={{ height: `${d.val}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-50 rounded-[32px] p-8 shadow-xl border border-emerald-100 flex flex-col justify-center">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-900">Acesso Rápido</h3>
                <div className="space-y-4">
                  <button onClick={() => navigate('/instances')} className="w-full flex items-center gap-4 p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all text-left shadow-sm group">
                    <div className="p-3 bg-emerald-500 rounded-xl text-white group-hover:scale-110 transition-transform"><Smartphone size={24} /></div>
                    <div><h4 className="font-bold text-sm text-slate-900">Conectar WhatsApp</h4><p className="text-xs text-slate-500">Gestão de instâncias</p></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Monitoramento de Atendimento</h3>
              {operationalStats?.services?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-tighter">
                        <th className="px-6 py-4 rounded-l-2xl">Status</th>
                        <th className="px-6 py-4">Agente</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Início</th>
                        <th className="px-6 py-4 rounded-r-2xl">Última msg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {operationalStats.services.map((service: any) => (
                        <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4"><div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg w-fit text-[10px] font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Ativo</div></td>
                          <td className="px-6 py-4 font-bold text-slate-700 text-sm">{service.agent_name}</td>
                          <td className="px-6 py-4"><span className="font-bold text-slate-900 text-sm block">{service.customer_name}</span><span className="text-[10px] text-slate-400">{service.customer_phone}</span></td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(service.service_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(service.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400 font-bold text-sm">Nenhum atendimento ativo no momento.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Histórico Recente por Agente (Últimas 24h)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operationalStats?.agentSummary?.length > 0 ? (
                  operationalStats.agentSummary.map((agent: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 hover:border-primary/20 transition-colors group">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{agent.agent_name}</p>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed truncate">{agent.last_customers || 'Sem atendimentos recentes'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 font-bold text-sm text-center py-12 w-full col-span-full">Nenhuma atividade registrada.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'financial' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <StatCard title="MRR (Receita)" value={financialMetrics ? formatCurrency(financialMetrics.mrr) : 'R$ 0,00'} icon={DollarSign} trend="+15%" colorClass="bg-emerald-600" subText="Recorrente Mensal" />
              <StatCard title="Clientes Ativos" value={financialMetrics?.activeClients} icon={Users} trend="+4" colorClass="bg-blue-600" subText="Total da base" />
              <StatCard title="Ticket Médio" value={financialMetrics ? formatCurrency(financialMetrics.averageTicket) : 'R$ 0,00'} icon={BarChart} trend="+2%" colorClass="bg-violet-600" subText="Por cliente" />
              <StatCard title="Projeção (Potencial)" value={financialMetrics ? formatCurrency(financialMetrics.projectedRevenue) : 'R$ 0,00'} icon={Target} active={true} trend="Alto" colorClass="bg-amber-500" subText="Incluindo Trials" />
            </div>
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Projeção da Base</h3>
              <p className="text-slate-500 max-w-2xl mx-auto mb-8">Seu SaaS está crescendo a uma taxa média de 15% ao mês.</p>
              <div className="h-64 flex items-end justify-center gap-4 max-w-3xl mx-auto border-b border-slate-100 pb-4">
                {[40, 55, 60, 75, 90, 110, 135].map((h, i) => (
                  <div key={i} className="flex-1 max-w-[60px] flex flex-col items-center gap-2">
                    <div className={cn("w-full rounded-t-xl transition-all", i >= 4 ? "bg-emerald-200" : "bg-emerald-500")} style={{ height: `${h}%` }} />
                    <span className="text-[10px] font-bold text-slate-400">{i >= 4 ? `+${i - 3} Mês` : `Mês ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'evaluation' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!moduleStatus.ai_evaluation ? (
              <div className="bg-white rounded-[40px] border border-slate-200 p-16 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Brain size={200} className="text-primary rotate-12" /></div>
                <div className="relative z-10 max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8"><Brain className="text-primary" size={40} /></div>
                  <h2 className="text-4xl font-black text-slate-900 mb-6">Auditoria de Atendimento com IA</h2>
                  <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">Analise cordialidade, identifique melhorias e receba feedbacks imparciais automaticamente.<span className="block mt-4 text-primary font-bold">Módulo opcional premium.</span></p>
                  <button onClick={handleToggleModule} disabled={isTogglingModule} className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50">{isTogglingModule ? 'Processando...' : 'Habilitar Auditoria IA'}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Auditoria IA</h2>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Análise de Qualidade</p>
                  </div>
                  <button onClick={handleToggleModule} className="text-xs font-black text-red-500 hover:underline uppercase tracking-widest">Desativar</button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {evaluations && evaluations.length > 0 ? (
                    evaluations.map((evalItem: any) => (
                      <div key={evalItem.id} className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:border-primary/30 transition-all">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[24px] p-6 min-w-[160px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Nota Geral</p>
                            <div className="text-4xl font-black text-primary">{evalItem.score_overall}</div>
                            <div className="mt-4 flex items-center gap-1 text-slate-800 text-xs font-bold"><Star className="text-amber-500 fill-amber-500" size={12} />Cordialidade: {evalItem.score_cordiality}</div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">{evalItem.agent_name.charAt(0)}</div>
                                <div><p className="text-sm font-black text-slate-800">{evalItem.agent_name}</p><p className="text-[10px] font-bold text-slate-400">Cliente: {evalItem.customer_name || evalItem.whatsapp_chat_id || 'Desconhecido'}</p></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analizado em {new Date(evalItem.analyzed_at).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 italic font-bold text-slate-700 text-sm">"{evalItem.feedback}"</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Melhorias</p>
                                <ul className="text-xs font-bold text-slate-600 space-y-1">{evalItem.improvement_points?.split('\n').map((p: string, i: number) => <li key={i}>• {p}</li>) || 'Nenhuma melhoria sugerida'}</ul>
                              </div>
                              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Comparação Cliente</p>
                                <p className="text-xs font-bold text-slate-600 italic">"{evalItem.comparison_with_customer || 'Sem nota de cliente'}"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                      <Brain className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-30" />
                      <p className="text-slate-400 font-bold">Nenhuma auditoria realizada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isDetailModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="premium-modal max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{detailConfig?.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", detailConfig?.color === 'blue' ? 'bg-blue-500' : detailConfig?.color === 'emerald' ? 'bg-emerald-500' : detailConfig?.color === 'indigo' ? 'bg-indigo-500' : 'bg-orange-500')} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Detalhadas</span>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="action-btn-circle"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-slate-400 font-bold animate-pulse">Buscando dados em tempo real...</p>
                </div>
              ) : detailData && detailData.length > 0 ? (
                <div className="space-y-4">
                  {detailData.map((item: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col gap-2">
                      {detailConfig?.type === 'online-agents' ? (
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{item.name?.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.customer_name || 'Desconhecido'}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(item.created_at || item.updated_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700">{item.content || item.agent_name || 'Atendimento ativo'}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 opacity-40 italic font-bold text-slate-400">Nenhum dado encontrado para esta métrica.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
