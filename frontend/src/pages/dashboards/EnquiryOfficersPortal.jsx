import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Users, FileText, Search, ChevronRight, User, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../../api';

const EnquiryOfficersPortal = () => {
    const navigate = useNavigate();
    const [officers, setOfficers] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersData, casesData] = await Promise.all([
                    api.fetchWithAuth('/auth/users/'),
                    api.fetchWithAuth('/cases/'),
                ]);
                
                // Filter only Enquiry Officers
                const eoList = Array.isArray(usersData) 
                    ? usersData.filter(u => u.role === 'ENQUIRY_OFFICER')
                    : [];
                
                setOfficers(eoList);
                setCases(Array.isArray(casesData) ? casesData : []);
            } catch (err) {
                console.error('Failed to load officers data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getOfficerCases = (officerId) => {
        return cases.filter(c => c.enquiry_officer_id === officerId);
    };

    const filteredOfficers = officers.filter(o => 
        o.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout userRole="CMD">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Enquiry Officers</h2>
                        <p className="text-slate-400 text-sm">Monitor assignments and investigation progress across all officers.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search officers..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                ) : filteredOfficers.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4">
                        <Users className="w-12 h-12 text-slate-700" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white">No Officers Found</h3>
                            <p className="text-slate-500 text-sm max-w-xs">We couldn't find any Enquiry Officers matching your search criteria.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredOfficers.map((officer) => {
                            const officerCases = getOfficerCases(officer.id);
                            const activeCases = officerCases.filter(c => c.status === 'UNDER_ENQUIRY');
                            
                            return (
                                <div key={officer.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all group">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                                        {/* Officer Info */}
                                        <div className="flex gap-5 items-start md:w-1/4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/10">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-bold text-white tracking-tight leading-tight group-hover:text-primary-400 transition-colors uppercase">{officer.username}</h4>
                                                <p className="text-slate-400 text-xs font-medium truncate max-w-[180px]">{officer.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="bg-primary-500/10 text-primary-400 text-[10px] font-black px-2 py-0.5 rounded border border-primary-500/20 uppercase tracking-tighter">EO</span>
                                                    <span className="text-slate-500 text-[10px] font-bold">ID: {officer.id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats and Cases Area */}
                                        <div className="flex-1 space-y-6 w-full">
                                            <div className="flex gap-4 items-center">
                                                <div className="bg-slate-800/80 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700/50">
                                                    <FileText className="w-4 h-4 text-primary-500" />
                                                    <span className="text-white font-bold text-sm tracking-tight">{officerCases.length} <span className="text-slate-500 font-medium">Total Cases</span></span>
                                                </div>
                                                <div className="bg-slate-800/80 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700/50">
                                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                                    <span className="text-white font-bold text-sm tracking-tight">{activeCases.length} <span className="text-slate-500 font-medium">Active</span></span>
                                                </div>
                                            </div>

                                            {/* Cases List Snippet */}
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Assigned Cases & Status</h5>
                                                {officerCases.length === 0 ? (
                                                    <p className="text-slate-600 text-sm italic">No active investigations assigned.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {officerCases.slice(0, 6).map((c) => (
                                                            <div 
                                                                key={c.id} 
                                                                className="bg-slate-800/20 border border-slate-800 rounded-xl p-3 flex items-center justify-between group/case hover:bg-slate-800/40 hover:border-slate-700 transition-all cursor-pointer"
                                                                onClick={() => navigate(`/complaints/cmd/${c.complaint_id}`)}
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-[10px] font-mono font-bold text-primary-500">CASE-{c.id}</span>
                                                                    <div className={`text-[11px] font-bold px-1.5 py-0.5 rounded inline-block w-fit tracking-tighter uppercase ${
                                                                        c.status === 'UNDER_ENQUIRY' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                        c.status === 'ALLEGATION_PROVED' ? 'bg-red-500/10 text-red-500' :
                                                                        'bg-green-500/10 text-green-500'
                                                                    }`}>
                                                                        {c.status.replace(/_/g, ' ')}
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover/case:text-white transition-all group-hover/case:translate-x-1" />
                                                            </div>
                                                        ))}
                                                        {officerCases.length > 6 && (
                                                            <div className="bg-slate-800/10 border border-dashed border-slate-800 rounded-xl p-3 flex items-center justify-center text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                                                                + {officerCases.length - 6} More Cases
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EnquiryOfficersPortal;
