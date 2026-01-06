import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { Package, Plus, Edit2, Trash2, DollarSign, Users, Smartphone, Cpu, Globe, Check, X, Brain } from 'lucide-react';
import axios from 'axios';
import './PlansManagementPage.css';

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    max_instances: number;
    max_agents: number;
    ai_enabled: boolean;
    can_use_api: boolean;
    addon_ai_evaluation_price: number;
    created_at: string;
}

export default function PlansManagementPage() {
    const { token } = useAuthStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        price_monthly: 0,
        max_instances: 1,
        max_agents: 2,
        ai_enabled: false,
        can_use_api: false,
        addon_ai_evaluation_price: 0
    });

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(response.data.plans);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPlans();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await axios.put(`/api/plans/${editingPlan.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/plans', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setEditingPlan(null);
            fetchPlans();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar plano');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este plano?')) {
            try {
                await axios.delete(`/api/plans/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchPlans();
            } catch (error: any) {
                alert(error.response?.data?.error || 'Erro ao excluir plano');
            }
        }
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            id: plan.id,
            name: plan.name,
            description: plan.description || '',
            price_monthly: plan.price_monthly,
            max_instances: plan.max_instances,
            max_agents: plan.max_agents,
            ai_enabled: plan.ai_enabled,
            can_use_api: plan.can_use_api,
            addon_ai_evaluation_price: plan.addon_ai_evaluation_price || 0
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            description: '',
            price_monthly: 0,
            max_instances: 1,
            max_agents: 2,
            ai_enabled: false,
            can_use_api: false,
            addon_ai_evaluation_price: 0
        });
    };

    return (
        <MainLayout>
            <div className="plans-management-container">
                <header className="page-header">
                    <div className="header-info">
                        <Package className="header-icon" />
                        <div>
                            <h1>Gestão de Planos</h1>
                            <p>Configure os planos de assinatura da plataforma</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => { setEditingPlan(null); resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} />
                        Novo Plano
                    </button>
                </header>

                {loading ? (
                    <div className="loading-state">Carregando planos...</div>
                ) : (
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className="plan-card">
                                <div className="plan-header">
                                    <h3>{plan.name}</h3>
                                    <div className="plan-price">
                                        <DollarSign size={20} />
                                        <span className="price-value">{parseFloat(String(plan.price_monthly)).toFixed(2)}</span>
                                        <span className="price-period">/mês</span>
                                    </div>
                                </div>

                                {plan.description && (
                                    <p className="plan-description">{plan.description}</p>
                                )}

                                <div className="plan-features">
                                    <div className="feature-item">
                                        <Smartphone size={16} />
                                        <span>{plan.max_instances} instância(s)</span>
                                    </div>
                                    <div className="feature-item">
                                        <Users size={16} />
                                        <span>{plan.max_agents} agente(s)</span>
                                    </div>
                                    <div className="feature-item">
                                        {plan.ai_enabled ? <Check size={16} className="check" /> : <X size={16} className="x" />}
                                        <span>IA Habilitada</span>
                                    </div>
                                    <div className="feature-item">
                                        {plan.can_use_api ? <Check size={16} className="check" /> : <X size={16} className="x" />}
                                        <span>Acesso API</span>
                                    </div>
                                </div>

                                <div className="plan-actions">
                                    <button className="btn-edit" onClick={() => openEditModal(plan)}>
                                        <Edit2 size={16} />
                                        Editar
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(plan.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="plan-id">ID: {plan.id}</div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="premium-modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="premium-modal-container" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="premium-modal-header">
                                <div className="modal-header-content">
                                    <div className="modal-icon-wrapper">
                                        <Package className="modal-icon" />
                                    </div>
                                    <div>
                                        <h2 className="modal-title">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
                                        <p className="modal-subtitle">Configure os recursos e limites do plano</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="modal-close-btn"
                                    aria-label="Fechar"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="premium-modal-body">
                                {/* Basic Info Section */}
                                <div className="form-section-premium">
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <Package size={16} />
                                        </div>
                                        <h3 className="section-title-premium">Informações Básicas</h3>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="field-label">
                                                ID do Plano
                                                <span className="required-mark">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="field-input"
                                                value={formData.id}
                                                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                                                placeholder="ex: premium"
                                                disabled={!!editingPlan}
                                                required
                                            />
                                            <span className="field-hint">Identificador único (apenas letras, números, - e _)</span>
                                        </div>

                                        <div className="form-field">
                                            <label className="field-label">
                                                Nome do Plano
                                                <span className="required-mark">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="field-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="ex: Plano Premium"
                                                required
                                            />
                                            <span className="field-hint">Nome exibido para os clientes</span>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="field-label">Descrição</label>
                                        <textarea
                                            className="field-textarea"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descreva os benefícios e diferenciais deste plano..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Pricing & Limits Section */}
                                <div className="form-section-premium">
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <DollarSign size={16} />
                                        </div>
                                        <h3 className="section-title-premium">Precificação e Limites</h3>
                                    </div>

                                    <div className="form-grid-3">
                                        <div className="form-field">
                                            <label className="field-label">
                                                Preço Mensal
                                                <span className="required-mark">*</span>
                                            </label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">R$</span>
                                                <input
                                                    type="number"
                                                    className="field-input with-prefix"
                                                    step="0.01"
                                                    value={formData.price_monthly}
                                                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label className="field-label">
                                                Máx. Instâncias
                                                <span className="required-mark">*</span>
                                            </label>
                                            <div className="input-with-icon">
                                                <Smartphone size={18} className="input-icon" />
                                                <input
                                                    type="number"
                                                    className="field-input with-icon"
                                                    value={formData.max_instances}
                                                    onChange={(e) => setFormData({ ...formData, max_instances: parseInt(e.target.value) })}
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label className="field-label">
                                                Máx. Agentes
                                                <span className="required-mark">*</span>
                                            </label>
                                            <div className="input-with-icon">
                                                <Users size={18} className="input-icon" />
                                                <input
                                                    type="number"
                                                    className="field-input with-icon"
                                                    value={formData.max_agents}
                                                    onChange={(e) => setFormData({ ...formData, max_agents: parseInt(e.target.value) })}
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Module Section */}
                                <div className="form-section-premium features-section" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
                                    <div className="section-header">
                                        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                                            <Brain size={16} />
                                        </div>
                                        <h3 className="section-title-premium" style={{ color: '#5b21b6' }}>Módulo de IA (Opcional/Add-on)</h3>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="feature-card" style={{ height: '100%', display: 'flex', alignItems: 'center', borderColor: formData.ai_enabled ? '#8b5cf6' : undefined }}>
                                                <input
                                                    type="checkbox"
                                                    className="feature-checkbox"
                                                    checked={formData.ai_enabled}
                                                    onChange={(e) => setFormData({ ...formData, ai_enabled: e.target.checked })}
                                                />
                                                <div className="feature-content" style={{ width: '100%' }}>
                                                    <div className="feature-icon-wrapper" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                                                        <Cpu size={24} />
                                                    </div>
                                                    <div className="feature-info">
                                                        <h4 className="feature-title">Habilitar Recursos de IA</h4>
                                                        <p className="feature-description">Ativa auditoria e inteligência no plano</p>
                                                    </div>
                                                    <div className={`feature-toggle ${formData.ai_enabled ? 'active' : ''}`} style={{ background: formData.ai_enabled ? '#7c3aed' : undefined }}>
                                                        {formData.ai_enabled ? <Check size={16} /> : <X size={16} />}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="form-field" style={{ opacity: formData.ai_enabled ? 1 : 0.5, pointerEvents: formData.ai_enabled ? 'auto' : 'none', transition: 'all 0.3s' }}>
                                            <label className="feature-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'default' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6d28d9', marginBottom: '8px' }}>
                                                    PREÇO DO ADD-ON (MENSAL)
                                                </div>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix" style={{ color: '#7c3aed' }}>R$</span>
                                                    <input
                                                        type="number"
                                                        className="field-input with-prefix"
                                                        step="0.01"
                                                        value={formData.addon_ai_evaluation_price}
                                                        onChange={(e) => setFormData({ ...formData, addon_ai_evaluation_price: parseFloat(e.target.value) })}
                                                        style={{ borderColor: '#ddd6fe', fontWeight: 700, color: '#5b21b6' }}
                                                    />
                                                </div>
                                                <span className="field-hint" style={{ color: '#8b5cf6' }}>Deixe 0 se já incluso no valor base</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Other Features Section */}
                                <div className="form-section-premium">
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <Globe size={16} />
                                        </div>
                                        <h3 className="section-title-premium">Outros Recursos</h3>
                                    </div>

                                    <div className="features-grid">
                                        <label className="feature-card">
                                            <input
                                                type="checkbox"
                                                className="feature-checkbox"
                                                checked={formData.can_use_api}
                                                onChange={(e) => setFormData({ ...formData, can_use_api: e.target.checked })}
                                            />
                                            <div className="feature-content">
                                                <div className="feature-icon-wrapper">
                                                    <Globe size={24} />
                                                </div>
                                                <div className="feature-info">
                                                    <h4 className="feature-title">Acesso à API</h4>
                                                    <p className="feature-description">Permite integrações via REST API</p>
                                                </div>
                                                <div className={`feature-toggle ${formData.can_use_api ? 'active' : ''}`}>
                                                    {formData.can_use_api ? <Check size={16} /> : <X size={16} />}
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="premium-modal-footer">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn-cancel"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save">
                                        <Check size={18} />
                                        {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
