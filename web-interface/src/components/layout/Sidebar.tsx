import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    Smartphone,
    Users,
    LineChart,
    Bot,
    ClipboardList,
    MessageSquare,
    HelpCircle,
    BookOpen,
    Building2,
    Settings,
    Calendar,
    FileText,
    LogOut,
    ChevronRight,
    PanelLeftClose,
    CreditCard,
    Package,
    Banknote
} from 'lucide-react'
import { useLabels } from '../../hooks/useLabels'
import { useBrandingStore } from '../../store/brandingStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Logo from '../common/Logo'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const { user, logout } = useAuthStore()
    const branding = useBrandingStore((state) => state.config)
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const isSuperAdmin = user?.role === 'superadmin'
    const labels = useLabels()

    const NavGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="space-y-1">
            <h4 className={cn(
                "px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 transition-opacity duration-300 whitespace-nowrap",
                isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100"
            )}>
                {title}
            </h4>
            {children}
        </div>
    )

    const Item = ({ to, icon: Icon, text }: { to: string, icon: any, text: string }) => (
        <NavLink
            to={to}
            title={isCollapsed ? text : undefined}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                isCollapsed && "justify-center px-2"
            )}
        >
            <Icon className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
                "group-hover:scale-110 duration-200"
            )} />
            <span className={cn(
                "flex-1 transition-all duration-300 whitespace-nowrap overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>{text}</span>

            {!isCollapsed && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />}
        </NavLink>
    )

    return (
        <aside className={cn(
            "h-full bg-white border-r border-slate-200 flex flex-col shadow-sm z-20 transition-all duration-300 ease-in-out relative",
            isCollapsed ? "w-20" : "w-72"
        )}>
            {/* Toggle Button Absolute */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-9 p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary shadow-sm z-50 hover:scale-110 transition-all items-center justify-center flex"
            >
                <PanelLeftClose
                    size={14}
                    strokeWidth={3}
                    className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}
                />
            </button>

            {/* Logo Section */}
            <div className={cn("p-6 flex items-center justify-center overflow-hidden transition-all duration-300", isCollapsed ? "px-2" : "px-6")}>
                <div className="flex items-center justify-center w-full">
                    {branding.logo_url ? (
                        <img
                            src={branding.logo_url}
                            alt="Logo"
                            className={cn(
                                "h-12 w-auto object-contain transition-all duration-300",
                                isCollapsed ? "max-w-[48px]" : ""
                            )}
                        />
                    ) : (
                        <Logo size={isCollapsed ? 64 : 190} animated={false} />
                    )}
                </div>
            </div>

            {/* Navigation links */}
            <nav className={cn(
                "flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide",
                isCollapsed ? "px-2" : "px-3"
            )}>
                <NavGroup title="Visão Geral">
                    <Item to="/dashboard" icon={LayoutDashboard} text="Dashboard" />
                </NavGroup>

                <NavGroup title="Operação">
                    <Item to="/chat" icon={MessageSquare} text="Atendimentos" />
                    <Item to="/customers" icon={Users} text="Base de Clientes" />
                </NavGroup>

                <NavGroup title="Conexões">
                    <Item to="/instances" icon={Smartphone} text="Instâncias" />
                </NavGroup>

                {isAdmin && (
                    <>
                        <NavGroup title="Gestão">
                            <Item to="/logged-agents" icon={Users} text="Agentes Logados" />
                            <Item to="/monitoring" icon={LineChart} text="Monitoramento" />
                            <Item to="/ai-settings" icon={Bot} text="Assistente IA" />
                        </NavGroup>

                        <NavGroup title="Automação">
                            <Item to="/menu-editor" icon={ClipboardList} text="Editor de Menus" />
                            <Item to="/messages" icon={MessageSquare} text="Mensagens" />
                            <Item to="/faq" icon={HelpCircle} text="FAQ / Base" />
                            <Item to="/catalog" icon={BookOpen} text={labels.sidebar_catalog} />
                        </NavGroup>

                        <NavGroup title={labels.sidebar_data}>
                            <Item to="/appointments" icon={Calendar} text="Agendamentos" />
                            <Item to="/leads" icon={FileText} text={labels.sidebar_leads} />
                        </NavGroup>

                        <NavGroup title="Administração">
                            <Item to="/settings" icon={Settings} text="Minha Empresa" />
                            <Item to="/plans" icon={CreditCard} text="Planos e Cobrança" />
                            <Item to="/sales" icon={Banknote} text="Vendas PIX Bot" />
                            <Item to="/users" icon={Users} text="Equipe / Usuários" />
                            {isSuperAdmin && <Item to="/tenants" icon={Building2} text="Gestão SaaS" />}
                            {isSuperAdmin && <Item to="/plans-management" icon={Package} text="Gestão de Planos" />}
                            {isSuperAdmin && <Item to="/financial" icon={Banknote} text="Financeiro" />}
                        </NavGroup>
                    </>
                )}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-100 space-y-4 overflow-hidden">
                <NavLink
                    to="/account"
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 group/user",
                        isCollapsed ? "justify-center flex-col px-0" : "hover:bg-slate-50"
                    )}
                >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md shadow-primary/10 flex-shrink-0 group-hover/user:scale-110 transition-transform">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={cn("flex-1 min-w-0 transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                            <ChevronRight size={14} className="text-slate-300 group-hover/user:translate-x-1 group-hover/user:text-primary transition-all" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 capitalize">{user?.role}</p>
                    </div>
                </NavLink>

                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group overflow-hidden whitespace-nowrap",
                        isCollapsed ? "justify-center px-0" : "px-4"
                    )}
                    title="Sair do Sistema"
                >
                    <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                    <span className={cn("transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>Sair do Sistema</span>
                </button>
            </div>
        </aside>
    )
}
