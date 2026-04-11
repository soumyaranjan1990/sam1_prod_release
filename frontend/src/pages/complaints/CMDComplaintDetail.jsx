import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
    FileText, ArrowLeft, User, Building2, Calendar, Users,
    ClipboardCheck, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '../../api';

const CMDComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [assignData, setAssignData] = useState({
        enquiry_officer_id: '',
        disciplinary_authority_id: '',
        controlling_officer_id: '',
        enquiry_deadline: '',
    });

    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [c, users] = await Promise.all([
                    api.fetchWithAuth(`/complaints/${id}`),
                    api.fetchWithAuth('/auth/users/'),
                ]);
                setComplaint(c);
                setAllUsers(Array.isArray(users) ? users : []);
                
                // Set Enquiry Officers (for legacy reasons or just to have them handy)
                const eos = Array.isArray(users)
                    ? users.filter(u => u.role === 'ENQUIRY_OFFICER')
                    : [];
                setOfficers(eos);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to load complaint.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignData.enquiry_officer_id || !assignData.disciplinary_authority_id || !assignData.controlling_officer_id) {
            setError('Please assign all three officers (EO, DA, and CO).');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            // Find the case for this complaint
            const cases = await api.fetchWithAuth('/cases/');
            const relatedCase = Array.isArray(cases)
                ? cases.find(c => c.complaint_id === complaint.id)
                : null;

            if (!relatedCase) throw new Error('No case found for this complaint.');

            await api.fetchWithAuth(`/cases/${relatedCase.id}/assign`, {
                method: 'PATCH',
                body: JSON.stringify({
                    enquiry_officer_id: parseInt(assignData.enquiry_officer_id),
                    disciplinary_authority_id: parseInt(assignData.disciplinary_authority_id),
                    controlling_officer_id: parseInt(assignData.controlling_officer_id),
                    enquiry_deadline: assignData.enquiry_deadline || null,
                    assigned_wing: assignData.assigned_wing,
                    wing_details: assignData.wing_details || null,
                }),
            });

            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Assignment failed.');
        } finally {
            setSubmitting(false);
        }
    };

    // ... (rest of the component render logic)

    if (loading) {
        return (
            <Layout userRole="CMD">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!complaint) {
        return (
            <Layout userRole="CMD">
                <div className="text-slate-400 p-8">Complaint not found.</div>
            </Layout>
        );
    }

    return (
        <Layout userRole="CMD">
            <div className="max-w-4xl space-y-6">
                {/* Back */}
                <button
                    onClick={() => navigate('/dashboard/cmd')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* Complaint Detail Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="font-mono text-amber-400 text-sm font-bold">{complaint.file_number}</span>
                            <h2 className="text-2xl font-bold text-white mt-1">{complaint.complaint_title}</h2>
                        </div>
                        <span className="shrink-0 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-3 py-1.5 rounded-full font-semibold">
                            REGISTERED
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {complaint.department && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Building2 className="w-4 h-4 text-slate-600" />
                                {complaint.department}
                            </div>
                        )}
                        {complaint.date_of_receipt && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4 text-slate-600" />
                                {complaint.date_of_receipt}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-400">
                            <FileText className="w-4 h-4 text-slate-600" />
                            {complaint.complaint_type}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Complaint Details</p>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{complaint.details}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tagged Employees</p>
                        <div className="flex flex-wrap gap-2">
                            {complaint.employees && complaint.employees.length > 0 ? (
                                complaint.employees.map((assoc, idx) => {
                                    const emp = assoc.employee;
                                    if (!emp) return null;
                                    return (
                                        <div key={emp.id || idx} className="bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-2 flex flex-col gap-0.5 shadow-inner">
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">ID: {emp.employee_id}</span>
                                            <span className="text-sm font-bold text-slate-200">{emp.name}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <span className="text-slate-600 italic text-xs">No employees tagged to this complaint.</span>
                            )}
                        </div>
                    </div>

                    {complaint.document_path && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Supporting document attached: <span className="text-slate-200 font-medium ml-1">{complaint.document_path.split('/').pop()}</span>
                        </div>
                    )}
                </div>

                {/* Assignment Form */}
                {success ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-white">Assignment Successful!</h3>
                            <p className="text-slate-400 mt-1">The Enquiry Officer has been notified and the case is now under enquiry.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/cmd')}
                            className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-8 rounded-xl transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAssign} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                                Review & Assign Enquiry
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Select a Wing, an Enquiry Officer, set a timeline, and classify the gravity.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Wing Assignment */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Assign to Wing *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <select
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                                        value={assignData.assigned_wing || ''}
                                        onChange={e => setAssignData({...assignData, assigned_wing: e.target.value, wing_details: ''})}
                                    >
                                        <option value="">Select Wing...</option>
                                        <option value="VIGILANCE">Vigilance Wing</option>
                                        <option value="AUDIT">Audit Wing</option>
                                        <option value="QC">QC Wing</option>
                                        <option value="AUTHORIZED_SERVICES">Authorized Services (Supply Power)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Wing Details (Sub-options for Authorized Services) */}
                            {assignData.assigned_wing === 'AUTHORIZED_SERVICES' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Authorized Services Option *</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <select
                                            required
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                                            value={assignData.wing_details || ''}
                                            onChange={e => setAssignData({...assignData, wing_details: e.target.value})}
                                        >
                                            <option value="">Select Option...</option>
                                            <option value="DPE">DPE (based on complaint type)</option>
                                            <option value="DE/Constn/MRT">DE / Constn / MRT</option>
                                            <option value="DE/Technical">DE / Technical</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Enquiry Officer */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Enquiry Officer *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <select
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                                        value={assignData.enquiry_officer_id}
                                        onChange={e => setAssignData({...assignData, enquiry_officer_id: e.target.value})}
                                    >
                                        <option value="">Select officer...</option>
                                        {officers.map(o => (
                                            <option key={o.id} value={o.id}>
                                                {o.username} ({o.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Enquiry Deadline *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={assignData.enquiry_deadline}
                                        onChange={e => setAssignData({...assignData, enquiry_deadline: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Disciplinary Authority (DA) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Disciplinary Authority (DA) *</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <select
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                                        value={assignData.disciplinary_authority_id}
                                        onChange={e => setAssignData({...assignData, disciplinary_authority_id: e.target.value})}
                                    >
                                        <option value="">Select DA...</option>
                                        {allUsers.filter(u => u.role === 'DA').map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.username} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Controlling Officer (CO) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Controlling Officer (CO) *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <select
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                                        value={assignData.controlling_officer_id}
                                        onChange={e => setAssignData({...assignData, controlling_officer_id: e.target.value})}
                                    >
                                        <option value="">Select CO...</option>
                                        {allUsers.filter(u => u.role === 'CO').map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.username} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard/cmd')}
                                className="px-6 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !assignData.enquiry_officer_id || !assignData.assigned_wing || (assignData.assigned_wing === 'AUTHORIZED_SERVICES' && !assignData.wing_details)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-10 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {submitting
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <><ClipboardCheck className="w-4 h-4" /> Review & Submit</>
                                }
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
};

export default CMDComplaintDetail;
