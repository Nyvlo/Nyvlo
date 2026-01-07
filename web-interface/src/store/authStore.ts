import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_BASE = import.meta.env.VITE_API_URL || ''
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in ms
const REFRESH_THRESHOLD = 30 * 60 * 1000 // Refresh 30 min before expiry

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'supervisor' | 'superadmin'
  allowedInstances: string[]
  status?: string
  statusMessage?: string
  industryType?: string
  customLabels?: Record<string, string>
  twoFactorEnabled?: boolean
  mustChangePassword?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastActivity: number | null
  tokenExpiry: number | null

  requireTwoFactor: boolean
  tempLoginCredentials: { username: string; password: string } | null

  login: (username: string, password: string) => Promise<boolean>
  completeTwoFactorLogin: (code: string) => Promise<boolean>
  logout: () => void
  refreshSession: () => Promise<boolean>
  checkSession: () => boolean
  updateActivity: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearError: () => void
  getAuthHeaders: () => Record<string, string>
  scheduleRefresh: () => void
  updateStatus: (status: string, message?: string) => Promise<boolean>
  setAuth: (user: User, token: string, refreshToken?: string) => void
}

function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: null,
      tokenExpiry: null,
      requireTwoFactor: false,
      tempLoginCredentials: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null, requireTwoFactor: false, tempLoginCredentials: null })

        try {
          // Ajuste de URL para compatibilidade com backend direto ou via auth router
          const url = `${API_BASE}/api/login`

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          })

          const data = await response.json()

          if (data.require2fa) {
            set({
              requireTwoFactor: true,
              isLoading: false,
              tempLoginCredentials: { username, password }
            })
            // Retornamos true aqui para indicar que o "passo 1" funcionou, 
            // a UI deve reagir ao estado requireTwoFactor
            return true
          }

          if (data.token) { // Sucesso direto (sem 2FA ou legado)
            const payload = parseJwt(data.token)
            const tokenExpiry = payload?.exp ? payload.exp * 1000 : Date.now() + SESSION_TIMEOUT

            set({
              user: data.admin || data.user, // Backend retorna admin object ou user object
              token: data.token,
              refreshToken: data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              lastActivity: Date.now(),
              tokenExpiry,
            })

            get().scheduleRefresh()
            return true
          } else {
            set({ error: data.error || 'Credenciais inválidas', isLoading: false })
            return false
          }
        } catch (e) {
          console.error(e)
          set({ error: 'Erro de conexão com o servidor', isLoading: false })
          return false
        }
      },

      completeTwoFactorLogin: async (code: string) => {
        const { tempLoginCredentials } = get()
        if (!tempLoginCredentials) return false

        set({ isLoading: true, error: null })

        try {
          const url = `${API_BASE}/api/login`
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: tempLoginCredentials.username,
              password: tempLoginCredentials.password,
              code
            }),
          })

          const data = await response.json()

          if (data.token) {
            const payload = parseJwt(data.token)
            const tokenExpiry = payload?.exp ? payload.exp * 1000 : Date.now() + SESSION_TIMEOUT

            set({
              user: data.admin || data.user,
              token: data.token,
              refreshToken: data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              lastActivity: Date.now(),
              tokenExpiry,
              requireTwoFactor: false,
              tempLoginCredentials: null
            })

            get().scheduleRefresh()
            return true
          } else {
            set({ error: data.error || 'Código inválido', isLoading: false })
            return false
          }
        } catch {
          set({ error: 'Erro de conexão', isLoading: false })
          return false
        }
      },

      logout: async () => {
        const { token, user, updateStatus } = get()

        // Update status to offline before logging out
        if (token && user && user.role === 'agent') {
          await updateStatus('offline')
        }

        // Call logout endpoint (fire and forget)
        if (token) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          }).catch(() => { })
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          lastActivity: null,
          tokenExpiry: null,
        })
      },

      refreshSession: async () => {
        const { refreshToken } = get()

        if (!refreshToken) {
          get().logout()
          return false
        }

        try {
          const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })

          const data = await response.json()

          if (data.success) {
            const payload = parseJwt(data.token)
            const tokenExpiry = payload?.exp ? payload.exp * 1000 : Date.now() + SESSION_TIMEOUT

            set({
              token: data.token,
              refreshToken: data.refreshToken,
              user: data.user,
              tokenExpiry,
              lastActivity: Date.now(),
            })

            get().scheduleRefresh()
            return true
          } else {
            get().logout()
            return false
          }
        } catch {
          get().logout()
          return false
        }
      },

      checkSession: () => {
        const { isAuthenticated, lastActivity, tokenExpiry, user } = get()
        console.log('[DEBUG] checkSession:', { isAuthenticated, hasUser: !!user, lastActivity, tokenExpiry })

        if (!isAuthenticated) return false

        const now = Date.now()

        // Check if token expired
        if (tokenExpiry && now >= tokenExpiry) {
          console.log('[DEBUG] checkSession: Token expired', { now, tokenExpiry })
          get().logout()
          return false
        }

        // Check inactivity timeout (8 hours)
        if (lastActivity && now - lastActivity > SESSION_TIMEOUT) {
          get().logout()
          return false
        }

        // Check if we need to refresh soon
        if (tokenExpiry && tokenExpiry - now < REFRESH_THRESHOLD) {
          get().refreshSession()
        }

        return true
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clearError: () => set({ error: null }),

      getAuthHeaders: () => {
        const { token } = get()
        return token ? { 'Authorization': `Bearer ${token}` } : {} as Record<string, string>
      },

      scheduleRefresh: () => {
        const { tokenExpiry } = get()
        if (!tokenExpiry) return

        const timeUntilRefresh = tokenExpiry - Date.now() - REFRESH_THRESHOLD
        if (timeUntilRefresh > 0) {
          setTimeout(() => {
            if (get().isAuthenticated) {
              get().refreshSession()
            }
          }, timeUntilRefresh)
        }
      },

      updateStatus: async (status: string, message?: string) => {
        const { token, user } = get()
        if (!token || !user) return false

        try {
          const response = await fetch(`${API_BASE}/api/users/me/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, message }),
          })

          const data = await response.json()
          if (data.success) {
            set({
              user: {
                ...user,
                status,
                statusMessage: message || ''
              }
            })
            return true
          }
          return false
        } catch {
          return false
        }
      },

      setAuth: (user, token, refreshToken) => {
        const payload = parseJwt(token)
        const tokenExpiry = payload?.exp ? payload.exp * 1000 : Date.now() + SESSION_TIMEOUT

        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          tokenExpiry,
          lastActivity: Date.now()
        })

        get().scheduleRefresh()
      },
    }),
    {
      name: 'nyvlo-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
        tokenExpiry: state.tokenExpiry,
      }),
    }
  )
)

// Activity tracker - update on user interaction
if (typeof window !== 'undefined') {
  const updateActivity = () => {
    const store = useAuthStore.getState()
    if (store.isAuthenticated) {
      store.updateActivity()
    }
  }

  window.addEventListener('click', updateActivity)
  window.addEventListener('keypress', updateActivity)
  window.addEventListener('scroll', updateActivity)

  // Check session periodically
  setInterval(() => {
    useAuthStore.getState().checkSession()
  }, 60000) // Every minute
}
