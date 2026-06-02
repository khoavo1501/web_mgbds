import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/broker/Sidebar';
import { Menu, Search } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth } from '../context/AuthContext';

export default function BrokerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    const getInitials = (name) => {
        if (!name) return 'NV';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex h-screen bg-[#f7f4ef] overflow-hidden font-sans">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="flex h-14 shrink-0 items-center gap-4 bg-white/90 backdrop-blur-md px-6 border-b border-slate-200/60 z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex-1 flex justify-between items-center">
                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 bg-[#f7f4ef] rounded-xl px-3.5 py-2 border border-slate-200/60 w-72 transition-all focus-within:border-gold-300 focus-within:ring-2 focus-within:ring-gold-500/20">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none w-full"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationDropdown />
                            <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center text-gold-400 font-black text-xs font-bold shadow-md">
                                {getInitials(user?.fullName)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
