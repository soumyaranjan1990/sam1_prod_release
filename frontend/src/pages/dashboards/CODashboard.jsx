import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, FileText, Eye, UploadCloud, CheckCircle2, ChevronRight, Filter, AlertCircle, X, Loader2, Clock, StopCircle, Shield, ClipboardCheck } from 'lucide-react';
import { api } from '../../api';

const CO_ACTIONABLE_STATUSES = [
    'SHOW_CAUSE_ISSUED',
    'REMINDER_1_SENT',
    'REMINDER_2_SENT',
    'FINAL_OPPORTUNITY_SENT',
    'EXPLANATION_RECEIVED',
    'MINOR_FINAL_ORDER_ISSUED',
    'DISCIPLINARY_ORDER_PENDING',
    'FINAL_ORDER_ISSUED_CONCURRED',
    'FINAL_ORDER_ISSUED_MODIFIED',
    'FINAL_ORDER_ISSUED_EX_PARTE'
];

const TIMER_ACTIVE_STATUSES = [
    'AWAITING_EMPLOYEE_RESPONSE',
    'REMINDER_1_SENT',
    'REMINDER_2_SENT',
    'FINAL_OPPORTUNITY_SENT',
];

const CODashboard = () => {
    const [cases, setCases] = useState([]);
    const [pendingCases, setPendingCases] = useState([]);
    const [servedCases, setServedCases] = useState([]);
    const [finalOrderCases, setFinalOrderCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    
    // Form states
    const [servedDate, setServedDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const data = await api.getCases();
            
            // 1. Pending Notices (Actionable)
            const actionable = data.filter(c => [
                'SHOW_CAUSE_ISSUED',
                'REMINDER_1_SENT',
                'REMINDER_2_SENT',
                'FINAL_OPPORTUNITY_SENT',
                'EXPLANATION_RECEIVED'
            ].includes(c.status));
            setPendingCases(actionable);

            // 2. Final Orders (Ready to be served)
            const finalOrders = data.filter(c => [
                'DISCIPLINARY_ORDER_PENDING',
                'FINAL_ORDER_ISSUED_CONCURRED',
                'FINAL_ORDER_ISSUED_MODIFIED',
                'MINOR_FINAL_ORDER_ISSUED',
                'FINAL_ORDER_ISSUED_EX_PARTE'
            ].includes(c.status));
            setFinalOrderCases(finalOrders);
            
            // 3. Served / In Progress (Timer Active or Appeal Window)
            const served = data.filter(c => [
                'AWAITING_EMPLOYEE_RESPONSE',
                'REMINDER_1_SENT',
                'REMINDER_2_SENT',
                'FINAL_OPPORTUNITY_SENT',
                'UNDER_DA_REVIEW_MAJOR',
                'APPEAL_WINDOW_OPEN'
            ].includes(c.status));
            setServedCases(served);

            setCases(data);
        } catch (err) {
            console.error('Failed to fetch cases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionTypeForStatus = (status) => {
        if (status === 'SHOW_CAUSE_ISSUED') return 'SERVE_SHOW_CAUSE';
        if (status === 'REMINDER_1_SENT') return 'SERVE_REMINDER_1';
        if (status === 'REMINDER_2_SENT') return 'SERVE_REMINDER_2';
        if (status === 'FINAL_OPPORTUNITY_SENT') return 'SERVE_FINAL_OPPORTUNITY';
        if (status === 'EXPLANATION_RECEIVED') return 'SUBMIT_EXPLANATION';
        if (status === 'DISCIPLINARY_ORDER_PENDING' || status.includes('FINAL_ORDER')) return 'SERVE_FINAL_ORDER';
        return 'UNKNOWN';
    };

    const calculateDaysLeft = (startDate, windowDays) => {
        if (!startDate) return windowDays;
        const start = new Date(startDate);
        const now = new Date();
        const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.max(0, windowDays - elapsed);
    };

    // Standard serve action (notice serving)
    const handleServeAction = async (e) => {
        e.preventDefault();
        setError(null);
        if (!file) {
            setError("Please upload the signed acknowledgement proof.");
            return;
        }
        setIsSubmitting(true);
        try {
            const uploadRes = await api.uploadFile(file);
            if (!uploadRes.document_path) throw new Error("File upload failed");
            const actionType = getActionTypeForStatus(selectedCase.status);
            await api.fetchWithAuth(`/cases/${selectedCase.id}/co-action`, {
                method: 'PUT',
                body: JSON.stringify({
                    action_type: actionType,
                    served_date: servedDate,
                    proof_path: uploadRes.document_path,
                    explanation_path: uploadRes.document_path
                })
            });
            setIsActionModalOpen(false);
            setFile(null);
            fetchCases();
        } catch (err) {
            setError(err.message || 'Failed to submit action');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Stop timer & submit explanation to DA
    const handleSubmitExplanation = async (e) => {
        e.preventDefault();
        setError(null);
        if (!file) {
            setError("Please upload the employee's explanation document.");
            return;
        }
        setIsSubmitting(true);
        try {
            const uploadRes = await api.uploadFile(file);
            if (!uploadRes.document_path) throw new Error("File upload failed");
            await api.fetchWithAuth(`/cases/${selectedCase.id}/co-action`, {
                method: 'PUT',
                body: JSON.stringify({
                    action_type: 'SUBMIT_EXPLANATION',
                    served_date: servedDate,
                    explanation_path: uploadRes.document_path,
                    proof_path: uploadRes.document_path
                })
            });
            setIsExplanationModalOpen(false);
            setFile(null);
            fetchCases();
        } catch (err) {
            setError(err.message || 'Failed to submit explanation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openExplanationModal = (c) => {
        setSelectedCase(c);
        setError(null);
        setFile(null);
        setServedDate(new Date().toISOString().split('T')[0]);
        setIsExplanationModalOpen(true);
    };

    const statusConfig = {
        'SHOW_CAUSE_ISSUED': { label: 'Serve Show Cause', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
        'REMINDER_1_SENT': { label: 'Serve Reminder 1', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
        'REMINDER_2_SENT': { label: 'Serve Reminder 2', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
        'FINAL_OPPORTUNITY_SENT': { label: 'Serve Final Opportunity', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
        'EXPLANATION_RECEIVED': { label: 'Submit to DA', color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
        'MINOR_FINAL_ORDER_ISSUED': { label: 'Serve Minor Order', color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20' },
        'DISCIPLINARY_ORDER_PENDING': { label: 'Serve Major Order', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        'FINAL_ORDER_ISSUED_CONCURRED': { label: 'Serve Concurred Order', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
        'FINAL_ORDER_ISSUED_MODIFIED': { label: 'Serve Modified Order', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        'FINAL_ORDER_ISSUED_EX_PARTE': { label: 'Serve Ex-Parte Order', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
    };

    const getActiveData = () => {
        if (activeTab === 'pending') return pendingCases;
        if (activeTab === 'final') return finalOrderCases;
        return servedCases;
    };

    return (
        <Layout userRole="CO">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Controlling Officer Portal</h2>
                        <p className="text-slate-400">Manage disciplinary notices and track service acknowledgements.</p>
                    </div>
                    <div className="bg-teal-500/10 text-teal-400 px-4 py-2 rounded-full border border-teal-500/20 text-sm font-medium">CONTROLLING OFFICER</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors">
                        <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><Eye className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Notices Pending</h3>
                            <p className="text-4xl font-black text-white">{pendingCases.length}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors border-l-4 border-l-purple-500">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><ClipboardCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Final Decisions</h3>
                            <p className="text-4xl font-black text-white">{finalOrderCases.length}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Clock className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Response</h3>
                            <p className="text-4xl font-black text-white">{servedCases.filter(c => TIMER_ACTIVE_STATUSES.includes(c.status)).length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Action Required</h3>
                        <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setActiveTab('pending')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none ${activeTab === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>Notices</button>
                            <button onClick={() => setActiveTab('final')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none ${activeTab === 'final' ? 'bg-purple-900 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>Final Orders</button>
                            <button onClick={() => setActiveTab('served')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none ${activeTab === 'served' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>Served / Tracking</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-sm bg-slate-900/30 font-medium text-slate-400 uppercase tracking-wider">
                                    <th className="p-4 pl-6 font-semibold">Case ID</th>
                                    <th className="p-4 font-semibold">Gravity</th>
                                    <th className="p-4 font-semibold">
                                        {activeTab === 'final' ? 'Decision Source' : (activeTab === 'served' ? 'Timer Status' : 'Action Type')}
                                    </th>
                                    <th className="p-4 text-right pr-6 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-slate-500">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                                            <p>Loading cases...</p>
                                        </td>
                                    </tr>
                                ) : getActiveData().length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-slate-500">
                                            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-teal-500/50" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-400">All caught up</p>
                                            <p className="text-sm mt-1">No cases currently in this section.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    getActiveData().map((c) => {
                                        const config = statusConfig[c.status] || { label: c.status, color: 'text-slate-400 bg-slate-800 border-slate-700' };
                                        
                                        const getSourceLabel = (status) => {
                                            if (status === 'FINAL_ORDER_ISSUED_MODIFIED') return 'CMD (Modified)';
                                            if (status === 'FINAL_ORDER_ISSUED_CONCURRED') return 'CC (Concurred)';
                                            if (status === 'MINOR_FINAL_ORDER_ISSUED') return 'DA (Minor)';
                                            if (status === 'FINAL_ORDER_ISSUED_EX_PARTE') return 'DA (Ex-Parte)';
                                            return 'DA (Direct)';
                                        };

                                        let daysLeft = null;
                                        if (activeTab === 'served' && c.window_start_date) {
                                            const isAppeal = c.status === 'APPEAL_WINDOW_OPEN';
                                            const windowSize = isAppeal ? 90 : (c.status === 'FINAL_OPPORTUNITY_SENT' ? 7 : 15);
                                            daysLeft = calculateDaysLeft(c.window_start_date, windowSize);
                                        }

                                        const isTimerActive = TIMER_ACTIVE_STATUSES.includes(c.status);
                                        const isMajor = c.gravity === 'MAJOR';

                                        return (
                                            <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-white">#{c.id}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        c.gravity === 'MAJOR' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    }`}>
                                                        {c.gravity}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {activeTab === 'final' ? (
                                                        <span className="flex items-center gap-2 text-sm font-bold text-white">
                                                            <Shield className="w-4 h-4 text-purple-400" />
                                                            {getSourceLabel(c.status)}
                                                        </span>
                                                    ) : activeTab === 'pending' ? (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    ) : (
                                                        daysLeft !== null ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                                                                daysLeft > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {daysLeft > 0 ? `${daysLeft} Days Left for Response` : 'Response Window Expired'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 italic text-sm">{c.status.replace(/_/g, ' ')}</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {activeTab === 'pending' ? (
                                                        <button 
                                                            onClick={() => { setSelectedCase(c); setError(null); setFile(null); setIsActionModalOpen(true); }}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all shadow-sm font-medium focus:outline-none"
                                                        >
                                                            {c.status === 'EXPLANATION_RECEIVED' ? 'Submit to DA' : 'Serve Notice'} <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    ) : activeTab === 'final' ? (
                                                        <button 
                                                            onClick={() => { setSelectedCase(c); setError(null); setFile(null); setIsActionModalOpen(true); }}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-sm font-medium focus:outline-none"
                                                        >
                                                            Serve & Start Appeal Window <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        // In "Served Notices" tab — show "Stop Timer & Submit" for cases in active-timer statuses
                                                        isTimerActive ? (
                                                            <button
                                                                onClick={() => openExplanationModal(c)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                                title="Employee has submitted response — stop timer and forward to DA"
                                                            >
                                                                <StopCircle className="w-4 h-4" />
                                                                Stop Timer &amp; Submit to DA
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.status.replace(/_/g, ' ')}</span>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Standard Serve Notice Modal */}
                {isActionModalOpen && selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/30">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {selectedCase.status === 'EXPLANATION_RECEIVED' ? 'Review & Submit to DA' : 'Serve Notice to Employee'}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">Case #{selectedCase.id} • {statusConfig[selectedCase.status]?.label}</p>
                                </div>
                                <button onClick={() => setIsActionModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors focus:outline-none">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleServeAction} className="p-6 flex-1 overflow-y-auto space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {selectedCase.status === 'EXPLANATION_RECEIVED' ? 'Date of Submission' : 'Date Served & Acknowledged'}
                                        </label>
                                        <input 
                                            type="date"
                                            required
                                            value={servedDate}
                                            onChange={(e) => setServedDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {selectedCase.status === 'EXPLANATION_RECEIVED' ? 'Explanation Document' : 'Acknowledgement Document Proof'}
                                        </label>
                                        <div className="p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center relative hover:border-primary-500/50 transition-colors group cursor-pointer">
                                            <input 
                                                type="file" 
                                                required
                                                onChange={(e) => setFile(e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept="image/*,application/pdf"
                                            />
                                            {file ? (
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-10 h-10 text-primary-400 mb-2" />
                                                    <p className="text-primary-300 font-medium text-center">{file.name}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-primary-400 transition-colors" />
                                                    <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                                                    <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-800 pt-6 flex justify-end gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsActionModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Submit Service Proof
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Stop Timer & Submit Explanation Modal */}
                {isExplanationModalOpen && selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-emerald-700/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-emerald-900/10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <StopCircle className="w-5 h-5 text-emerald-400" />
                                        <h3 className="text-xl font-bold text-white">Stop Timer & Submit Explanation to DA</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm">Case #{selectedCase.id} &bull; Major Penalty — Window will be stopped immediately upon submission.</p>
                                </div>
                                <button onClick={() => setIsExplanationModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors focus:outline-none">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmitExplanation} className="p-6 flex-1 overflow-y-auto space-y-5">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Info banner */}
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-emerald-300 space-y-1">
                                        <p className="font-semibold">Employee Response Received</p>
                                        <p className="text-emerald-300/70">Upload the explanation document provided by the employee. Once submitted, the response timer will stop and the case will be forwarded to the Disciplinary Authority (DA) for review.</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Date of Response Receipt</label>
                                    <input 
                                        type="date"
                                        required
                                        value={servedDate}
                                        onChange={(e) => setServedDate(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">The date on which the employee submitted the explanation to you.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Employee Explanation Document</label>
                                    <div className="p-6 border-2 border-dashed border-emerald-800/40 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center relative hover:border-emerald-500/50 transition-colors group cursor-pointer">
                                        <input 
                                            type="file" 
                                            required
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*,application/pdf"
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-10 h-10 text-emerald-400 mb-2" />
                                                <p className="text-emerald-300 font-medium text-center">{file.name}</p>
                                                <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-emerald-400 transition-colors" />
                                                <p className="text-slate-300 font-medium">Click to upload explanation document</p>
                                                <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-800 pt-5 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsExplanationModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <StopCircle className="w-4 h-4" />
                                        Stop Timer & Submit to DA
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

export default CODashboard;
