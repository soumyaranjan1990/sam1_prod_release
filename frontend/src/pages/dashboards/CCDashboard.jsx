import React from 'react';
import Layout from '../../components/Layout';
import { FileText, Scale, ClipboardCheck } from 'lucide-react';

const CCDashboard = () => {
    return (
        <Layout userRole="CONCURRENCE_COMMITTEE">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Concurrence Committee Portal</h2>
                        <p className="text-slate-400">Review and concur on disciplinary orders before finalization.</p>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/20 text-sm font-medium">CONCURRENCE COMMITTEE</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Scale className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Concurrence</h3>
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
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Concurred</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h3 className="text-xl font-bold text-white">Orders Pending Concurrence</h3></div>
                    <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                        <Scale className="w-12 h-12 opacity-20" />
                        <p>No orders pending concurrence at this time.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CCDashboard;
