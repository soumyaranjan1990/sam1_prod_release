import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, Scale, ExternalLink, ShieldCheck, Clock, Send, X, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

const CCDashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form States
    const [verdict, setVerdict] = useState('CONCUR');
    const [comments, setComments] = useState('');
    const [modifiedPunishment, setModifiedPunishment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const data = await api.getCases();
            setCases(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch CC cases:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (c) => {
        setSelectedCase(c);
        setVerdict('CONCUR');
        setComments('');
        setModifiedPunishment('');
        setIsModalOpen(true);
    };

    const handleSubmitAction = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.fetchWithAuth(`/cases/${selectedCase.id}/cc-action`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    verdict, 
                    comments,
                    modified_punishment: verdict === 'MODIFY' ? modifiedPunishment : null
                })
            });
            await fetchCases();
            setIsModalOpen(false);
        } catch (err) {
            alert("Action failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCases = cases.filter(c => c.status === 'UNDER_CONCURRENCE_REVIEW');
    const concurredCases = cases.filter(c => ['FINAL_ORDER_ISSUED_CONCURRED', 'FINAL_ORDER_ISSUED_MODIFIED'].includes(c.status));

    return (
        <Layout userRole="CONCURRENCE_COMMITTEE">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Concurrence Committee Portal</h2>
                        <p className="text-slate-400">Review Major Penalty cases and provide final concurring directives.</p>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/20 text-sm font-bold flex items-center gap-2">
                        <Scale className="w-4 h-4" /> CONCURRENCE COMMITTEE
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Review</h3>
                            <p className="text-4xl font-black text-white">{pendingCases.length}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Historically Reviewed</h3>
                            <p className="text-4xl font-black text-white">{concurredCases.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h3 className="text-xl font-bold text-white">Orders Pending Concurrence</h3></div>
                    
                    {loading ? (
                        <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 border-t-transparent"></div></div>
                    ) : pendingCases.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                            <Scale className="w-12 h-12 opacity-20" />
                            <p>No orders pending concurrence at this time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/30 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                        <th className="px-6 py-4 font-bold">Case Ref</th>
                                        <th className="px-6 py-4 font-bold">Employee Explanation</th>
                                        <th className="px-6 py-4 font-bold">Enquiry Report</th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {pendingCases.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-5 font-mono text-white font-bold">CASE-{c.id}</td>
                                            <td className="px-6 py-5">
                                                {c.employee_explanation_path ? (
                                                    <a href={`${api.rootURL}/${c.employee_explanation_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold">
                                                        <FileText className="w-3.5 h-3.5" /> View Explanation
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 text-rose-400 text-sm font-bold bg-rose-500/10 px-3 py-1 text-xs rounded-full border border-rose-500/20">
                                                        <AlertTriangle className="w-3.5 h-3.5"/> Ex-Parte Processed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {c.enquiry_report_path ? (
                                                    <a href={`${api.rootURL}/${c.enquiry_report_path}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300 flex items-center gap-2 text-sm font-bold">
                                                        Report PDF <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                ) : <span className="text-slate-500 italic text-sm">Not Provided</span>}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => handleActionClick(c)}
                                                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all ml-auto shadow-lg shadow-indigo-500/20"
                                                >
                                                    Evaluate
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
                                    <h3 className="text-xl font-bold text-white tracking-tight">Concurrence Evaluation</h3>
                                    <p className="text-slate-400 text-sm">CASE-{selectedCase.id} • Sent directly from DA</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors focus:outline-none"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <form onSubmit={handleSubmitAction} className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Concurrence Verdict</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${verdict === 'CONCUR' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                            <input type="radio" required checked={verdict === 'CONCUR'} onChange={() => setVerdict('CONCUR')} className="accent-indigo-500" />
                                            <div className="flex-1">
                                                <p className="font-bold">Concur with Proposed Penalty</p>
                                                <p className="text-xs uppercase tracking-tight opacity-75">No modifications to DA intent</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${verdict === 'MODIFY' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                            <input type="radio" required checked={verdict === 'MODIFY'} onChange={() => setVerdict('MODIFY')} className="accent-indigo-500" />
                                            <div className="flex-1">
                                                <p className="font-bold">Modify Disciplinary Action</p>
                                                <p className="text-xs uppercase tracking-tight opacity-75">Reduce or alter the penalty details</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {verdict === 'MODIFY' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Modified Punishment Details</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-indigo-500/5 border border-indigo-500/30 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="Specify the exact modified punishment..."
                                            value={modifiedPunishment}
                                            onChange={(e) => setModifiedPunishment(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Committee Note / Rationale</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                                        placeholder="Enter the official committee documentation here..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium">Cancel</button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Finalize Concurrence</>}
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

export default CCDashboard;
