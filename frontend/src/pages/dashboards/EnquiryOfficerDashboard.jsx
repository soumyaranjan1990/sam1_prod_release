import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, FolderGit2, ClipboardCheck, ExternalLink, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

const EnquiryOfficerDashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [verdict, setVerdict] = useState(''); // 'PROVED' or 'NOT_PROVED'
    const [gravity, setGravity] = useState('MINOR');
    const [comments, setComments] = useState('');
    const [reportFile, setReportFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, casesData] = await Promise.all([
                    api.getCurrentUser(),
                    api.getCases()
                ]);
                setCurrentUser(userData);
                // Filter cases assigned to this EO
                const assignedCases = casesData.filter(c => c.enquiry_officer_id === userData.id);
                setCases(assignedCases);
            } catch (err) {
                console.error("Error fetching EO data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleActionClick = (c) => {
        setSelectedCase(c);
        setIsModalOpen(true);
        setVerdict('');
        setGravity('MINOR');
        setComments('');
        setReportFile(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!verdict) {
            setError('Please select a verdict');
            return;
        }

        setUploading(true);
        setError('');

        try {
            let reportPath = '';
            if (reportFile) {
                const uploadRes = await api.uploadFile(reportFile);
                reportPath = uploadRes.document_path;
            }

            await api.submitEnquiryAction(selectedCase.id, {
                verdict,
                gravity: verdict === 'PROVED' ? gravity : null,
                comments,
                enquiry_report_path: reportPath
            });

            // Refresh list
            const updatedCases = await api.getCases();
            setCases(updatedCases.filter(c => c.enquiry_officer_id === currentUser.id));
            setIsModalOpen(false);
            alert("Action submitted successfully!");
        } catch (err) {
            setError(err.message || 'Action failed');
        } finally {
            setUploading(false);
        }
    };

    const stats = {
        assigned: cases.length,
        pending: cases.filter(c => ['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status)).length,
        completed: cases.filter(c => ['ALLEGATION_PROVED', 'CLOSED_NOT_PROVED'].includes(c.status)).length
    };

    return (
        <Layout userRole="ENQUIRY_OFFICER">
            <div className="space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Enquiry Officer Portal</h2>
                        <p className="text-slate-400">Conduct investigations and submit findings for assigned cases.</p>
                    </div>
                    <div className="bg-violet-500/10 text-violet-400 px-4 py-2 rounded-full border border-violet-500/20 text-sm font-medium">
                        EO: {currentUser?.username || 'Loading...'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl"><FolderGit2 className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Assigned</h3>
                            <p className="text-4xl font-black text-white">{stats.assigned}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Under Enquiry</h3>
                            <p className="text-4xl font-black text-white">{stats.pending}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><ClipboardCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</h3>
                            <p className="text-4xl font-black text-white">{stats.completed}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">My Assignments</h3>
                    </div>
                    
                    {loading ? (
                        <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div></div>
                    ) : cases.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <FolderGit2 className="w-12 h-12 opacity-20" />
                            <p>No enquiries assigned to you yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/20 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                        <th className="px-6 py-4 font-bold">Case ID</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Assigned Wing</th>
                                        <th className="px-6 py-4 font-bold">Created</th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {cases.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/10 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-white">CASE-{c.id}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                                    ['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status) ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                    c.status === 'ALLEGATION_PROVED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    c.status === 'CLOSED_NOT_PROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                    {c.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {c.assigned_wing} {c.wing_details && `(${c.wing_details})`}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {['ASSIGNED', 'UNDER_ENQUIRY'].includes(c.status) ? (
                                                    <button 
                                                        onClick={() => handleActionClick(c)}
                                                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ml-auto"
                                                    >
                                                        Review <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-600 italic text-xs">Action Taken</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Enquiry Action Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !uploading && setIsModalOpen(false)}></div>
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white tracking-tight">Enquiry Verdict: CASE-{selectedCase?.id}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">&times;</button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm italic">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Report Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enquiry Report (PDF/Doc)</label>
                                    <div className="relative group border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 transition-all bg-slate-900/50 flex flex-col items-center">
                                        <input 
                                            type="file" 
                                            onChange={(e) => setReportFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            required
                                        />
                                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-violet-400 mb-2" />
                                        {reportFile ? (
                                            <span className="text-violet-400 font-medium truncate max-w-full italic">{reportFile.name}</span>
                                        ) : (
                                            <span className="text-slate-500 italic">Click or drag to upload report</span>
                                        )}
                                    </div>
                                </div>

                                {/* Verdict Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Verdict</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setVerdict('PROVED')}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                                                verdict === 'PROVED' 
                                                ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                                                : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            <AlertCircle className="w-6 h-6" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Allegation Proved</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setVerdict('NOT_PROVED')}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                                                verdict === 'NOT_PROVED' 
                                                ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                                                : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-6 h-6" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Not Proved</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Gravity (if Proved) */}
                                {verdict === 'PROVED' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gravity of Breach</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`cursor-pointer group relative overflow-hidden p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                                                gravity === 'MINOR' ? 'bg-slate-800 border-violet-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}>
                                                <input type="radio" name="gravity" value="MINOR" checked={gravity === 'MINOR'} onChange={(e) => setGravity(e.target.value)} className="hidden" />
                                                <span className="font-bold">Minor</span>
                                            </label>
                                            <label className={`cursor-pointer group relative overflow-hidden p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                                                gravity === 'MAJOR' ? 'bg-slate-800 border-red-500 text-white font-bold' : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}>
                                                <input type="radio" name="gravity" value="MAJOR" checked={gravity === 'MAJOR'} onChange={(e) => setGravity(e.target.value)} className="hidden" />
                                                <span className="font-bold">Major</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Comments */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enquiry Findings / Comments</label>
                                    <textarea 
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[100px] italic placeholder:text-slate-600"
                                        placeholder="Summary of your findings..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={uploading}
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {uploading ? (
                                        <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Submitting...</>
                                    ) : (
                                        "Submit Official Verdict"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EnquiryOfficerDashboard;
