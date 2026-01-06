import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { DollarSign, Users, TrendingUp, BarChart, Search, Download } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './FinancialPage.css';

interface DashboardData {
    mrr: number;
    activeClients: number;
    trialClients: number;
    projectedRevenue: number;
    averageTicket: number;
    growthRate: number;
}

interface ClientFinancial {
    id: string;
    name: string;
    status: string;
    created_at: string;
    expires_at: string | null;
    plan_name: string;
    price_monthly: number;
    plan_id: string;
}

export default function FinancialPage() {
    const { token } = useAuthStore();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [clients, setClients] = useState<ClientFinancial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                const [overviewRes, clientsRes] = await Promise.all([
                    axios.get('/api/finance/overview', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/finance/clients', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (overviewRes.data.success) {
                    setDashboardData(overviewRes.data.data);
                }
                if (clientsRes.data.success) {
                    setClients(clientsRes.data.clients);
                }
            } catch (error) {
                console.error('Erro ao carregar dados financeiros:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchFinancialData();
        }
    }, [token]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="financial-page">
                <header className="financial-header">
                    <h1>Financeiro & Métricas</h1>
                    <p>Visão geral da saúde financeira e assinaturas do SaaS</p>
                </header>

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon revenue">
                            <DollarSign />
                        </div>
                        <div className="kpi-content">
                            <h3>MRR (Receita Mensal)</h3>
                            <div className="kpi-value">{formatCurrency(dashboardData?.mrr || 0)}</div>
                            <div className="kpi-trend trend-up">
                                <TrendingUp size={14} />
                                <span>Recorrente</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon clients">
                            <Users />
                        </div>
                        <div className="kpi-content">
                            <h3>Clientes Ativos</h3>
                            <div className="kpi-value">{dashboardData?.activeClients || 0}</div>
                            <div className="kpi-trend">
                                <span className="text-slate-500 text-xs">Total na base: {dashboardData?.activeClients! + dashboardData?.trialClients!}</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon ticket">
                            <BarChart />
                        </div>
                        <div className="kpi-content">
                            <h3>Ticket Médio</h3>
                            <div className="kpi-value">{formatCurrency(dashboardData?.averageTicket || 0)}</div>
                            <div className="kpi-trend">
                                <span className="text-slate-500 text-xs">Por cliente ativo</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon growth">
                            <TrendingUp />
                        </div>
                        <div className="kpi-content">
                            <h3>Projeção de Receita</h3>
                            <div className="kpi-value">{formatCurrency(dashboardData?.projectedRevenue || 0)}</div>
                            <div className="kpi-trend text-blue-500">
                                <span>Potencial com Trials</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <section className="table-section">
                        <div className="table-header">
                            <div>
                                <h2>Clientes & Assinaturas</h2>
                                <p className="text-slate-500 text-sm mt-1">Gerencie o status financeiro de cada cliente</p>
                            </div>
                            <div className="table-actions">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        className="search-input pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                                    <Download size={18} />
                                    Exportar
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="financial-table">
                                <thead>
                                    <tr>
                                        <th>Cliente / Empresa</th>
                                        <th>Status</th>
                                        <th>Plano Atual</th>
                                        <th>Valor Mensal</th>
                                        <th>Início Contrato</th>
                                        <th>Vencimento / Renovação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map(client => (
                                        <tr key={client.id}>
                                            <td>
                                                <div className="font-semibold text-slate-800">{client.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{client.id}</div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${client.status}`}>
                                                    {client.status === 'active' ? 'Ativo' :
                                                        client.status === 'trial' ? 'Em Teste' :
                                                            client.status === 'suspended' ? 'Suspenso' : client.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="plan-badge">
                                                    {client.plan_name || 'Sem plano'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="revenue-value">
                                                    {client.price_monthly ? formatCurrency(client.price_monthly) : formatCurrency(0)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="date-value">{formatDate(client.created_at)}</span>
                                            </td>
                                            <td>
                                                <span className="date-value">
                                                    {client.expires_at ? formatDate(client.expires_at) : 'Vitalício / Indefinido'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredClients.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                                Nenhum cliente encontrado com os filtros atuais.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
