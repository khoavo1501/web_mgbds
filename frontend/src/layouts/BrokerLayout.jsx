import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/broker/Sidebar';
import { Menu, Bell, Search, UserCircle } from 'lucide-react';

export default function BrokerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="flex h-14 shrink-0 items-center gap-4 bg-white/80 backdrop-blur-md px-6 border-b border-zinc-100 z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex-1 flex justify-between items-center">
                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 bg-zinc-50 rounded-xl px-3.5 py-2 border border-zinc-100 w-72 transition-all focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-50">
                            <Search className="h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="bg-transparent text-sm text-zinc-600 placeholder:text-zinc-400 outline-none w-full"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-50 rounded-xl">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            </button>
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                NV
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
