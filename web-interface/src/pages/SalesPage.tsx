import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { Banknote, ShoppingBag, CreditCard, Search, Download, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './FinancialPage.css';

interface Order {
    id: string;
    item_id: string;
    amount: number;
    status: string;
    payment_method: string;
    customer_name: string;
    customer_phone: string;
    created_at: string;
    external_id: string;
}

export default function SalesPage() {
    const { token } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get<{ orders: Order[] }>('/api/payments/history');
                if (response?.success && response.data) {
                    setOrders(response.data.orders);
                }
            } catch (error) {
                console.error('Erro ao buscar histórico de vendas:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchOrders();
        }
    }, [token]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    };

    const filteredOrders = orders.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm) ||
        order.item_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = orders
        .filter(o => o.status === 'paid' || o.status === 'confirmed')
        .reduce((sum, o) => sum + Number(o.amount), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'paid' || o.status === 'confirmed').length;

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
                    <h1>Vendas e Faturamento do Bot</h1>
                    <p>Histórico de cobranças PIX geradas automaticamente durante os atendimentos</p>
                </header>

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon revenue">
                            <Banknote />
                        </div>
                        <div className="kpi-content">
                            <h3>Receita Total (Confirmada)</h3>
                            <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
                            <div className="kpi-trend trend-up">
                                <span>Saldo Realizado</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon clients">
                            <ShoppingBag />
                        </div>
                        <div className="kpi-content">
                            <h3>Vendas Concluídas</h3>
                            <div className="kpi-value">{completedOrders}</div>
                            <div className="kpi-trend">
                                <span className="text-slate-500 text-xs">Conversão via PIX</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon ticket">
                            <Calendar />
                        </div>
                        <div className="kpi-content">
                            <h3>Aguardando Pagamento</h3>
                            <div className="kpi-value">{pendingOrders}</div>
                            <div className="kpi-trend text-amber-500">
                                <span>Links expirando em breve</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon growth">
                            <CreditCard />
                        </div>
                        <div className="kpi-content">
                            <h3>Ticket Médio do Bot</h3>
                            <div className="kpi-value">
                                {formatCurrency(completedOrders > 0 ? totalRevenue / completedOrders : 0)}
                            </div>
                            <div className="kpi-trend">
                                <span>Por venda confirmada</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <section className="table-section">
                        <div className="table-header">
                            <div>
                                <h2>Histórico de Transações</h2>
                                <p className="text-slate-500 text-sm mt-1">Lista de todos os pedidos gerados pelo assistente virtual</p>
                            </div>
                            <div className="table-actions">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente ou item..."
                                        className="search-input pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                                    <Download size={18} />
                                    Exportar CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="financial-table">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Item / Referência</th>
                                        <th>Status</th>
                                        <th>Valor</th>
                                        <th>Data/Hora</th>
                                        <th>ID Externo (Gateway)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <div className="font-semibold text-slate-800">{order.customer_name || 'Usuário WhatsApp'}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{order.customer_phone}</div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="plan-badge">
                                                        {order.item_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${order.status === 'paid' || order.status === 'confirmed' ? 'status-active' :
                                                    order.status === 'pending' ? 'status-trial' : 'status-expired'
                                                    }`}>
                                                    {order.status === 'paid' || order.status === 'confirmed' ? 'Pago' :
                                                        order.status === 'pending' ? 'Pendente' : order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="revenue-value">
                                                    {formatCurrency(order.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="date-value">{formatDate(order.created_at)}</span>
                                            </td>
                                            <td>
                                                <span className="text-xs text-slate-400 font-mono">{order.external_id || '-'}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-400">
                                                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>Nenhuma venda encontrada.</p>
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
