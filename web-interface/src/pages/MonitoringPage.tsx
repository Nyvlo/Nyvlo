import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api, auditApi } from '../services/api'
import { Activity, Database, Server, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import './MonitoringPage.css'

interface Metrics {
    messagesReceived: number
    messagesProcessed: number
    aiResponses?: number
    humanTransfers?: number
    errors: number
    uptime: number
    memory: {
        rss: number
        heapTotal: number
        heapUsed: number
    }
}

interface CacheStats {
    size: number
    hitRate: number
    totalHits: number
}

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Array<{
        name: string
        status: 'healthy' | 'degraded' | 'unhealthy'
        message: string
    }>
}

interface Backup {
    name: string
    size: number
    created: string
}

export default function MonitoringPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'audit'>('dashboard');

    return (
        <MainLayout>
            <div className="min-h-screen bg-slate-50/50 p-8 pb-24">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="text-primary" />
                            Monitoramento
                        </h1>
                        <p className="text-slate-500 font-medium">Saúde, performance e segurança do sistema</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'audit' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Auditoria & Logs
                        </button>
                    </div>
                </header>

                {activeTab === 'dashboard' ? <DashboardTab /> : <AuditTab />}
            </div>
        </MainLayout>
    )
}

function DashboardTab() {
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [cache, setCache] = useState<CacheStats | null>(null)
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [backups, setBackups] = useState<Backup[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchAll()
        const interval = setInterval(fetchAll, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchAll = async () => {
        try {
            const [mRes, cRes, hRes, bRes] = await Promise.all([
                api.get<Metrics>('/api/metrics'),
                api.get<CacheStats>('/api/cache/stats'),
                api.get<HealthStatus>('/api/health'),
                api.get<Backup[]>('/api/backups')
            ])

            if (mRes.success) setMetrics(mRes.data || null)
            if (cRes.success) setCache(cRes.data || null)
            if (hRes.success) setHealth(hRes.data || null)
            if (bRes.success) setBackups(bRes.data || [])
        } catch (error) {
            console.error('Erro ao buscar monitoramento:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearCache = async () => {
        if (!confirm('Limpar o cache do sistema?')) return
        await api.post('/api/cache/clear')
        fetchAll()
    }

    const handleCreateBackup = async () => {
        await api.post('/api/backup')
        fetchAll()
    }

    const formatUptime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    const formatSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <RefreshCw className="animate-spin text-primary w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Status do Sistema</span>
                        {health?.status === 'healthy' ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <AlertTriangle className="text-amber-500 w-5 h-5" />}
                    </div>
                    <div className="text-2xl font-black text-slate-900 capitalize flex items-center gap-2">
                        {health?.status === 'healthy' ? 'Operacional' : health?.status || 'Unknown'}
                        <div className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Tempo de Atividade</span>
                        <Activity className="text-primary w-5 h-5" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{formatUptime(metrics?.uptime || 0)}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Uso de Memória</span>
                        <Server className="text-violet-500 w-5 h-5" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{metrics?.memory ? Math.round(metrics.memory.rss / 1024 / 1024) : 0} MB</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-violet-500 h-full rounded-full" style={{ width: '40%' }}></div> {/* Mock visualization */}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Cache Hits</span>
                        <Database className="text-blue-500 w-5 h-5" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{((cache?.hitRate || 0) * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400 font-medium">{cache?.totalHits} requisições atendidas</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Métricas Detalhadas */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 lg:col-span-2">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-slate-400" />
                        Fluxo de Mensagens
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Recebidas</span>
                            <span className="block text-2xl font-black text-slate-900 mt-1">{metrics?.messagesReceived || 0}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Processadas</span>
                            <span className="block text-2xl font-black text-slate-900 mt-1">{metrics?.messagesProcessed || 0}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Via IA</span>
                            <span className="block text-2xl font-black text-slate-900 mt-1">{metrics?.aiResponses || 0}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Transbordos</span>
                            <span className="block text-2xl font-black text-slate-900 mt-1">{metrics?.humanTransfers || 0}</span>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <span className="block text-xs font-bold text-red-400 uppercase">Erros</span>
                            <span className="block text-2xl font-black text-red-600 mt-1">{metrics?.errors || 0}</span>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <CheckCircle size={20} className="text-slate-400" />
                        Saúde dos Serviços
                    </h2>
                    <div className="space-y-4">
                        {health?.checks.map((check, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-sm">{check.name}</span>
                                    <span className="text-xs text-slate-400">{check.message}</span>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${check.status === 'healthy' ? 'bg-emerald-100 text-emerald-600' :
                                    check.status === 'degraded' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {check.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Ações Rápidas</h3>
                        <div className="flex gap-2">
                            <button onClick={handleClearCache} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                                Limpar Cache
                            </button>
                            <button onClick={handleCreateBackup} className="flex-1 py-2 bg-primary hover:brightness-110 rounded-xl text-xs font-bold text-white transition-colors">
                                Backup Agora
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backups List */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Database size={20} className="text-slate-400" />
                    Backups Recentes
                </h2>
                {backups.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 font-medium">Nenhum backup encontrado</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-xl">Arquivo</th>
                                    <th className="px-6 py-4">Tamanho</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4 rounded-r-xl">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {backups.map((b, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">{b.name}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm font-mono">{formatSize(b.size)}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(b.created).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={`/api/backups/${b.name}`}
                                                className="text-primary hover:text-primary-dark font-bold text-sm hover:underline"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Baixar
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function AuditTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await auditApi.getLogs(LIMIT, page * LIMIT);
            if (res.success && res.data) {
                setLogs(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-slate-400" />
                    Registro de Auditoria
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={logs.length < LIMIT || loading}
                        className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <RefreshCw className="animate-spin text-slate-300" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4 rounded-l-xl">Data e Hora</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Endereço IP</th>
                                <th className="px-6 py-4 rounded-r-xl">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-600">
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border ${log.action.includes('error') ? 'bg-red-50 text-red-600 border-red-100' :
                                            log.action.includes('login') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                log.action.includes('2fa') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {log.user_id}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                        {log.ip_address}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-xs font-mono text-slate-500" title={JSON.stringify(log.details, null, 2)}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Nenhum registro de auditoria encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
