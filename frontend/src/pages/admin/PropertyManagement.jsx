import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

const emptyForm = {
  title: "",
  description: "",
  propertyType: "apartment",
  province: "Đà Nẵng",
  district: "",
  area: "",
  price: "",
  images: [{ url: "", isPrimary: true }],
};

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
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đang đăng" },
  { value: "rejected", label: "Từ chối" },
  { value: "sold", label: "Đã bán" },
  { value: "rented", label: "Đã thuê" },
];

const statusMeta = {
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  published: { label: "Đang đăng", className: "bg-emerald-100 text-emerald-800" },
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
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [previewProperty, setPreviewProperty] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
      pending: properties.filter((item) => item.status === "pending").length,
      published: properties.filter((item) => item.status === "published").length,
      totalValue: properties.reduce((sum, item) => sum + Number(item.price || 0), 0),
    };
  }, [properties]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalMode("create");
  };

  const openEditModal = (property) => {
    setEditingId(property.propertyId);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      propertyType: property.propertyType || "apartment",
      province: property.province || "Đà Nẵng",
      district: property.district || "",
      area: property.area || "",
      price: property.price || "",
      images: property.images?.length
        ? property.images.map((image, index) => ({
            url: image.url || "",
            isPrimary: Boolean(image.isPrimary) || index === 0,
          }))
        : [{ url: "", isPrimary: true }],
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateImage = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      images: current.images.map((image, i) => {
        if (i !== index) return field === "isPrimary" && value ? { ...image, isPrimary: false } : image;
        return { ...image, [field]: value };
      }),
    }));
  };

  const addImageRow = () => {
    setFormData((current) => ({
      ...current,
      images: [...current.images, { url: "", isPrimary: current.images.length === 0 }],
    }));
  };

  const uploadLocalImages = async (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedImages = [];
      for (const file of selectedFiles) {
        const data = new FormData();
        data.append("file", file);
        const response = await api.post("/uploads/images", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Upload ảnh thất bại");
        }

        uploadedImages.push({
          url: response.data.data.url,
          isPrimary: false,
        });
      }

      setFormData((current) => {
        const existingImages = current.images.filter((image) => image.url.trim());
        const next = [...existingImages, ...uploadedImages];
        if (!next.some((image) => image.isPrimary) && next.length > 0) {
          next[0] = { ...next[0], isPrimary: true };
        }
        return { ...current, images: next.length ? next : [{ url: "", isPrimary: true }] };
      });

      showToast("success", `Đã upload ${uploadedImages.length} ảnh vào thư mục local.`);
    } catch (error) {
      showToast("error", error.response?.data?.message || error.message || "Upload ảnh thất bại.");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImageRow = (index) => {
    setFormData((current) => {
      const next = current.images.filter((_, i) => i !== index);
      if (next.length === 0) return { ...current, images: [{ url: "", isPrimary: true }] };
      if (!next.some((image) => image.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return { ...current, images: next };
    });
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    description: formData.description.trim(),
    propertyType: formData.propertyType,
    province: formData.province.trim(),
    district: formData.district.trim(),
    area: Number(formData.area),
    price: Number(formData.price),
    images: formData.images
      .filter((image) => image.url.trim())
      .map((image, index) => ({
        url: image.url.trim(),
        isPrimary: image.isPrimary || index === 0,
      })),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      const response = editingId
        ? await api.put(`/properties/${editingId}`, payload)
        : await api.post("/properties", payload);

      if (response.data.success) {
        showToast("success", editingId ? "Đã cập nhật BĐS." : "Đã tạo BĐS mới, trạng thái chờ duyệt.");
        closeModal();
        fetchProperties();
      } else {
        showToast("error", response.data.message || "Lưu BĐS thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Lưu BĐS thất bại.");
    } finally {
      setSaving(false);
    }
  };

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await api.delete(`/properties/${deleteTarget.propertyId}`);
      if (response.data.success) {
        showToast("success", `Đã xóa ${deleteTarget.propertyCode}.`);
        setDeleteTarget(null);
        fetchProperties();
      } else {
        showToast("error", response.data.message || "Xóa BĐS thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Xóa BĐS thất bại.");
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
            Quản trị toàn bộ tin đăng, cập nhật trạng thái, chỉnh thông tin và kiểm soát dữ liệu hiển thị trên website.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Thêm BĐS
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Tổng tin" value={summary.total} />
        <Metric label="Chờ duyệt" value={summary.pending} tone="amber" />
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
              <ImagePlus className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-stone-900">Chưa có bất động sản phù hợp</p>
            <p className="mt-1 text-sm font-medium text-stone-500">Thử đổi bộ lọc hoặc thêm tin mới.</p>
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
                    <select
                      value={property.status}
                      onChange={(event) => handleStatusChange(property, event.target.value)}
                      className={`rounded-lg border-0 px-3 py-2 text-xs font-black outline-none ${statusMeta[property.status]?.className || "bg-stone-100 text-stone-700"}`}
                    >
                      {statuses
                        .filter((status) => status.value !== "all")
                        .map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <IconButton title="Xem nhanh" onClick={() => setPreviewProperty(property)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton title="Chỉnh sửa" onClick={() => openEditModal(property)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton title="Xóa" tone="danger" onClick={() => setDeleteTarget(property)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalMode && (
        <PropertyModal
          mode={modalMode}
          formData={formData}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFieldChange={updateField}
          onImageChange={updateImage}
          onAddImage={addImageRow}
          onRemoveImage={removeImageRow}
          onUploadImages={uploadLocalImages}
          uploadingImages={uploadingImages}
        />
      )}

      {previewProperty && <PreviewModal property={previewProperty} onClose={() => setPreviewProperty(null)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Xóa bất động sản?"
          message={`Tin ${deleteTarget.propertyCode} sẽ bị xóa khỏi hệ thống. Thao tác này không nên dùng nếu tin đã phát sinh giao dịch.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
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

function PropertyModal({
  mode,
  formData,
  saving,
  onClose,
  onSubmit,
  onFieldChange,
  onImageChange,
  onAddImage,
  onRemoveImage,
  onUploadImages,
  uploadingImages,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6f2f]">
              {mode === "edit" ? "Cập nhật dữ liệu" : "Tạo nguồn hàng mới"}
            </p>
            <h2 className="text-2xl font-black text-stone-950">
              {mode === "edit" ? "Chỉnh sửa bất động sản" : "Thêm bất động sản"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:text-stone-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tiêu đề" className="md:col-span-2">
              <input
                required
                value={formData.title}
                onChange={(event) => onFieldChange("title", event.target.value)}
                className="field-control"
                placeholder="VD: Căn hộ 2PN view sông..."
              />
            </Field>

            <Field label="Loại BĐS">
              <select
                value={formData.propertyType}
                onChange={(event) => onFieldChange("propertyType", event.target.value)}
                className="field-control"
              >
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tỉnh/Thành">
              <input
                required
                value={formData.province}
                onChange={(event) => onFieldChange("province", event.target.value)}
                className="field-control"
              />
            </Field>

            <Field label="Quận/Huyện">
              <input
                required
                value={formData.district}
                onChange={(event) => onFieldChange("district", event.target.value)}
                className="field-control"
                placeholder="VD: Hải Châu"
              />
            </Field>

            <Field label="Diện tích (m²)">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.area}
                onChange={(event) => onFieldChange("area", event.target.value)}
                className="field-control"
              />
            </Field>

            <Field label="Giá (VNĐ)">
              <input
                required
                type="number"
                min="0"
                step="1000000"
                value={formData.price}
                onChange={(event) => onFieldChange("price", event.target.value)}
                className="field-control"
              />
            </Field>

            <Field label="Mô tả" className="md:col-span-2">
              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                className="field-control resize-none"
                placeholder="Mô tả vị trí, pháp lý, tiện ích, tình trạng thực tế..."
              />
            </Field>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-stone-900">Hình ảnh</p>
                <p className="text-xs font-medium text-stone-500">
                  Chọn ảnh từ máy để lưu vào thư mục local `backend/images`, tên file sẽ được mã hoá.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-lg bg-[#d7b56d] px-3 py-2 text-xs font-black text-stone-950">
                  {uploadingImages ? "Đang upload..." : "Chọn ảnh local"}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    disabled={uploadingImages}
                    onChange={(event) => {
                      onUploadImages(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={onAddImage} className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-black text-white">
                  Nhập URL
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2">
                  <input
                    value={image.url}
                    onChange={(event) => onImageChange(index, "url", event.target.value)}
                    className="field-control"
                    placeholder="https://..."
                  />
                  <label className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 text-xs font-black text-stone-600">
                    <input
                      type="radio"
                      checked={image.isPrimary}
                      onChange={() => onImageChange(index, "isPrimary", true)}
                    />
                    Ảnh chính
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="flex items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-stone-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-black">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#d7b56d] px-4 py-2.5 text-sm font-black text-stone-950 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function PreviewModal({ property, onClose }) {
  const primaryImage = property.images?.find((image) => image.isPrimary)?.url || property.images?.[0]?.url;

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

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-black text-stone-950">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-stone-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-black">
            Hủy
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-black text-white">
            Xóa
          </button>
        </div>
      </div>
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
