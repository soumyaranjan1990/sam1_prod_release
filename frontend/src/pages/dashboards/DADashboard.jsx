import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, Gavel, AlertTriangle, ChevronRight, CheckCircle2, ShieldCheck, Clock, Send, X, ExternalLink } from 'lucide-react';
import { api } from '../../api';

const DADashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const data = await api.getCases();
            setCases(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch DA cases:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (c) => {
        setSelectedCase(c);
        setIsModalOpen(true);
        setActionType('');
        setComments('');
    };

    const handleSubmitAction = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.fetchWithAuth(`/cases/${selectedCase.id}/da-action`, {
                method: 'PUT',
                body: JSON.stringify({ action_type: actionType, comments })
            });
            await fetchCases();
            setIsModalOpen(false);
        } catch (err) {
            alert("Action failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const daActiveCases = cases.filter(c => [
        'ALLEGATION_PROVED', 
        'AWAITING_EMPLOYEE_RESPONSE', 
        'REMINDER_1_SENT', 
        'REMINDER_2_SENT', 
        'FINAL_OPPORTUNITY_SENT',
        'FINAL_ORDER_ISSUED_CONCURRED',
        'FINAL_ORDER_ISSUED_MODIFIED'
    ].includes(c.status));

    const needsAttentionCount = daActiveCases.length;

    const getAvailableActions = (c) => {
        const actions = [];
        if (c.status === 'ALLEGATION_PROVED') {
            actions.push({ id: 'ISSUE_SHOW_CAUSE', label: 'Issue Show-Cause Notice' });
        }
        
        const hasExplanation = !!c.employee_explanation_path;
        
        if (hasExplanation) {
            if (c.gravity === 'MAJOR' && !['FINAL_ORDER_ISSUED_CONCURRED', 'FINAL_ORDER_ISSUED_MODIFIED'].includes(c.status)) {
                actions.push({ id: 'SEND_TO_CC', label: 'Send to Concurrence Committee' });
            } else {
                actions.push({ id: 'ISSUE_FINAL_ORDER', label: 'Issue Final Order' });
            }
        } else {
            if (c.status === 'AWAITING_EMPLOYEE_RESPONSE') {
                actions.push({ id: 'ISSUE_REMINDER_1', label: 'Issue Reminder 1' });
                actions.push({ id: 'ISSUE_EX_PARTE', label: 'Proceed Ex-Parte' });
            } else if (c.status === 'REMINDER_1_SENT') {
                actions.push({ id: 'ISSUE_REMINDER_2', label: 'Issue Reminder 2' });
                actions.push({ id: 'ISSUE_EX_PARTE', label: 'Proceed Ex-Parte' });
            } else if (c.status === 'REMINDER_2_SENT') {
                actions.push({ id: 'ISSUE_FINAL_OPPORTUNITY', label: 'Issue Final Opportunity' });
                actions.push({ id: 'ISSUE_EX_PARTE', label: 'Proceed Ex-Parte' });
            } else if (c.status === 'FINAL_OPPORTUNITY_SENT') {
                actions.push({ id: 'ISSUE_EX_PARTE', label: 'Proceed Ex-Parte' });
            }
        }
        
        if (['FINAL_ORDER_ISSUED_CONCURRED', 'FINAL_ORDER_ISSUED_MODIFIED'].includes(c.status)) {
            actions.push({ id: 'ISSUE_FINAL_ORDER', label: 'Issue Final Disciplinary Order' });
        }

        return actions;
    };

    return (
        <Layout userRole="DA">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Disciplinary Authority Portal</h2>
                        <p className="text-slate-400">Control the disciplinary workflow, issue reminders, and evaluate explanations.</p>
                    </div>
                    <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-full border border-rose-500/20 text-sm font-bold flex items-center gap-2">
                        <Gavel className="w-4 h-4" /> DISCIPLINARY AUTHORITY
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Proceedings</h3>
                            <p className="text-4xl font-black text-white">{needsAttentionCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Cases Under Control</h3>
                    </div>
                    
                    {loading ? (
                        <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 border-t-transparent"></div></div>
                    ) : daActiveCases.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <ShieldCheck className="w-12 h-12 opacity-20" />
                            <p>No actions required at this time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/30 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                        <th className="px-6 py-4 font-bold">Case ID</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Employee Explanation</th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {daActiveCases.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-5 font-mono text-white font-bold">CASE-{c.id}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                                    c.status.includes('REMINDER') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                                    c.status === 'ALLEGATION_PROVED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                    {c.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {c.employee_explanation_path ? (
                                                    <a href={`${api.rootURL}/${c.employee_explanation_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold">
                                                        <FileText className="w-3.5 h-3.5" /> View Explanation
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-500 italic text-sm">Not Submitted</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => handleActionClick(c)}
                                                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-all focus:outline-none"
                                                >
                                                    Manage Case <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isModalOpen && selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setIsModalOpen(false)}></div>
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Case Operations</h3>
                                    <p className="text-slate-400 text-sm">CASE-{selectedCase.id} • {selectedCase.gravity}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors focus:outline-none"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <form onSubmit={handleSubmitAction} className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Next Proceeding Action</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {getAvailableActions(selectedCase).map(action => (
                                            <label key={action.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${actionType === action.id ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/10' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                                <input type="radio" required checked={actionType === action.id} onChange={() => setActionType(action.id)} className="accent-rose-500" />
                                                <div className="flex-1">
                                                    <p className="font-bold">{action.label}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Authority Comments & Directives</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[100px]"
                                        placeholder="Enter your administrative directives..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium">Cancel</button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting || !actionType}
                                        className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                    >
                                        {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Finalize Selection</>}
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

export default DADashboard;
