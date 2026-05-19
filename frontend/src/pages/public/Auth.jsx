import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=85";

const getRedirectPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "broker") return "/broker";
  return "/customer";
};

const normalizeAuthError = (message, mode) => {
  if (!message) return mode === "login" ? "Đăng nhập thất bại. Vui lòng thử lại." : "Đăng ký thất bại. Vui lòng thử lại.";
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("credential") || lowerMessage.includes("password") || lowerMessage.includes("email")) {
    return mode === "login" ? "Email hoặc mật khẩu không đúng" : message;
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("kết nối") || lowerMessage.includes("máy chủ")) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.";
  }
  return message;
};

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isLogin = mode === "login";

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleLogin = async () => {
    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      navigate(getRedirectPath(result.user?.role), { replace: true });
      return;
    }
    setError(normalizeAuthError(result.message, "login"));
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const result = await register({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      role: "customer",
    });

    if (!result.success) {
      setError(normalizeAuthError(result.message, "register"));
      return;
    }

    const loginResult = await login(form.email.trim(), form.password);
    if (loginResult.success) {
      navigate(getRedirectPath(loginResult.user?.role), { replace: true });
      return;
    }

    setMode("login");
    setError("Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-[0.98fr_1.02fr]">
      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Building2 className="h-6 w-6" />
            <span>NhaDatPro</span>
          </Link>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
              {isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h1>
            <p className="mt-3 text-base font-medium text-slate-500">
              {isLogin
                ? "Chào mừng bạn quay lại với NhaDatPro"
                : "Tạo tài khoản khách hàng để lưu tin và đặt lịch xem nhà"}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-10 rounded-sm text-sm font-extrabold transition ${
                isLogin ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`h-10 rounded-sm text-sm font-extrabold transition ${
                !isLogin ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-slate-700">
                    Họ và tên
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(event) => updateForm("fullName", event.target.value)}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                    placeholder="Nhập họ và tên"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    pattern="[0-9]{10,11}"
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                    placeholder="Ví dụ: 0901234567"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Nhập email"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Mật khẩu
                </label>
                {isLogin && (
                  <button type="button" className="text-sm font-bold text-slate-700 transition hover:text-slate-950">
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isLogin ? undefined : 6}
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-slate-500 transition hover:text-slate-950"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(event) => updateForm("confirmPassword", event.target.value)}
                  className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-base font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm font-medium text-slate-500">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="font-extrabold text-slate-800 hover:text-slate-950"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden lg:block">
        <img src={HERO_IMAGE} alt="Mô hình nhà và chìa khóa" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white">
          <h2 className="max-w-2xl text-4xl font-extrabold tracking-tight">
            Nền tảng môi giới số 1 Việt Nam
          </h2>
          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-white/85">
            Kết nối hàng triệu người mua và người bán mỗi tháng với trải nghiệm an toàn, minh bạch.
          </p>
        </div>
      </section>
    </div>
  );
}
