import { useState } from "react";
import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Phone,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const isAuthPage = location.pathname === "/auth";

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "broker") return "/broker";
    return "/customer";
  };

  const navClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-950"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-950">
      {!isAuthPage && <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-950">
            <Building2 className="h-6 w-6" />
            <span>NhaDatPro</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <NavLink to="/" className={navClass} end>
              Trang chủ
            </NavLink>
            <NavLink to="/properties" className={navClass}>
              Nhà đất bán
            </NavLink>
            <NavLink to="/properties?propertyType=apartment" className={navClass}>
              Nhà đất cho thuê
            </NavLink>
            <NavLink to="/properties?propertyType=villa" className={navClass}>
              Dự án
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {!user ? (
              <Link
                to="/auth"
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Đăng nhập
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown((value) => !value)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                >
                  <UserCircle className="h-5 w-5" />
                  <span className="hidden max-w-40 truncate sm:inline">
                    {user.fullName || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {user?.role === 'customer' && (
                      <Link
                        to="/customer/appointments"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Calendar className="h-4 w-4" />
                        Lịch hẹn của tôi
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>}

      <main className="flex-grow">
        <Outlet />
      </main>

      {!isAuthPage && <footer className="bg-slate-950 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Building2 className="h-5 w-5" />
              <span>NhaDatPro</span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-300">
              Nền tảng môi giới bất động sản hàng đầu Việt Nam. Cung cấp thông tin chính xác,
              giao dịch an toàn và nhanh chóng.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold">Danh mục</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/properties" className="hover:text-white">Mua bán nhà đất</Link></li>
              <li><Link to="/properties" className="hover:text-white">Cho thuê nhà đất</Link></li>
              <li><Link to="/properties" className="hover:text-white">Dự án nổi bật</Link></li>
              <li><Link to="/properties" className="hover:text-white">Chuyên viên môi giới</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/" className="hover:text-white">Về chúng tôi</Link></li>
              <li><Link to="/" className="hover:text-white">Liên hệ</Link></li>
              <li><Link to="/" className="hover:text-white">Điều khoản sử dụng</Link></li>
              <li><Link to="/" className="hover:text-white">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4" />123 Đường ABC, Quận 1, TP. Hồ Chí Minh</li>
              <li className="flex gap-2"><Phone className="h-4 w-4" />1900 1234</li>
              <li className="flex gap-2"><Mail className="h-4 w-4" />contact@nhadatpro.vn</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs text-slate-500 sm:px-6 lg:px-8">
          © 2026 NhaDatPro. All rights reserved.
        </div>
      </footer>}
    </div>
  );
}
