import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FileText, PlusCircle, FolderGit2 } from 'lucide-react';

const ComplaintOfficerDashboard = () => {
    const navigate = useNavigate();

    return (
        <Layout userRole="COMPLAINT_OFFICER">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Complaint Registration Portal</h2>
                        <p className="text-slate-400">Register new complaints, tag employees, and upload supporting documents.</p>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full border border-cyan-500/20 text-sm font-medium">COMPLAINT OFFICER</div>
                </div>

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
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Review</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><FolderGit2 className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Registered</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h3 className="text-xl font-bold text-white">Recent Complaints</h3></div>
                    <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                        <FolderGit2 className="w-12 h-12 opacity-20" />
                        <p>No complaints registered yet.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ComplaintOfficerDashboard;
