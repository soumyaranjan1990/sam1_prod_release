import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Bell, CheckCircle2, Clock, ChevronRight, Inbox, MailOpen } from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await api.fetchWithAuth('/notifications/');
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const timeAgo = (isoString) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <Layout userRole="GENERIC">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Notifications</h2>
                        <p className="text-slate-400">Stay updated on case progress and pending actions.</p>
                    </div>
                    <div className="p-3 bg-primary-500/10 text-primary-400 rounded-2xl border border-primary-500/20">
                        <Bell className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[500px]">
                    {isLoading ? (
                        <div className="p-20 flex justify-center">
                            <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700">
                                <Inbox className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="text-lg font-medium">All caught up!</p>
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-6 flex items-start gap-4 transition-all cursor-pointer border-l-4 ${
                                        notif.is_read 
                                            ? 'border-transparent bg-transparent opacity-60 grayscale-[0.3]' 
                                            : 'border-primary-500 bg-primary-500/[0.03] hover:bg-primary-500/[0.06]'
                                    }`}
                                >
                                    <div className={`mt-1 p-2 rounded-lg ${notif.is_read ? 'bg-slate-800 text-slate-500' : 'bg-primary-500/20 text-primary-400'}`}>
                                        {notif.is_read ? <MailOpen className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold ${notif.is_read ? 'text-slate-300' : 'text-white text-lg'}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="pt-2 flex items-center gap-2 text-xs font-bold text-primary-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                            Take Action <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Notifications;
