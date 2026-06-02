export const PROPERTY_STATUSES = [
  { value: "pending", label: "Chờ kiểm tra", className: "bg-amber-100 text-amber-800" },
  { value: "published", label: "Đang bán", className: "bg-emerald-100 text-emerald-800" },
  { value: "in_transaction", label: "Đang giao dịch", className: "bg-cyan-100 text-cyan-800" },
  { value: "sold", label: "Đã bán", className: "bg-blue-100 text-blue-800" },
  { value: "rejected", label: "Bị từ chối", className: "bg-rose-100 text-rose-800" },
];

export const PROPERTY_STATUS_META = Object.fromEntries(
  PROPERTY_STATUSES.map(({ value, label, className }) => [value, { label, className }])
);

export const getPropertyStatusMeta = (status) =>
  PROPERTY_STATUS_META[status] || {
    label: status || "Chưa rõ",
    className: "bg-stone-100 text-stone-700",
  };
