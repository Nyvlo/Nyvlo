  import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useEffect, useState } from 'react'
import Logo from '../common/Logo'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'supervisor' | 'agent' | 'superadmin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, checkSession } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const valid = checkSession()
    setIsChecking(false)

    if (!valid) {
      // Session expired or invalid
    }
  }, [checkSession])

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full animate-pulse" />
          <Logo size={64} />
        </div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Carregando Sistema</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('[DEBUG] ProtectedRoute: Not authenticated, redirecting to login', { from: location.pathname })
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Mandatory password change check
  if (user?.mustChangePassword && location.pathname !== '/account') {
    console.log('[DEBUG] ProtectedRoute: Password change required, redirecting to account')
    return <Navigate to="/account" replace />
  }

  // Check role permissions
  if (requiredRole && user) {
    const roleHierarchy: Record<string, number> = { superadmin: 10, admin: 3, supervisor: 2, agent: 1 }
    const userLevel = roleHierarchy[user.role as string] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    console.log('🔐 Role Check:', {
      userRole: user.role,
      userLevel,
      requiredRole,
      requiredLevel,
      hasAccess: userLevel >= requiredLevel
    })

    if (userLevel < requiredLevel) {
      console.log('❌ Access denied - redirecting to dashboard')
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
