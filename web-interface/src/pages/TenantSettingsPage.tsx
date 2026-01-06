import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { Building2, Save, Key, RefreshCw, Eye, EyeOff, AlertTriangle, Globe } from 'lucide-react';
import axios from 'axios';
import { useBrandingStore } from '../store/brandingStore';
import './DataPage.css';

export default function TenantSettingsPage() {
    const { token, user } = useAuthStore();
    const setBranding = useBrandingStore(state => state.setBranding);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        industry_type: 'general',
        logo_url: '',
        primary_color: '#10b981',
        secondary_color: '#059669',
        custom_domain: ''
    });

    const [apiKeyData, setApiKeyData] = useState<{
        apiKey: string | null;
        canUseApi: boolean;
        showKey: boolean;
    }>({ apiKey: null, canUseApi: false, showKey: false });

    useEffect(() => {
        fetchConfig();
        fetchApiKey();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await axios.get('/api/tenants/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const { name, industry_type, logo_url, primary_color, secondary_color, custom_domain } = response.data.tenant;
                setFormData({
                    name: name || '',
                    industry_type: industry_type || 'general',
                    logo_url: logo_url || '',
                    primary_color: primary_color || '#10b981',
                    secondary_color: secondary_color || '#059669',
                    custom_domain: custom_domain || ''
                });
            }
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApiKey = async () => {
        try {
            const response = await axios.get('/api/tenants/me/api-key', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setApiKeyData(prev => ({
                    ...prev,
                    apiKey: response.data.apiKey,
                    canUseApi: response.data.canUseApi
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar API key:', error);
        }
    };

    const handleGenerateApiKey = async () => {
        if (!window.confirm('Ao gerar uma nova chave, a antiga deixará de funcionar imediatamente. Deseja continuar?')) return;

        try {
            setSaving(true);
            const response = await axios.post('/api/tenants/me/api-key/generate', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setApiKeyData(prev => ({ ...prev, apiKey: response.data.apiKey }));
                setMessage('Nova API Key gerada com sucesso!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao gerar API Key');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const response = await axios.put('/api/tenants/me/branding', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setMessage('Configurações salvas com sucesso!');
                setBranding(formData);

                // Atualizar o store local para refletir as mudanças de labels imediatamente
                if (user) {
                    const { setUser } = useAuthStore.getState();
                    setUser({
                        ...user,
                        industryType: response.data.industry_type || formData.industry_type
                    });
                }

                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <MainLayout><div className="p-10">Carregando configurações...</div></MainLayout>;

    return (
        <MainLayout>
            <div className="data-page">
                <header className="page-header">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-emerald-500" />
                        <div>
                            <h1>Configurações da Empresa</h1>
                            <p className="subtitle">Personalize a identidade visual e o comportamento do seu portal</p>
                        </div>
                    </div>
                </header>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 ${message.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="form-group">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome da Empresa</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-transparent rounded-2xl h-12 px-4 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Domínio Personalizado (White-Label)
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-transparent rounded-2xl h-12 px-4 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                                    placeholder="ex: atendimento.suaempresa.com"
                                    value={formData.custom_domain}
                                    onChange={e => setFormData({ ...formData, custom_domain: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    Insira o domínio ou subdomínio que você deseja usar. <br />
                                    <span className="text-amber-600">Atenção:</span> Você deve apontar o seu CNAME no DNS para o endereço da plataforma.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Setor / Nicho</label>
                                <select
                                    className="w-full bg-slate-50 border-transparent rounded-2xl h-12 px-4 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                                    value={formData.industry_type}
                                    onChange={e => setFormData({ ...formData, industry_type: e.target.value })}
                                >
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
                                <p className="text-[10px] text-slate-400 mt-2">Isso altera os termos usados no menu (ex: Alunos vs Pacientes).</p>
                            </div>

                            <div className="form-group">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Logo da Empresa</label>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-transparent rounded-2xl h-12 px-4 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                                        placeholder="URL da Logo (https://...)"
                                        value={formData.logo_url}
                                        onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Cor Primária</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer"
                                            value={formData.primary_color}
                                            onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-50 border-transparent rounded-2xl h-12 px-4 text-center font-mono"
                                            value={formData.primary_color}
                                            onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Cor Secundária</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer"
                                            value={formData.secondary_color}
                                            onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-50 border-transparent rounded-2xl h-12 px-4 text-center font-mono"
                                            value={formData.secondary_color}
                                            onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-emerald-500 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {saving ? 'Salvando...' : 'Salvar Branding'}
                            </button>
                        </form>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[40px] p-10 relative overflow-hidden group">
                            {/* Preview Background */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                                <div
                                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[80px] rounded-full"
                                    style={{ backgroundColor: formData.primary_color }}
                                />
                                <div
                                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full"
                                    style={{ backgroundColor: formData.secondary_color }}
                                />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <h3 className="text-white text-xs font-black uppercase tracking-widest opacity-50">Preview da Tela de Login</h3>

                                <div className="space-y-4">
                                    {formData.logo_url ? (
                                        <img src={formData.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-slate-950">
                                            <Building2 className="text-emerald-500" />
                                        </div>
                                    )}
                                    <h2 className="text-3xl font-black text-white">
                                        Bem-vindo ao <span style={{ color: formData.primary_color }}>{formData.name || 'Sua Empresa'}</span>
                                    </h2>
                                </div>

                                <div
                                    className="w-full h-12 rounded-xl flex items-center justify-center text-slate-950 text-[10px] font-black uppercase tracking-[0.2em]"
                                    style={{ backgroundColor: formData.primary_color }}
                                >
                                    Botão de Acesso Exemplo
                                </div>
                            </div>
                        </div>

                        {/* API Integrations Section */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                    <Key size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Integrações via API</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Desenvolvedores & Automação</p>
                                </div>
                            </div>

                            {!apiKeyData.canUseApi ? (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900">Recurso não disponível</h4>
                                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                                Seu plano atual não permite o uso de API externa.
                                                Faça o upgrade para os planos <strong>Pro</strong> ou <strong>Enterprise</strong> para desbloquear este recurso.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Sua API Key</label>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-white border border-slate-200 rounded-xl h-12 px-4 flex items-center font-mono text-sm text-slate-600 overflow-hidden">
                                                {apiKeyData.apiKey ? (
                                                    apiKeyData.showKey ? apiKeyData.apiKey : '••••••••••••••••••••••••••••••••'
                                                ) : (
                                                    <span className="text-slate-300 italic">Nenhuma chave gerada</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setApiKeyData(prev => ({ ...prev, showKey: !prev.showKey }))}
                                                className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                                            >
                                                {apiKeyData.showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={handleGenerateApiKey}
                                                className="px-4 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
                                                Gerar Nova
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
