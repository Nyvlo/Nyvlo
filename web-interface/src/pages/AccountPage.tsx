import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { User, Lock, Save, KeyRound, ShieldCheck, QrCode, Database, Download } from 'lucide-react';
import { authApi, tenantsApi } from '../services/api';
import './DataPage.css';

export default function AccountPage() {
    const { user, setUser } = useAuthStore();
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // 2FA States
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [otpCode, setOtpCode] = useState('');
    const [setupError, setSetupError] = useState('');
    const [setupSuccess, setSetupSuccess] = useState('');
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        if (!confirm('Deseja baixar uma cópia completa dos seus dados?')) return;
        setExporting(true);
        try {
            const blob = await tenantsApi.exportData();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nyvlo-backup-${user?.username || 'dados'}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setMessage('Download iniciado com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Erro ao exportar dados. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.newPassword.length < 4) {
            setError('A nova senha deve ter pelo menos 4 caracteres');
            return;
        }

        setSaving(true);
        try {
            const response = await authApi.changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });

            if (response.success) {
                setMessage('Senha alterada com sucesso!');
                setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                if (user) {
                    setUser({ ...user, mustChangePassword: false });
                }
                setTimeout(() => setMessage(''), 3000);
            } else {
                setError(response.error || 'Erro ao alterar senha');
            }
        } catch (err: any) {
            setError('Erro interno de rede');
        } finally {
            setSaving(false);
        }
    };

    const handleSetup2FA = async () => {
        setSetupError('');
        try {
            const res = await authApi.generate2FA();
            if (res.success && res.data) {
                setQrCode(res.data.qrCode);
                setShow2FASetup(true);
            } else { setSetupError(res.error || 'Erro ao gerar 2FA'); }
        } catch (err) { setSetupError('Erro de conexão'); }
    };

    const handleConfirm2FA = async () => {
        setSetupError('');
        if (otpCode.length !== 6) return;
        try {
            const res = await authApi.activate2FA(otpCode);
            if (res.success) {
                setSetupSuccess('2FA ativado!');
                setShow2FASetup(false);
                setQrCode(null);
                setOtpCode('');
                if (user) { setUser({ ...user, twoFactorEnabled: true }); }
                setTimeout(() => setSetupSuccess(''), 3000);
            } else { setSetupError(res.error || 'Código inválido'); }
        } catch (err) { setSetupError('Erro ao ativar'); }
    };

    const handleDisable2FA = async () => {
        if (!confirm('Tem certeza?')) return;
        try {
            const res = await authApi.disable2FA();
            if (res.success) {
                setSetupSuccess('2FA desativado.');
                if (user) { setUser({ ...user, twoFactorEnabled: false }); }
                setTimeout(() => setSetupSuccess(''), 3000);
            }
        } catch (err) { setSetupError('Erro ao desativar'); }
    };

    return (
        <MainLayout>
            <div className="p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meus Dados</h1>
                            <p className="text-slate-500 font-medium">Gerencie suas informações e segurança</p>
                        </div>
                    </div>
                </header>

                {user?.mustChangePassword && (
                    <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-[32px] flex items-center gap-4 animate-bounce">
                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600"><Lock size={24} /></div>
                        <div>
                            <h3 className="font-black text-amber-900">Troca de Senha Obrigatória</h3>
                            <p className="text-amber-700 font-medium">Por segurança, altere sua senha antes de continuar.</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-8">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><User size={20} className="text-primary" /> Informações</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="form-group"><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Nome</label><div className="bg-slate-50 rounded-2xl h-12 px-4 flex items-center font-bold">{user?.name}</div></div>
                            <div className="form-group"><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Usuário</label><div className="bg-slate-50 rounded-2xl h-12 px-4 flex items-center font-bold">{user?.username}</div></div>
                        </div>
                    </div>

                    <div className={`bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 ${user?.mustChangePassword ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><ShieldCheck className="text-primary" size={20} /> Segurança</h2>
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div><h3 className="font-bold">2FA</h3><p className="text-sm text-slate-500">{user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}</p></div>
                            {user?.twoFactorEnabled ?
                                <button onClick={handleDisable2FA} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold">Desativar</button> :
                                <button onClick={handleSetup2FA} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">Configurar</button>
                            }
                        </div>
                        {show2FASetup && qrCode && (
                            <div className="mt-8 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="flex flex-col items-center">
                                    <img src={qrCode} alt="QR" className="w-48 h-48 mb-4" />
                                    <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-48 bg-white border border-slate-200 rounded-2xl h-14 text-center text-2xl font-mono mb-4" />
                                    {setupError && <p className="text-red-500 mb-4">{setupError}</p>}
                                    <button onClick={handleConfirm2FA} disabled={otpCode.length !== 6} className="w-48 py-3 bg-primary text-white rounded-xl font-bold">Confirmar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><KeyRound size={20} className="text-primary" /> Alterar Senha</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold">{message}</div>}
                            {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl font-bold">{error}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group"><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Atual</label><input type="password" underline="false" className="w-full bg-slate-50 rounded-2xl h-12 px-4 font-bold" value={formData.oldPassword} onChange={e => setFormData({ ...formData, oldPassword: e.target.value })} required /></div>
                                <div className="form-group"><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Nova</label><input type="password" underline="false" className="w-full bg-slate-50 rounded-2xl h-12 px-4 font-bold" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} required /></div>
                                <div className="form-group"><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Confirmação</label><input type="password" underline="false" className="w-full bg-slate-50 rounded-2xl h-12 px-4 font-bold" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required /></div>
                            </div>
                            <div className="flex justify-end"><button type="submit" disabled={saving} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase shadow-lg shadow-primary/20">{saving ? '...' : 'Alterar Senha'}</button></div>
                        </form>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Database size={20} className="text-primary" /> Exportação de Dados
                        </h2>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <p className="text-slate-600 mb-4 font-medium text-sm">
                                Baixe uma cópia completa dos dados da sua conta, incluindo informações de clientes, funcionários e configurações.
                                O arquivo será gerado em formato JSON.
                            </p>
                            <button
                                onClick={handleExportData}
                                disabled={exporting}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                <Download size={18} />
                                {exporting ? 'Gerando Arquivo...' : 'Baixar Backup Completo (JSON)'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
