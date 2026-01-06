import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { Building2, Plus, Edit2, Trash2, Shield, Calendar, Users, Smartphone, Search, Globe, CreditCard, Brain } from 'lucide-react';
import axios from 'axios';
import './TenantsPage.css';

interface Tenant {
    id: string;
    name: string;
    status: 'active' | 'trial' | 'suspended' | 'expired';
    plan_id: string;
    max_instances: number;
    max_agents: number;
    expires_at: string | null;
    use_bridge_mode: boolean;
    industry_type: string;
    created_at: string;
    asaas_customer_id: string | null;
    pagarme_customer_id: string | null;
    pagarme_subscription_id: string | null;
    module_ai_evaluation: boolean;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    max_agents: number;
    max_instances: number;
    ai_enabled: boolean;
    can_use_api: boolean;
}

export default function TenantsPage() {
    const { token } = useAuthStore();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        status: 'active',
        plan_id: 'trial',
        max_instances: 1,
        max_agents: 2,
        expires_at: '',
        use_bridge_mode: false,
        module_ai_evaluation: false,
        industry_type: 'general',
        adminName: '',
        adminUsername: '',
        adminEmail: '',
        adminPassword: '',
        asaas_customer_id: '',
        pagarme_customer_id: '',
        pagarme_subscription_id: ''
    });

    const fetchTenants = async () => {
        try {
            const response = await axios.get('/api/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(response.data.tenants);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPlans(response.data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    useEffect(() => {
        if (token) {
            setLoading(true);
            Promise.all([fetchTenants(), fetchPlans()]).finally(() => setLoading(false));
        }
    }, [token]);

    const handlePlanChange = (planId: string) => {
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan) {
            setFormData(prev => ({
                ...prev,
                plan_id: planId,
                max_agents: selectedPlan.max_agents,
                max_instances: selectedPlan.max_instances
            }));
        } else {
            setFormData(prev => ({ ...prev, plan_id: planId }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                expires_at: formData.expires_at || null
            };

            if (editingTenant) {
                await axios.put(`/api/tenants/${editingTenant.id}`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/tenants', dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setEditingTenant(null);
            fetchTenants();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar tenant');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta empresa? Todos os dados associados serão perdidos.')) {
            try {
                await axios.delete(`/api/tenants/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchTenants();
            } catch (error: any) {
                alert(error.response?.data?.error || 'Erro ao excluir tenant');
            }
        }
    };

    const openEditModal = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setFormData({
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            plan_id: tenant.plan_id,
            max_instances: tenant.max_instances,
            max_agents: tenant.max_agents,
            expires_at: tenant.expires_at ? tenant.expires_at.split('T')[0] : '',
            use_bridge_mode: !!tenant.use_bridge_mode,
            industry_type: tenant.industry_type || 'general',
            adminName: '',
            adminUsername: '',
            adminEmail: '',
            adminPassword: '',
            asaas_customer_id: tenant.asaas_customer_id || '',
            pagarme_customer_id: tenant.pagarme_customer_id || '',
            pagarme_subscription_id: tenant.pagarme_subscription_id || '',
            module_ai_evaluation: !!tenant.module_ai_evaluation
        });
        setIsModalOpen(true);
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            id: '', name: '', status: 'active', plan_id: 'trial',
            max_instances: 1, max_agents: 2, expires_at: '',
            use_bridge_mode: false,
            industry_type: 'general',
            adminName: '', adminUsername: '', adminEmail: '', adminPassword: '',
            asaas_customer_id: '', pagarme_customer_id: '', pagarme_subscription_id: '',
            module_ai_evaluation: false
        });
    }

    return (
        <MainLayout>
            <div className="tenants-container">
                <header className="page-header">
                    <div className="header-info">
                        <Building2 className="header-icon" />
                        <div>
                            <h1>Gestão de Clientes (SaaS)</h1>
                            <p>Gerencie todas as empresas da plataforma Nyvlo Omnichannel</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => { setEditingTenant(null); resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} />
                        Nova Empresa
                    </button>
                </header>

                <div className="controls-row">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="stats-mini">
                        <span>Total: <strong>{tenants.length}</strong></span>
                        <span>Ativos: <strong>{tenants.filter(t => t.status === 'active').length}</strong></span>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Carregando empresas...</div>
                ) : (
                    <div className="tenants-grid">
                        {filteredTenants.map(tenant => (
                            <div key={tenant.id} className={`tenant-card status-${tenant.status}`}>
                                <div className="tenant-card-header">
                                    <div className="tenant-alias">
                                        {tenant.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="tenant-status-badge">
                                        {tenant.status === 'active' ? 'Ativo' :
                                            tenant.status === 'trial' ? 'Teste' :
                                                tenant.status === 'suspended' ? 'Suspenso' : 'Expirado'}
                                    </div>
                                    {tenant.use_bridge_mode && (
                                        <div className="bridge-badge" title="Este cliente não armazena mensagens no banco (LGPD)">
                                            BRIDGE
                                        </div>
                                    )}
                                </div>

                                <div className="tenant-card-body">
                                    <h3 className="tenant-name">{tenant.name}</h3>
                                    <code className="tenant-id">ID: {tenant.id}</code>
                                    <div className="industry-tag">
                                        {({
                                            general: 'Geral / Comercial',
                                            security_academy: 'Academia de Vigilantes',
                                            medical: 'Clínica / Saúde',
                                            real_estate: 'Imobiliária',
                                            education: 'Educação / Escolar',
                                            legal: 'Advocacia / Jurídico',
                                            restaurant: 'Restaurante / Delivery',
                                            sales: 'Vendas / E-commerce',
                                            beauty: 'Estética / Salão de Beleza',
                                            auto: 'Oficina / Mecânica',
                                            gym: 'Academia / Fitness',
                                            hotel: 'Hotelaria / Turismo',
                                            dental: 'Odontologia',
                                            veterinary: 'Veterinária / Pet Shop',
                                            accounting: 'Contabilidade',
                                            logistics: 'Logística / Transporte',
                                            it_services: 'TI / Tecnologia',
                                            events: 'Eventos / Buffet',
                                            construction: 'Construção / Engenharia',
                                            agriculture: 'Agronegócio',
                                            finance: 'Financeiro / Crédito',
                                            insurance: 'Seguros / Corretora'
                                        } as Record<string, string>)[tenant.industry_type || 'general']}
                                    </div>

                                    <div className="tenant-stats">
                                        <div className="stat-item">
                                            <Smartphone size={14} />
                                            <span>Máx. {tenant.max_instances} Conexões</span>
                                        </div>
                                        <div className="stat-item">
                                            <Users size={14} />
                                            <span>Máx. {tenant.max_agents} Agentes</span>
                                        </div>
                                        <div className="stat-item">
                                            <Shield size={14} />
                                            <span>Plano: {tenant.plan_id}</span>
                                        </div>
                                        {tenant.expires_at && (
                                            <div className="stat-item expire-date">
                                                <Calendar size={14} />
                                                <span>Expira: {new Date(tenant.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {tenant.pagarme_customer_id && (
                                            <div className="stat-item payment-info" title={`Pagarme: ${tenant.pagarme_customer_id}`}>
                                                <CreditCard size={14} />
                                                <span>Pagarme Ativo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="tenant-card-footer">
                                    <button onClick={() => openEditModal(tenant)} className="btn-icon" title="Editar">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(tenant.id)} className="btn-icon btn-danger" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content-compact">
                            <div className="modal-header-compact">
                                <h2>{editingTenant ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h2>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-grid-layout">
                                    {/* Coluna Esquerda: Dados da Empresa */}
                                    <div className="form-column">
                                        <h4 className="column-title">Dados da Empresa</h4>

                                        <div className="form-group-compact">
                                            <label>Nome Fantasia</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Nome da empresa"
                                                required
                                            />
                                        </div>

                                        <div className="form-group-compact">
                                            <label>ID da Empresa (Slug)</label>
                                            <input
                                                type="text"
                                                value={formData.id}
                                                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                                placeholder="ex: minha-empresa"
                                                disabled={!!editingTenant}
                                                required
                                            />
                                        </div>

                                        <div className="form-row-compact">
                                            <div className="form-group-compact">
                                                <label>Status</label>
                                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                                                    <option value="active">Ativo</option>
                                                    <option value="trial">Trial</option>
                                                    <option value="suspended">Suspenso</option>
                                                    <option value="expired">Expirado</option>
                                                </select>
                                            </div>
                                            <div className="form-group-compact">
                                                <label>Setor / Nicho</label>
                                                <select value={formData.industry_type} onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}>
                                                    <option value="general">Geral / Comercial</option>
                                                    <option value="security_academy">Academia de Vigilantes</option>
                                                    <option value="medical">Clínica / Saúde</option>
                                                    <option value="real_estate">Imobiliária</option>
                                                    <option value="education">Educação / Escolar</option>
                                                    <option value="legal">Advocacia / Jurídico</option>
                                                    <option value="restaurant">Restaurante / Delivery</option>
                                                    <option value="sales">Vendas / E-commerce</option>
                                                    <option value="beauty">Estética / Salão de Beleza</option>
                                                    <option value="auto">Oficina / Mecânica</option>
                                                    <option value="gym">Academia / Fitness</option>
                                                    <option value="hotel">Hotelaria / Turismo</option>
                                                    <option value="dental">Odontologia</option>
                                                    <option value="veterinary">Veterinária / Pet Shop</option>
                                                    <option value="accounting">Contabilidade</option>
                                                    <option value="logistics">Logística / Transporte</option>
                                                    <option value="it_services">TI / Tecnologia</option>
                                                    <option value="events">Eventos / Buffet</option>
                                                    <option value="construction">Construção / Engenharia</option>
                                                    <option value="agriculture">Agronegócio</option>
                                                    <option value="finance">Financeiro / Crédito</option>
                                                    <option value="insurance">Seguros / Corretora</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group-compact">
                                            <label>Data de Expiração</label>
                                            <input
                                                type="date"
                                                value={formData.expires_at}
                                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                            />
                                        </div>

                                        <div className="admin-compact-section" style={{ marginTop: '15px' }}>
                                            <span className="section-subtitle">Acesso Administrador</span>
                                            {!editingTenant ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={formData.adminName}
                                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                                        placeholder="Nome Completo"
                                                        required
                                                    />
                                                    <div className="form-row-compact">
                                                        <input
                                                            type="text"
                                                            value={formData.adminUsername}
                                                            onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                                                            placeholder="Login"
                                                            required
                                                        />
                                                        <input
                                                            type="password"
                                                            value={formData.adminPassword}
                                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                            placeholder="Senha"
                                                            required
                                                        />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        value={formData.adminEmail}
                                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                                        placeholder="Email (opcional)"
                                                    />
                                                </>
                                            ) : (
                                                <p style={{ fontSize: '11px', color: '#64748b' }}>A gestão de usuários deve ser feita no painel da empresa.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Coluna Direita: Plano e Pagamento */}
                                    <div className="form-column">
                                        <h4 className="column-title">Plano e Integrações</h4>

                                        <div className="form-grid-3-compact">
                                            <div className="form-group-compact" style={{ gridColumn: 'span 3' }}>
                                                <label>Plano de Assinatura</label>
                                                <select value={formData.plan_id} onChange={(e) => handlePlanChange(e.target.value)}>
                                                    <option value="" disabled>Selecione um plano</option>
                                                    {Array.isArray(plans) && plans.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} - {p.price_monthly > 0 ? `R$${parseFloat(String(p.price_monthly)).toFixed(2)}` : 'Grátis'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group-compact">
                                                <label>Conexões</label>
                                                <input type="number" value={formData.max_instances} onChange={(e) => setFormData({ ...formData, max_instances: parseInt(e.target.value) })} />
                                            </div>
                                            <div className="form-group-compact">
                                                <label>Agentes</label>
                                                <input type="number" value={formData.max_agents} onChange={(e) => setFormData({ ...formData, max_agents: parseInt(e.target.value) })} />
                                            </div>
                                        </div>

                                        <div className="payment-ids-section" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>IDs de Pagamento</h5>
                                            <div className="form-group-compact">
                                                <label>Asaas Customer ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.asaas_customer_id}
                                                    onChange={(e) => setFormData({ ...formData, asaas_customer_id: e.target.value })}
                                                    placeholder="cus_..."
                                                    style={{ fontSize: '11px' }}
                                                />
                                            </div>
                                            <div className="form-group-compact">
                                                <label>Pagarme Customer ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.pagarme_customer_id}
                                                    onChange={(e) => setFormData({ ...formData, pagarme_customer_id: e.target.value })}
                                                    placeholder="cus_..."
                                                    style={{ fontSize: '11px' }}
                                                />
                                            </div>
                                            <div className="form-group-compact">
                                                <label>Pagarme Subscription ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.pagarme_subscription_id}
                                                    onChange={(e) => setFormData({ ...formData, pagarme_subscription_id: e.target.value })}
                                                    placeholder="sub_..."
                                                    style={{ fontSize: '11px' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '15px', padding: '15px', background: '#f5f3ff', borderRadius: '15px', border: '1px solid #ddd6fe' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <div style={{ padding: '6px', borderRadius: '8px', background: '#8b5cf6', color: 'white' }}>
                                                    <Brain size={16} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase' }}>Módulo Auditoria IA</span>
                                            </div>

                                            <div className="checkbox-compact">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.module_ai_evaluation}
                                                        onChange={(e) => setFormData({ ...formData, module_ai_evaluation: e.target.checked })}
                                                    />
                                                    <div>
                                                        <span style={{ color: '#4c1d95', fontWeight: 600 }}>Habilitar para este Cliente</span>
                                                        <div style={{ fontSize: '10px', color: '#6d28d9', fontWeight: 'normal' }}>Ativa análise de qualidade (cobrado à parte conforme plano)</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="checkbox-compact" style={{ marginTop: '20px' }}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.use_bridge_mode}
                                                    onChange={(e) => setFormData({ ...formData, use_bridge_mode: e.target.checked })}
                                                />
                                                <div>
                                                    <span>Modo Bridge / LGPD</span>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>Não salvar mensagens no banco</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions-compact">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn-primary">Salvar Empresa</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
