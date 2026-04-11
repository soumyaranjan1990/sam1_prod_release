import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FileText, FolderGit2, ChevronRight, Calendar, Building2, Search, Filter } from 'lucide-react';
import { api } from '../../api';

const AllComplaints = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = api.getUserRole();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const data = await api.fetchWithAuth('/complaints/');
            setComplaints(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredComplaints = complaints.filter(c => 
        c.complaint_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.file_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout userRole={userRole}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight text-glow">All Complaints</h2>
                        <p className="text-slate-400">View and track all registered complaints.</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search by title or file number..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-semibold">
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Complaint History</h3>
                        <span className="text-slate-500 text-sm">{filteredComplaints.length} items</span>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : filteredComplaints.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <FolderGit2 className="w-16 h-16 opacity-10" />
                            <p className="text-lg">No complaints found.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800">
                            {filteredComplaints.map(c => (
                                <li 
                                    key={c.id} 
                                    onClick={() => navigate(userRole === 'CMD' ? `/complaints/cmd/${c.id}` : '#')}
                                    className={`flex items-center justify-between gap-4 px-6 py-5 hover:bg-slate-800/30 transition-all group ${userRole === 'CMD' ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded">
                                                {c.file_number}
                                            </span>
                                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest">
                                                {c.complaint_type || 'SERVICE'}
                                            </span>
                                        </div>
                                        <p className="text-white font-bold text-base transition-colors group-hover:text-cyan-400">{c.complaint_title}</p>
                                        <div className="flex items-center gap-4 mt-2 text-slate-500 text-xs">
                                            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{c.department || 'DVC'}</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{c.date_of_receipt}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter shadow-sm">
                                            Registered
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-cyan-500 transition-all group-hover:translate-x-1" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AllComplaints;
