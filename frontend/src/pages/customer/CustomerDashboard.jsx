import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bath,
  BedDouble,
  Calendar,
  CalendarClock,
  Heart,
  MapPin,
  Square,
  X,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80";

const statusLabels = {
  pending: "Chờ xác nhận",
  scheduled: "Đã lên lịch",
  confirmed: "Đã xác nhận",
  viewed: "Đã xem nhà",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
};

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
    return `${Number(price / 1000000000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })} tỷ`;
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

const getStatusClass = (status) => {
  if (status === "confirmed" || status === "scheduled" || status === "viewed") return "bg-green-50 text-green-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await api.get("/appointments?page=0&size=100");
      if (res.data.success) {
        // Backend trả về Page object với content array
        const data = res.data.data;
        setAppointments(data.content || data || []);
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
        setActiveTab("appointments");
        fetchAppointments();
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
      alert(`Lỗi khi dời lịch: ${err.response?.data?.message || err.message}`);
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
    <div>
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Xin chào,</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              {user?.fullName || user?.email || "Khách hàng"}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Quản lý lịch xem nhà và danh sách bất động sản bạn quan tâm.
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <CalendarClock className="h-4 w-4" />
            Tìm bất động sản
          </Link>
          <Link
            to="/customer/transactions/active"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Đang giao dịch
          </Link>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Lịch hẹn</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{appointments.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Giao dịch</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{transactions.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Đang quan tâm</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{favorites.length}</p>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-8">
          {[
            { id: "appointments", label: "Lịch hẹn của tôi" },
            { id: "transactions", label: "Giao dịch của tôi" },
            { id: "favorites", label: "Bất động sản yêu thích" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 pb-4 text-sm font-extrabold transition ${
                activeTab === tab.id
                  ? "border-slate-950 text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "appointments" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Bất động sản
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Ngày xem
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Giờ xem
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loadingAppointments ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                      Đang tải lịch hẹn...
                    </td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <tr key={appointment.appointmentId} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm font-extrabold text-slate-950">
                        {appointment.propertyTitle || "Bất động sản"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatDate(appointment.scheduledAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatTime(appointment.scheduledAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(appointment.status)}`}>
                          {statusLabels[appointment.status] || appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end items-center gap-3">
                          <Link
                            to={`/properties/${appointment.propertyId}`}
                            className="font-bold text-blue-600 hover:text-blue-800"
                          >
                            Xem chi tiết
                          </Link>
                          {(appointment.status === "pending" || appointment.status === "scheduled") && (
                            <>
                              <button
                                type="button"
                                onClick={() => openRescheduleModal(appointment)}
                                className="font-bold text-slate-700 hover:text-slate-950"
                              >
                                Dời lịch
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(appointment.appointmentId)}
                                className="font-bold text-red-600 hover:text-red-700"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {appointment.status === "viewed" && (
                            <button
                              type="button"
                              onClick={() => handleCreateDeposit(appointment)}
                              className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800"
                            >
                              Đặt cọc 10%
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm font-medium text-slate-500">
                      Bạn chưa có lịch hẹn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Mã Giao Dịch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Bất động sản
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                      Đang tải giao dịch...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm font-extrabold text-slate-950">
                        {tx.transactionCode}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {tx.propertyTitle}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(tx.status)}`}>
                          {statusLabels[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/customer/transactions/${tx.transactionId}`}
                          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Xem chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                      Bạn chưa có giao dịch nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
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
                    onClick={() => setBookingProperty(property)}
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
      )}

      {(bookingProperty || rescheduleId) && (
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
              <button type="button" onClick={resetBookingForm} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={rescheduleId ? handleReschedule : handleBookAppointment} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Ngày xem</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Giờ xem</label>
                <input
                  type="time"
                  required
                  value={bookingTime}
                  onChange={(event) => setBookingTime(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetBookingForm}
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
      )}
    </div>
  );
}
