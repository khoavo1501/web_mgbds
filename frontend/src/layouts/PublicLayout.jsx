import { useState, useEffect } from "react";
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
import { useReputation } from "../context/ReputationContext";
import NotificationDropdown from "../components/NotificationDropdown";
import ReputationBadge from "../components/common/ReputationBadge";

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const { reputationScore } = useReputation();
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
    `text-sm font-semibold transition-all duration-200 relative ${
      isActive 
        ? "text-gold-600 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-gold-500 after:rounded-full" 
        : "text-slate-500 hover:text-slate-900"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {!isAuthPage && <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 group">
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-white p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">NhaDatPro</span>
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
                className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-gold-600 hover:border-gold-200 hover:shadow-md"
              >
                Đăng nhập
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <NotificationDropdown />
                <div className="relative">
                  <button
                  type="button"
                  onClick={() => setShowDropdown((value) => !value)}
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm pl-2 pr-4 py-1.5 shadow-sm transition-all hover:bg-white hover:border-gold-300 hover:shadow-md group"
                >
                  <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="hidden text-sm font-bold text-slate-800 sm:inline group-hover:text-gold-700 transition-colors">
                      {user.fullName || user.email}
                    </span>
                    {user.role === "customer" && reputationScore && (
                      <div className="hidden sm:block">
                        <ReputationBadge 
                          score={reputationScore.currentScore} 
                          level={reputationScore.level} 
                          size="sm"
                          showScore={true}
                        />
                      </div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white/95 backdrop-blur-xl py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] animate-fade-in origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài khoản</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-gold-600 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {user?.role === "customer" && (
                      <>
                        <Link
                          to="/customer/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <UserCircle className="h-4 w-4" />
                          Hồ sơ
                        </Link>
                        <Link
                          to="/customer/transactions/active"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Đang giao dịch
                        </Link>
                        <Link
                          to="/customer/transactions"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Lịch sử giao dịch
                        </Link>
                        <Link
                          to="/customer/appointments"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Calendar className="h-4 w-4" />
                          Lịch của tôi
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-slate-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        </div>
      </header>}

      <main className="flex-grow">
        <Outlet />
      </main>

      {!isAuthPage && <footer className="bg-slate-950 py-12 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xl font-extrabold text-white">
              <div className="bg-gold-500 text-slate-950 p-1.5 rounded-lg shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <span>NhaDatPro</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
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
              <li><Link to="/" className="hover:text-white">Giới thiệu</Link></li>
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
