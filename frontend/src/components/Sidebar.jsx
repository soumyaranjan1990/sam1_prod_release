import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Bell, Shield, FolderGit2 } from 'lucide-react';
import { api } from '../api';

const Sidebar = ({ userRole }) => {
    const handleLogout = () => {
        api.clearToken();
        window.location.href = '/login';
    };

    const getLinksForRole = () => {
        const commonLinks = [
            { path: `/dashboard/${userRole.toLowerCase().replace('_', '-')}`, label: 'Overview', icon: LayoutDashboard },
            { path: '/settings', label: 'Settings', icon: Settings },
        ];

        switch (userRole) {
            case 'CMD':
                return [
                    ...commonLinks,
                    { path: '/cases/review', label: 'Pending Cases', icon: FileText },
                    { path: '/officers', label: 'Enquiry Officers', icon: Users },
                ];
            case 'COMPLAINT_OFFICER':
                return [
                    ...commonLinks,
                    { path: '/complaints/new', label: 'Register Complaint', icon: FileText },
                    { path: '/complaints', label: 'All Complaints', icon: FolderGit2 },
                ];
            case 'DA':
                return [
                    ...commonLinks,
                    { path: '/cases/active', label: 'Active Enquiries', icon: Shield },
                    { path: '/orders/pending', label: 'Pending Orders', icon: FileText },
                ];
            case 'ENQUIRY_OFFICER':
                return [
                    ...commonLinks,
                    { path: '/enquiries/assigned', label: 'My Enquiries', icon: FolderGit2 },
                    { path: '/reports/submit', label: 'Submit Reports', icon: FileText },
                ];
            default:
                // Generic fallback
                return [
                    ...commonLinks,
                    { path: '/cases', label: 'My Cases', icon: FileText },
                ];
        }
    };

    const links = getLinksForRole();

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col p-4 fixed left-0 top-0">
            <div className="flex items-center gap-3 mb-8 px-2 mt-4">
                <div className="bg-primary-500/20 p-2 rounded-xl text-primary-400 border border-primary-500/30">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">DCMTS</h1>
                    <p className="text-xs text-slate-500 capitalize">{userRole.replace('_', ' ').toLowerCase()}</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium ${isActive
                                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-slate-800 pt-4 mt-auto space-y-2">
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium">
                    <Bell className="w-5 h-5" />
                    Notifications
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left text-red-400 hover:bg-red-500/10 transition-all font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
