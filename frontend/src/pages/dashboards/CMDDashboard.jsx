import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
    User, FileText, Bell, Users, CheckCheck, ChevronRight, Scale, X,
    ShieldCheck, Loader2, AlertCircle, UserCheck, UserX, Briefcase, Send,
    Building2, Calendar, Tag
} from 'lucide-react';
import { api } from '../../api';
import { useOfficerAvailability } from '../../hooks/useOfficerAvailability';

const ROLE_LABELS = {
    DA: 'Disciplinary Authority',
    CO: 'Controlling Officer',
    ENQUIRY_OFFICER: 'Enquiry Officer',
    COMPLAINT_OFFICER: 'Complaint Officer',
    CONCURRENCE_COMMITTEE: 'Concurrence Committee',
};

const CMDDashboard = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({ unassigned: 0, active: 0, pending: 0 });
    const [loadingNotifs, setLoadingNotifs] = useState(true);
    const [loadingComplaints, setLoadingComplaints] = useState(true);
    const [modifiedCases, setModifiedCases] = useState([]);
    const [assignedCases, setAssignedCases] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    
    // Derived state for overdue cases (Pending Action)
    const overdueCases = assignedCases.filter(c => 
        c.enquiry_deadline && 
        new Date(c.enquiry_deadline) < new Date() && 
        ['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status)
    );
    
    // Shared Data Hook
    const { availability: officerAvailability, loading: loadingOfficers, eos: eosAvailable, cos: cosAvailable, das: dasAvailable } = useOfficerAvailability();

    // Modals
    const [selectedCase, setSelectedCase] = useState(null);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [assignment, setAssignment] = useState({ eo_id: '', co_id: '', da_id: '', deadline: '', wing: '', wing_details: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignError, setAssignError] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchStats();
        fetchModifiedCases();
        fetchAssignedCases();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await api.fetchWithAuth('/notifications/');
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setLoadingNotifs(false); }
    };

    const fetchStats = async () => {
        try {
            const statsData = await api.fetchWithAuth('/complaints/stats');
            setStats(statsData);
            const complaintsData = await api.fetchWithAuth('/complaints/?limit=1000');
            const pending = Array.isArray(complaintsData)
                ? complaintsData.filter(c => c.status === 'REGISTERED')
                : [];
            setComplaints(pending);
        } catch (err) { console.error(err); }
        finally { setLoadingComplaints(false); }
    };

    const fetchModifiedCases = async () => {
        try {
            const data = await api.fetchWithAuth('/cases/');
            const modified = Array.isArray(data)
                ? data.filter(c => c.status === 'REFERRED_TO_CMD_BY_CC')
                : [];
            setModifiedCases(modified);
        } catch (err) { console.error(err); }
    };

    const fetchAssignedCases = async () => {
        try {
            const data = await api.fetchWithAuth('/cases/');
            const assigned = Array.isArray(data)
                ? data.filter(c => c.status !== 'REGISTERED' && c.status !== 'REFERRED_TO_CMD_BY_CC')
                : [];
            setAssignedCases(assigned);
        } catch (err) { console.error(err); }
    };



    const handleIssueFinalOrder = async () => {
        setIsSubmitting(true);
        try {
            await api.fetchWithAuth(`/cases/${selectedCase.id}/cmd-settle`, {
                method: 'PUT',
                body: JSON.stringify({
                    comments: "Final order settled and approved by CMD.",
                    final_punishment_details: selectedCase.cc_modified_details
                })
            });
            await fetchModifiedCases();
            setIsSettleModalOpen(false);
        } catch (err) {
            alert('Failed to settle final order: ' + err.message);
        } finally { setIsSubmitting(false); }
    };

    const handleOpenAssign = (complaint) => {
        setSelectedComplaint(complaint);
        setAssignment({ eo_id: '', co_id: '', da_id: '', deadline: '', wing: '', wing_details: '' });
        setAssignError(null);
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        
        let caseId = selectedComplaint?.case_id;
        
        // Final fallback: if case_id is missing from list, try fetching full object
        if (!caseId && selectedComplaint?.id) {
            try {
                const fullComplaint = await api.fetchWithAuth(`/complaints/${selectedComplaint.id}`);
                caseId = fullComplaint?.case_id;
            } catch (err) {
                console.error("Linkage recovery failed:", err);
            }
        }

        if (!caseId) {
            setAssignError(
                <div className="text-left space-y-1">
                    <p className="font-bold underline mb-1">Linkage Error Diagnosis:</p>
                    <p>Complaint ID: {selectedComplaint?.id}</p>
                    <p>Keys found: {Object.keys(selectedComplaint || {}).join(', ')}</p>
                    <p>case_id value: {String(selectedComplaint?.case_id)}</p>
                    <p>Status: {selectedComplaint?.status}</p>
                    <p className="mt-2 text-[10px] opacity-70 italic">Please take a screenshot of this and send to support.</p>
                </div>
            );
            return;
        }
        if (!assignment.eo_id && !assignment.co_id && !assignment.da_id) {
            setAssignError("Please assign at least one officer.");
            return;
        }
        setIsSubmitting(true);
        setAssignError(null);
        try {
            await api.fetchWithAuth(`/cases/${caseId}/assign`, {
                method: 'PATCH',
                body: JSON.stringify({
                    enquiry_officer_id: assignment.eo_id ? parseInt(assignment.eo_id) : null,
                    controlling_officer_id: assignment.co_id ? parseInt(assignment.co_id) : null,
                    disciplinary_authority_id: assignment.da_id ? parseInt(assignment.da_id) : null,
                    enquiry_deadline: assignment.deadline || null,
                    assigned_wing: assignment.wing || null,
                    wing_details: assignment.wing_details || null,
                    gravity: "MINOR"
                })
            });
            setIsAssignModalOpen(false);
            fetchOfficerAvailability();
            fetchStats();
        } catch (err) {
            setAssignError(err.message || 'Assignment failed. Please try again.');
        } finally { setIsSubmitting(false); }
    };

    const markAllRead = async () => {
        try {
            await api.fetchWithAuth('/notifications/mark-all-read', { method: 'PATCH' });
            setNotifications(n => n.map(x => ({ ...x, is_read: true })));
        } catch {}
    };

    const markRead = async (id) => {
        try {
            await api.fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
        } catch {}
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const timeAgo = (iso) => {
        const diff = Date.now() - new Date(iso).getTime();
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
                        <p className="text-slate-400">Review complaints, assign officers, and manage disciplinary proceedings.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5" /> {unreadCount} new
                            </div>
                        )}
                        <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20 text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4" /> CMD
                        </div>
                        {modifiedCases.length > 0 && (
                            <div className="bg-teal-500 animate-pulse text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 ring-4 ring-teal-500/20 shadow-lg shadow-teal-500/40">
                                <Scale className="w-3.5 h-3.5" /> CC MODIFIED
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Unassigned Complaints', value: stats.unassigned, color: 'red', icon: FileText },
                        { label: 'Active Enquiries', value: stats.active, color: 'blue', icon: Users },
                        { label: 'Pending Orders', value: stats.pending, color: 'green', icon: Briefcase },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                            <div className={`p-3 bg-${s.color}-500/10 text-${s.color}-500 rounded-xl`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</h3>
                                <p className="text-4xl font-black text-white">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area with Tabs */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-1 border-b border-slate-800 flex bg-slate-800/20">
                                <button 
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold transition-all ${
                                        activeTab === 'pending' ? 'text-amber-500 bg-amber-500/10 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" /> Pending Assignments ({complaints.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('assigned')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold transition-all ${
                                        activeTab === 'assigned' ? 'text-blue-500 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" /> Assigned Cases ({assignedCases.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('overdue')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold transition-all ${
                                        activeTab === 'overdue' ? 'text-red-500 bg-red-500/10 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <AlertCircle className={`w-4 h-4 ${overdueCases.length > 0 ? 'animate-pulse' : ''}`} /> 
                                    Pending Action ({overdueCases.length})
                                </button>
                            </div>

                            {activeTab === 'pending' ? (
                                <>
                                    {loadingComplaints ? (
                                        <div className="p-12 flex justify-center">
                                            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                        </div>
                                    ) : complaints.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                                            <FileText className="w-12 h-12 opacity-20" />
                                            <p>No complaints pending assignment.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                                        <th className="px-6 py-4">File Number</th>
                                                        <th className="px-6 py-4">Complaint</th>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {complaints.map((c) => (
                                                        <tr key={c.id} className="hover:bg-amber-500/5 transition-all group">
                                                            <td className="px-6 py-5">
                                                                <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                                                                    {c.file_number}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-white font-semibold text-sm">{c.complaint_title}</div>
                                                                <div className="text-slate-500 text-[11px] mt-1">{c.department || 'DVC'}</div>
                                                            </td>
                                                            <td className="px-6 py-5 text-slate-400 text-xs font-mono">{c.date_of_receipt}</td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button
                                                                    onClick={() => handleOpenAssign(c)}
                                                                    className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider hover:text-amber-400 transition-all"
                                                                >
                                                                    Assign Officers <ChevronRight className="w-3 h-3" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'assigned' ? (
                                <>
                                    {assignedCases.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                                            <Briefcase className="w-12 h-12 opacity-20" />
                                            <p>No assigned cases to track.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                                        <th className="px-6 py-4">Case ID</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Enquiry Deadline</th>
                                                        <th className="px-6 py-4">Assigned EO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {assignedCases.map((c) => {
                                                        const isOverdue = c.enquiry_deadline && new Date(c.enquiry_deadline) < new Date() && ['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status);
                                                        return (
                                                            <tr key={c.id} className="hover:bg-blue-500/5 transition-all group">
                                                                <td className="px-6 py-5">
                                                                    <span className="font-mono text-blue-500 font-bold text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                                                                        CASE-{c.id}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                                        ['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status) ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'
                                                                    }`}>
                                                                        {c.status.replace(/_/g, ' ')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    {c.enquiry_deadline ? (
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-sm font-bold ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
                                                                                {new Date(c.enquiry_deadline).toLocaleDateString()}
                                                                            </span>
                                                                            {isOverdue && <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Deadline Passed</span>}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-600 italic text-xs">No deadline</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                                                            <User className="w-3 h-3" />
                                                                        </div>
                                                                        <span className="text-xs text-white font-medium">
                                                                            EO ID: {c.enquiry_officer_id}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {overdueCases.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                                            <CheckCheck className="w-12 h-12 opacity-20 text-green-500" />
                                            <p>No cases are currently overdue. Well done!</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                                        <th className="px-6 py-4">Case ID / File</th>
                                                        <th className="px-6 py-4">Current EO</th>
                                                        <th className="px-6 py-4">Deadline Status</th>
                                                        <th className="px-6 py-4 text-right">Emergency Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {overdueCases.map((c) => (
                                                        <tr key={c.id} className="hover:bg-red-500/5 transition-all group">
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="font-mono text-red-500 font-bold text-xs bg-red-500/10 border border-red-500/20 px-2 py-1 rounded w-fit">
                                                                        CASE-{c.id}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 font-mono italic">
                                                                        File: {c.complaint?.file_number}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <UserX className="w-4 h-4 text-slate-500" />
                                                                    <span className="text-xs text-white font-medium">EO ID: {c.enquiry_officer_id}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-red-400">
                                                                        Expired on {new Date(c.enquiry_deadline).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-red-500 font-black uppercase">ACTION OVERDUE</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button
                                                                    onClick={() => handleOpenAssign(c.complaint)}
                                                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ml-auto shadow-lg shadow-red-500/20 border border-red-400/30"
                                                                >
                                                                    <Users className="w-3.5 h-3.5" /> Re-assign
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* CC Modified Cases */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-teal-500/10">
                                <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                                    <Scale className="w-4 h-4" /> CC Modified Orders
                                </h3>
                                <span className="bg-teal-500/20 text-teal-400 text-[10px] font-bold px-2 py-1 rounded-full border border-teal-500/30">
                                    {modifiedCases.length} pending
                                </span>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-800/50">
                                {modifiedCases.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 italic text-xs">No modifications pending.</div>
                                ) : modifiedCases.map(c => (
                                    <div key={c.id} className="p-5 hover:bg-slate-800/30 cursor-pointer group"
                                        onClick={() => { setSelectedCase(c); setIsSettleModalOpen(true); }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-teal-500 font-bold text-[10px] bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">CASE-{c.id}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Modified</span>
                                        </div>
                                        <p className="text-white text-xs font-semibold mb-2 group-hover:text-teal-400">{c.cc_modified_details}</p>
                                        <div className="flex justify-end">
                                            <span className="text-teal-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">Review & Issue <ChevronRight className="w-3 h-3" /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-amber-400" /> Recent Alerts
                                </h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all" title="Mark all read">
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {loadingNotifs ? (
                                    <div className="p-8 flex justify-center"><div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-slate-600 gap-3 text-center">
                                        <Bell className="w-10 h-10 opacity-10" />
                                        <p className="text-xs">No recent notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-800/50">
                                        {notifications.map((n) => (
                                            <div key={n.id}
                                                onClick={async () => { if (!n.is_read) await markRead(n.id); if (n.link) navigate(n.link); }}
                                                className={`p-5 cursor-pointer transition-all border-l-2 ${n.is_read ? 'border-transparent opacity-60 hover:opacity-100' : 'border-amber-500 bg-amber-500/[0.03]'}`}
                                            >
                                                <div className="flex justify-between items-start gap-3 mb-1">
                                                    <p className={`font-bold text-xs uppercase tracking-tight ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                                                    <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">{timeAgo(n.created_at)}</span>
                                                </div>
                                                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CC Modification Settle Modal */}
                {isSettleModalOpen && selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSettleModalOpen(false)} />
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-teal-500/10 text-teal-400">
                                <h3 className="text-xl font-bold tracking-tight">CC Modification Review</h3>
                                <button onClick={() => setIsSettleModalOpen(false)}><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">CC Modification</h4>
                                    <p className="text-white font-semibold text-sm leading-relaxed">{selectedCase.cc_modified_details}</p>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                    <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-200/80 leading-relaxed">Your approval will finalize and issue this order.</p>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
                                    <button onClick={() => setIsSettleModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium">Defer</button>
                                    <button onClick={handleIssueFinalOrder} disabled={isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                                        {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <CheckCheck className="w-4 h-4" />}
                                        Issue Final Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Officers Modal */}
                {isAssignModalOpen && selectedComplaint && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)} />
                        <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-amber-500/10">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Review & Assign Officers</h3>
                                    <p className="text-slate-400 text-sm mt-1">File: <span className="font-mono text-amber-400">{selectedComplaint.file_number}</span></p>
                                </div>
                                <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAssignSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {/* Comprehensive Complaint Registry Details */}
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-amber-500" /> Registry Details
                                        </h4>
                                        <span className="text-[10px] font-mono text-amber-500/80">{selectedComplaint.date_of_receipt}</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* Meta Grid */}
                                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                <span className="text-slate-500 block uppercase mb-1">Department</span>
                                                <span className="text-slate-200 font-bold flex items-center gap-1.5"><Building2 className="w-2.5 h-2.5" /> {selectedComplaint.department || 'N/A'}</span>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                <span className="text-slate-500 block uppercase mb-1">Mode</span>
                                                <span className="text-slate-200 font-bold flex items-center gap-1.5"><Tag className="w-2.5 h-2.5" /> {selectedComplaint.complaint_mode}</span>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                <span className="text-slate-500 block uppercase mb-1">Category</span>
                                                <span className="text-slate-200 font-bold">{selectedComplaint.complaint_category}</span>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                <span className="text-slate-500 block uppercase mb-1">Type</span>
                                                <span className="text-slate-200 font-bold">{selectedComplaint.complaint_type}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/30">
                                            <div className="text-white font-bold text-sm mb-1">{selectedComplaint.complaint_title}</div>
                                            <div className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{selectedComplaint.details}</div>
                                        </div>

                                        {/* Tagged Employees */}
                                        {selectedComplaint.employees && selectedComplaint.employees.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Involved Employees</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedComplaint.employees.map((assoc, idx) => (
                                                        <div key={idx} className="bg-amber-500/5 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-amber-500">{assoc.employee?.employee_id}</span>
                                                            <span className="text-[10px] text-slate-300 font-bold">{assoc.employee?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {assignError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{assignError}</p>
                                    </div>
                                )}

                                {[
                                    { label: 'Enquiry Officer (EO)', key: 'eo_id', options: eosAvailable },
                                    { label: 'Controlling Officer (CO)', key: 'co_id', options: cosAvailable },
                                    { label: 'Disciplinary Authority (DA)', key: 'da_id', options: dasAvailable },
                                ].map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest">{field.label}</label>
                                        <select
                                            value={assignment[field.key]}
                                            onChange={e => setAssignment(a => ({ ...a, [field.key]: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
                                        >
                                            <option value="">— Not assigned —</option>
                                            {field.options.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.username} ({o.active_cases} active · {o.availability})
                                                </option>
                                            ))}
                                        </select>
                                        {field.options.length === 0 && (
                                            <p className="text-xs text-slate-500 italic">No {field.label.split('(')[0].trim()} officers registered yet.</p>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest">Enquiry Deadline</label>
                                        <input type="date" value={assignment.deadline}
                                            onChange={e => setAssignment(a => ({ ...a, deadline: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest">Assign to Wing</label>
                                        <select
                                            value={assignment.wing}
                                            onChange={e => setAssignment(a => ({ ...a, wing: e.target.value, wing_details: e.target.value === 'AUTHORIZED_SERVICES' ? a.wing_details : '' }))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none text-sm"
                                        >
                                            <option value="">— Select Wing —</option>
                                            <option value="VIGILANCE">Vigilance Wing</option>
                                            <option value="AUDIT">Audit Wing</option>
                                            <option value="QC">QC Wing</option>
                                            <option value="AUTHORIZED_SERVICES">Authorized Services</option>
                                        </select>
                                    </div>
                                </div>

                                {assignment.wing === 'AUTHORIZED_SERVICES' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest">Authorized Services (Sub-option) *</label>
                                        <select
                                            required
                                            value={assignment.wing_details}
                                            onChange={e => setAssignment(a => ({ ...a, wing_details: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm appearance-none"
                                        >
                                            <option value="">— Select Option —</option>
                                            <option value="DPE">DPE (based on complaint type)</option>
                                            <option value="DE/Constn/MRT">DE / Constn / MRT</option>
                                            <option value="DE/Technical">DE / Technical</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                )}

                                <div className="border-t border-slate-800 pt-5 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAssignModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-all disabled:opacity-50 flex items-center gap-2 font-bold">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Assign Officers</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CMDDashboard;
