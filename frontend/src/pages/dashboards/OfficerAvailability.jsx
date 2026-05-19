import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { api } from '../../api';

import { useOfficerAvailability } from '../../hooks/useOfficerAvailability';

const ROLE_LABELS = {
    DA: 'Disciplinary Authority',
    CO: 'Controlling Officer',
    ENQUIRY_OFFICER: 'Enquiry Officer',
};

const OfficerAvailability = () => {
    const { availability: officerAvailability, loading, refresh: fetchOfficerAvailability } = useOfficerAvailability();

    return (
        <Layout userRole="CMD">
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Officer Availability</h2>
                    <p className="text-slate-400 text-sm">Real-time status and case load monitoring for all presiding officers.</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary-400" />
                            <h3 className="text-lg font-bold text-white">Registry Status</h3>
                        </div>
                        <button 
                            onClick={fetchOfficerAvailability}
                            className="text-xs font-bold text-primary-400 hover:text-white transition-colors"
                        >
                            Refresh Live Status
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                            <p className="text-slate-500 text-sm font-medium">Fetching real-time data...</p>
                        </div>
                    ) : Object.keys(officerAvailability).length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <Users className="w-12 h-12 text-slate-800" />
                            <p className="text-slate-500 text-sm italic">No officers are currently registered in the system.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x-0">
                            {Object.entries(officerAvailability).map(([role, officers]) => (
                                <div key={role} className="p-6 border-b border-slate-800 last:border-b-0">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-5">{ROLE_LABELS[role] || role}</h4>
                                    <div className="space-y-3">
                                        {officers.map(officer => (
                                            <div key={officer.id} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-950/60 shadow-inner">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${
                                                        officer.availability === 'AVAILABLE' 
                                                            ? 'bg-emerald-500/10 text-emerald-500' 
                                                            : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                        {officer.availability === 'AVAILABLE'
                                                            ? <UserCheck className="w-4 h-4" />
                                                            : <UserX className="w-4 h-4" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{officer.username}</p>
                                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                                            {officer.active_cases} active case{officer.active_cases !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${
                                                    officer.availability === 'AVAILABLE'
                                                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                                                }`}>
                                                    {officer.availability}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Legend/Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <h4 className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                             <UserCheck className="w-4 h-4" /> Available Status
                        </h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">Officers with "AVAILABLE" status have no more than 3 active cases and are ready for new assignments.</p>
                    </div>
                    <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                        <h4 className="text-red-500 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                             <UserX className="w-4 h-4" /> Unavailable Status
                        </h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">Officers with "UNAVAILABLE" status currently have 4 or more active cases. Assignment is still possible but not recommended.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default OfficerAvailability;
