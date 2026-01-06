import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import {
    Building2,
    Mail,
    Lock,
    User,
    ArrowRight,
    CheckCircle2
} from 'lucide-react'
import Logo from '../components/common/Logo'

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyName: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const setAuth = useAuthStore((state) => state.setAuth)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await api.post<any>('/api/auth/signup', formData)
            if (response.success) {
                setAuth(response.data.user, response.data.token)
                navigate('/dashboard')
            } else {
                setError(response.error || 'Erro ao criar conta')
            }
        } catch (err) {
            setError('Erro de conexão ao servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-[#F8FAFC]">
            {/* Left Side: Illustration & Info */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#059669] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <Logo size={120} animated={false} />
                        <span className="text-white text-3xl font-black tracking-tight mt-2">Nyvlo Omnichannel</span>
                    </div>

                    <h1 className="text-5xl font-black text-white leading-tight mb-8">
                        Comece sua jornada <br /> de automação hoje.
                    </h1>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-white/20 p-1 rounded-lg">
                                <CheckCircle2 className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">7 dias de teste grátis</h3>
                                <p className="text-emerald-50/80 text-sm">Experimente todos os recursos básicos sem compromisso.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-white/20 p-1 rounded-lg">
                                <CheckCircle2 className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Multi-agentes centralizados</h3>
                                <p className="text-emerald-50/80 text-sm">Sua equipe toda em um único número de WhatsApp.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-white/20 p-1 rounded-lg">
                                <CheckCircle2 className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Dashboard Inteligente</h3>
                                <p className="text-emerald-50/80 text-sm">Métricas em tempo real sobre seu atendimento.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-12 border-t border-white/10">
                    <p className="text-emerald-100/60 text-xs font-medium uppercase tracking-[0.2em]">
                        Plataforma Omnichannel de Próxima Geração
                    </p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-20">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Crie sua conta</h2>
                        <p className="text-slate-500 font-medium">Junte-se a centenas de empresas que escalam com o Nyvlo Omnichannel.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in shake duration-300">
                            <div className="shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <X size={16} />
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-slate-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Seu nome completo"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium text-slate-700"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-slate-400 transition-colors">
                                    <Building2 size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Nyvlo Omnichannel Solutions"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium text-slate-700"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-slate-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="empresa@exemplo.com"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium text-slate-700"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-slate-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Min. 8 caracteres"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium text-slate-700"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            {loading ? 'Criando conta...' : (
                                <>
                                    Criar minha conta grátis
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 font-bold text-sm">
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function X({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )
}
