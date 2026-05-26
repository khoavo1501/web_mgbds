import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Square,
  UserCircle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80";

const TIME_SLOTS = ["08:30", "09:30", "10:30", "14:00", "15:00", "16:00"];

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà riêng",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
};

const statusLabels = {
  published: "Đang mở bán",
  in_transaction: "Đang giao dịch",
  pending: "Chờ duyệt",
  rejected: "Đã từ chối",
  sold: "Đã bán",
  Available: "Đang mở bán",
};

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPrice = (price) => {
  if (!hasValue(price)) return "";
  if (Number(price) >= 1000000000) {
    return `${Number(price / 1000000000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })} tỷ`;
  }
  return `${Number(price / 1000000).toLocaleString("vi-VN")} triệu`;
};

const formatArea = (area) => {
  if (!hasValue(area)) return "";
  return `${Number(area).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} m²`;
};

const formatPricePerSquareMeter = (price, area) => {
  if (!hasValue(price) || !hasValue(area) || Number(area) <= 0) return "";
  const value = Number(price) / Number(area);
  return `≈ ${Number(value / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu/m²`;
};

const formatDate = (date) => {
  if (!hasValue(date)) return "";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleDateString("vi-VN");
};

const getPropertyTypeLabel = (type) => propertyTypeLabels[type] || type || "";

const getLocation = (property) =>
  [property.address, property.ward, property.district, property.province].filter(Boolean).join(", ");

const getPropertyImage = (property) => {
  const primaryImage = property?.images?.find((image) => image.isPrimary);
  return primaryImage?.url || property?.images?.[0]?.url || PLACEHOLDER_IMAGE;
};

const getNextDays = (count = 14) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < count; index += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    days.push(day);
  }

  return days;
};

function RelatedPropertyCard({ property }) {
  return (
    <Link
      to={`/properties/${property.propertyId}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={getPropertyImage(property)}
          alt={property.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-900">
          {getPropertyTypeLabel(property.propertyType)}
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950">{property.title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{getLocation(property)}</span>
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-lg font-black text-slate-950">{formatPrice(property.price)}</p>
          <p className="text-sm font-bold text-slate-500">{formatArea(property.area)}</p>
        </div>
      </div>
    </Link>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ type: "", message: "" });
  const [currentTime] = useState(() => Date.now());
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [favoriteToast, setFavoriteToast] = useState("");
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        if (response.data.success) {
          const nextProperty = response.data.data;
          setProperty(nextProperty);

          const relatedResponse = await api.get(
            `/properties?status=published&propertyType=${nextProperty.propertyType || ""}&size=4&sortBy=createdAt&sortDirection=DESC`
          );
          if (relatedResponse.data.success) {
            setRelatedProperties(
              (relatedResponse.data.data.content || []).filter((item) => item.propertyId !== nextProperty.propertyId).slice(0, 3)
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch property details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const fetchBookedAppointments = useCallback(async () => {
    try {
      const response = await api.get(`/appointments/property/${id}`);
      if (response.data.success) {
        setBookedAppointments(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch property appointments", error);
    }
  }, [id]);

  useEffect(() => {
    fetchBookedAppointments();
  }, [fetchBookedAppointments]);

  const images = useMemo(() => {
    if (!property?.images?.length) return [PLACEHOLDER_IMAGE];
    return property.images.map((image) => image.url).filter(Boolean);
  }, [property]);

  const days = useMemo(() => getNextDays(14), []);

  const bookedSlots = useMemo(() => {
    const slots = new Set();
    bookedAppointments.forEach((appointment) => {
      const date = new Date(appointment.scheduledAt);
      if (!Number.isNaN(date.getTime())) {
        slots.add(`${toDateKey(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
      }
    });
    return slots;
  }, [bookedAppointments]);

  const isPastSlot = (dateKey, time) => {
    const slotDate = new Date(`${dateKey}T${time}:00`);
    return slotDate.getTime() <= currentTime;
  };

  const isSlotBooked = (dateKey, time) => bookedSlots.has(`${dateKey}T${time}`);

  const isDayFull = (dateKey) => TIME_SLOTS.every((time) => isPastSlot(dateKey, time) || isSlotBooked(dateKey, time));

  const handleBookAppointment = () => {
    setBookingStatus({ type: "", message: "" });

    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.role !== "customer") {
      setBookingStatus({ type: "error", message: "Chỉ tài khoản khách hàng mới có thể đặt lịch xem nhà." });
      return;
    }

    if (!selectedDate || !selectedTime) {
      setBookingStatus({ type: "error", message: "Vui lòng chọn ngày và giờ xem nhà." });
      return;
    }

    // Navigate sang BookAppointmentFlow với date/time đã chọn
    navigate(`/properties/${property.propertyId}/book`, {
      state: {
        selectedDate: selectedDate,
        selectedTime: selectedTime,
        note: "",
      },
    });
  };

  const handleToggleFavorite = () => {
    const willSave = !isFavorite(property.propertyId);
    toggleFavorite(property);
    setFavoriteToast(willSave ? "Đã lưu bất động sản" : "Đã bỏ lưu bất động sản");
    window.setTimeout(() => setFavoriteToast(""), 2200);
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-[60vh] bg-slate-50 px-4 py-20 text-center">
        <h2 className="text-2xl font-extrabold text-slate-950">Không tìm thấy bất động sản</h2>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Tin đăng này không tồn tại hoặc đã được gỡ khỏi hệ thống.
        </p>
        <Link
          to="/properties"
          className="mt-6 inline-flex rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const typeLabel = getPropertyTypeLabel(property.propertyType);
  const location = getLocation(property);
  const price = formatPrice(property.price);
  const pricePerSquareMeter = formatPricePerSquareMeter(property.price, property.area);
  const area = formatArea(property.area);
  const favorite = isFavorite(property.propertyId);
  const broker = property.assignedTo || property.createdBy;
  const hasBrokerInfo = broker?.fullName || broker?.phone || broker?.email;
  const statusLabel = statusLabels[property.status] || property.status || "Đang mở bán";
  const mapQuery = encodeURIComponent(location || `${property.district || ""}, ${property.province || ""}`);
  const mapUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const brokerPhoneDigits = broker?.phone?.replace(/\D/g, "");

  const overviewItems = [
    area && { icon: Square, label: area },
    hasValue(property.bedrooms) && { icon: BedDouble, label: `${property.bedrooms} PN` },
    hasValue(property.bathrooms) && { icon: Bath, label: `${property.bathrooms} WC` },
  ].filter(Boolean);

  const detailItems = [
    typeLabel && { label: "Loại hình", value: typeLabel },
    property.status && { label: "Trạng thái", value: statusLabels[property.status] || property.status },
    property.propertyCode && { label: "Mã tin", value: property.propertyCode },
    property.province && { label: "Tỉnh/Thành", value: property.province },
    property.district && { label: "Quận/Huyện", value: property.district },
    property.ward && { label: "Phường/Xã", value: property.ward },
    area && { label: "Diện tích", value: area },
    hasValue(property.bedrooms) && { label: "Phòng ngủ", value: property.bedrooms },
    hasValue(property.bathrooms) && { label: "Phòng tắm", value: property.bathrooms },
    formatDate(property.createdAt) && { label: "Ngày đăng", value: formatDate(property.createdAt) },
    formatDate(property.updatedAt) && { label: "Cập nhật", value: formatDate(property.updatedAt) },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {favoriteToast && (
        <div className="fixed right-6 top-24 z-50 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-xl">
          {favoriteToast}
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-slate-950">Trang chủ</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-slate-950">{typeLabel || "Bất động sản"}</Link>
          <span>/</span>
          <span className="text-slate-950">{property.title}</span>
        </div>

        <section className="grid gap-2 overflow-hidden rounded-xl border border-white bg-white shadow-sm md:grid-cols-[1.55fr_0.5fr]">
          <div className="h-[420px] overflow-hidden bg-slate-200">
            <img src={images[0]} alt={property.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
          </div>
          <div className="grid gap-2">
            <div className="h-[206px] overflow-hidden bg-slate-200">
              <img src={images[1] || images[0]} alt={property.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
            </div>
            <div className="h-[206px] overflow-hidden bg-slate-200">
              <img src={images[2] || images[0]} alt={property.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {typeLabel && (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                      {typeLabel}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950">
                    {property.title}
                  </h1>
                </div>
                {location && (
                  <p className="mt-3 flex items-start gap-2 text-sm font-medium text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {location}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Chia sẻ"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`grid h-11 w-11 place-items-center rounded-full border transition hover:-translate-y-0.5 ${
                    favorite ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-label="Lưu bất động sản"
                >
                  <Heart className={`h-5 w-5 transition ${favorite ? "fill-current scale-110" : ""}`} />
                </button>
              </div>
            </div>

            {(price || overviewItems.length > 0) && (
              <div className="mt-6 rounded-xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-950/10">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    {price && <p className="text-4xl font-black tracking-tight">{price}</p>}
                    {pricePerSquareMeter && <p className="mt-2 text-sm font-bold text-white/65">{pricePerSquareMeter}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {overviewItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <span key={item.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">
                          <Icon className="h-4 w-4 text-[#d7b56d]" />
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            </section>

            {property.description && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">🏡 Mô tả bất động sản</h2>
                <p className="mt-4 whitespace-pre-line text-base font-medium leading-8 text-slate-600">
                  {property.description}
                </p>
              </section>
            )}

            {detailItems.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-950">Đặc điểm bất động sản</h2>
                <div className="mt-4 grid border-t border-slate-200 sm:grid-cols-2">
                  {detailItems.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[130px_1fr] gap-4 border-b border-slate-200 py-4 text-sm"
                    >
                      <span className="font-medium text-slate-500">{item.label}</span>
                      <span className="font-bold text-slate-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {location && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#9b7932]" />
                  <h2 className="text-lg font-extrabold text-slate-950">Vị trí bất động sản</h2>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <iframe
                    title="Vị trí bất động sản"
                    src={mapUrl}
                    className="h-72 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 transition hover:-translate-y-1 hover:shadow-xl">
              {hasBrokerInfo && (
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-600">
                    <UserCircle className="h-9 w-9" />
                  </div>
                  <div>
                    {broker.fullName && <p className="font-extrabold text-slate-950">{broker.fullName}</p>}
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Môi giới chuyên nghiệp
                    </p>
                  </div>
                </div>
              )}

              {broker?.phone && (
                <a
                  href={`tel:${broker.phone}`}
                  className="mb-3 flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  <Phone className="h-4 w-4" />
                  Gọi ngay {broker.phone}
                </a>
              )}

              {brokerPhoneDigits && (
                <a
                  href={`https://zalo.me/${brokerPhoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-4 flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Zalo
                </a>
              )}

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-slate-700" />
                  <h2 className="text-base font-extrabold text-slate-950">Đặt lịch xem nhà</h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowScheduler((value) => !value);
                    setBookingStatus({ type: "", message: "" });
                  }}
                  className="flex h-12 w-full animate-pulse items-center justify-center rounded-lg bg-[#d7b56d] px-4 text-sm font-black text-slate-950 shadow-lg shadow-[#d7b56d]/25 transition hover:bg-[#edcd82]"
                >
                  {showScheduler ? "Ẩn lịch đặt hẹn" : "Đặt lịch xem nhà"}
                </button>

                {showScheduler && (
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold text-slate-500">
                      Chọn ngày còn trống trong 14 ngày tới
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day) => {
                        const dateKey = toDateKey(day);
                        const disabled = isDayFull(dateKey);
                        const selected = selectedDate === dateKey;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedDate(dateKey);
                              setSelectedTime("");
                              setBookingStatus({ type: "", message: "" });
                            }}
                            className={`rounded-md border px-1 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-35 ${
                              selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="block text-[10px] font-bold uppercase">
                              {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                            </span>
                            <span className="mt-1 block text-sm font-extrabold">{day.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mb-3 mt-5 text-xs font-semibold text-slate-500">Khung giờ còn trống</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((time) => {
                        const disabled = isPastSlot(selectedDate, time) || isSlotBooked(selectedDate, time);
                        const selected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedTime(time);
                              setBookingStatus({ type: "", message: "" });
                            }}
                            className={`h-10 rounded-md border text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                              selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>

                    {bookingStatus.message && (
                      <div
                        className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                          bookingStatus.type === "success"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {bookingStatus.message}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleBookAppointment}
                      disabled={!selectedTime}
                      className="mt-4 flex h-11 w-full items-center justify-center rounded-md border border-slate-950 bg-white px-4 text-sm font-extrabold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {user ? "Xác nhận đặt lịch" : "Đăng nhập để đặt lịch"}
                    </button>
                  </div>
                )}

                {broker?.email && (
                  <a
                    href={`mailto:${broker.email}`}
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-50"
                  >
                    <Mail className="h-4 w-4" />
                    Yêu cầu tư vấn
                  </a>
                )}
              </div>

              <p className="mt-5 text-xs font-medium leading-5 text-slate-500">
                Lịch hẹn sẽ ở trạng thái chờ xác nhận sau khi đặt thành công.
              </p>
            </div>
          </aside>
        </section>

        {relatedProperties.length > 0 && (
          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">Gợi ý thêm</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Bất động sản tương tự</h2>
              </div>
              <Link to={`/properties?propertyType=${property.propertyType || ""}`} className="hidden text-sm font-black text-slate-700 hover:text-slate-950 sm:inline-flex">
                Xem thêm
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedProperties.map((item) => (
                <RelatedPropertyCard key={item.propertyId} property={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
