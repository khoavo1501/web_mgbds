import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

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
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.";
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const toast = useToast();

  const isLogin = mode === "login";

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
  };

  const handleLogin = async () => {
    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      toast.success("Đăng nhập thành công!");
      navigate(getRedirectPath(result.user?.role), { replace: true });
      return;
    }
    toast.error(normalizeAuthError(result.message, "login"));
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
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
      toast.error(normalizeAuthError(result.message, "register"));
      return;
    }

    const loginResult = await login(form.email.trim(), form.password);
    if (loginResult.success) {
      toast.success("Đăng ký thành công!");
      navigate(getRedirectPath(loginResult.user?.role), { replace: true });
      return;
    }

    setMode("login");
    toast.success("Đăng ký thành công. Vui lòng đăng nhập.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.98fr_1.02fr] font-sans">
      {/* Left Section - Form */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-10 bg-[#f7f4ef]">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 group w-fit">
            <div className="p-2.5 rounded-xl bg-slate-950 text-gold-400 group-hover:scale-105 transition-transform duration-300 shadow-xl shadow-slate-950/20">
              <Building2 className="h-6 w-6" />
            </div>
            <span>NhaDatPro</span>
          </Link>

          {/* Form Container */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 premium-shadow border border-slate-100">
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-3">
                {isLogin ? "Đăng nhập" : "Đăng ký"}
              </h1>
              <p className="text-sm font-bold text-slate-500">
                {isLogin
                  ? "Chào mừng bạn quay lại với hệ thống"
                  : "Tạo tài khoản để bắt đầu hành trình của bạn"}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-8 flex p-1.5 rounded-xl bg-[#f8f6f2] border border-slate-200/60">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 h-12 rounded-lg text-sm font-black transition-all duration-300 ${
                  isLogin 
                    ? "bg-slate-950 text-white shadow-md scale-[1.02]" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex-1 h-12 rounded-lg text-sm font-black transition-all duration-300 ${
                  !isLogin 
                    ? "bg-slate-950 text-white shadow-md scale-[1.02]" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label htmlFor="fullName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Họ và tên
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(event) => updateForm("fullName", event.target.value)}
                      className="w-full px-5 py-3.5 bg-[#f8f6f2] border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Nhập họ và tên"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      pattern="[0-9]{10,11}"
                      value={form.phone}
                      onChange={(event) => updateForm("phone", event.target.value)}
                      className="w-full px-5 py-3.5 bg-[#f8f6f2] border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Ví dụ: 0901234567"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  className="w-full px-5 py-3.5 bg-[#f8f6f2] border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                  placeholder="Nhập email"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mật khẩu
                  </label>
                  {isLogin && (
                    <button type="button" className="text-[11px] font-bold text-gold-600 hover:text-gold-700 hover:underline transition">
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
                    className="w-full px-5 py-3.5 bg-[#f8f6f2] border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium pr-12"
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-200/50"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="animate-fade-in">
                  <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={(event) => updateForm("confirmPassword", event.target.value)}
                    className="w-full px-5 py-3.5 bg-[#f8f6f2] border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-6 bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded-xl font-black text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 hover:from-gold-300 hover:to-gold-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {isLogin ? "Đăng nhập ngay" : "Hoàn tất đăng ký"}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </form>
          </div>
          
          <p className="mt-8 text-center text-sm font-bold text-slate-500">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="text-gold-600 hover:text-gold-700 hover:underline transition-all"
            >
              {isLogin ? "Đăng ký tại đây" : "Đăng nhập ngay"}
            </button>
          </p>
        </div>
      </section>

      {/* Right Section - Image */}
      <section className="relative hidden lg:block overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay z-10" />
        <img 
          src={HERO_IMAGE} 
          alt="Bất động sản cao cấp" 
          className="h-full w-full object-cover scale-105 hover:scale-100 transition-transform duration-[10s] ease-out opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-20" />
        
        {/* Badge */}
        <div className="absolute top-10 right-10 z-30">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-black tracking-widest uppercase">
            Premium Real Estate
          </div>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-16 text-white z-30">
          <h2 className="max-w-2xl text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6">
            Khám phá những không gian sống đẳng cấp nhất.
          </h2>
          <p className="max-w-xl text-lg font-bold text-white/70 leading-relaxed border-l-4 border-gold-500 pl-4">
            Đồng hành cùng hàng ngàn khách hàng trong hành trình tìm kiếm tổ ấm hoàn hảo với trải nghiệm minh bạch và chuyên nghiệp.
          </p>
        </div>
      </section>
    </div>
  );
}
