import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building,
  CheckSquare,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || "customer";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = {
    customer: [{ name: "Trang khách hàng", path: "/customer", icon: Home }],
    broker: [
      { name: "Tổng quan", path: "/broker", icon: LayoutDashboard },
      { name: "Quản lý khách hàng", path: "/broker/leads", icon: Users },
      { name: "Tạo giao dịch", path: "/broker/transaction", icon: FileText },
    ],
    admin: [
      { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
      { name: "Quản lý BĐS", path: "/admin/properties", icon: Building },
      { name: "Duyệt BĐS", path: "/admin/approval", icon: CheckSquare },
      { name: "Tài chính", path: "/admin/finance", icon: Wallet },
    ],
  };

  const portalLabel = {
    customer: "Cổng khách hàng",
    broker: "Cổng môi giới",
    admin: "Quản trị hệ thống",
  }[role] || "Bảng điều khiển";

  const currentNav = navItems[role] || [];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="fixed z-40 h-full w-64 flex-shrink-0 bg-slate-950 text-white">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Building className="mr-2 h-7 w-7" />
          <span className="text-xl font-extrabold">NhaDatPro</span>
        </div>
        <nav className="space-y-1 p-4">
          <div className="mb-4 px-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {portalLabel}
          </div>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-md px-2 py-2.5 text-sm font-bold transition-colors ${
                  isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-2 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex w-96 items-center rounded-md bg-slate-100 px-3 py-1.5">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="ml-2 w-full border-none bg-transparent text-sm text-slate-800 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell className="h-6 w-6" />
              <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-slate-950 ring-2 ring-white" />
            </button>
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <div className="rounded-full bg-slate-100 p-1.5">
                <User className="h-5 w-5 text-slate-700" />
              </div>
              <span className="text-sm font-bold text-slate-700">{user?.fullName || user?.email || role}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
