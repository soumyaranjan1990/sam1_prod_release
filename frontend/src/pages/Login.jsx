import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, KeyRound, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api';

const LoginPage = () => {
    const [step, setStep] = useState('login'); // 'login' or 'otp'
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await api.login(username, password);
            api.setToken(data.access_token);

            // Get user profile to determine role
            const user = await api.getCurrentUser();
            const rolePath = user.role.toLowerCase().replace(/_/g, '-');
            window.location.href = `/dashboard/${rolePath}`;
        } catch (error) {
            alert(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            window.location.href = '/dashboard';
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/30">
                            <Shield className="w-8 h-8 text-primary-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">DCMTS</h1>
                        <p className="text-slate-400 text-sm mt-1">Disciplinary Case Management System</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'login' ? (
                            <motion.form
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Username / Employee ID</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                                            placeholder="Enter your ID"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = '/forgot-password'}
                                        className="text-slate-400 hover:text-white text-sm transition-colors text-center"
                                    >
                                        Forgot Password?
                                    </button>
                                    <div className="h-px bg-slate-800 w-full" />
                                    <p className="text-slate-500 text-sm text-center">
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => window.location.href = '/signup'}
                                            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                        >
                                            Sign Up
                                        </button>
                                    </p>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="otp-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <p className="text-slate-300">We've sent a 6-digit code to your email.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">One-Time Password</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('login')}
                                    className="w-full text-slate-500 hover:text-white text-sm transition-colors"
                                >
                                    Back to login
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
