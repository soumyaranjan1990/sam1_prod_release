import React from 'react';
import Layout from '../../components/Layout';
import { FileText, Gavel, AlertTriangle, ClipboardCheck } from 'lucide-react';

const DADashboard = () => {
    return (
        <Layout userRole="DA">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Disciplinary Authority Portal</h2>
                        <p className="text-slate-400">Review enquiry reports, propose punishments, and issue orders.</p>
                    </div>
                    <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-full border border-rose-500/20 text-sm font-medium">DISCIPLINARY AUTHORITY</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Enquiry Reports</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Gavel className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Orders</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Show-Cause Notices</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><ClipboardCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Final Orders Issued</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h3 className="text-xl font-bold text-white">Cases Awaiting Action</h3></div>
                    <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                        <Gavel className="w-12 h-12 opacity-20" />
                        <p>No cases require your action at this time.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DADashboard;
