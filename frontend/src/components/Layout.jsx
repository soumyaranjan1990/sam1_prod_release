import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ userRole, children }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex font-sans">
            <Sidebar userRole={userRole} />
            <div className="flex-1 ml-64 p-8 overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
