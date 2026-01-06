import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { schedulingApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Calendar, Clock, Settings, Save, CheckCircle, User, ChevronRight, AlertCircle, Plus, X } from 'lucide-react';

interface Appointment {
    id: string;
    scheduled_at: string;
    end_at: string;
    name: string;
    phone: string;
    status: string;
    purpose?: string;
}

interface DaySchedule {
    enabled: boolean;
    intervals: { start: string; end: string }[];
}

interface Config {
    slotDuration: number;
    days: { [key: string]: DaySchedule };
}

export default function AppointmentsPage() {
    const [activeTab, setActiveTab] = useState<'appointments' | 'settings'>('appointments');
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [config, setConfig] = useState<Config | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const { socket } = useChatStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAppt, setNewAppt] = useState({ name: '', phone: '', time: '', purpose: '' });

    const weekDirs: { [key: string]: string } = {
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
        sunday: 'Domingo'
    };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            if (activeTab === 'appointments') loadData();
        };
        socket.on('appointment_updated', handleUpdate);
        return () => { socket.off('appointment_updated', handleUpdate); };
    }, [socket, activeTab, selectedDate]);

    useEffect(() => {
        loadData();
    }, [activeTab, selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'appointments') {
                const res = await schedulingApi.listAppointments(selectedDate, selectedDate);
                if (res.success && res.data) {
                    setAppointments(res.data.appointments);
                }
            } else {
                const res = await schedulingApi.getConfig();
                if (res.success && res.data) {
                    setConfig(res.data.config);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await schedulingApi.saveConfig(config);
            setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            setMessage({ text: 'Erro ao salvar configurações.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleConfigChange = (day: string, field: string, value: any) => {
        if (!config) return;

        const newConfig = { ...config };
        if (field === 'enabled') {
            newConfig.days[day].enabled = value;
        } else if (field === 'start') {
            // Assuming single interval for UI simplicity
            if (!newConfig.days[day].intervals.length) newConfig.days[day].intervals = [{ start: '09:00', end: '18:00' }];
            newConfig.days[day].intervals[0].start = value;
        } else if (field === 'end') {
            if (!newConfig.days[day].intervals.length) newConfig.days[day].intervals = [{ start: '09:00', end: '18:00' }];
            newConfig.days[day].intervals[0].end = value;
        }
        setConfig(newConfig);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const handleCreateAppointment = async () => {
        if (!newAppt.name || !newAppt.phone || !newAppt.time) {
            setMessage({ text: 'Por favor, preencha todos os campos obrigatórios.', type: 'error' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        try {
            await schedulingApi.createAppointment({
                date: selectedDate,
                ...newAppt
            });
            setIsModalOpen(false);
            setNewAppt({ name: '', phone: '', time: '', purpose: '' });
            setMessage({ text: 'Agendamento criado com sucesso!', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
            loadData();
        } catch (e) {
            setMessage({ text: 'Erro ao criar agendamento.', type: 'error' });
        }
    };

    return (
        <MainLayout>
            <div className="mb-8 pl-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Inteligente</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">Gerencie horários e acompanhe os agendamentos da IA</p>
            </div>
            <div className="flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'appointments' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calendar size={16} /> Agendamentos
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16} /> Configurações
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm min-h-[500px] p-8">
                    {activeTab === 'appointments' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="text-primary" />
                                    Agendamentos do Dia
                                </h2>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:border-primary focus:outline-none"
                                />
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="ml-4 bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-slate-400">Carregando...</div>
                            ) : appointments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                                    <Calendar size={48} className="text-slate-200" />
                                    <p>Nenhum agendamento para este dia.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {appointments.map(appt => (
                                        <div key={appt.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-primary/10 p-3 rounded-xl text-primary font-bold text-lg min-w-[80px] text-center">
                                                    {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">{appt.name}</h3>
                                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mt-1">
                                                        <User size={14} />
                                                        {appt.phone}
                                                    </div>
                                                    {appt.purpose && (
                                                        <div className="mt-2 text-slate-600 text-sm bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-100">
                                                            {appt.purpose}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`mt-4 md:mt-0 px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${getStatusColor(appt.status)}`}>
                                                {appt.status === 'confirmed' ? 'Confirmado' : appt.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Configuração de Horários</h2>
                                    <p className="text-slate-500 mt-1">Defina quando a IA pode marcar atendimentos.</p>
                                </div>
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                                </button>
                            </div>

                            {loading || !config ? (
                                <div className="text-center py-20 text-slate-400">Carregando configurações...</div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <label className="block text-slate-700 font-bold mb-2 flex items-center gap-2">
                                            <Clock size={18} /> Duração do Atendimento (minutos)
                                        </label>
                                        <p className="text-sm text-slate-500 mb-4">Tempo médio reservado para cada cliente.</p>
                                        <input
                                            type="number"
                                            value={config.slotDuration}
                                            onChange={(e) => setConfig({ ...config, slotDuration: parseInt(e.target.value) })}
                                            className="w-full max-w-[200px] px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none font-bold text-lg"
                                        />
                                    </div>

                                    <div className="grid gap-4">
                                        {Object.entries(weekDirs).map(([key, label]) => (
                                            <div key={key} className={`p-6 rounded-2xl border transition-all ${config.days[key]?.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-70'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.days[key]?.enabled || false}
                                                            onChange={(e) => handleConfigChange(key, 'enabled', e.target.checked)}
                                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className={`font-bold text-lg ${config.days[key]?.enabled ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                                                    </div>
                                                </div>

                                                {config.days[key]?.enabled && (
                                                    <div className="flex items-center gap-4 pl-8">
                                                        <div className="flex-1">
                                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Abertura</label>
                                                            <input
                                                                type="time"
                                                                value={config.days[key]?.intervals[0]?.start || '09:00'}
                                                                onChange={(e) => handleConfigChange(key, 'start', e.target.value)}
                                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 font-medium focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                        <span className="text-slate-300 mt-4"><ChevronRight /></span>
                                                        <div className="flex-1">
                                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fechamento</label>
                                                            <input
                                                                type="time"
                                                                value={config.days[key]?.intervals[0]?.end || '18:00'}
                                                                onChange={(e) => handleConfigChange(key, 'end', e.target.value)}
                                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 font-medium focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-black text-slate-900 mb-6">Novo Agendamento</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Cliente</label>
                                <input
                                    type="text"
                                    value={newAppt.name}
                                    onChange={e => setNewAppt({ ...newAppt, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:outline-none bg-slate-50"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
                                <input
                                    type="text"
                                    value={newAppt.phone}
                                    onChange={e => setNewAppt({ ...newAppt, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:outline-none bg-slate-50"
                                    placeholder="Ex: 5511999999999"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Horário</label>
                                    <input
                                        type="time"
                                        value={newAppt.time}
                                        onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:outline-none bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
                                <input
                                    type="text"
                                    value={newAppt.purpose}
                                    onChange={e => setNewAppt({ ...newAppt, purpose: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:outline-none bg-slate-50"
                                    placeholder="Ex: Reunião de alinhamento"
                                />
                            </div>

                            <button
                                onClick={handleCreateAppointment}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 mt-4 transition-all"
                            >
                                Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
