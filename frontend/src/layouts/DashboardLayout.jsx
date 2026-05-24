import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  CheckSquare,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  FileCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "../components/NotificationDropdown";

const navItems = [
  { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
  { name: "Duyệt BĐS", path: "/admin/approval", icon: CheckSquare },
  { name: "Quản lý BĐS", path: "/admin/properties", icon: Building2 },
  { name: "Duyệt pháp lý", path: "/admin/transactions", icon: FileCheck },
  { name: "Tài chính", path: "/admin/finance", icon: Wallet },
  { name: "Người dùng", path: "/admin/users", icon: Users },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-950">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-stone-200 bg-[#15130f] text-stone-50">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d7b56d] text-stone-950">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">MGBDS Admin</p>
            <p className="text-xs font-medium text-stone-400">Trung tâm kiểm duyệt</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Điều hành
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-[#d7b56d] text-stone-950"
                        : "text-stone-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/[0.06] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-800">
              <ShieldCheck className="h-5 w-5 text-[#d7b56d]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.fullName || user?.email || "Admin"}</p>
              <p className="text-xs text-stone-400">Quản trị viên</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-stone-200 bg-[#f6f3ee]/90 px-8 backdrop-blur">
          <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
            <Search className="h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm mã BĐS, môi giới, khách hàng..."
              className="w-96 bg-transparent text-sm font-medium text-stone-700 outline-none placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <button className="rounded-lg border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition-colors hover:text-stone-950">
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
              <User className="h-5 w-5 text-stone-500" />
              <span className="text-sm font-bold text-stone-800">{user?.fullName || "Admin"}</span>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
