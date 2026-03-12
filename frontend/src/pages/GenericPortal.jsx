import React from 'react';
import Layout from '../components/Layout';
import { Settings, Construction } from 'lucide-react';

const GenericPortal = ({ title, userRole }) => {
    return (
        <Layout userRole={userRole || 'CMD'}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-primary-500/10 rounded-3xl flex items-center justify-center border border-primary-500/20 animate-pulse">
                    <Construction className="w-12 h-12 text-primary-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{title || 'Portal Section'}</h2>
                    <p className="text-slate-400 max-w-md mx-auto">This module is currently under development. Please check back later for updates as we complete the DCMTS implementation.</p>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                    &larr; Go Back
                </button>
            </div>
        </Layout>
    );
};

export default GenericPortal;
