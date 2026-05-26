import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Eye, Loader2, MapPin, ShieldCheck, X, XCircle } from "lucide-react";
import api from "../../services/api";

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const typeLabels = {
  apartment: "Căn hộ",
  house: "Nhà ở",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
  rental: "Cho thuê",
};

export default function PropertyApproval() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchPendingProperties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/properties?status=pending&size=100");
      if (response.data.success) {
        setProperties(response.data.data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending properties", error);
      showToast("error", "Không tải được danh sách tin chờ duyệt.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPendingProperties();
  }, [fetchPendingProperties]);

  const handleStatus = async (property, status) => {
    setProcessingId(property.propertyId);
    try {
      const res = await api.patch(`/properties/${property.propertyId}/status?status=${status}`);
      if (res.data.success) {
        setProperties((current) => current.filter((item) => item.propertyId !== property.propertyId));
        setSelectedProperty(null);
        showToast(
          status === "published" ? "success" : "error",
          status === "published" ? `Đã duyệt ${property.propertyCode}.` : `Đã từ chối ${property.propertyCode}.`
        );
      } else {
        showToast("error", res.data.message || "Cập nhật trạng thái thất bại.");
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Không thể cập nhật trạng thái.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalValue = useMemo(
    () => properties.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [properties]
  );

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

      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Kiểm duyệt nguồn hàng</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Duyệt bất động sản</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Kiểm tra tin môi giới gửi lên, xem nhanh thông tin và duyệt hoặc từ chối ngay trên danh sách.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SummaryBox label="Chờ xử lý" value={properties.length} />
          <SummaryBox label="Tổng giá trị" value={formatVnd(totalValue)} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_140px_180px_160px_136px] border-b border-stone-200 px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-400">
          <div>Tin đăng</div>
          <div>Loại</div>
          <div>Giá</div>
          <div>Người tạo</div>
          <div className="text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm font-bold">Đang tải danh sách...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-stone-900">Không còn tin chờ duyệt</p>
            <p className="mt-1 text-sm font-medium text-stone-500">Danh sách kiểm duyệt hiện đang trống.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {properties.map((property) => (
              <article
                key={property.propertyId}
                className="grid grid-cols-[1fr_140px_180px_160px_136px] items-center px-5 py-4 transition-colors hover:bg-[#fbf8f1]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {property.images?.length ? (
                      <img
                        src={property.images.find((item) => item.isPrimary)?.url || property.images[0].url}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-stone-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                        {property.propertyCode}
                      </span>
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-500">
                        Chờ duyệt
                      </span>
                    </div>
                    <h2 className="truncate text-sm font-black text-stone-950">{property.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-stone-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.district}, {property.province}
                    </p>
                  </div>
                </div>

                <div className="text-sm font-bold text-stone-700">{typeLabels[property.propertyType] || property.propertyType}</div>
                <div className="text-sm font-black text-stone-950">{formatVnd(property.price)}</div>
                <div className="text-sm font-bold text-stone-600">{property.createdBy?.fullName || "N/A"}</div>

                <div className="flex justify-end gap-2">
                  <IconButton title="Xem chi tiết" onClick={() => setSelectedProperty(property)}>
                    <Eye className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    title="Duyệt"
                    onClick={() => handleStatus(property, "published")}
                    disabled={processingId === property.propertyId}
                    tone="approve"
                  >
                    <Check className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    title="Từ chối"
                    onClick={() => handleStatus(property, "rejected")}
                    disabled={processingId === property.propertyId}
                    tone="reject"
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProperty && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-200 p-6">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6f2f]">
                  {selectedProperty.propertyCode}
                </p>
                <h2 className="text-2xl font-black text-stone-950">{selectedProperty.title}</h2>
                <p className="mt-1 text-sm font-medium text-stone-500">
                  {selectedProperty.district}, {selectedProperty.province}
                </p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="rounded-lg border border-stone-200 p-2 text-stone-500 transition-colors hover:text-stone-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedProperty.images?.length > 0 && (
              <div className="grid grid-cols-3 gap-3 p-6">
                {selectedProperty.images.slice(0, 3).map((image) => (
                  <img key={image.imageId || image.url} src={image.url} alt="" className="h-44 w-full rounded-lg object-cover" />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 px-6 pb-6 md:grid-cols-4">
              <Detail label="Loại BĐS" value={typeLabels[selectedProperty.propertyType] || selectedProperty.propertyType} />
              <Detail label="Giá" value={formatVnd(selectedProperty.price)} />
              <Detail label="Diện tích" value={`${selectedProperty.area} m²`} />
              <Detail label="Người tạo" value={selectedProperty.createdBy?.fullName || "N/A"} />
            </div>

            <div className="px-6 pb-6">
              <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-stone-900">
                  <ShieldCheck className="h-4 w-4 text-stone-500" /> Thông tin chủ sở hữu
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Detail label="Chủ nhà" value={selectedProperty.ownerName || "N/A"} />
                  <Detail label="SĐT" value={selectedProperty.ownerPhone || "N/A"} />
                  <Detail label="Loại hồ sơ" value={selectedProperty.isExclusive ? "Độc quyền" : "Thông thường"} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-stone-400">Mô tả</p>
              <p className="whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm font-medium leading-6 text-stone-700">
                {selectedProperty.description || "Tin đăng chưa có mô tả."}
              </p>
            </div>

            <div className="px-6 pb-6">
              <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-5">
                <h3 className="mb-4 text-sm font-black text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-stone-500" /> Giấy tờ pháp lý
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-stone-200 p-4 bg-white">
                    <p className="text-xs font-black uppercase tracking-wider text-stone-400">Sổ hồng/Sổ đỏ</p>
                    {selectedProperty.redBookUrl ? (
                      <a href={selectedProperty.redBookUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                    ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                  </div>
                  <div className="rounded-lg border border-stone-200 p-4 bg-white">
                    <p className="text-xs font-black uppercase tracking-wider text-stone-400">Sổ hộ khẩu</p>
                    {selectedProperty.householdRegistrationUrl ? (
                      <a href={selectedProperty.householdRegistrationUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                    ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                  </div>
                  <div className="rounded-lg border border-stone-200 p-4 bg-white">
                    <p className="text-xs font-black uppercase tracking-wider text-stone-400">CCCD Chủ nhà</p>
                    {selectedProperty.ownerIdUrl ? (
                      <a href={selectedProperty.ownerIdUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">Xem tài liệu</a>
                    ) : <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>}
                  </div>
                </div>
              </div>
            </div>

            {selectedProperty.isExclusive && (
              <div className="px-6 pb-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5">
                  <h3 className="mb-4 text-sm font-black text-blue-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Bất động sản độc quyền
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-stone-200 p-4 bg-white">
                      <p className="text-xs font-black uppercase tracking-wider text-stone-400">Hợp đồng môi giới</p>
                      {selectedProperty.brokerageContractUrl ? (
                        <a href={selectedProperty.brokerageContractUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-blue-600 hover:underline truncate">
                          Xem hợp đồng
                        </a>
                      ) : (
                        <p className="mt-1 text-sm font-bold text-stone-500">Chưa tải lên</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-200 p-6">
              <button
                onClick={() => handleStatus(selectedProperty, "rejected")}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-rose-700"
              >
                <X className="h-4 w-4" />
                Từ chối
              </button>
              <button
                onClick={() => handleStatus(selectedProperty, "published")}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                Duyệt tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="min-w-40 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 text-lg font-black text-stone-950">{value}</p>
    </div>
  );
}

function IconButton({ children, title, onClick, disabled, tone = "neutral" }) {
  const tones = {
    neutral: "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-950",
    approve: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    reject: "border-rose-200 text-rose-700 hover:bg-rose-50",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
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
