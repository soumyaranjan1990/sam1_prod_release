import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, Send, User, MapPin, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

const ComplaintForm = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        complaint_title: '',
        details: '',
        department: '',
        employee_ids: [], // Should be list of ints
    });
    const [tempEmpId, setTempEmpId] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await api.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Transform tempEmpId to array of ints
            const finalData = {
                ...formData,
                registered_by_id: user?.id || 1, // Fallback if user fetch failed
                employee_ids: tempEmpId ? tempEmpId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
            };

            await api.fetch('/api/v1/complaints/', {
                method: 'POST',
                body: JSON.stringify(finalData),
            });
            setSuccess(true);
        } catch (error) {
            alert('Failed to register complaint: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout userRole="COMPLAINT_OFFICER">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Complaint Registered!</h2>
                        <p className="text-slate-400 max-w-md">The complaint has been successfully recorded and is now pending review by the CMD.</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard/complaint-officer'}
                        className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout userRole="COMPLAINT_OFFICER">
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Register New Complaint</h2>
                    <p className="text-slate-400">Provide details about the incident or grievance to initiate a case.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Complaint Title</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Unauthorized Absence"
                                        value={formData.complaint_title}
                                        onChange={e => setFormData({ ...formData, complaint_title: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Employee IDs (Comma separated numbers)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="1, 2, 3"
                                        value={tempEmpId}
                                        onChange={e => setTempEmpId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Location / Department</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Circle Office, Delhi"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Detailed Description</label>
                            <textarea
                                required
                                rows={6}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                placeholder="Describe the incident in detail..."
                                value={formData.details}
                                onChange={e => setFormData({ ...formData, details: e.target.value })}
                            />
                        </div>

                        <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-4 flex gap-3 text-sm text-primary-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Ensure all information is accurate. Once submitted, the complaint will be reviewed by the CMD for gravity classification.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-10 rounded-xl flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Complaint</>}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default ComplaintForm;
