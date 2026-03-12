import React from 'react';
import Layout from '../../components/Layout';
import { User, FileText, Bell, Users } from 'lucide-react';

const CMDDashboard = () => {
    return (
        <Layout userRole="CMD">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">CMD Dashboard</h2>
                        <p className="text-slate-400">Review new complaints and assign Enquiry Officers.</p>
                    </div>
                    <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20 text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        CMD
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Unassigned Complaints</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Enquiries</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-colors cursor-pointer">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Disciplinary Orders</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                        <h3 className="text-xl font-bold text-white">Pending Assignments</h3>
                        <button className="text-amber-500 text-sm font-medium hover:text-amber-400">View All</button>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-48 gap-3">
                        <p>No complaints are currently pending assignment.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CMDDashboard;
