import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

const propertyTypes = [
  { value: "apartment", label: "Căn hộ" },
  { value: "house", label: "Nhà ở" },
  { value: "land", label: "Đất nền" },
  { value: "villa", label: "Biệt thự" },
  { value: "shophouse", label: "Shophouse" },
  { value: "rental", label: "Cho thuê" },
];

const statuses = [
  { value: "all", label: "Tất cả" },
  { value: "pending_review", label: "Chờ kiểm tra" },
  { value: "published", label: "Đang đăng" },
  { value: "in_transaction", label: "Đang giao dịch" },
  { value: "deposit_paid", label: "Đã cọc" },
  { value: "rejected", label: "Từ chối" },
  { value: "sold", label: "Đã bán" },
  { value: "rented", label: "Đã thuê" },
];

const statusMeta = {
  pending: { label: "Chờ kiểm tra", className: "bg-amber-100 text-amber-800" },
  pending_review: { label: "Chờ kiểm tra", className: "bg-amber-100 text-amber-800" },
  published: { label: "Đang đăng", className: "bg-emerald-100 text-emerald-800" },
  deposit_paid: { label: "Đã cọc", className: "bg-amber-100 text-amber-800" },
  in_transaction: { label: "Đang giao dịch", className: "bg-cyan-100 text-cyan-800" },
  rejected: { label: "Từ chối", className: "bg-rose-100 text-rose-800" },
  sold: { label: "Đã bán", className: "bg-blue-100 text-blue-800" },
  rented: { label: "Đã thuê", className: "bg-cyan-100 text-cyan-800" },
};

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

export default function PropertyManagement() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [previewProperty, setPreviewProperty] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ size: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("propertyType", typeFilter);
      if (query.trim()) params.set("keyword", query.trim());

      const response = await api.get(`/properties?${params.toString()}`);
      if (response.data.success) {
        setProperties(response.data.data.content || []);
      } else {
        showToast("error", response.data.message || "Không tải được danh sách BĐS.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không tải được danh sách BĐS.");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const summary = useMemo(() => {
    return {
      total: properties.length,
      pending: properties.filter((item) => item.status === "pending_review" || item.status === "pending").length,
      published: properties.filter((item) => item.status === "published").length,
      totalValue: properties.reduce((sum, item) => sum + Number(item.price || 0), 0),
    };
  }, [properties]);

  const handleStatusChange = async (property, status) => {
    try {
      const response = await api.patch(`/properties/${property.propertyId}/status?status=${status}`);
      if (response.data.success) {
        showToast("success", `Đã chuyển ${property.propertyCode} sang ${statusMeta[status]?.label || status}.`);
        fetchProperties();
      } else {
        showToast("error", response.data.message || "Cập nhật trạng thái thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Cập nhật trạng thái thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Kho nguồn hàng</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Quản lý bất động sản</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Quản trị toàn bộ tin đăng, xem thông tin chi tiết và phê duyệt hoặc từ chối tin đăng.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Tổng tin" value={summary.total} />
        <Metric label="Chờ kiểm tra" value={summary.pending} tone="amber" />
        <Metric label="Đang đăng" value={summary.published} tone="green" />
        <Metric label="Tổng giá trị" value={formatVnd(summary.totalValue)} tone="dark" />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && fetchProperties()}
              placeholder="Tìm theo mã, tiêu đề, địa chỉ..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
            />
          </div>

          <Select value={statusFilter} onChange={setStatusFilter} options={statuses} />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "all", label: "Mọi loại BĐS" }, ...propertyTypes]}
          />
          <button
            onClick={fetchProperties}
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-black text-stone-700 transition-colors hover:bg-stone-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Lọc
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_140px_170px_145px_180px] border-b border-stone-200 px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-400">
          <div>Bất động sản</div>
          <div>Loại</div>
          <div>Giá / diện tích</div>
          <div>Trạng thái</div>
          <div className="text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm font-bold">Đang tải danh sách...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-black text-stone-900">Chưa có bất động sản phù hợp</p>
            <p className="mt-1 text-sm font-medium text-stone-500">Thử đổi bộ lọc để kiểm tra lại.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {properties.map((property) => {
              const primaryImage = property.images?.find((image) => image.isPrimary)?.url || property.images?.[0]?.url;
              return (
                <article
                  key={property.propertyId}
                  className="grid grid-cols-[1fr_140px_170px_145px_180px] items-center px-5 py-4 transition-colors hover:bg-[#fbf8f1]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {primaryImage ? (
                        <img src={primaryImage} alt={property.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-stone-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-500">
                          {property.propertyCode}
                        </span>
                        <span className="text-[11px] font-bold text-stone-400">
                          {new Date(property.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <h2 className="truncate text-sm font-black text-stone-950">{property.title}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-stone-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {property.district}, {property.province}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-stone-700">
                    {propertyTypes.find((type) => type.value === property.propertyType)?.label || property.propertyType}
                  </div>
                  <div>
                    <p className="text-sm font-black text-stone-950">{formatVnd(property.price)}</p>
                    <p className="mt-1 text-xs font-bold text-stone-400">{property.area} m²</p>
                  </div>
                  <div>
                    <span className={`inline-block rounded-lg px-3 py-2 text-xs font-black ${statusMeta[property.status]?.className || "bg-stone-100 text-stone-700"}`}>
                      {statusMeta[property.status]?.label || property.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <IconButton title="Xem nhanh" onClick={() => setPreviewProperty(property)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    {(property.status === "pending_review" || property.status === "pending") && (
                      <>
                        <IconButton title="Duyệt BĐS và giấy tờ" tone="approve" onClick={() => handleStatusChange(property, "published")}>
                          <CheckCircle2 className="h-4 w-4" />
                        </IconButton>
                        <IconButton title="Từ chối" tone="danger" onClick={() => handleStatusChange(property, "rejected")}>
                          <XCircle className="h-4 w-4" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {previewProperty && <PreviewModal property={previewProperty} onClose={() => setPreviewProperty(null)} />}
    </div>
  );
}

function Metric({ label, value, tone = "light" }) {
  const styles = {
    light: "bg-white text-stone-950",
    amber: "bg-amber-50 text-amber-800",
    green: "bg-emerald-50 text-emerald-800",
    dark: "bg-stone-950 text-white",
  };

  return (
    <div className={`rounded-lg border border-stone-200 p-5 shadow-sm ${styles[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-2 truncate text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold text-stone-700 outline-none transition-colors hover:bg-stone-50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function IconButton({ children, title, onClick, tone = "neutral" }) {
  const tones = {
    neutral: "border-stone-200 text-stone-500 hover:text-stone-950",
    approve: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    danger: "border-rose-200 text-rose-700 hover:bg-rose-50",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function PreviewModal({ property, onClose }) {
  const [docStatuses, setDocStatuses] = useState({});
  const primaryImage = property.images?.find((image) => image.isPrimary)?.url || property.images?.[0]?.url;

  const handleDocStatus = (docType, status) => {
    setDocStatuses((prev) => ({ ...prev, [docType]: status }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        {primaryImage && <img src={primaryImage} alt={property.title} className="h-72 w-full object-cover" />}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6f2f]">{property.propertyCode}</p>
              <h2 className="text-2xl font-black text-stone-950">{property.title}</h2>
              <p className="mt-1 text-sm font-medium text-stone-500">
                {property.district}, {property.province}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:text-stone-950">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Detail label="Giá" value={formatVnd(property.price)} />
            <Detail label="Diện tích" value={`${property.area} m²`} />
            <Detail label="Trạng thái" value={statusMeta[property.status]?.label || property.status} />
          </div>
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50/70 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-stone-400">Giấy tờ pháp lý</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Sổ hồng/Sổ đỏ</p>
                  {property.redBookUrl ? (
                    <a href={property.redBookUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                  ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                </div>
                {property.redBookUrl && (
                  <div className="mt-2 flex gap-1">
                    <button 
                      onClick={() => handleDocStatus('redBook', 'approved')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.redBook === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-emerald-50'}`}>
                      Duyệt
                    </button>
                    <button 
                      onClick={() => handleDocStatus('redBook', 'rejected')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.redBook === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600 hover:bg-rose-50'}`}>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Sổ hộ khẩu</p>
                  {property.householdRegistrationUrl ? (
                    <a href={property.householdRegistrationUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                  ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                </div>
                {property.householdRegistrationUrl && (
                  <div className="mt-2 flex gap-1">
                    <button 
                      onClick={() => handleDocStatus('household', 'approved')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.household === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-emerald-50'}`}>
                      Duyệt
                    </button>
                    <button 
                      onClick={() => handleDocStatus('household', 'rejected')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.household === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600 hover:bg-rose-50'}`}>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">CCCD</p>
                  {property.ownerIdUrl ? (
                    <a href={property.ownerIdUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                  ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                </div>
                {property.ownerIdUrl && (
                  <div className="mt-2 flex gap-1">
                    <button 
                      onClick={() => handleDocStatus('ownerId', 'approved')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.ownerId === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-emerald-50'}`}>
                      Duyệt
                    </button>
                    <button 
                      onClick={() => handleDocStatus('ownerId', 'rejected')}
                      className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${docStatuses.ownerId === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600 hover:bg-rose-50'}`}>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Loại hồ sơ</p>
                <p className="mt-1 text-sm font-bold text-stone-950">{property.isExclusive ? "Độc quyền" : "Thông thường"}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm font-medium leading-6 text-stone-700">
            {property.description || "Tin đăng chưa có mô tả."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-950">{value}</p>
    </div>
  );
}

function Toast({ type, message }) {
  return (
    <div className="fixed right-6 top-6 z-[60] rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </div>
        <p className="text-sm font-bold text-stone-800">{message}</p>
      </div>
    </div>
  );
}
