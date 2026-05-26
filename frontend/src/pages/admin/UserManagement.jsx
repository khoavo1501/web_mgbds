import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Lock,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

const roleLabels = {
  admin: "Quản trị viên",
  broker: "Môi giới",
  customer: "Khách hàng",
};

const roleStyles = {
  admin: "bg-stone-950 text-white",
  broker: "bg-[#d7b56d] text-stone-950",
  customer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load users", error);
      showToast("error", error.response?.data?.message || "Không tải được danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const summary = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      brokers: users.filter((user) => user.role === "broker").length,
      active: users.filter((user) => user.isActive).length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "locked" && !user.isActive);
      const matchesKeyword =
        !keyword ||
        [user.fullName, user.email, user.phone]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      return matchesRole && matchesStatus && matchesKeyword;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/admin/users/brokers", {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (response.data.success) {
        setForm(initialForm);
        showToast("success", "Đã tạo tài khoản môi giới.");
        await fetchUsers();
      } else {
        showToast("error", response.data.message || "Tạo tài khoản thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không thể tạo tài khoản môi giới.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActiveChange = async (user, active) => {
    setProcessingId(user.userId);
    try {
      const response = await api.patch(`/admin/users/${user.userId}/active?active=${active}`);
      if (response.data.success) {
        showToast("success", active ? `Đã mở khóa ${user.fullName}.` : `Đã khóa ${user.fullName}.`);
        await fetchUsers();
      } else {
        showToast("error", response.data.message || "Cập nhật trạng thái thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không thể cập nhật trạng thái người dùng.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                toast.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <p className="text-sm font-bold text-stone-800">{toast.message}</p>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Quyền truy cập</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Quản lý người dùng</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Quản lý tài khoản người dùng và tạo tài khoản môi giới trong hệ thống.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Tổng tài khoản" value={summary.total} icon={Users} tone="dark" />
        <Metric title="Quản trị" value={summary.admins} icon={ShieldCheck} tone="gold" />
        <Metric title="Môi giới" value={summary.brokers} icon={UserCog} tone="brown" />
        <Metric title="Đang hoạt động" value={summary.active} icon={BadgeCheck} tone="green" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d7b56d] text-stone-950">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-950">Tạo tài khoản broker</h2>
              <p className="text-sm font-medium text-stone-500">Tài khoản mới sẽ có role cố định là môi giới.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field
              label="Họ tên"
              value={form.fullName}
              onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
              placeholder="Nguyễn Văn Môi Giới"
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder="broker@example.com"
              required
            />
            <Field
              label="Số điện thoại"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              placeholder="0901234567"
              required
            />
            <Field
              label="Mật khẩu tạm"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Tạo broker
          </button>
        </form>

        <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-950">Danh sách tài khoản</h2>
              <p className="text-sm font-medium text-stone-500">Lọc theo vai trò, trạng thái hoặc tìm nhanh theo tên/email.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm người dùng..."
                  className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm font-bold text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-[#d7b56d] sm:w-64"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm font-black text-stone-800 outline-none transition-colors focus:border-[#d7b56d]"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="broker">Broker</option>
                <option value="customer">Customer</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm font-black text-stone-800 outline-none transition-colors focus:border-[#d7b56d]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã khóa</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-stone-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải người dùng...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Users className="h-7 w-7" />
              </div>
              <p className="text-lg font-black text-stone-900">Không có người dùng phù hợp</p>
              <p className="mt-1 text-sm font-medium text-stone-500">Thử đổi bộ lọc hoặc tạo broker mới.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredUsers.map((user) => (
                <article key={user.userId} className="grid grid-cols-[1fr_130px_130px_116px] items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fbf8f1]">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-black text-stone-950">{user.fullName}</span>
                      <RolePill role={user.role} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {user.phone || "Chưa có SĐT"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-stone-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
                        user.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {user.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    {user.role === "admin" ? (
                      <span className="text-xs font-black text-stone-400">Bảo vệ</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActiveChange(user, !user.isActive)}
                        disabled={processingId === user.userId}
                        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          user.isActive
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {processingId === user.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {user.isActive ? "Khóa" : "Mở"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#d7b56d] text-stone-950",
    brown: "bg-[#7f5539] text-white",
    green: "bg-[#2f6f73] text-white",
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-stone-950">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-stone-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-[#d7b56d]"
      />
    </label>
  );
}

function RolePill({ role }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-transparent ${roleStyles[role] || roleStyles.customer}`}>
      {roleLabels[role] || role}
    </span>
  );
}
