
import './AgentStatusGrid.css'
import { usersApi } from '../../services/api'
import { LogOut, Coffee, PlayCircle, Ban } from 'lucide-react'

interface User {
    id: string
    name: string
    username: string
    role: string
    status: string
    status_message?: string
    status_updated_at?: string
    last_login?: string
}

interface AgentStatusGridProps {
    users: User[]
    lastUpdatedId?: string | null
}

export default function AgentStatusGrid({ users, lastUpdatedId }: AgentStatusGridProps) {
    const agents = users.filter(u => u.role === 'agent')

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'available': return 'Disponível'
            case 'away': return 'Ausente'
            case 'break': return 'Pausa / Banheiro'
            case 'lunch': return 'Almoço'
            case 'offline': return 'Deslogado'
            default: return 'Disponível'
        }
    }

    const formatTime = (isoString?: string) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        const now = new Date()

        if (date.toDateString() === now.toDateString()) {
            return `hoje às ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        }
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const getStatusClass = (status?: string) => {
        return `agent-status-badge status-${status || 'available'}`
    }

    const handleForceLogout = async (userId: string, userName: string) => {
        if (!confirm(`ATENÇÃO: Isso irá desconectar ${userName} imediatamente.\n\nDeseja continuar?`)) return
        try {
            await usersApi.forceLogout(userId)
        } catch (error) {
            console.error(error)
            alert('Erro ao tentar deslogar o usuário.')
        }
    }

    const handleForceStatus = async (userId: string, status: string, message?: string) => {
        try {
            await usersApi.updateStatus(userId, status, message)
        } catch (error) {
            console.error(error)
            alert('Erro ao tentar alterar o status.')
        }
    }

    return (
        <div className="agent-status-section">
            <div className="section-header">
                <h2>Painel de Agentes</h2>
                <p>Acompanhe o status e disponibilidade da sua equipe em tempo real.</p>
            </div>

            <div className="agent-grid">
                {agents.length === 0 ? (
                    <p className="no-agents">Nenhum agente cadastrado.</p>
                ) : (
                    agents.map(agent => (
                        <div
                            key={agent.id}
                            className={`agent-card ${lastUpdatedId === agent.id ? 'just-updated' : ''}`}
                        >
                            <div className="agent-info">
                                <div className="agent-avatar">
                                    {agent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="agent-details">
                                    <h3>{agent.name}</h3>
                                    <p>@{agent.username}</p>
                                </div>
                            </div>

                            <div className={getStatusClass(agent.status)}>
                                <div className="status-dot-large"></div>
                                <span>{getStatusLabel(agent.status)}</span>
                            </div>

                            {agent.status_message && (
                                <p className="agent-status-message">"{agent.status_message}"</p>
                            )}

                            <div className="last-update">
                                Atualizado às {formatTime(agent.status_updated_at)}
                            </div>

                            {/* Admin Controls */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                                {/* Only show controls if user is not offline (logout control still visible if needed though) */}
                                {agent.status !== 'offline' ? (
                                    <>
                                        <button
                                            onClick={() => handleForceLogout(agent.id, agent.name)}
                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                                            title="Expulsar / Deslogar"
                                        >
                                            <LogOut size={16} />
                                        </button>

                                        {agent.status === 'available' ? (
                                            <button
                                                onClick={() => handleForceStatus(agent.id, 'break', 'Pausa forçada pela Administração')}
                                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                title="Forçar Pausa"
                                            >
                                                <Coffee size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleForceStatus(agent.id, 'available')}
                                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                                                title="Forçar Disponibilidade"
                                            >
                                                <PlayCircle size={16} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-9 flex items-center justify-center text-xs text-slate-400 font-medium">
                                        <Ban className="w-4 h-4 mr-1.5" />
                                        Usuário Offline
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
