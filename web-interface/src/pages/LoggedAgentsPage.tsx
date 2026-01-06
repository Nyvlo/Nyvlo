import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { usersApi } from '../services/api'
import MainLayout from '../components/layout/MainLayout'
import AgentStatusGrid from '../components/dashboard/AgentStatusGrid'
import './LoggedAgentsPage.css'

export default function LoggedAgentsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null)
  const lastUpdateTimerRef = useRef<any>(null)
  const { user } = useAuthStore()
  const { socket } = useChatStore()
  const navigate = useNavigate()

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return
    try {
      const response = await usersApi.list()
      if (response.success && response.data) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }, [user])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(() => {
      fetchUsers()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  // Socket connection is now handled globally by MainLayout

  useEffect(() => {
    if (!socket || user?.role !== 'admin') return

    const handleStatusUpdate = (data: any) => {
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === data.userId
          ? { ...u, status: data.status, status_message: data.message, status_updated_at: data.timestamp }
          : u
      ))

      setLastUpdatedId(data.userId)
      if (lastUpdateTimerRef.current) clearTimeout(lastUpdateTimerRef.current)
      lastUpdateTimerRef.current = setTimeout(() => setLastUpdatedId(null), 1500)
    }

    socket.on('user:status', handleStatusUpdate)
    return () => {
      socket.off('user:status', handleStatusUpdate)
    }
  }, [socket, user])

  return (
    <MainLayout>
      <div className="agents-page-container">
        <div className="agents-content">

          <div className="agents-header">
            <div className="header-title">
              <h2>Monitoramento de Equipe</h2>
              <p>Gerencie o status e disponibilidade dos agentes em tempo real</p>
            </div>
            <button className="btn-manage-users" onClick={() => navigate('/users')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Gerenciar Usuários
            </button>
          </div>

          <div className="info-box-modern">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <p>A visualização abaixo atualiza automaticamente quando os agentes entram, saem ou mudam de status.</p>
          </div>

          <AgentStatusGrid users={users} lastUpdatedId={lastUpdatedId} />
        </div>
      </div>
    </MainLayout>
  )
}
