import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../services/api';
import { CreditCard, Check, Zap, Rocket, Building2, Crown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    max_instances: number;
    max_agents: number;
    ai_enabled: boolean;
    can_use_api: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPlanId, setCurrentPlanId] = useState<string>('');

    const [subscription, setSubscription] = useState<{ expiresAt: string | null; createdAt: string } | null>(null);

    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        qrCode: string;
        copyPaste: string;
        value: number;
        planName: string;
    }>({ isOpen: false, qrCode: '', copyPaste: '', value: 0, planName: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Busca paralela: Lista de todos os planos E plano atual do tenant
                const [plansResponse, tenantResponse] = await Promise.all([
                    api.get<any>('/api/plans'),
                    api.get<any>('/api/tenants/me/plan')
                ]);

                // Configura lista de planos
                if (plansResponse.success && Array.isArray(plansResponse.data.plans)) {
                    setPlans(plansResponse.data.plans);
                } else if (tenantResponse.success && Array.isArray(tenantResponse.data.availablePlans)) {
                    // Fallback para endpoint antigo se o novo falhar ou vier vazio
                    setPlans(tenantResponse.data.availablePlans);
                }

                // Configura plano atual e assinatura
                if (tenantResponse.success && tenantResponse.data) {
                    setCurrentPlanId(tenantResponse.data.currentPlanId || tenantResponse.data.plan?.id);
                    setSubscription(tenantResponse.data.subscription);
                }

            } catch (error) {
                console.error('Erro ao buscar dados de planos:', error);
                // Fallback de emergência apenas se tudo falhar
                setPlans([
                    { id: 'trial', name: 'Plano Trial', description: 'Plano de teste', price_monthly: 0, max_instances: 1, max_agents: 2, ai_enabled: false, can_use_api: false }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleUpgrade = async (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        if (plan.price_monthly === 0) {
            // Se for grátis (ex: upgrade forçado ou brinde), usa o endpoint antigo de upgrade direto
            try {
                const response = await api.post<any>('/api/tenants/me/upgrade', { planId });
                if (response.success) {
                    alert('Plano ativado com sucesso!');
                    window.location.reload();
                }
            } catch (err) {
                alert('Erro ao ativar plano gratuito');
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.post<any>('/api/payments/create-pix', { planId });
            if (response.success && response.data.payment) {
                const pay = response.data.payment;
                setPaymentModal({
                    isOpen: true,
                    qrCode: pay.pixQrCode,
                    copyPaste: pay.pixCopyPaste,
                    value: pay.value,
                    planName: plan.name
                });
            } else {
                alert(response.error || 'Erro ao gerar pagamento');
            }
        } catch (error) {
            alert('Erro de conexão ao gerar pagamento');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (id: string, name: string) => {
        const lowerId = id.toLowerCase();
        const lowerName = name.toLowerCase();

        if (lowerId.includes('trial') || lowerName.includes('teste')) return <Zap className="w-6 h-6" />;
        if (lowerId.includes('starter') || lowerName.includes('iniciante')) return <Rocket className="w-6 h-6" />;
        if (lowerId.includes('pro') || lowerName.includes('profissional')) return <Building2 className="w-6 h-6" />;
        if (lowerId.includes('enterprise') || lowerName.includes('avançado')) return <Crown className="w-6 h-6" />;

        return <CreditCard className="w-6 h-6" />;
    };

    const getDaysRemaining = (dateString: string | null) => {
        if (!dateString) return null;
        const target = new Date(dateString);
        const now = new Date();
        const diff = target.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) return <MainLayout><div className="p-10 text-center text-slate-500">Carregando planos disponíveis...</div></MainLayout>;

    const daysRemaining = subscription?.expiresAt ? getDaysRemaining(subscription.expiresAt) : null;

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-10">
                <header className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Planos e Assinatura</h1>
                    <p className="text-slate-500 font-medium">Veja todos os planos disponíveis para turbinar seu atendimento</p>
                </header>

                {subscription?.expiresAt && daysRemaining !== null && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Sua assinatura está ativa
                                </h3>
                                <p className="text-slate-400 text-sm max-w-md">
                                    Seu ciclo atual encerra em <strong className="text-white">{new Date(subscription.expiresAt).toLocaleDateString()}</strong>.
                                    A renovação automática ocorrerá nesta data.
                                </p>
                            </div>
                            <div className="flex items-center gap-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                                <div className="text-right">
                                    <span className="block text-4xl font-black text-white tracking-tight">
                                        {daysRemaining > 0 ? daysRemaining : 0}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Dias Restantes</span>
                                </div>
                                <div className="h-10 w-px bg-slate-700"></div>
                                <button className="text-xs font-bold text-white hover:text-emerald-400 transition-colors">
                                    Ver Faturas
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.isArray(plans) && plans.length > 0 ? (
                        plans.map((plan) => {
                            const isCurrent = plan.id === currentPlanId;
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative p-8 rounded-[32px] border-2 transition-all flex flex-col",
                                        isCurrent
                                            ? "bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 scale-105 z-10"
                                            : "bg-white border-slate-100 hover:border-emerald-500/30 shadow-sm"
                                    )}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-4 right-8 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                            Plano Atual
                                        </div>
                                    )}

                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                                        isCurrent ? "bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20" : "bg-slate-50 text-slate-400"
                                    )}>
                                        {getIcon(plan.id, plan.name)}
                                    </div>

                                    <h3 className={cn("text-xl font-black mb-2", isCurrent ? "text-white" : "text-slate-900")}>
                                        {plan.name}
                                    </h3>
                                    <p className={cn("text-xs font-medium mb-8", isCurrent ? "text-slate-400" : "text-slate-400")}>
                                        {plan.description || 'Sem descrição'}
                                    </p>

                                    <div className="mb-10 flex items-baseline gap-1">
                                        <span className={cn("text-4xl font-black", isCurrent ? "text-white" : "text-slate-900")}>
                                            R$ {parseFloat(String(plan.price_monthly)).toFixed(2)}
                                        </span>
                                        <span className={cn("text-xs font-bold", isCurrent ? "text-slate-500" : "text-slate-400")}>
                                            /mês
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isCurrent ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-100 text-slate-400")}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className={cn("text-xs font-bold", isCurrent ? "text-slate-300" : "text-slate-600")}>
                                                Até {plan.max_instances} instâncias WhatsApp
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isCurrent ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-100 text-slate-400")}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className={cn("text-xs font-bold", isCurrent ? "text-slate-300" : "text-slate-600")}>
                                                Até {plan.max_agents} agentes logados
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center",
                                                plan.ai_enabled
                                                    ? (isCurrent ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-100 text-emerald-600")
                                                    : "bg-red-50 text-red-300"
                                            )}>
                                                {plan.ai_enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                            </div>
                                            <span className={cn("text-xs font-bold", isCurrent ? "text-slate-300" : "text-slate-600")}>
                                                {plan.ai_enabled ? 'Automação com IA Inclusa' : 'Sem automação com IA'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center",
                                                plan.can_use_api
                                                    ? (isCurrent ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-100 text-emerald-600")
                                                    : "bg-red-50 text-red-300"
                                            )}>
                                                {plan.can_use_api ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                            </div>
                                            <span className={cn("text-xs font-bold", isCurrent ? "text-slate-300" : "text-slate-600")}>
                                                {plan.can_use_api ? 'Acesso via API Aberta' : 'Acesso web apenas'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isCurrent}
                                        onClick={() => handleUpgrade(plan.id)}
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                            isCurrent
                                                ? "bg-slate-800 text-slate-500 cursor-default"
                                                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 hover:bg-emerald-600"
                                        )}
                                    >
                                        {isCurrent ? 'Plano Ativado' : 'Upgrade de Plano'}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-4 py-20 text-center text-slate-400">
                            Nenhum plano disponível no momento.
                        </div>
                    )}
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl">
                        💡
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="text-emerald-900 font-black text-lg">Precisa de algo sob medida?</h4>
                        <p className="text-emerald-700 font-medium text-sm">Nossa equipe está pronta para desenhar um plano específico para grandes volumes ou necessidades especiais.</p>
                    </div>
                    <button className="bg-emerald-600 text-white px-8 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">
                        Falar com Consultor
                    </button>
                </div>

                {/* Modal de Pagamento PIX */}
                {paymentModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between p-8 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Pagamento via PIX</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Plano {paymentModal.planName}</p>
                                </div>
                                <button
                                    onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                                    className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-10 flex flex-col items-center">
                                <div className="p-4 bg-slate-50 rounded-3xl mb-8">
                                    {paymentModal.qrCode.startsWith('http') ? (
                                        <img
                                            src={paymentModal.qrCode}
                                            alt="QR Code PIX"
                                            className="w-56 h-56"
                                        />
                                    ) : (
                                        <img
                                            src={`data:image/png;base64,${paymentModal.qrCode}`}
                                            alt="QR Code PIX"
                                            className="w-56 h-56 mix-blend-multiply"
                                        />
                                    )}
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="text-center">
                                        <span className="text-4xl font-black text-slate-900">R$ {parseFloat(String(paymentModal.value)).toFixed(2)}</span>
                                        <p className="text-xs font-bold text-slate-500 mt-2">Escaneie o código acima ou use o Copia e Cola</p>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <div className="flex-1 truncate font-mono text-[10px] text-slate-500">
                                            {paymentModal.copyPaste}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(paymentModal.copyPaste);
                                                alert('Copiado para a área de transferência!');
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                        >
                                            Copiar
                                        </button>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-dashed border-slate-100 italic text-center">
                                        <p className="text-xs text-slate-400 font-medium">
                                            Após o pagamento, seu plano será ativado automaticamente em poucos segundos.
                                            Você receberá uma notificação no sistema.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
