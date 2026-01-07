import { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { useBrandingStore } from '../../store/brandingStore'
import NotificationBanner from './NotificationBanner'

interface MainLayoutProps {
    children: ReactNode
    hideSidebar?: boolean
}

export default function MainLayout({ children, hideSidebar = false }: MainLayoutProps) {
    const { user, token, logout } = useAuthStore()
    const { socket, connectSocket } = useChatStore()
    const fetchBranding = useBrandingStore((state) => state.fetchBranding)

    useEffect(() => {
        console.log('[DEBUG] MainLayout mounted', { hasToken: !!token, hasSocket: !!socket })
        if (token && !socket) {
            connectSocket(token)
            fetchBranding()
        }

        if (socket) {
            const handleForceLogout = (data: { userId: string }) => {
                if (user?.id === data.userId) {
                    alert('Sua sessão foi encerrada pelo administrador.')
                    logout()
                    window.location.href = '/login'
                }
            }

            socket.on('user:force_logout', handleForceLogout)

            return () => {
                socket.off('user:force_logout', handleForceLogout)
            }
        }
    }, [socket, user, logout, connectSocket])

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
            {!hideSidebar && <Sidebar />}
            <main className="flex-1 overflow-auto bg-slate-50 relative">
                {children}
            </main>
            <NotificationBanner />
        </div>
    )
}
