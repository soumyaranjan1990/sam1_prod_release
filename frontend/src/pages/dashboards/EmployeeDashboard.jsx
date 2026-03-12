import React from 'react';
import Layout from '../../components/Layout';
import { User, FileText, Bell } from 'lucide-react';

const EmployeeDashboard = () => {
    return (
        <Layout userRole="EMPLOYEE">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Employee Hub</h2>
                        <p className="text-slate-400">View cases where you have been tagged or submit responses.</p>
                    </div>
                    <div className="bg-primary-500/10 text-primary-400 px-4 py-2 rounded-full border border-primary-500/20 text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        EMPLOYEE
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-primary-500/30 transition-colors">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Active Cases Against You</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-primary-500/30 transition-colors">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Pending Responses</h3>
                            <p className="text-4xl font-black text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Recent Activity</h3>
                    <div className="flex flex-col items-center justify-center text-slate-500 h-64 gap-3">
                        <FileText className="w-12 h-12 opacity-20" />
                        <p>No active cases or recent activity found.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeDashboard;
