import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FileText, PlusCircle, FolderGit2, ChevronRight, Calendar, Building2 } from 'lucide-react';
import { api } from '../../api';

const ComplaintOfficerDashboard = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({ unassigned: 0, active: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cData, statsData] = await Promise.all([
                    api.fetchWithAuth('/complaints/'),
                    api.fetchWithAuth('/complaints/stats')
                ]);
                setComplaints(Array.isArray(cData) ? cData : []);
                setStats(statsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const pendingCount = stats.unassigned; // Unassigned in CMD view is 'Pending Review' here
    const totalCount = complaints.length;

    const statusColor = (c) => 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';

    return (
        <Layout userRole="COMPLAINT_OFFICER">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Complaint Registration Portal</h2>
                        <p className="text-slate-400">Register new complaints, tag employees, and upload supporting documents.</p>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full border border-cyan-500/20 text-sm font-medium">
                        COMPLAINT OFFICER
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => navigate('/complaints/new')}
                        className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><PlusCircle className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Register New</h3>
                            <p className="text-lg font-semibold text-white">New Complaint</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending CMD Review</h3>
                            <p className="text-4xl font-black text-white">{loading ? '—' : pendingCount}</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><FolderGit2 className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Registered</h3>
                            <p className="text-4xl font-black text-white">{loading ? '—' : totalCount}</p>
                        </div>
                    </div>
                </div>

                {/* All Complaints Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">All Complaints</h3>
                        <span className="text-slate-500 text-sm">{totalCount} total</span>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                            <FolderGit2 className="w-12 h-12 opacity-20" />
                            <p>No complaints registered yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800">
                            {complaints.map(c => (
                                <li key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-amber-400 font-semibold">{c.file_number}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                                c.status === 'REGISTERED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                c.status === 'UNDER_ENQUIRY' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                'bg-green-500/10 text-green-500 border-green-500/20'
                                            }`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-white font-semibold text-sm truncate">{c.complaint_title}</p>
                                        <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs">
                                            {c.department && (
                                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.department}</span>
                                            )}
                                            {c.date_of_receipt && (
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.date_of_receipt}</span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ComplaintOfficerDashboard;
