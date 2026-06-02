import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import DocumentViewerModal from "../../components/DocumentViewerModal";

const formatDate = (value) => {
  if (!value) return "Chưa rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

export default function AdminReviewCenter() {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyRes, userRes, transactionRes] = await Promise.all([
        api.get("/properties?status=pending&size=100&sortBy=createdAt&sortDirection=ASC"),
        api.get("/admin/users?role=customer"),
        api.get("/transactions"),
      ]);
      setProperties(propertyRes.data.success ? propertyRes.data.data.content || [] : []);
      setUsers(userRes.data.success ? userRes.data.data || [] : []);
      setTransactions(transactionRes.data.success ? transactionRes.data.data || [] : []);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không tải được hàng đợi duyệt.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const queue = useMemo(() => {
    const propertyItems = properties.map((item) => ({
      key: `property-${item.propertyId}`,
      type: "property",
      title: item.title,
      code: item.propertyCode,
      owner: item.ownerName || item.createdBy?.fullName || "Chưa rõ",
      createdAt: item.createdAt,
      statusLabel: "BĐS chờ kiểm tra",
      icon: Building2,
      payload: item,
      priority: 1,
    }));

    const userItems = users
      .filter((item) => item.identityVerificationStatus === "pending_review")
      .map((item) => ({
        key: `user-${item.userId}`,
        type: "user",
        title: item.fullName,
        code: item.email,
        owner: item.phone || "Chưa có SĐT",
        createdAt: item.createdAt,
        statusLabel: "Hồ sơ khách chờ kiểm tra",
        icon: UserCheck,
        payload: item,
        priority: 2,
      }));

    const reviewStatuses = {
      documents_submitted: "Hồ sơ giao dịch chờ kiểm tra",
      payment_submitted: "Thanh toán cọc chờ xác nhận",
      refund_requested: "Yêu cầu hoàn cọc",
      broker_confirmed: "Bàn giao chờ hoàn tất",
    };
    const transactionItems = transactions
      .filter((item) => reviewStatuses[item.status])
      .map((item) => ({
        key: `transaction-${item.transactionId}`,
        type: "transaction",
        title: item.propertyTitle || "Giao dịch",
        code: item.transactionCode,
        owner: item.customerName || "Khách hàng",
        createdAt: item.transactionDate,
        statusLabel: reviewStatuses[item.status],
        icon: FileCheck,
        payload: item,
        priority: 3,
      }));

    return [...propertyItems, ...userItems, ...transactionItems].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.priority - b.priority;
    });
  }, [properties, transactions, users]);

  const handlePropertyStatus = async (property, status) => {
    const reason = status === "rejected"
      ? window.prompt("Nhập lý do không duyệt BĐS để môi giới cập nhật lại:")
      : "";
    if (status === "rejected" && !reason?.trim()) return;

    const key = `property-${property.propertyId}`;
    setProcessingKey(key);
    try {
      const response = await api.patch(`/properties/${property.propertyId}/status`, null, {
        params: { status, reason: reason?.trim() },
      });
      if (response.data.success) {
        showToast(status === "published" ? "success" : "error", status === "published" ? "Đã duyệt BĐS." : "Đã từ chối BĐS.");
        setSelected(null);
        await fetchQueue();
      } else {
        showToast("error", response.data.message || "Cập nhật BĐS thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Cập nhật BĐS thất bại.");
    } finally {
      setProcessingKey(null);
    }
  };

  const handleUserStatus = async (user, status) => {
    const key = `user-${user.userId}`;
    setProcessingKey(key);
    try {
      const reason = status === "rejected" ? window.prompt("Lý do từ chối hồ sơ khách hàng:") || "Hồ sơ không hợp lệ" : "";
      const response = await api.patch(`/admin/users/${user.userId}/identity-status`, null, { params: { status, reason } });
      if (response.data.success) {
        showToast(status === "verified" ? "success" : "error", status === "verified" ? "Đã xác nhận hồ sơ khách hàng." : "Đã từ chối hồ sơ khách hàng.");
        setSelected(null);
        await fetchQueue();
      } else {
        showToast("error", response.data.message || "Cập nhật hồ sơ thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setProcessingKey(null);
    }
  };

  const handleTransactionStatus = async (transaction, status) => {
    const key = `transaction-${transaction.transactionId}`;
    setProcessingKey(key);
    try {
      const response = await api.patch(`/transactions/${transaction.transactionId}/status?status=${status}`);
      if (response.data.success) {
        showToast("success", "Đã cập nhật giao dịch.");
        setSelected(null);
        await fetchQueue();
      } else {
        showToast("error", response.data.message || "Cập nhật giao dịch thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Cập nhật giao dịch thất bại.");
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Hàng đợi kiểm duyệt</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Trung tâm duyệt</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Tất cả hồ sơ cần xử lý được gom tại đây và sắp theo thứ tự cũ nhất trước.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm hover:bg-stone-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Tổng chờ xử lý" value={queue.length} icon={Clock3} tone="dark" />
        <Metric label="BĐS" value={properties.length} icon={Building2} tone="gold" />
        <Metric label="Hồ sơ khách" value={users.filter((item) => item.identityVerificationStatus === "pending_review").length} icon={UserCheck} tone="green" />
        <Metric label="Giao dịch" value={transactions.filter((item) => ["documents_submitted", "payment_submitted", "refund_requested", "broker_confirmed"].includes(item.status)).length} icon={FileCheck} tone="brown" />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-bold text-stone-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải hàng đợi...
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BadgeCheck className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-stone-900">Không còn hồ sơ chờ xử lý</p>
            <p className="mt-1 text-sm font-medium text-stone-500">Hàng đợi kiểm duyệt hiện đang trống.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {queue.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.key} className="grid grid-cols-[1fr_170px_160px_130px] items-center gap-4 px-5 py-4 hover:bg-[#fbf8f1]">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-[#8b6f2f]">{item.statusLabel}</p>
                      <h2 className="truncate text-sm font-black text-stone-950">{item.title}</h2>
                      <p className="mt-1 text-xs font-bold text-stone-500">{item.code} · {item.owner}</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-stone-600">{formatDate(item.createdAt)}</div>
                  <div className="text-sm font-black text-stone-900">
                    {item.type === "transaction" ? formatVnd(item.payload.depositAmount || item.payload.totalPrice) : item.type === "property" ? formatVnd(item.payload.price) : "Hồ sơ"}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setSelected(item)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-950">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <ReviewModal
          item={selected}
          processing={processingKey === selected.key}
          onClose={() => setSelected(null)}
          onApproveProperty={handlePropertyStatus}
          onApproveUser={handleUserStatus}
          onUpdateTransaction={handleTransactionStatus}
        />
      )}
    </div>
  );
}

function ReviewModal({ item, processing, onClose, onApproveProperty, onApproveUser, onUpdateTransaction }) {
  const payload = item.payload;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#8b6f2f]">{item.statusLabel}</p>
            <h2 className="text-2xl font-black text-stone-950">{item.title}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">{item.code}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:text-stone-950">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {item.type === "property" && <PropertyReview property={payload} />}
          {item.type === "user" && <UserReview user={payload} />}
          {item.type === "transaction" && <TransactionReview transaction={payload} />}
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-200 p-6">
          {item.type === "property" && (
            <>
              <button disabled={processing} onClick={() => onApproveProperty(payload, "rejected")} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-black text-rose-700 hover:bg-rose-200 disabled:opacity-60">Không duyệt</button>
              <button disabled={processing} onClick={() => onApproveProperty(payload, "published")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Duyệt BĐS</button>
            </>
          )}
          {item.type === "user" && (
            <>
              <button disabled={processing} onClick={() => onApproveUser(payload, "rejected")} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-black text-rose-700 hover:bg-rose-200 disabled:opacity-60">Từ chối</button>
              <button disabled={processing} onClick={() => onApproveUser(payload, "verified")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Duyệt hồ sơ</button>
            </>
          )}
          {item.type === "transaction" && (
            <>
              {payload.status === "documents_submitted" && <button disabled={processing} onClick={() => onUpdateTransaction(payload, "documents_verified")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Duyệt hồ sơ giao dịch</button>}
              {payload.status === "payment_submitted" && <button disabled={processing} onClick={() => onUpdateTransaction(payload, "deposit_confirmed")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Xác nhận cọc</button>}
              {payload.status === "refund_requested" && <button disabled={processing} onClick={() => onUpdateTransaction(payload, "refunded")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Xác nhận hoàn cọc</button>}
              {payload.status === "broker_confirmed" && <button disabled={processing} onClick={() => onUpdateTransaction(payload, "completed")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Hoàn tất giao dịch</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyReview({ property }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Info label="Giá" value={formatVnd(property.price)} />
        <Info label="Khu vực" value={`${property.district || ""}, ${property.province || ""}`} />
        <Info label="Chủ bán" value={property.ownerName || "Chưa có"} />
      </div>
      <DocumentGrid
        docs={[
          { label: "Sổ đỏ/Sổ hồng", url: property.redBookUrl },
          { label: "Sổ hộ khẩu/Xác nhận cư trú", url: property.householdRegistrationUrl },
          { label: "CCCD người bán", url: property.ownerIdUrl },
          ...(property.isExclusive ? [{ label: "Hợp đồng môi giới độc quyền", url: property.brokerageContractUrl }] : []),
        ]}
      />
    </>
  );
}

function UserReview({ user }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Info label="Khách hàng" value={user.fullName} />
        <Info label="Email" value={user.email} />
        <Info label="SĐT" value={user.phone || "Chưa có"} />
      </div>
      <DocumentGrid
        docs={[
          { label: "CCCD mặt trước", url: user.cccdFrontUrl },
          { label: "CCCD mặt sau", url: user.cccdBackUrl },
          { label: "Cư trú/Sổ hộ khẩu", url: user.residenceUrl },
        ]}
      />
    </>
  );
}

function TransactionReview({ transaction }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Info label="Khách hàng" value={transaction.customerName || "N/A"} />
        <Info label="Môi giới" value={transaction.brokerName || "N/A"} />
        <Info label="Tiền cọc" value={formatVnd(transaction.depositAmount)} />
        <Info label="Tổng giá trị" value={formatVnd(transaction.totalPrice)} />
        <Info label="Ngày giao dịch" value={formatDate(transaction.transactionDate)} />
        <Info label="Trạng thái" value={transaction.status} />
      </div>
      <DocumentGrid
        docs={(transaction.documents || [])
          .filter((doc) => doc.status !== "archived")
          .map((doc) => ({
            label: getDocumentLabel(doc.documentType),
            url: doc.url,
            fileName: doc.fileName,
          }))}
        emptyText="Chưa có giấy tờ hoặc biên lai được tải lên."
      />
    </>
  );
}

function getDocumentLabel(type) {
  const labels = {
    cccd_front: "CCCD mặt trước",
    cccd_back: "CCCD mặt sau",
    residence: "Cư trú/Sổ hộ khẩu",
    household: "Sổ hộ khẩu",
    receipt: "Biên lai đặt cọc",
    marriage: "Giấy xác nhận hôn nhân",
  };
  return labels[type] || type || "Tài liệu";
}

function DocumentGrid({ docs, emptyText = "Chưa tải lên" }) {
  const [viewDoc, setViewDoc] = useState(null);
  const openDocument = (doc) => {
    if (!doc.url) return;
    setViewDoc({
      url: doc.url,
      name: doc.fileName || doc.label,
      type: doc.url.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
    });
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-900">
        <ShieldCheck className="h-4 w-4" /> Giấy tờ cần kiểm tra
      </h3>
      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-200 bg-white p-4 text-sm font-bold text-stone-500">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {docs.map((doc) => (
            <div key={`${doc.label}-${doc.url || "empty"}`} className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-stone-400">{doc.label}</p>
              {doc.url ? (
                <button
                  type="button"
                  onClick={() => openDocument(doc)}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:underline"
                >
                  <Eye className="h-4 w-4" /> Xem giấy tờ
                </button>
              ) : (
                <p className="mt-2 text-sm font-bold text-rose-600">Chưa tải lên</p>
              )}
            </div>
          ))}
        </div>
      )}
      <DocumentViewerModal
        isOpen={!!viewDoc}
        onClose={() => setViewDoc(null)}
        documentUrl={viewDoc?.url}
        documentName={viewDoc?.name}
        documentType={viewDoc?.type}
      />
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-stone-950">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#d7b56d] text-stone-950",
    green: "bg-[#2f6f73] text-white",
    brown: "bg-[#7f5539] text-white",
  };
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function Toast({ type, message }) {
  return (
    <div className="fixed right-6 top-6 z-[60] rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </div>
        <p className="text-sm font-bold text-stone-800">{message}</p>
      </div>
    </div>
  );
}
