import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  Clock3,
  Heart,
  Landmark,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Square,
  UserRound,
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useToast } from "../../context/ToastContext";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80";

const appointmentStatusLabels = {
  pending: "Chờ xác nhận",
  scheduled: "Đã lên lịch",
  confirmed: "Đã xác nhận",
  viewed: "Đã xem nhà",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
};

const transactionStatusLabels = {
  pending: "mới",
  customer_confirmed: "đang xử lý",
  documents_submitted: "đang xử lý",
  documents_verified: "đang xử lý",
  payment_submitted: "đang xử lý",
  deposit_confirmed: "đang xử lý",
  commitment_signed: "đang xử lý",
  deal_scheduled: "đang xử lý",
  broker_confirmed: "hoàn tất",
  completed: "hoàn tất",
  cancelled: "đã hủy",
};

const activeTransactionStatuses = new Set([
  "pending",
  "customer_confirmed",
  "documents_submitted",
  "documents_verified",
  "payment_submitted",
  "deposit_confirmed",
  "commitment_signed",
  "deal_scheduled",
  "broker_confirmed",
  "refund_requested",
]);

const appointmentFallbackImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80",
];

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (price) => {
  if (!price) return "Liên hệ";
  if (Number(price) >= 1000000000) {
    return `${Number(price / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }
  return `${Number(price / 1000000).toLocaleString("vi-VN")} triệu`;
};

const formatArea = (area) => {
  if (!area) return "Đang cập nhật";
  return `${Number(area).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}m²`;
};

const getPropertyImage = (property) => {
  const primaryImage = property?.images?.find((image) => image.isPrimary);
  return primaryImage?.url || property?.images?.[0]?.url || PLACEHOLDER_IMAGE;
};

const getAppointmentStatusClass = (status) => {
  if (status === "confirmed" || status === "scheduled" || status === "viewed") return "bg-green-50 text-green-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
};

const appointmentStatusTone = {
  pending: "bg-amber-500 text-white",
  scheduled: "bg-blue-500 text-white",
  confirmed: "bg-emerald-500 text-white",
  viewed: "bg-slate-100 text-slate-950",
  completed: "bg-slate-100 text-slate-950",
  cancelled: "bg-rose-50 text-rose-700",
};

const getAppointmentImage = (appointment, index) =>
  appointment.propertyImage ||
  appointment.propertyImageUrl ||
  appointment.imageUrl ||
  appointment.thumbnailUrl ||
  appointmentFallbackImages[index % appointmentFallbackImages.length];

const getAppointmentAddress = (appointment) =>
  appointment.propertyAddress ||
  appointment.address ||
  [appointment.propertyDistrict, appointment.propertyProvince].filter(Boolean).join(", ") ||
  appointment.note ||
  "Đang cập nhật địa chỉ";

const getAppointmentBroker = (appointment) => {
  const name = appointment.brokerName || "Môi giới phụ trách";
  const phone = appointment.brokerPhone || appointment.brokerPhoneNumber || appointment.customerPhone;
  return phone ? `${name} · ${phone}` : name;
};

const getTransactionStatusClass = (status) => {
  if (status === "completed" || status === "broker_confirmed") return "bg-emerald-500 text-white";
  if (status === "cancelled") return "bg-rose-50 text-rose-700";
  if (activeTransactionStatuses.has(status)) return "bg-slate-950 text-white";
  return "bg-slate-100 text-slate-700";
};

const BANKS_API_URL = "https://api.vietqr.io/v2/banks";

export default function CustomerDashboard({ mode = "overview" }) {
  const [appointments, setAppointments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);
  const { favorites } = useFavorites();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await api.get("/appointments");
      if (res.data.success) {
        setAppointments(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách lịch hẹn", err);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const res = await api.get("/transactions");
      if (res.data.success) {
        setTransactions(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách giao dịch", err);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchTransactions();
  }, [fetchAppointments, fetchTransactions]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((item) => !["cancelled", "completed"].includes(item.status)),
    [appointments]
  );

  const activeTransactions = useMemo(
    () => transactions.filter((item) => activeTransactionStatuses.has(item.status)),
    [transactions]
  );

  const recentTransactions = useMemo(
    () => transactions.slice().sort((a, b) => Number(b.transactionId || 0) - Number(a.transactionId || 0)).slice(0, 3),
    [transactions]
  );

  const resetBookingForm = () => {
    setBookingProperty(null);
    setRescheduleId(null);
    setBookingDate("");
    setBookingTime("");
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!bookingDate || !bookingTime || !bookingProperty) return;

    try {
      const res = await api.post("/appointments", {
        propertyId: bookingProperty.propertyId,
        scheduledAt: `${bookingDate}T${bookingTime}:00`,
        note: "Khách hàng hẹn xem qua portal",
      });

      if (res.data.success) {
        resetBookingForm();
        fetchAppointments();
        toast.success("Đặt lịch xem nhà thành công!");
        navigate("/customer/appointments");
      }
    } catch (err) {
      toast.error(`Lỗi khi đặt lịch: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    if (!bookingDate || !bookingTime || !rescheduleId) return;

    try {
      const res = await api.put(`/appointments/${rescheduleId}`, {
        scheduledAt: `${bookingDate}T${bookingTime}:00`,
        note: "Khách hàng dời lịch",
      });

      if (res.data.success) {
        resetBookingForm();
        fetchAppointments();
        toast.success("Dời lịch hẹn thành công!");
      }
    } catch (err) {
      toast.error(`Lỗi khi dời lịch hẹn: ${err.response?.data?.message || err.message}`);
    }
  };

  const openRescheduleModal = (appointment) => {
    const date = new Date(appointment.scheduledAt);
    setBookingDate(date.toISOString().slice(0, 10));
    setBookingTime(date.toTimeString().slice(0, 5));
    setRescheduleId(appointment.appointmentId);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;

    try {
      const res = await api.delete(`/appointments/${id}`);
      if (res.data.success) {
        toast.success("Hủy lịch hẹn thành công!");
        fetchAppointments();
      }
    } catch (err) {
      toast.error(`Lỗi khi hủy lịch hẹn: ${err.response?.data?.message || err.message}`);
    }
  };
  return (
    <div className="mx-auto max-w-7xl">
      {mode === "overview" && (
        <Overview
          appointments={upcomingAppointments}
          transactions={recentTransactions}
          activeTransactions={activeTransactions}
          favorites={favorites}
          loadingTransactions={loadingTransactions}
        />
      )}

      {mode === "profile" && <Profile user={user} onUpdateProfile={updateProfile} returnTo={location.state?.returnTo} initialMessage={location.state?.message} appointments={appointments} transactions={transactions} />}

      {mode === "appointments" && (
        <Appointments
          appointments={appointments}
          loading={loadingAppointments}
          onReschedule={openRescheduleModal}
          onCancel={handleCancel}
        />
      )}

      {mode === "favorites" && <Favorites favorites={favorites} onBook={setBookingProperty} />}

      {(bookingProperty || rescheduleId) && (
        <BookingModal
          bookingProperty={bookingProperty}
          rescheduleId={rescheduleId}
          bookingDate={bookingDate}
          bookingTime={bookingTime}
          onDateChange={setBookingDate}
          onTimeChange={setBookingTime}
          onClose={resetBookingForm}
          onSubmit={rescheduleId ? handleReschedule : handleBookAppointment}
        />
      )}
    </div>
  );
}

function Overview({ appointments, transactions, activeTransactions, favorites, loadingTransactions }) {
  return (
    <div>
      <PageTitle title="Tổng quan" description="Theo dõi hoạt động và giao dịch mới nhất." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Lịch hẹn sắp tới" value={appointments.length} tone="blue" />
        <SummaryCard icon={BriefcaseBusiness} label="Giao dịch đang xử lý" value={activeTransactions.length} tone="amber" />
        <SummaryCard icon={MessageSquare} label="Yêu cầu tư vấn" value={appointments.length} tone="green" />
        <SummaryCard icon={Heart} label="BĐS đã lưu" value={favorites.length} tone="rose" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Giao dịch của tôi"
          action={
            <Link to="/customer/transactions" className="text-sm font-bold text-slate-700 hover:text-slate-950">
              Xem tất cả
            </Link>
          }
        >
          {loadingTransactions ? (
            <EmptyText>Đang tải giao dịch...</EmptyText>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((item) => (
                <Link
                  key={item.transactionId}
                  to={`/customer/transactions/${item.transactionId}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.propertyTitle || "Bất động sản"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{formatPrice(item.totalPrice)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getTransactionStatusClass(item.status)}`}>
                    {transactionStatusLabels[item.status] || item.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyText>Bạn chưa có giao dịch nào.</EmptyText>
          )}
        </Panel>

        <Panel
          title="Bất động sản đã lưu"
          action={
            <Link to="/customer/favorites" className="text-sm font-bold text-slate-700 hover:text-slate-950">
              Xem tất cả
            </Link>
          }
        >
          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.slice(0, 3).map((property) => (
                <Link
                  key={property.propertyId}
                  to={`/properties/${property.propertyId}`}
                  className="flex items-center gap-4 rounded-md border border-slate-200 px-3 py-3 hover:bg-slate-50"
                >
                  <img
                    src={getPropertyImage(property)}
                    alt={property.title}
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{property.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{formatPrice(property.price)}</p>
                  </div>
                  <Heart className="h-5 w-5 shrink-0 text-slate-700" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyText>Bạn chưa lưu bất động sản nào.</EmptyText>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Profile({ user, onUpdateProfile, returnTo, initialMessage, appointments, transactions }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    bankName: user?.bankName || "",
    bankAccountNumber: user?.bankAccountNumber || "",
    bankAccountHolder: user?.bankAccountHolder || "",
    cccdFrontUrl: user?.cccdFrontUrl || "",
    cccdBackUrl: user?.cccdBackUrl || "",
    residenceUrl: user?.residenceUrl || "",
  });
  const [files, setFiles] = useState({ cccdFront: null, cccdBack: null, residence: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(initialMessage ? { type: "error", text: initialMessage } : null);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    setForm({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      bankName: user?.bankName || "",
      bankAccountNumber: user?.bankAccountNumber || "",
      bankAccountHolder: user?.bankAccountHolder || "",
      cccdFrontUrl: user?.cccdFrontUrl || "",
      cccdBackUrl: user?.cccdBackUrl || "",
      residenceUrl: user?.residenceUrl || "",
    });
  }, [user?.fullName, user?.phone, user?.bankName, user?.bankAccountNumber, user?.bankAccountHolder, user?.cccdFrontUrl, user?.cccdBackUrl, user?.residenceUrl]);

  useEffect(() => {
    let ignore = false;
    setLoadingBanks(true);
    fetch(BANKS_API_URL)
      .then((response) => response.json())
      .then((payload) => {
        if (ignore) return;
        setBanks(Array.isArray(payload?.data) ? payload.data : []);
      })
      .catch(() => {
        if (!ignore) setBanks([]);
      })
      .finally(() => {
        if (!ignore) setLoadingBanks(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const upload = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/uploads/documents", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          params: { type: "customer-profile" },
        });
        return res.data.data.url;
      };
      const nextForm = { ...form };
      if (files.cccdFront) nextForm.cccdFrontUrl = await upload(files.cccdFront);
      if (files.cccdBack) nextForm.cccdBackUrl = await upload(files.cccdBack);
      if (files.residence) nextForm.residenceUrl = await upload(files.residence);
      const result = await onUpdateProfile(nextForm);
      setFiles({ cccdFront: null, cccdBack: null, residence: null });
      setMessage({
        type: result.success ? "success" : "error",
        text: result.success ? "Đã cập nhật hồ sơ. Hệ thống sẽ xác nhận thông tin." : result.message,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Không thể tải hồ sơ lên." });
    } finally {
      setSaving(false);
    }
  };

  const recentActivities = useMemo(() => {
    const list = [];
    if (appointments && appointments.length > 0) {
      appointments.slice(0, 3).forEach(apt => {
        list.push({
          id: `apt-${apt.appointmentId}`,
          title: `Đặt lịch xem nhà ${apt.propertyTitle || ''}`,
          time: apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleDateString("vi-VN") : "Gần đây",
          isNew: apt.status === 'pending',
          type: 'appointment'
        });
      });
    }
    return list.slice(0, 3);
  }, [appointments]);



  return (
    <div className="relative pb-16">
      {/* Dark Header Background */}
      <div className="absolute inset-x-0 -top-6 h-64 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 -mx-4 sm:-mx-6 lg:-mx-8 pattern-dots pattern-slate-800 pattern-opacity-40 pattern-size-4 z-0" />

      <div className="relative z-10 pt-6">
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-2xl font-black text-slate-950 shadow-xl ring-4 ring-white/10">
            {(user?.fullName || user?.email || "KH").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">{user?.fullName || "Khách hàng"}</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Membership Card */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] rounded-3xl p-6 sm:p-8 text-white premium-shadow border border-slate-700/50 relative overflow-hidden group">
              {/* Background accent */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-gold-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Thẻ thành viên điện tử</p>
                  <p className="font-black text-lg tracking-wide">EstateLink Elite</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <UserRound className="w-5 h-5 text-gold-400" />
                </div>
              </div>

              <div className="mb-8 relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mã khách hàng</p>
                <p className="font-mono text-xl tracking-[0.25em]">{user?.email ? user.email.substring(0, 8).toUpperCase() : `EL-8829`}</p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Hạng thẻ</p>
                   <p className="font-black text-gold-400 text-2xl tracking-wide">{user?.rank || "PLATINUM"}</p>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-3xl premium-shadow p-6 sm:p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-950 text-sm uppercase tracking-wider">Hoạt động gần đây</h3>
                <span className="text-xs font-bold text-slate-500">Tất cả</span>
              </div>
              
              <div className="space-y-4">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 items-start group">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-gold-50 group-hover:border-gold-100 transition-colors">
                        <CalendarDays className="w-4 h-4 text-slate-500 group-hover:text-gold-600" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-slate-900 truncate">{activity.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{activity.time}</p>
                      </div>
                      {activity.isNew && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">Mới</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500 text-center py-4">Chưa có hoạt động nào</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                     <UserRound className="w-5 h-5 text-slate-700" />
                   </div>
                   <h3 className="text-lg font-black text-slate-950">Thông tin cơ bản</h3>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <ProfileField icon={UserRound} label="Họ và tên" value={form.fullName} onChange={(value) => setForm((current) => ({ ...current, fullName: value }))} required />
                  <ProfileField icon={Phone} label="Số điện thoại" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="Nhập số điện thoại" />
                  <ProfileReadonly icon={Mail} label="Email liên hệ" value={user?.email || "Chưa cập nhật"} />
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                     <Landmark className="w-5 h-5 text-slate-700" />
                   </div>
                   <h3 className="text-lg font-black text-slate-950">Thông tin thanh toán</h3>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <BankSelect icon={Landmark} label="Ngân hàng thụ hưởng" banks={banks} loading={loadingBanks} value={form.bankName} onChange={(value) => setForm((current) => ({ ...current, bankName: value }))} />
                  <ProfileField icon={Landmark} label="Số tài khoản" value={form.bankAccountNumber} onChange={(value) => setForm((current) => ({ ...current, bankAccountNumber: value }))} placeholder="Nhập số tài khoản" />
                  <ProfileField icon={UserRound} label="Tên chủ tài khoản (In hoa không dấu)" value={form.bankAccountHolder} onChange={(value) => setForm((current) => ({ ...current, bankAccountHolder: value }))} placeholder="VD: NGUYEN VAN A" />
                </div>
              </div>

              {/* Identity Verification */}
              <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                       <ShieldCheck className="w-5 h-5 text-slate-700" />
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-slate-950">Xác thực danh tính</h3>
                       <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mt-1">Hoàn thành để kích hoạt tất cả đặc quyền VIP</p>
                     </div>
                   </div>
                   <IdentityStatus status={user?.identityVerificationStatus} />
                </div>

                {/* Progress Tracker Simulation */}
                <div className="mb-8 hidden sm:flex items-center justify-center max-w-lg mx-auto">
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="w-5 h-5" /></div>
                     <span className="text-[10px] font-black uppercase text-slate-950">Thông tin</span>
                   </div>
                   <div className="flex-1 h-0.5 bg-emerald-500 mx-2 -mt-4" />
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="w-5 h-5" /></div>
                     <span className="text-[10px] font-black uppercase text-slate-950">Liên hệ</span>
                   </div>
                   <div className={`flex-1 h-0.5 ${
                     user?.identityVerificationStatus === 'verified' || user?.identityVerificationStatus === 'pending_review'
                       ? 'bg-emerald-500'
                       : user?.identityVerificationStatus === 'rejected'
                       ? 'bg-rose-500'
                       : 'bg-slate-200'
                   } mx-2 -mt-4 transition-colors duration-500`} />
                   <div className="flex flex-col items-center gap-2">
                     {user?.identityVerificationStatus === 'verified' || user?.identityVerificationStatus === 'pending_review' ? (
                       <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white transition-all duration-300">
                         <CheckCircle2 className="w-5 h-5" />
                       </div>
                     ) : user?.identityVerificationStatus === 'rejected' ? (
                       <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-300">
                         !
                       </div>
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 font-bold text-xs">
                         3
                       </div>
                     )}
                     <span className={`text-[10px] font-black uppercase ${user?.identityVerificationStatus === 'rejected' ? 'text-rose-600' : 'text-slate-950'}`}>
                       Giấy tờ
                     </span>
                   </div>
                   <div className={`flex-1 h-0.5 ${
                     user?.identityVerificationStatus === 'verified'
                       ? 'bg-emerald-500'
                       : user?.identityVerificationStatus === 'pending_review'
                       ? 'bg-amber-500 animate-pulse'
                       : 'bg-slate-200'
                   } mx-2 -mt-4 transition-colors duration-500`} />
                   <div className={`flex flex-col items-center gap-2 ${!user?.identityVerificationStatus || user?.identityVerificationStatus === 'not_submitted' || user?.identityVerificationStatus === 'rejected' ? 'opacity-50' : ''}`}>
                     {user?.identityVerificationStatus === 'verified' ? (
                       <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white transition-all duration-300">
                         <CheckCircle2 className="w-5 h-5" />
                       </div>
                     ) : user?.identityVerificationStatus === 'pending_review' ? (
                       <div className="w-8 h-8 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center text-amber-500 font-bold text-xs animate-pulse">
                         4
                       </div>
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                         4
                       </div>
                     )}
                     <span className={`text-[10px] font-black uppercase ${
                       user?.identityVerificationStatus === 'verified'
                         ? 'text-slate-950'
                         : user?.identityVerificationStatus === 'pending_review'
                         ? 'text-amber-500'
                         : 'text-slate-400'
                     }`}>
                       Xác thực
                     </span>
                   </div>
                </div>

                {user?.identityRejectReason && (
                  <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    Lý do từ chối: {user.identityRejectReason}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <ProfileUpload label="CCCD mặt trước" file={files.cccdFront} currentUrl={form.cccdFrontUrl} onChange={(file) => setFiles((current) => ({ ...current, cccdFront: file }))} />
                  <ProfileUpload label="CCCD mặt sau" file={files.cccdBack} currentUrl={form.cccdBackUrl} onChange={(file) => setFiles((current) => ({ ...current, cccdBack: file }))} />
                  <ProfileUpload label="Xác nhận cư trú" file={files.residence} currentUrl={form.residenceUrl} onChange={(file) => setFiles((current) => ({ ...current, residence: file }))} />
                </div>
              </div>

              {message && (
                <div className={`rounded-xl border p-4 text-xs font-semibold flex items-start gap-2.5 shadow-sm transition-all duration-300 ${message.type === "success" ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" : "border-rose-200 bg-rose-50/50 text-rose-700"}`}>
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 sticky bottom-6 z-20">
                {returnTo && user?.identityVerificationStatus === "verified" && (
                  <Link to={returnTo} className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50 transition shadow-sm">
                    Quay lại giao dịch
                  </Link>
                )}
                <button type="button" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50 transition shadow-sm" onClick={() => window.location.reload()}>
                  Thiết lập lại
                </button>
                <button type="submit" disabled={saving || !form.fullName.trim()} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#111827] px-8 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer">
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Appointments({ appointments, loading, onReschedule, onCancel }) {
  return (
    <div>
      <PageTitle title="Lịch hẹn xem nhà" description="Theo dõi các lịch hẹn xem nhà bạn đã đặt với môi giới." />

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Đang tải lịch hẹn...
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appointment, index) => {
            const canEdit = appointment.status === "pending" || appointment.status === "scheduled" || appointment.status === "confirmed";
            return (
              <article
                key={appointment.appointmentId}
                className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md lg:grid-cols-[180px_1fr_auto]"
              >
                <Link to={`/properties/${appointment.propertyId}`} className="block h-44 bg-slate-100 lg:h-full">
                  <img
                    src={getAppointmentImage(appointment, index)}
                    alt={appointment.propertyTitle || "Bất động sản"}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 p-5 lg:p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        appointmentStatusTone[appointment.status] || getAppointmentStatusClass(appointment.status)
                      }`}
                    >
                      {appointmentStatusLabels[appointment.status] || appointment.status}
                    </span>
                    <span className="text-xs font-black text-slate-400">
                      #{String(appointment.appointmentId || index + 1).padStart(2, "A")}
                    </span>
                  </div>

                  <Link
                    to={`/properties/${appointment.propertyId}`}
                    className="block truncate text-lg font-black text-slate-950 hover:text-slate-700"
                  >
                    {appointment.propertyTitle || "Bất động sản"}
                  </Link>

                  <div className="mt-4 grid gap-2 text-sm font-medium text-slate-600 sm:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{formatDate(appointment.scheduledAt) || "Chưa có ngày"}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Clock3 className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{formatTime(appointment.scheduledAt) || "Chưa có giờ"}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{getAppointmentAddress(appointment)}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{getAppointmentBroker(appointment)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 lg:w-44 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0 lg:p-6">
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => onReschedule(appointment)}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 hover:bg-slate-50"
                      >
                        Đổi lịch
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(appointment.appointmentId)}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Hủy lịch
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-sm font-bold text-slate-500">Bạn chưa có lịch hẹn nào.</p>
          <Link to="/properties" className="mt-5 inline-flex rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Tìm bất động sản
          </Link>
        </div>
      )}
    </div>
  );
}

function Favorites({ favorites, onBook }) {
  return (
    <div>
      <PageTitle title="BĐS yêu thích" description="Danh sách bất động sản bạn đã lưu." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {favorites.length > 0 ? (
          favorites.map((property) => (
            <div key={property.propertyId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Link to={`/properties/${property.propertyId}`} className="block">
                <div className="relative h-52 overflow-hidden">
                  <img src={getPropertyImage(property)} alt={property.title} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-sm bg-white/95 px-3 py-1 text-xs font-extrabold text-slate-900">
                    {formatPrice(property.price)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 min-h-11 text-base font-extrabold text-slate-950">
                    {property.title}
                  </h3>
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {property.address || `${property.district || ""}, ${property.province || ""}`}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{formatArea(property.area)}</span>
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.bedrooms || "-"}</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms || "-"}</span>
                  </div>
                </div>
              </Link>
              <div className="border-t border-slate-100 p-4">
                <button
                  type="button"
                  onClick={() => onBook(property)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-extrabold text-white transition hover:bg-slate-800"
                >
                  <Calendar className="h-4 w-4" />
                  Đặt lịch xem nhà
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Bạn chưa lưu bất động sản nào.
            </p>
            <Link to="/properties" className="mt-5 inline-flex rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Khám phá ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingModal({
  bookingProperty,
  rescheduleId,
  bookingDate,
  bookingTime,
  onDateChange,
  onTimeChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">
              {rescheduleId ? "Dời lịch hẹn" : "Đặt lịch xem nhà"}
            </h2>
            {bookingProperty && (
              <p className="mt-2 text-sm font-medium text-slate-500">{bookingProperty.title}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Ngày xem</label>
            <input
              type="date"
              required
              value={bookingDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Giờ xem</label>
            <input
              type="time"
              required
              value={bookingTime}
              onChange={(event) => onTimeChange(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              {rescheduleId ? "Xác nhận dời lịch" : "Xác nhận đặt lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PageTitle({ title, description }) {
  return (
    <section className="mb-6">
      <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">{description}</p>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <article className="flex min-h-24 items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-950">{value}</p>
      </div>
    </article>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="min-h-96 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyText({ children }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

function BankSelect({ icon: Icon, label, banks, loading, value, onChange }) {
  const hasCurrentValue = value && !banks.some((bank) => bank.shortName === value || bank.name === value);

  return (
    <label className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <div className="flex items-center gap-3 px-1">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent cursor-pointer"
        >
          <option value="">{loading ? "Đang tải danh sách ngân hàng..." : "Chọn ngân hàng"}</option>
          {hasCurrentValue && <option value={value}>{value}</option>}
          {banks.map((bank) => (
            <option key={bank.id || bank.code || bank.shortName} value={bank.shortName || bank.name}>
              {[bank.shortName, bank.name].filter(Boolean).join(" - ")}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function IdentityStatus({ status }) {
  const meta = {
    verified: "Đã duyệt",
    pending_review: "Chờ duyệt",
    rejected: "Bị từ chối",
    not_submitted: "Chưa gửi",
  };
  const styles = {
    verified: "bg-emerald-100 text-emerald-800",
    pending_review: "bg-amber-100 text-amber-800",
    rejected: "bg-rose-100 text-rose-800",
    not_submitted: "bg-slate-100 text-slate-600",
  };
  const key = status || "not_submitted";
  
  let percentText = "60% HOÀN THÀNH";
  if (status === "verified") {
    percentText = "100% HOÀN THÀNH";
  } else if (status === "pending_review") {
    percentText = "80% HOÀN THÀNH";
  } else if (status === "rejected") {
    percentText = "CẦN CẬP NHẬT";
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${styles[key] || styles.not_submitted}`}>
        {meta[key] || key}
      </span>
      <span className={`text-xs font-bold ${status === 'rejected' ? 'text-rose-600 font-extrabold' : 'text-slate-400'} hidden sm:inline-block`}>
        {percentText}
      </span>
    </div>
  );
}

function ProfileUpload({ label, file, currentUrl, onChange }) {
  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-[#f8f6f2] p-6 text-center cursor-pointer hover:border-slate-500 transition-colors group">
      <div className="mx-auto w-12 h-12 bg-white rounded-xl flex items-center justify-center premium-shadow mb-4 group-hover:scale-110 transition-transform">
         <FileText className="w-5 h-5 text-slate-400" />
      </div>
      <span className="text-sm font-black text-slate-900 block">{label}</span>
      <span className="mt-2 block truncate text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {file?.name || (currentUrl ? "Đã tải lên thành công" : "Định dạng JPG, PNG")}
      </span>
      <input type="file" className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      {currentUrl && (
        <a href={currentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] font-black text-slate-700 hover:text-slate-950 uppercase underline">
          Xem tài liệu
        </a>
      )}
    </label>
  );
}

function ProfileField({ icon: Icon, label, value, onChange, placeholder, required = false }) {
  return (
    <label className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <div className="flex items-center gap-3 px-1">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent placeholder-slate-300"
        />
      </div>
    </label>
  );
}

function ProfileReadonly({ icon: Icon, label, value }) {
  return (
    <div className="block rounded-xl border border-slate-100 bg-slate-50 p-3 opacity-80 cursor-not-allowed">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <div className="flex items-center gap-3 px-1">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="w-full text-sm font-bold text-slate-500 truncate">{value}</span>
      </div>
    </div>
  );
}
