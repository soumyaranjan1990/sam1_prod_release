import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileText, Send, User, MapPin, AlertCircle, Loader2, CheckCircle2, Calendar, Upload } from 'lucide-react';
import { api } from '../../api';

const ComplaintForm = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registeredFileNo, setRegisteredFileNo] = useState('');
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        complaint_title: '',
        details: '',
        department: '',
        date_of_receipt: new Date().toISOString().split('T')[0],
    });
    const [tempEmpId, setTempEmpId] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const userData = await api.getCurrentUser();
                setUser(userData);
                const empData = await api.fetchWithAuth('/employees/');
                setEmployees(Array.isArray(empData) ? empData : []);
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let documentPath = null;

            // 1. Upload document first if selected
            if (file) {
                const uploadData = await api.uploadFile(file);
                documentPath = uploadData.document_path;
            }

            // 2. Submit complaint
            const employee_ids = tempEmpId
                ? tempEmpId.split(',').map(id => {
                    const idTrim = id.trim();
                    const emp = employees.find(e => e.employee_id === idTrim || e.id.toString() === idTrim);
                    return emp ? emp.id : null;
                }).filter(id => id !== null)
                : [];

            // Resolve complainant employee PK if applicable
            let complainant_pk = null;
            if (formData.complainant_type === 'EMPLOYEE' && formData.complainant_employee_id) {
                const cEmp = employees.find(e => e.employee_id === formData.complainant_employee_id || e.id.toString() === formData.complainant_employee_id);
                complainant_pk = cEmp ? cEmp.id : null;
            }

            const payload = {
                ...formData,
                registered_by_id: user?.id || 1,
                employee_ids,
                complainant_employee_id: complainant_pk,
                document_path: documentPath,
            };

            const result = await api.fetchWithAuth('/complaints/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setRegisteredFileNo(result?.file_number || '');
            setSuccess(true);
        } catch (err) {
            alert('Failed to register complaint: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper: resolve employee name from ID
    const resolveNames = () =>
        tempEmpId.split(',').filter(id => id.trim()).map((id, i) => {
            const emp = employees.find(e => e.id.toString() === id.trim());
            return emp
                ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
                : `EMP #${id.trim()}`;
        });

    if (success) {
        return (
            <Layout userRole="COMPLAINT_OFFICER">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Complaint Registered!</h2>
                        {registeredFileNo && (
                            <p className="text-amber-400 font-mono text-lg font-bold mb-2">
                                File No: {registeredFileNo}
                            </p>
                        )}
                        <p className="text-slate-400 max-w-md">
                            The complaint has been successfully recorded and the CMD has been notified for review.
                        </p>
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
                    <p className="text-slate-400">Provide details about the petition to initiate a case. A unique file number will be auto-generated.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-8">
                        
                        {/* Section 1: Source & Complainant */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-l-4 border-primary-500 pl-3">
                                Complainant Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Source of Complaint</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={formData.complainant_type || ''}
                                        onChange={e => setFormData({ ...formData, complainant_type: e.target.value })}
                                    >
                                        <option value="">Select Source</option>
                                        <option value="CONSUMER">Consumer Petition</option>
                                        <option value="EMPLOYEE">Employee Grievance</option>
                                        <option value="FIELD_OFFICER">Field Officer (Circle/Division)</option>
                                        <option value="CORPORATE">Corporate Office Section</option>
                                        <option value="EXTERNAL">External Authority</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Complainant Name / Details</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Name of petitioner/current"
                                            value={formData.complainant_name || ''}
                                            onChange={e => setFormData({ ...formData, complainant_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {formData.complainant_type === 'EMPLOYEE' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 col-span-full">
                                        <label className="text-sm font-medium text-primary-400 font-bold">Link to Complainant's Employee ID (for Portal Visibility)</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                                            <input
                                                type="text"
                                                className="w-full bg-primary-500/5 border border-primary-500/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                                                placeholder="e.g. 101"
                                                value={formData.complainant_employee_id || ''}
                                                onChange={e => setFormData({ ...formData, complainant_employee_id: e.target.value })}
                                            />
                                        </div>
                                        {formData.complainant_employee_id && (
                                            <div className="text-xs mt-1 font-bold text-primary-300">
                                                {(() => {
                                                    const emp = employees.find(e => e.employee_id === formData.complainant_employee_id || e.id.toString() === formData.complainant_employee_id);
                                                    return emp ? `Linked to: ${emp.name}` : "Employee ID not found in registry";
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Subject Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                                Subject & Details
                            </h3>
                            
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
                                    <label className="text-sm font-medium text-slate-300">Tagged Employee IDs</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                                            placeholder="e.g. 1, 2 (comma separated)"
                                            value={tempEmpId}
                                            onChange={e => setTempEmpId(e.target.value)}
                                        />
                                    </div>
                                    {tempEmpId.trim() && (
                                        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                            {tempEmpId.split(',').filter(id => id.trim()).map((id, i) => {
                                                const idTrim = id.trim();
                                                // Find employee by employee_id or id
                                                const emp = employees.find(e => e.employee_id === idTrim || e.id.toString() === idTrim);
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col gap-0.5 px-4 py-2 rounded-2xl border transition-all shadow-sm ${
                                                            emp 
                                                            ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                                                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">ID: {idTrim}</span>
                                                        <span className="text-sm font-bold">
                                                            {emp ? emp.name : "Unknown Employee"}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row: Department + Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Circle / Department</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g. Circle Office, Delhi"
                                            value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Date of Receipt</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.date_of_receipt}
                                            onChange={e => setFormData({ ...formData, date_of_receipt: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Complaint Details</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none leading-relaxed"
                                    placeholder="Describe the incident, petition details, or reference numbers..."
                                    value={formData.details}
                                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Section 3: Document Upload */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-l-4 border-slate-500 pl-3">
                                Supporting Document
                            </h3>
                            <label className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl p-6 cursor-pointer hover:border-primary-500/50 transition-all hover:bg-slate-800 group group shadow-inner">
                                <div className="p-4 bg-primary-500/10 rounded-2xl text-primary-400 group-hover:bg-primary-500/20 transition-all">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    {file ? (
                                        <p className="text-white font-bold text-base flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" /> {file.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-slate-200 font-bold text-base">Click or drag a file here</p>
                                            <p className="text-slate-500 text-sm mt-0.5">PDF, DOCX, JPG, PNG — max 10MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-5 flex gap-4 text-sm text-primary-300 shadow-sm">
                            <AlertCircle className="w-6 h-6 shrink-0 text-primary-500" />
                            <div>
                                <p className="font-bold mb-1">Confirmation Note</p>
                                <p className="opacity-80">A unique file number (DC/YYYY/XXXX) will be auto‑assigned. The CMD will be notified immediately of this registration.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pb-12">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-8 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-12 rounded-xl flex items-center gap-2 transition-all transform hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-primary-500/20 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Final Submission</>}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default ComplaintForm;
