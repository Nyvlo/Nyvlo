import { useEffect, useState } from 'react';
import { AlertCircle, X, Bell, Info, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: number;
    created_at: string;
}

export default function NotificationBanner() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [visible, setVisible] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get<any>('/api/tenants/me/notifications');
            if (response.success) {
                const unread = response.data.notifications.filter((n: Notification) => n.is_read === 0);
                setNotifications(unread);
                if (unread.length > 0) {
                    setVisible(true);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/api/tenants/me/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.length <= 1) {
                setVisible(false);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    if (!visible || notifications.length === 0) return null;

    const current = notifications[0];

    const bgColor = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    }[current.type];

    const Icon = {
        info: Info,
        warning: AlertTriangle,
        error: AlertCircle,
        success: Bell
    }[current.type];

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] max-w-md w-full animate-in slide-in-from-bottom-5 duration-300 shadow-2xl rounded-2xl border p-4 ${bgColor}`}>
            <div className="flex items-start gap-3">
                <div className="mt-1">
                    <Icon size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm leading-tight">{current.title}</h4>
                    <p className="text-xs mt-1 opacity-90">{current.message}</p>
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={() => markAsRead(current.id)}
                            className="text-[10px] uppercase tracking-wider font-black px-3 py-1.5 bg-white/50 hover:bg-white rounded-lg transition-colors border border-black/5"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
