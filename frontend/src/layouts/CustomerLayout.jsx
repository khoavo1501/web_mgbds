import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  Home,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "../components/NotificationDropdown";

const navItems = [
  { name: "Tổng quan", path: "/customer", icon: Home, end: true },
  { name: "Thông tin cá nhân", path: "/customer/profile", icon: UserRound },
  { name: "Lịch hẹn", path: "/customer/appointments", icon: CalendarDays },
  { name: "Lịch sử giao dịch", path: "/customer/transactions", icon: BriefcaseBusiness },
  { name: "BĐS yêu thích", path: "/customer/favorites", icon: Heart },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userName = user?.fullName || user?.email || "Khách hàng";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link to="/" className="flex h-16 items-center px-8 text-xl font-extrabold tracking-tight text-slate-950">
          NhaDatPro
        </Link>

        <nav className="flex-1 space-y-1 border-t border-slate-100 px-4 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              {initials || "KH"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{userName}</p>
              <p className="text-xs font-semibold text-slate-500">Customer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden h-10 w-72 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm text-slate-500 sm:flex">
                <Search className="h-4 w-4" />
                <span>Tìm kiếm...</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Link
                to="/"
                className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 hover:bg-slate-50"
              >
                Về trang chủ
              </Link>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold ${
                    isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
