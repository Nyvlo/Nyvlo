import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  MessageSquare,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import Logo from '../components/common/Logo'
import TwoFactorForm from '../components/auth/TwoFactorForm'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { login, completeTwoFactorLogin, isLoading, error, clearError, isAuthenticated, checkSession, user: currentUser, requireTwoFactor } = useAuthStore()
  const navigate = useNavigate()

  const [tenantConfig, setTenantConfig] = useState<{
    id: string;
    name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    industry_type?: string;
  } | null>(null)

  // Tenant Detection
  useEffect(() => {
    const fetchBranding = async () => {
      // 1. Detect Slug from hostname or query param
      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      let slug = urlParams.get('tenant') || '';

      if (!slug && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const parts = hostname.split('.');
        // Heuristic: if it's a long hostname that doesn't look like a standard subdomain of the platform,
        // treat the whole thing as a custom domain.
        if (parts.length > 2 && parts[0] !== 'www') {
          // If it contains the platform name, it's likely a subdomain (e.g., client.nyvlo.com)
          if (hostname.toLowerCase().includes('nyvlo')) {
            slug = parts[0];
          } else {
            // Otherwise, treat as full custom domain (e.g., atendimento.empresa.com.br)
            slug = hostname;
          }
        } else if (parts.length === 2) {
          // simple custom domain (e.g., empresa.com)
          slug = hostname;
        }
      }

      if (slug) {
        try {
          const response = await fetch(`/api/tenants/public-config/${slug}`);
          const data = await response.json();
          if (data.success && data.config) {
            setTenantConfig(data.config);
            // Apply colors to root for global consistency
            const root = document.documentElement;
            if (data.config.primary_color) root.style.setProperty('--primary-color', data.config.primary_color);
            if (data.config.secondary_color) root.style.setProperty('--secondary-color', data.config.secondary_color);
          }
        } catch (err) {
          console.error('Erro ao carregar branding do tenant:', err);
        }
      }
    };

    fetchBranding();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')

    if (urlToken) {
      try {
        const payload = JSON.parse(window.atob(urlToken.split('.')[1]))
        const { setToken, setUser, updateActivity } = useAuthStore.getState()

        setToken(urlToken)
        setUser({
          id: payload.userId,
          username: payload.username,
          name: payload.username,
          email: payload.email || '',
          role: payload.role,
          allowedInstances: payload.allowedInstances || []
        })
        updateActivity()
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (err) {
        console.error('Erro ao processar token da URL:', err)
      }
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, currentUser, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    const success = await login(username.trim(), password)
    if (success) {
      // Navigation happens in the useEffect above
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#F8FAFC] font-sans selection:bg-emerald-500/10 selection:text-emerald-900">

      {/* Dynamic Background Particles / Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full animate-float opacity-10"
          style={{ backgroundColor: tenantConfig?.primary_color || '#1D3D6B' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[150px] rounded-full animate-float-delayed opacity-10"
          style={{ backgroundColor: tenantConfig?.secondary_color || '#59C348' }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Side: Branding & Value Prop */}
        <div className="hidden lg:flex flex-col space-y-12 animate-in slide-in-from-left duration-1000">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plataforma Oficial</span>
            </div>
            <h1 className="text-7xl font-black text-slate-900 tracking-tight leading-[0.9]">
              Sua jornada para o <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D3D6B] to-[#59C348]">sucesso omnichannel</span>
            </h1>
            <p className="text-xl text-slate-600 font-medium max-w-lg leading-relaxed">
              Gerencie todas as suas comunicações em um único lugar com a potência da <span className="font-bold text-slate-900">Nyvlo</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Conversas Ativas', value: '1.2k+', sub: 'em tempo real' },
              { label: 'Eficiência de IA', value: '98%', sub: 'precisão de resposta' },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm transition-transform hover:scale-105 duration-300">
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-2">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="bg-white border border-slate-200 rounded-[40px] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#1D3D6B] to-[#59C348]" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                {tenantConfig?.logo_url ? (
                  <img src={tenantConfig.logo_url} alt={tenantConfig.name} className="h-24 w-auto mb-6 mx-auto object-contain drop-shadow-md transition-transform hover:scale-105 duration-500" />
                ) : (
                  <div className="flex items-center justify-center mb-2">
                    <Logo size={360} />
                  </div>
                )}
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                  Bem-vindo ao <span style={{ color: tenantConfig?.primary_color || '#1D3D6B', fontFamily: '"Outfit", sans-serif', fontSize: '1.1em', letterSpacing: '-0.02em' }}>{tenantConfig?.id ? tenantConfig.id.charAt(0).toUpperCase() + tenantConfig.id.slice(1) : 'Nyvlo'}</span>
                </h2>
                <p className="text-slate-600 text-sm font-medium">Insira suas credenciais para acessar o painel</p>
              </div>

              {requireTwoFactor ? (
                <TwoFactorForm
                  onSubmit={async (code) => {
                    await completeTwoFactorLogin(code);
                    // Navigation handled by useEffect
                  }}
                  isLoading={isLoading}
                  onCancel={() => useAuthStore.setState({ requireTwoFactor: false })}
                  primaryColor={tenantConfig?.primary_color}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Usuário</label>
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                        placeholder="seu_usuario"
                        value={username}
                        onChange={e => {
                          setUsername(e.target.value)
                          if (error) clearError()
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Senha</label>
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 pl-12 pr-14 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value)
                          if (error) clearError()
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center space-x-2 cursor-pointer group/check">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="w-4 h-4 rounded border border-slate-300 bg-slate-100 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                        <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 group-hover/check:text-slate-700 transition-colors font-medium">Lembrar acesso</span>
                    </label>
                    <button type="button" className="text-xs text-emerald-600 hover:text-emerald-500 font-bold tracking-tight transition-colors">Esqueceu a senha?</button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full h-14 bg-slate-900 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1D3D6B] to-[#59C348] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="relative flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span className="text-white font-black uppercase tracking-[0.2em]">Autenticando...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white font-black uppercase tracking-[0.2em]">Entrar na Plataforma</span>
                          <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>

                  <div className="pt-4 flex items-center justify-center space-x-6 border-t border-slate-200">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">v2.0.4</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">&copy; 2026 Nyvlo Omnichannel</span>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-xs font-bold text-slate-500">
                      Não tem uma conta?{' '}
                      <Link to="/signup" className="text-emerald-600 hover:text-emerald-500 transition-colors">
                        Experimente grátis
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-in {
          animation-delay: calc(var(--index) * 100ms);
        }
      `}</style>
    </div >
  )
}
