import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
    UserX,
    Check,
    ChevronDown,
    Loader2,
    Users,
    X,
    Clock,
    Shield,
    Zap,
    Plus,
    ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

interface Agent {
    id: string
    name: string
    status: string
    status_updated_at: string
}

interface AgentAssignmentProps {
    conversationId: string
    instanceId: string
    currentAgentId?: string | null
    onAssigned?: (agentId: string | null) => void
}

export default function AgentAssignment({
    conversationId,
    instanceId,
    currentAgentId,
    onAssigned
}: AgentAssignmentProps) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAssigning, setIsAssigning] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        loadAgents()
    }, [])

    const loadAgents = async () => {
        try {
            setIsLoading(true)
            const response = await api.get<{ users: Agent[] }>('/api/users')

            if (response.success && response.data?.users) {
                const agentsList = response.data.users.filter((u: Agent) => u.id !== 'admin')
                setAgents(agentsList)
            }
        } catch (error) {
            console.error('Erro ao carregar agentes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAssign = async (agentId: string | null) => {
        try {
            setIsAssigning(true)
            const response = await api.put(
                `/api/instances/${instanceId}/conversations/${conversationId}/assign`,
                { agentId }
            )

            if (response.success) {
                setShowDropdown(false)
                onAssigned?.(agentId)
            }
        } catch (error) {
            console.error('Erro ao atribuir conversa:', error)
        } finally {
            setIsAssigning(false)
        }
    }

    const currentAgent = agents.find(a => a.id === currentAgentId)

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'available': return { color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Disponível' }
            case 'away': return { color: 'bg-amber-500', shadow: 'shadow-amber-500/20', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Ausente' }
            case 'break':
            case 'lunch': return { color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20', bg: 'bg-indigo-50', text: 'text-indigo-600', label: status === 'break' ? 'Pausa' : 'Almoço' }
            case 'offline': return { color: 'bg-slate-400', shadow: 'shadow-slate-400/20', bg: 'bg-slate-50', text: 'text-slate-500', label: 'Offline' }
            default: return { color: 'bg-slate-300', shadow: 'shadow-slate-300/20', bg: 'bg-slate-50', text: 'text-slate-500', label: 'Inativo' }
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                        <Shield className="w-3 h-3 text-white/50" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Escaneando Time</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Localizando Agentes Online</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                        <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Curadoria de Agentes</h3>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">Conversa Direcionada</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">{agents.filter(a => a.status === 'available').length} Online</span>
                </div>
            </div>

            <div className="relative group/manager">
                <button
                    className={cn(
                        "w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-[35px] transition-all active:scale-[0.98] shadow-xl",
                        showDropdown && "ring-2 ring-emerald-500/20 bg-slate-50"
                    )}
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isAssigning}
                >
                    {currentAgent ? (
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-slate-900 font-black text-2xl shadow-2xl group-hover:rotate-3 transition-transform">
                                    {currentAgent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-2xl border-4 border-slate-900 shadow-xl flex items-center justify-center animate-in zoom-in duration-500",
                                    getStatusStyles(currentAgent.status).color
                                )}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex flex-col items-start space-y-1.5">
                                <span className="text-[15px] font-black text-slate-900 tracking-tight">{currentAgent.name}</span>
                                <div className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2",
                                    getStatusStyles(currentAgent.status).bg,
                                    getStatusStyles(currentAgent.status).text
                                )}>
                                    <Zap className="w-2.5 h-2.5 fill-current" />
                                    {getStatusStyles(currentAgent.status).label}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-5 py-1">
                            <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex items-center justify-center text-slate-300 group-hover:border-emerald-500/50 group-hover:text-emerald-500/50 transition-all">
                                <UserX className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col items-start space-y-1">
                                <span className="text-[15px] font-black text-slate-400 tracking-tight uppercase">Livre para Atribuição</span>
                                <div className="flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Selecionar Consultor</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={cn(
                        "w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-all duration-500 active:scale-90",
                        showDropdown && "rotate-180 bg-slate-200 text-slate-600"
                    )}>
                        {isAssigning ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </button>

                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-200 p-4 z-[100] animate-in zoom-in-95 slide-in-from-top-4 duration-300 origin-top">
                        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar-white">
                            {/* Unassign option */}
                            {currentAgentId && (
                                <button
                                    className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 rounded-[24px] transition-all group active:scale-95"
                                    onClick={() => handleAssign(null)}
                                    disabled={isAssigning}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                            <X className="w-5 h-5 stroke-[3]" />
                                        </div>
                                        <span className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em]">Retirar Consultor</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-red-900 group-hover:text-red-500 transition-colors" />
                                </button>
                            )}

                            {currentAgentId && <div className="h-px bg-slate-100 mx-6 my-2" />}

                            {/* Section: Disponíveis */}
                            <div className="px-6 py-3 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Disponíveis</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {agents
                                    .filter(agent => agent.status === 'available')
                                    .map(agent => (
                                        <button
                                            key={agent.id}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-[28px] transition-all group relative overflow-hidden",
                                                currentAgentId === agent.id ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
                                            )}
                                            onClick={() => handleAssign(agent.id)}
                                            disabled={isAssigning}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 font-black text-lg group-hover:scale-105 transition-transform shadow-xl">
                                                        {agent.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-xl" />
                                                </div>
                                                <div className="flex flex-col items-start space-y-0.5">
                                                    <span className={cn(
                                                        "text-[14px] font-black tracking-tight",
                                                        currentAgentId === agent.id ? "text-emerald-600" : "text-slate-900"
                                                    )}>{agent.name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Online Agora</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {currentAgentId === agent.id && (
                                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-in zoom-in group-hover:scale-110 transition-transform relative z-10">
                                                    <Check className="w-4 h-4 stroke-[4]" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                            </div>

                            {/* Section: Outros */}
                            <div className="px-6 py-5 flex items-center justify-between mt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Em Outra Jornada</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {agents
                                    .filter(agent => agent.status !== 'available')
                                    .map(agent => (
                                        <button
                                            key={agent.id}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-[28px] transition-all group opacity-60 hover:opacity-100",
                                                currentAgentId === agent.id ? "bg-slate-100" : "hover:bg-slate-50"
                                            )}
                                            onClick={() => handleAssign(agent.id)}
                                            disabled={isAssigning}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 font-bold text-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                                        {agent.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className={cn(
                                                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-slate-900 shadow-xl",
                                                        getStatusStyles(agent.status).color
                                                    )} />
                                                </div>
                                                <div className="flex flex-col items-start space-y-0.5">
                                                    <span className="text-[14px] font-black text-slate-700 tracking-tight">{agent.name}</span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest",
                                                        getStatusStyles(agent.status).text
                                                    )}>{getStatusStyles(agent.status).label}</span>
                                                </div>
                                            </div>
                                            {currentAgentId === agent.id && <Check className="w-5 h-5 text-white/20" />}
                                        </button>
                                    ))}
                            </div>

                            {agents.length === 0 && (
                                <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200 mx-2">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                        <UserX className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nenhum Consultor Logado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
