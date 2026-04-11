import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FileText, User, Calendar, ChevronRight, ClipboardCheck } from 'lucide-react';
import { api } from '../../api';

const AssignedCases = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignedCases();
    }, []);

    const fetchAssignedCases = async () => {
        try {
            const data = await api.fetchWithAuth('/complaints/');
            // Filter for cases that are ASSIGNED or UNDER_ENQUIRY
            const assigned = Array.isArray(data) 
                ? data.filter(c => ['ASSIGNED', 'UNDER_ENQUIRY', 'ALLEGATION_PROVED', 'CHARGE_MEMO_ISSUED', 'SHOW_CAUSE_ISSUED', 'FINAL_ORDER_ISSUED'].some(s => c.status === s)) 
                : [];
            setCases(assigned);
        } catch (err) {
            console.error('Failed to fetch assigned cases:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout userRole="CMD">
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Assigned Cases</h2>
                    <p className="text-slate-400">Track the progress of enquiries currently assigned to officers.</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-amber-500" />
                            Active Enquiries & Orders
                        </h3>
                        <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded-full border border-amber-500/20">
                            {cases.length} assigned
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : cases.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p>No cases have been assigned yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                        <th className="px-6 py-4">File Number</th>
                                        <th className="px-6 py-4">Title & Dept</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {cases.map((c) => (
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
                                                <p className="text-slate-500 text-[10px] mt-0.5">{c.department || 'DVC'}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border tracking-widest uppercase ${
                                                    c.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    c.status === 'UNDER_ENQUIRY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                    {c.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-slate-400 text-xs font-mono">
                                                {c.date_of_receipt}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                                    View Details
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
        </Layout>
    );
};

export default AssignedCases;
