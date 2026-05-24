import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Users, ListChecks,
  UploadCloud, Wallet, LogOut, X, ChevronRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Tổng quan', href: '/broker', icon: LayoutDashboard },
  { name: 'Đăng tin BĐS', href: '/broker/upload', icon: UploadCloud },
  { name: 'Quản lý Lead', href: '/broker/leads', icon: Users },
  { name: 'Lịch hẹn', href: '/broker/appointments', icon: Calendar },
  { name: 'BĐS đang giao dịch', href: '/broker/transactions/history', icon: ListChecks },
  { name: 'Hoa hồng', href: '/broker/finance', icon: Wallet },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const closeSidebar = () => setIsOpen(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-white border-r border-zinc-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">MGBDS</span>
              <p className="text-[10px] text-zinc-400 font-medium -mt-0.5">Môi giới BĐS</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-3 py-4 overflow-y-auto">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest px-3 mb-3">Menu chính</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/broker'}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                        isActive ? "bg-blue-600 shadow-md shadow-blue-600/30" : "bg-zinc-100 group-hover:bg-zinc-200"
                      )}>
                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-700")} />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-zinc-50/80 mb-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 truncate">{user?.fullName || 'Môi giới'}</p>
              <p className="text-[11px] text-zinc-400">Nhân viên môi giới</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
