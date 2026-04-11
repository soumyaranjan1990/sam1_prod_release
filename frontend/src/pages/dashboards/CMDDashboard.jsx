import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { User, FileText, Bell, Users, CheckCheck, Circle, ChevronRight } from 'lucide-react';
import { api } from '../../api';

const CMDDashboard = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({ unassigned: 0, active: 0, pending: 0 });
    const [loadingNotifs, setLoadingNotifs] = useState(true);
    const [loadingComplaints, setLoadingComplaints] = useState(true);

    useEffect(() => {
        fetchNotifications();
        fetchStats();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await api.fetchWithAuth('/notifications/');
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoadingNotifs(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Fetch real stats
            const statsData = await api.fetchWithAuth('/complaints/stats');
            setStats(statsData);

            // Fetch a larger slice so older pending files are also visible to CMD.
            const complaintsData = await api.fetchWithAuth('/complaints/?limit=1000');
            const pendingComplaints = Array.isArray(complaintsData)
                ? complaintsData.filter(c => c.status === 'REGISTERED')
                : [];
            setComplaints(pendingComplaints);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoadingComplaints(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.fetchWithAuth('/notifications/mark-all-read', { method: 'PATCH' });
            setNotifications(notifs => notifs.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const markRead = async (id) => {
        try {
            await api.fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(notifs =>
                notifs.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) { /* silently */ }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <Layout userRole="CMD">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">CMD Dashboard</h2>
                        <p className="text-slate-400">Review new complaints and assign Enquiry Officers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <div className="relative">
                                <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                    <Bell className="w-3.5 h-3.5" />
                                    {unreadCount} new
                                </div>
                            </div>
                        )}
                        <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20 text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4" />
                            CMD
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Unassigned Complaints</h3>
                            <p className="text-4xl font-black text-white">{stats.unassigned}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Enquiries</h3>
                            <p className="text-4xl font-black text-white">{stats.active}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Disciplinary Orders</h3>
                            <p className="text-4xl font-black text-white">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Pending Assignments */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                    Pending Assignments
                                </h3>
                                <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded-full border border-amber-500/20">
                                    {stats.unassigned} pending
                                </span>
                            </div>
                            
                            {loadingComplaints ? (
                                <div className="p-12 flex justify-center">
                                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                </div>
                            ) : complaints.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p>No complaints are currently pending assignment.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                                <th className="px-6 py-4">File Number</th>
                                                <th className="px-6 py-4">Complaint Title</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {complaints.map((c) => (
                                                <tr 
                                                    key={c.id} 
                                                    onClick={() => navigate(`/complaints/cmd/${c.id}`)}
                                                    className="hover:bg-amber-500/5 transition-all cursor-pointer group"
                                                >
                                                    <td className="px-6 py-5">
                                                        <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                                                            {c.file_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
                                                            {c.complaint_title}
                                                        </div>
                                                        <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-2">
                                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-tighter font-bold">
                                                                {c.department || 'DVC'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-slate-400 text-xs font-mono">
                                                        {c.date_of_receipt}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                                            {c.status === 'ALLEGATION_PROVED' ? 'Take DC Action' : 'Review & Assign'}
                                                            <ChevronRight className="w-3 h-3" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Notifications */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden sticky top-6">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-amber-400" />
                                    Recent Alerts
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[600px] overflow-y-auto">
                                {loadingNotifs ? (
                                    <div className="p-8 flex justify-center">
                                        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-slate-600 gap-3 text-center">
                                        <Bell className="w-10 h-10 opacity-10" />
                                        <p className="text-xs">No recent notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-800/50">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={async () => {
                                                    if (!notif.is_read) await markRead(notif.id);
                                                    if (notif.link) navigate(notif.link);
                                                }}
                                                className={`p-5 cursor-pointer transition-all border-l-2
                                                    ${notif.is_read
                                                        ? 'border-transparent opacity-60 hover:opacity-100 grayscale-[0.5]'
                                                        : 'border-amber-500 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start gap-3 mb-1">
                                                    <p className={`font-bold text-xs uppercase tracking-tight ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">
                                                        {timeAgo(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default CMDDashboard;
