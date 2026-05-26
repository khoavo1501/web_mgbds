import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Building2, CheckCircle2, Clock3, FileText, RefreshCcw } from "lucide-react";
import api from "../../services/api";

const activeStatuses = new Set([
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

const statusLabels = {
  pending: "Chờ khách xác nhận",
  customer_confirmed: "Khách đã xác nhận",
  documents_submitted: "Chờ admin kiểm hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Chờ admin xác nhận cọc",
  deposit_confirmed: "Đã xác nhận cọc",
  commitment_signed: "Khách đã ký cam kết",
  deal_scheduled: "Đã đặt lịch giao dịch",
  broker_confirmed: "Đã thanh toán cho người bán",
  refund_requested: "Yêu cầu hoàn cọc",
  refunded: "Đã hoàn cọc",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const statusStyles = {
  commitment_signed: "bg-teal-100 text-teal-700 border-teal-200",
  deal_scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  broker_confirmed: "bg-cyan-100 text-cyan-700 border-cyan-200",
  refund_requested: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatVnd = (value) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0))} VNĐ`;

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function BrokerTransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/transactions");
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể tải giao dịch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const activeTransactions = useMemo(
    () => transactions.filter((item) => activeStatuses.has(item.status)),
    [transactions]
  );

  const summary = useMemo(
    () => ({
      total: activeTransactions.length,
      waitingBroker: activeTransactions.filter((item) => item.status === "deal_scheduled").length,
      deposits: activeTransactions.reduce((sum, item) => sum + Number(item.depositAmount || 0), 0),
    }),
    [activeTransactions]
  );

  const confirmBroker = async (transaction) => {
    try {
      const response = await api.patch(`/transactions/${transaction.transactionId}/broker-confirm`);
      if (response.data.success) {
        setTransactions((current) =>
          current.map((item) => (item.transactionId === transaction.transactionId ? response.data.data : item))
        );
        showToast("Đã xác nhận người mua thanh toán cho người bán");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể xác nhận giao dịch");
    }
  };

  const rejectBroker = async (transaction) => {
    if (!window.confirm("Xác nhận giao dịch trực tiếp thất bại?")) return;
    try {
      const response = await api.patch(`/transactions/${transaction.transactionId}/broker-reject`);
      if (response.data.success) {
        setTransactions((current) =>
          current.map((item) => (item.transactionId === transaction.transactionId ? response.data.data : item))
        );
        showToast("Đã xác nhận giao dịch trực tiếp thất bại");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể xác nhận giao dịch thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {toast && (
          <div className="fixed right-6 top-6 z-50 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-xl">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BĐS đang giao dịch</h1>
          <p className="text-gray-600">
            Theo dõi các bất động sản đang trong giao dịch, chờ khách ký cam kết và xác nhận thanh toán cho người bán.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Building2 className="h-6 w-6 text-gray-400" />
              <button
                type="button"
                onClick={fetchTransactions}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCcw className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">BĐS đang giao dịch</p>
            <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Clock3 className="h-6 w-6 text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">Chờ xác nhận thanh toán</p>
            <p className="text-3xl font-bold text-gray-900">{summary.waitingBroker}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Banknote className="h-6 w-6 text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">Tổng tiền cọc</p>
            <p className="text-3xl font-bold text-gray-900">{formatVnd(summary.deposits)}</p>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang tải giao dịch...</p>
          </div>
        ) : activeTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Chưa có bất động sản nào đang giao dịch</p>
            <p className="text-sm text-gray-500">Các giao dịch mới sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {activeTransactions.map((item) => (
              <div key={item.transactionId} className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all p-5 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {item.propertyCode || item.transactionCode}
                    </p>
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
                      {item.propertyTitle || "Bất động sản"}
                    </h2>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Khách hàng:</span> {item.customerName || "Chưa cập nhật"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Ngày giao dịch:</span> {formatDate(item.transactionDate)}
                    </p>
                    {item.dealScheduleAt && (
                      <p className="text-sm text-blue-600 font-semibold mt-2">
                        📅 Lịch giao dịch: {new Date(item.dealScheduleAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                </div>

                {/* Money Info */}
                <div className="grid gap-3 md:grid-cols-3 mb-4">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Giá trị</p>
                    <p className="text-sm font-bold text-gray-900">{formatVnd(item.totalPrice)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1">Tiền cọc</p>
                    <p className="text-sm font-bold text-green-900">{formatVnd(item.depositAmount)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Hoàn cọc dự kiến</p>
                    <p className="text-sm font-bold text-blue-900">{formatVnd(item.refundableDeposit)}</p>
                  </div>
                </div>

                {/* Actions */}
                {item.status === "deal_scheduled" && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => confirmBroker(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Xác nhận đã thanh toán
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectBroker(item)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm"
                    >
                      Giao dịch thất bại
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Money({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{formatVnd(value)}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    commitment_signed: "bg-teal-100 text-teal-700 border-teal-200",
    deal_scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    broker_confirmed: "bg-cyan-100 text-cyan-700 border-cyan-200",
    refund_requested: "bg-orange-100 text-orange-700 border-orange-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    default: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || styles.default}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {statusLabels[status] || status}
    </span>
  );
}
