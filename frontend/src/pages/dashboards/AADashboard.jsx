import React from 'react';
import Layout from '../../components/Layout';
import { FileText, Shield, ClipboardCheck } from 'lucide-react';

const AADashboard = () => {
    return (
        <Layout userRole="APPEAL_AUTHORITY">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Appeal Authority Portal</h2>
                        <p className="text-slate-400">Review employee appeals against final disciplinary orders.</p>
                    </div>
                    <div className="bg-orange-500/10 text-orange-400 px-4 py-2 rounded-full border border-orange-500/20 text-sm font-medium">APPEAL AUTHORITY</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl"><Shield className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Appeals</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Under Review</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><ClipboardCheck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h3 className="text-xl font-bold text-white">Appeal Cases</h3></div>
                    <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                        <Shield className="w-12 h-12 opacity-20" />
                        <p>No appeals filed at this time.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AADashboard;
