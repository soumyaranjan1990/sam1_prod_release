import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, ChevronRight, Clock, Send, X, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../api';

const DAPendingReviews = () => {
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const data = await api.getCases();
            // Filter cases waiting for DA review after CO submission:
            // 1. Major cases in UNDER_DA_REVIEW_MAJOR
            // 2. Minor cases in EXPLANATION_RECEIVED
            const reviewItems = data.filter(c => 
                (c.status === 'UNDER_DA_REVIEW_MAJOR' && c.gravity === 'MAJOR') ||
                (c.status === 'EXPLANATION_RECEIVED' && c.gravity === 'MINOR')
            );
            setCases(reviewItems);
        } catch (err) {
            console.error("Failed to fetch pending reviews:", err);
            setError("Failed to load cases. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReviewClick = (c) => {
        setSelectedCase(c);
        setComments('');
        setError(null);
        setIsModalOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!comments.trim()) {
            setError("Please provide internal review comments before proceeding.");
            return;
        }

        const isMajor = selectedCase.gravity === 'MAJOR';
        const actionType = isMajor ? 'SEND_TO_CC' : 'ISSUE_FINAL_ORDER';

        setIsSubmitting(true);
        try {
            await api.fetchWithAuth(`/cases/${selectedCase.id}/da-action`, {
                method: 'PUT',
                body: JSON.stringify({
                    action_type: actionType,
                    comments: comments
                })
            });
            setIsModalOpen(false);
            fetchCases();
        } catch (err) {
            setError(err.message || `Failed to ${isMajor ? 'forward case to CC' : 'issue final order'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout userRole="DA">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Pending Explanations</h2>
                        <p className="text-slate-400">Review employee explanations submitted by Controlling Officers and forward for concurrence.</p>
                    </div>
                    <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full border border-amber-500/20 text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {cases.length} WAITING
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="text-slate-400 font-medium">Loading pending reviews...</p>
                        </div>
                    ) : cases.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
                                <p className="text-slate-400 max-w-sm mx-auto mt-2">There are currently no employee explanations pending your review. All submitted items have been processed.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/30 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                        <th className="px-6 py-4 font-bold">Case Information</th>
                                        <th className="px-6 py-4 font-bold">Gravity</th>
                                        <th className="px-6 py-4 font-bold">Submission Details</th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {cases.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-mono text-white font-bold text-lg mb-0.5">CASE-{c.id}</div>
                                                <div className="text-sm text-slate-500 truncate max-w-xs">{c.complaint_title || 'Disciplinary Proceeding'}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                    c.gravity === 'MAJOR' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                    {c.gravity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Explanation Document</span>
                                                    {c.employee_explanation_path ? (
                                                        <a 
                                                            href={`${api.rootURL}/${c.employee_explanation_path}`} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-bold"
                                                        >
                                                            <FileText className="w-4 h-4" /> View Submitted Document
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 italic text-sm">Document path missing</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => handleReviewClick(c)}
                                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/10 transition-all focus:outline-none"
                                                >
                                                    Start Review <ArrowRight className="w-4 h-4" />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/30">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {selectedCase.gravity === 'MAJOR' ? 'Review & Forward to Concurrence' : 'Review & Issue Final Order'}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">Evaluating explanation for Case #{selectedCase.id}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors focus:outline-none">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmitReview} className="p-6 flex-1 overflow-y-auto space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Case Type</p>
                                        <p className="text-white font-medium">Major Disciplinary Block</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Gravity</p>
                                        <span className={selectedCase.gravity === 'MAJOR' ? 'text-red-400 font-bold' : 'text-yellow-400 font-bold'}>
                                            {selectedCase.gravity}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Evidence / Explanation</p>
                                        <a href={`${api.rootURL}/${selectedCase.employee_explanation_path}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:underline flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Open Full Explanation Document
                                        </a>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest">Administrative Evaluation Comments</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[150px]"
                                        placeholder="Enter your detailed comments on the employee explanation and justifying reasons for forwarding to the Concurrence Committee..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        required
                                    ></textarea>
                                    <p className="text-xs text-slate-500">These comments will be visible to the Concurrence Committee during their evaluation.</p>
                                </div>
                                
                                <div className="border-t border-slate-800 pt-6 flex justify-end gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none font-medium"
                                    >
                                        Cancel Review
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={`px-6 py-2.5 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20 ${selectedCase.gravity === 'MAJOR' ? 'bg-primary-600 hover:bg-primary-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <Send className="w-4 h-4" /> 
                                                {selectedCase.gravity === 'MAJOR' ? 'Forward to Concurrence Committee' : 'Issue Final Order'}
                                            </>
                                        )}
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

export default DAPendingReviews;
