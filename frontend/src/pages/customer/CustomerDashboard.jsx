import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Square,
  UserRound,
  X,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";

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
  const navigate = useNavigate();

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
        navigate("/customer/appointments");
      }
    } catch (err) {
      alert(`Lỗi khi đặt lịch: ${err.response?.data?.message || err.message}`);
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
      }
    } catch (err) {
      alert(`Lỗi khi dời lịch hẹn: ${err.response?.data?.message || err.message}`);
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
        fetchAppointments();
      }
    } catch (err) {
      alert(`Lỗi khi hủy lịch hẹn: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCreateDeposit = async (appointment) => {
    if (!window.confirm("Bạn xác nhận đặt cọc 10% giá trị bất động sản này?")) return;
    try {
      const res = await api.post(`/transactions/appointment/${appointment.appointmentId}/deposit`);
      if (res.data.success) {
        navigate(`/customer/transactions/${res.data.data.transactionId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Không thể đặt cọc bất động sản này.");
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

      {mode === "profile" && <Profile user={user} onUpdateProfile={updateProfile} />}

      {mode === "appointments" && (
        <Appointments
          appointments={appointments}
          loading={loadingAppointments}
          onReschedule={openRescheduleModal}
          onCancel={handleCancel}
          onDeposit={handleCreateDeposit}
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
      <PageTitle title="Tổng quan" description="Theo dõi các hoạt động và giao dịch của bạn." />

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

function Profile({ user, onUpdateProfile }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setForm({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    });
  }, [user?.fullName, user?.phone]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await onUpdateProfile(form);
    setSaving(false);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.success ? "Đã cập nhật thông tin cá nhân." : result.message,
    });
  };

  return (
    <div>
      <PageTitle title="Thông tin cá nhân" description="Quản lý thông tin tài khoản khách hàng." />
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white">
            {(user?.fullName || user?.email || "KH").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{user?.fullName || "Khách hàng"}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Customer</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <ProfileField
            icon={UserRound}
            label="Họ tên"
            value={form.fullName}
            onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
            required
          />
          <ProfileReadonly icon={Mail} label="Email" value={user?.email || "Chưa cập nhật"} />
          <ProfileField
            icon={Phone}
            label="Số điện thoại"
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
            placeholder="Nhập số điện thoại"
          />
          <ProfileReadonly icon={BriefcaseBusiness} label="Vai trò" value="Khách hàng" />
        </div>

        {message && (
          <div
            className={`mt-5 rounded-md px-4 py-3 text-sm font-bold ${
              message.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving || !form.fullName.trim()}
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Cập nhật thông tin"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Appointments({ appointments, loading, onReschedule, onCancel, onDeposit }) {
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
            const canDeposit = appointment.status === "viewed";

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

                  {canDeposit && (
                    <button
                      type="button"
                      onClick={() => onDeposit(appointment)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-black text-slate-950 hover:bg-slate-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Tiến hành giao dịch
                    </button>
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

function ProfileField({ icon: Icon, label, value, onChange, placeholder, required = false }) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-3 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function ProfileReadonly({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 flex h-11 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500">
        {value}
      </div>
    </div>
  );
}
