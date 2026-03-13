import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowRight, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../api';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState('request'); // 'request', 'reset', 'success'
    const [loading, setLoading] = useState(false);
    const [id, setId] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.forgotPassword(id);
            setStep('reset');
        } catch (error) {
            alert(error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.resetPassword({
                username_or_email: id,
                code: otp,
                new_password: newPassword
            });
            setStep('success');
        } catch (error) {
            alert(error.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 'request' && (
                            <motion.div
                                key="request"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/30">
                                        <KeyRound className="w-8 h-8 text-primary-500" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password</h1>
                                    <p className="text-slate-400 text-sm mt-1 text-center">Enter your Employee ID or Email to receive an OTP</p>
                                </div>

                                <form onSubmit={handleRequestOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Username / Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                placeholder="Enter your ID or Email"
                                                value={id}
                                                onChange={(e) => setId(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => window.location.href = '/login'}
                                        className="w-full text-slate-500 hover:text-white text-sm transition-colors"
                                    >
                                        Back to login
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 'reset' && (
                            <motion.div
                                key="reset"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/30">
                                        <Lock className="w-8 h-8 text-primary-500" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Reset Password</h1>
                                    <p className="text-slate-400 text-sm mt-1">Check your email for the 6-digit code</p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">OTP Code</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="000000"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                                <p className="text-slate-400 mb-8">Your password has been reset successfully. You can now log in with your new password.</p>
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Back to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
