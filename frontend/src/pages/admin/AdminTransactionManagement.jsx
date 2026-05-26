import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  X,
  Eye,
} from "lucide-react";
import api from "../../services/api";

const statusMeta = {
  deposit_paid: { label: "Đã cọc", tone: "blue" },
  documents_submitted: { label: "Chờ duyệt giấy tờ", tone: "gold" },
  document_verifying: { label: "Đang duyệt giấy tờ", tone: "gold" },
  notarizing: { label: "Đang công chứng", tone: "purple" },
  payment_submitted: { label: "Chờ duyệt thanh toán", tone: "blue" },
  completed: { label: "Hoàn tất", tone: "green" },
  cancelled: { label: "Đã hủy", tone: "red" },
  refund_requested: { label: "Yêu cầu hoàn cọc", tone: "red" }
};

const documentTypeMeta = {
  cccd: "Căn cước công dân",
  cccd_front: "CCCD mặt trước",
  cccd_back: "CCCD mặt sau",
  household: "Sổ hộ khẩu",
  residence: "Sổ hộ khẩu / Xác nhận cư trú",
  marriage: "Giấy đăng ký kết hôn",
};

export default function AdminTransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("identity_pending");
  
  // Modal states
  const [selectedTx, setSelectedTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectPrompt, setRejectPrompt] = useState(null);
  const [identityRejectPrompt, setIdentityRejectPrompt] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/transactions");
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      showToast("error", "Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerifyDocument = async (txId, docId) => {
    try {
      const response = await api.patch(`/transactions/${txId}/documents/${docId}/verify`);
      if (response.data.success) {
        showToast("success", "Đã duyệt giấy tờ");
        setSelectedTx(response.data.data); // Update modal with fresh data
        fetchTransactions(); // Update background list
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Lỗi khi duyệt giấy tờ");
    }
  };

  const handleRejectDocument = async (txId, docId, reason) => {
    try {
      const response = await api.patch(`/transactions/${txId}/documents/${docId}/reject`, null, {
        params: { reason }
      });
      if (response.data.success) {
        showToast("success", "Đã từ chối giấy tờ");
        setSelectedTx(response.data.data);
        fetchTransactions();
        setRejectPrompt(null);
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Lỗi khi từ chối giấy tờ");
    }
  };

  const handleVerifyCustomerIdentity = async (transaction) => {
    try {
      const response = await api.patch(`/admin/users/${transaction.customerId}/identity-status`, null, {
        params: { status: "verified" },
      });
      if (response.data.success) {
        showToast("success", "Đã duyệt hồ sơ xác thực khách hàng");
        setSelectedTx(null);
        fetchTransactions();
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không thể duyệt hồ sơ khách hàng");
    }
  };

  const handleRejectCustomerIdentity = async (transaction, reason) => {
    try {
      const response = await api.patch(`/admin/users/${transaction.customerId}/identity-status`, null, {
        params: { status: "rejected", reason },
      });
      if (response.data.success) {
        showToast("success", "Đã từ chối hồ sơ xác thực khách hàng");
        setSelectedTx(null);
        setIdentityRejectPrompt(false);
        fetchTransactions();
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không thể từ chối hồ sơ khách hàng");
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "identity_pending" && tx.customerIdentityStatus === "pending_review") ||
      tx.status === filterStatus;
    const matchSearch =
      tx.transactionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Pháp lý & Giấy tờ</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Duyệt hồ sơ giao dịch</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Xem xét và xác thực các loại giấy tờ tùy thân của khách hàng trước khi tiến hành công chứng.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã giao dịch, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm font-bold text-stone-700 outline-none transition-colors hover:bg-stone-100 focus:border-[#d7b56d] focus:bg-white"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "identity_pending", label: "Hồ sơ khách chờ duyệt" },
              { value: "all", label: "Tất cả trạng thái" },
              { value: "documents_submitted", label: "Chờ duyệt giấy tờ" },
              { value: "document_verifying", label: "Đang duyệt" },
              { value: "documents_verified", label: "Đã duyệt hợp lệ" },
              { value: "notarizing", label: "Đang công chứng" }
            ]}
          />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_200px_150px_120px] items-center gap-4 border-b border-stone-200 bg-stone-50/50 px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-400">
          <div>Thông tin giao dịch</div>
          <div>Khách hàng</div>
          <div>Trạng thái</div>
          <div className="text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm font-bold text-stone-400">Đang tải dữ liệu...</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-stone-400">
            <FileText className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-sm font-bold">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredTransactions.map((tx) => (
              <article
                key={tx.transactionId}
                className="grid grid-cols-[1fr_200px_150px_120px] items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fbf8f1]"
              >
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-500">
                      {tx.transactionCode}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-stone-900">{tx.propertyTitle}</h3>
                  <p className="mt-1 text-[11px] font-medium text-stone-500">
                    BĐS: {tx.propertyCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-700">{tx.customerName}</p>
                  <p className="text-[11px] font-medium text-stone-500">{tx.customerEmail}</p>
                </div>
                <div>
                  {tx.customerIdentityStatus === "pending_review" ? (
                    <IdentityBadge status={tx.customerIdentityStatus} />
                  ) : (
                    <StatusBadge status={tx.status} />
                  )}
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="flex inline-flex items-center gap-2 rounded-lg bg-[#d7b56d] px-3 py-1.5 text-xs font-black text-stone-950 transition-colors hover:bg-[#c4a45d]"
                  >
                    <Eye className="h-3 w-3" />
                    Xem hồ sơ
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedTx && (
        <DocumentReviewModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onVerify={(docId) => handleVerifyDocument(selectedTx.transactionId, docId)}
          onReject={(docId) => setRejectPrompt(docId)}
          onVerifyIdentity={() => handleVerifyCustomerIdentity(selectedTx)}
          onRejectIdentity={() => setIdentityRejectPrompt(true)}
        />
      )}

      {rejectPrompt && (
        <RejectPromptModal
          onCancel={() => setRejectPrompt(null)}
          onSubmit={(reason) => handleRejectDocument(selectedTx.transactionId, rejectPrompt, reason)}
        />
      )}

      {identityRejectPrompt && (
        <RejectPromptModal
          title="Từ chối hồ sơ khách hàng"
          description="Nhập lý do để khách hàng cập nhật lại hồ sơ xác thực trong trang cá nhân."
          onCancel={() => setIdentityRejectPrompt(false)}
          onSubmit={(reason) => handleRejectCustomerIdentity(selectedTx, reason)}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || { label: status, tone: "neutral" };
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    gold: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-purple-50 text-purple-700",
    neutral: "bg-stone-100 text-stone-600",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${tones[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

function IdentityBadge({ status }) {
  const labels = {
    pending_review: "Hồ sơ khách chờ duyệt",
    verified: "Hồ sơ khách đã duyệt",
    rejected: "Hồ sơ khách bị từ chối",
    not_submitted: "Chưa có hồ sơ khách",
  };
  const styles = {
    pending_review: "bg-amber-50 text-amber-700",
    verified: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
    not_submitted: "bg-stone-100 text-stone-600",
  };
  const key = status || "not_submitted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${styles[key] || styles.not_submitted}`}>
      {labels[key] || key}
    </span>
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

function DocumentReviewModal({ transaction, onClose, onVerify, onReject, onVerifyIdentity, onRejectIdentity }) {
  const documents = transaction.documents || [];
  const identityDocuments = [
    { key: "cccdFront", label: "CCCD mặt trước", url: transaction.customerCccdFrontUrl },
    { key: "cccdBack", label: "CCCD mặt sau", url: transaction.customerCccdBackUrl },
    { key: "residence", label: "Sổ hộ khẩu / xác nhận cư trú", url: transaction.customerResidenceUrl },
  ];
  const isIdentityReview = transaction.customerIdentityStatus === "pending_review";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-200 p-6 shrink-0">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6f2f]">
              {transaction.transactionCode}
            </p>
            <h2 className="text-2xl font-black text-stone-950">
              Hồ sơ pháp lý: {transaction.customerName}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:text-stone-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {isIdentityReview ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                Khách hàng đã cập nhật hồ sơ xác thực trong trang cá nhân. Admin duyệt tại mục pháp lý này để mở bước thanh toán cọc.
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {identityDocuments.map((doc) => (
                  <div key={doc.key} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                    <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
                      <h4 className="text-sm font-black text-stone-900">{doc.label}</h4>
                    </div>
                    <div className="flex min-h-[260px] items-center justify-center bg-stone-100 p-3">
                      {doc.url ? (
                        <img src={doc.url} alt={doc.label} className="max-h-[360px] rounded object-contain shadow-sm" />
                      ) : (
                        <span className="text-sm font-bold text-stone-400">Chưa có file</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={onRejectIdentity}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-100"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={onVerifyIdentity}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700"
                >
                  Duyệt hồ sơ khách
                </button>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 text-stone-500 font-medium">
              Chưa có giấy tờ nào được tải lên.
            </div>
          ) : (
            <div className="space-y-8">
              {documents.map(doc => (
                <div key={doc.documentId} className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900">{documentTypeMeta[doc.documentType] || doc.documentType}</h4>
                      <p className="text-xs font-medium text-stone-500 mt-0.5">Trạng thái: {
                        doc.status === 'verified' ? <span className="text-emerald-600 font-bold">Đã duyệt</span> :
                        doc.status === 'rejected' ? <span className="text-rose-600 font-bold">Đã từ chối</span> :
                        <span className="text-amber-600 font-bold">Chờ duyệt</span>
                      }</p>
                    </div>
                    {doc.status === 'pending_review' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onReject(doc.documentId)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
                        >
                          Từ chối
                        </button>
                        <button 
                          onClick={() => onVerify(doc.documentId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Duyệt
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-stone-100 flex justify-center">
                    {doc.url ? (
                      <img src={doc.url} alt={doc.documentType} className="max-h-[500px] object-contain rounded shadow-sm" />
                    ) : (
                      <div className="text-sm font-medium text-stone-400 py-10">Lỗi: Không tìm thấy link ảnh</div>
                    )}
                  </div>
                  {doc.notes && (
                    <div className="bg-rose-50 px-4 py-3 border-t border-rose-100 text-sm">
                      <strong className="text-rose-800">Lý do từ chối:</strong> <span className="text-rose-700">{doc.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectPromptModal({ title, description, onCancel, onSubmit }) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-black text-stone-950">{title || "Từ chối giấy tờ"}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-stone-500">
          {description || "Vui lòng nhập lý do từ chối để khách hàng có thể cập nhật lại giấy tờ chính xác hơn."}
        </p>
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-stone-200 p-3 text-sm font-medium text-stone-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            placeholder="Ví dụ: Ảnh mờ, không rõ số CMND..."
            required
          />
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-black text-stone-600 hover:bg-stone-50">
              Hủy
            </button>
            <button type="submit" disabled={!reason.trim()} className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
              Xác nhận từ chối
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toast({ type, message }) {
  return (
    <div className="fixed right-6 top-6 z-[70] rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-xl">
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
