import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, FileText, UploadCloud, PlusCircle, ShieldCheck, Clock, AlertCircle, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';
import { api } from '../../api';

const EmployeeDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Action Modal State
    const [actionModal, setActionModal] = useState({ isOpen: false, caseId: null, actionType: null });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, cData] = await Promise.all([
                api.getCurrentUser(),
                api.fetchWithAuth('/complaints/')
            ]);
            setCurrentUser(userData);
            setComplaints(Array.isArray(cData) ? cData : []);
        } catch (err) {
            console.error('Failed to load employee dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setError("Please select a file to upload."); return; }
        
        setIsSubmitting(true);
        setError(null);
        try {
            const uploadRes = await api.uploadFile(file);

            if (!uploadRes.document_path) throw new Error("Upload failed");

            await api.fetchWithAuth(`/cases/${actionModal.caseId}/employee-response`, {
                method: 'PUT',
                body: JSON.stringify({
                    action_type: actionModal.actionType,
                    document_path: uploadRes.document_path
                })
            });

            setActionModal({ isOpen: false, caseId: null, actionType: null });
            setFile(null);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to submit response');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filedCount = complaints.filter(c => c.registered_by_id === currentUser?.id).length;
    const taggedCount = complaints.length - filedCount;
    const activeCount = complaints.filter(c => c.case && c.case.status === 'UNDER_ENQUIRY').length;

    const calculateDaysLeft = (startDate, windowDays) => {
        if (!startDate) return windowDays;
        const start = new Date(startDate);
        const now = new Date();
        const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.max(0, windowDays - elapsed);
    };

    const requiresExplanation = (status) => 
        ['AWAITING_EMPLOYEE_RESPONSE', 'REMINDER_1_SENT', 'REMINDER_2_SENT', 'FINAL_OPPORTUNITY_SENT'].includes(status);

    return (
        <Layout userRole="EMPLOYEE">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Employee Hub</h2>
                        <p className="text-slate-400">View cases where you have been tagged or submit responses.</p>
                    </div>
                    <div className="bg-primary-500/10 text-primary-400 px-4 py-2 rounded-full border border-primary-500/20 text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        EMPLOYEE
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Investigations Against You</h3>
                            <p className="text-3xl font-black text-white">{loading ? '—' : taggedCount}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><PlusCircle className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cases Filed by You</h3>
                            <p className="text-3xl font-black text-white">{loading ? '—' : filedCount}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Enquiries</h3>
                            <p className="text-3xl font-black text-white">{loading ? '—' : activeCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        Your Investigation History
                    </h3>
                    
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 h-64 gap-3">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p>No active cases or recent activity found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {complaints.map(c => {
                                const caseStatus = c.case?.status || 'UNASSIGNED';
                                const needsExplanation = requiresExplanation(caseStatus);
                                const isAppealWindow = caseStatus === 'APPEAL_WINDOW_OPEN';
                                
                                let daysLeft = null;
                                if (c.case?.window_start_date) {
                                    const windowSize = isAppealWindow ? 90 : (caseStatus === 'FINAL_OPPORTUNITY_SENT' ? 7 : 15);
                                    daysLeft = calculateDaysLeft(c.case.window_start_date, windowSize);
                                }

                                return (
                                    <div key={c.id} className={`bg-slate-800/20 border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/40 transition-all border-l-4 ${
                                        needsExplanation || isAppealWindow ? 'border-amber-500 border-l-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-800 border-l-primary-500'
                                    }`}>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="font-mono text-sm font-bold text-primary-400">{c.file_number}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border tracking-widest uppercase ${
                                                    needsExplanation || isAppealWindow ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    ['CASE_CLOSED', 'CLOSED_FINAL'].includes(caseStatus) ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                    {caseStatus.replace(/_/g, ' ')}
                                                </span>
                                                {c.registered_by_id === currentUser?.id ? (
                                                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Complainant</span>
                                                ) : (
                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Subject</span>
                                                )}
                                                
                                                {daysLeft !== null && c.registered_by_id !== currentUser?.id && (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full animate-pulse">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {daysLeft} Days Left to Respond
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-lg font-bold text-white">{c.complaint_title || c.complaint_category}</h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                {c.department && <span>Dept: {c.department}</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0 flex items-center justify-end">
                                            {c.registered_by_id !== currentUser?.id && c.case && (needsExplanation || isAppealWindow) && !c.case.employee_explanation_path && !c.case.appeal_path && (
                                                <button 
                                                    onClick={() => setActionModal({ isOpen: true, caseId: c.case.id, actionType: needsExplanation ? 'EXPLANATION' : 'APPEAL' })}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 focus:outline-none"
                                                >
                                                    {needsExplanation ? 'Submit Explanation' : 'Submit Appeal'} 
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Response Upload Modal */}
                {actionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/30">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        Submit {actionModal.actionType === 'EXPLANATION' ? 'Show Cause Explanation' : 'Case Appeal'}
                                    </h3>
                                </div>
                                <button onClick={() => {setActionModal({isOpen: false}); setFile(null); setError(null);}} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors focus:outline-none">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleActionSubmit} className="p-6 space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Document Upload</label>
                                    <div className="p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center relative hover:border-amber-500/50 transition-colors group cursor-pointer h-40">
                                        <input 
                                            type="file" 
                                            required
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*,application/pdf"
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-10 h-10 text-amber-500 mb-2" />
                                                <p className="text-amber-400 font-medium text-center truncate max-w-xs">{file.name}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-amber-500 transition-colors" />
                                                <p className="text-slate-300 font-medium">Select signed response document</p>
                                                <p className="text-sm text-slate-500 mt-1">PDF or JPG only</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-800 pt-6 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => {setActionModal({isOpen: false}); setFile(null); setError(null);}}
                                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold focus:outline-none"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Submit {actionModal.actionType === 'EXPLANATION' ? 'Explanation' : 'Appeal'}
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

export default EmployeeDashboard;
