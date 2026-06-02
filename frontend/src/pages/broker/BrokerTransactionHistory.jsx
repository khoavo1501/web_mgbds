import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Building2, CheckCircle2, Clock3, FileText, RefreshCcw, User, Calendar } from "lucide-react";
import api from "../../services/api";
import CountdownTimer from "../../components/common/CountdownTimer";

const activeStatuses = new Set([
  "pending",
  "pending_deposit",
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
  pending_deposit: "Chờ khách đặt cọc",
  customer_confirmed: "Khách đã xác nhận",
  documents_submitted: "Chờ hệ thống kiểm tra hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Chờ hệ thống xác nhận cọc",
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
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  pending_deposit: "bg-orange-100 text-orange-700 border-orange-200",
  commitment_signed: "bg-teal-100 text-teal-700 border-teal-200",
  deal_scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  broker_confirmed: "bg-cyan-100 text-cyan-700 border-cyan-200",
  refund_requested: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  default: "bg-gray-100 text-slate-700 border-gray-200",
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
    <div className="min-h-screen bg-[#f7f4ef] font-sans p-6">
      <div className="max-w-7xl mx-auto">
        {toast && (
          <div className="fixed right-6 top-6 z-50 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-xl">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950 mb-2">BĐS đang giao dịch</h1>
          <p className="text-slate-600">
            Theo dõi các bất động sản đang trong giao dịch, chờ khách ký cam kết và xác nhận thanh toán cho người bán.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Building2 className="h-6 w-6 text-slate-400" />
              <button
                type="button"
                onClick={fetchTransactions}
                className="p-2 rounded-lg hover:bg-[#f7f4ef] font-sans transition-colors"
              >
                <RefreshCcw className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">BĐS đang giao dịch</p>
            <p className="text-3xl font-bold text-slate-950">{summary.total}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <Clock3 className="h-6 w-6 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-600 mb-1">Chờ xác nhận thanh toán</p>
            <p className="text-3xl font-bold text-slate-950">{summary.waitingBroker}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <Banknote className="h-6 w-6 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-600 mb-1">Tổng tiền cọc</p>
            <p className="text-3xl font-bold text-slate-950">{formatVnd(summary.deposits)}</p>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Đang tải giao dịch...</p>
          </div>
        ) : activeTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-slate-950 mb-2">Chưa có bất động sản nào đang giao dịch</p>
            <p className="text-sm text-slate-500">Các giao dịch mới sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 w-full">
            {activeTransactions.map((item) => (
              <div key={item.transactionId} className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row w-full">
                {/* Property Image Left Section */}
                <div className="relative w-full md:w-72 h-48 md:h-auto shrink-0 bg-slate-100 border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden">
                  {item.propertyImageUrl ? (
                    <img 
                      src={item.propertyImageUrl} 
                      alt={item.propertyTitle}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                      <Building2 className="w-10 h-10 stroke-[1.5] mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Không có ảnh</span>
                    </div>
                  )}
                  {/* Status Overlay for Mobile */}
                  <div className="absolute top-3 left-3 md:hidden">
                    <StatusPill status={item.status} />
                  </div>
                </div>

                {/* Right Content Section */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    {/* Top row: Code + Status */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600 uppercase tracking-widest">
                          {item.propertyCode || item.transactionCode}
                        </span>
                        {item.dealScheduleAt && (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">
                            Lịch GD: {new Date(item.dealScheduleAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                        {(item.status === 'pending_deposit' || item.status === 'pending') && item.expiredAt && (
                          <CountdownTimer expiredAt={item.expiredAt} variant="compact" onExpired={fetchTransactions} />
                        )}
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    <h2 className="text-xl font-black text-slate-900 leading-snug mb-4">
                      {item.propertyTitle || "Bất động sản"}
                    </h2>

                    {/* Metadata Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Khách hàng</span>
                          <span className="text-sm font-bold text-slate-800">{item.customerName || "Chưa cập nhật"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Ngày giao dịch</span>
                          <span className="text-sm font-bold text-slate-800">{formatDate(item.transactionDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Money Grid */}
                    <div className="grid grid-cols-3 gap-4 bg-[#f8f6f2] p-4 rounded-xl border border-slate-200/40 mb-4">
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Giá trị BĐS</span>
                        <span className="text-sm md:text-base font-black text-slate-900">{formatVnd(item.totalPrice)}</span>
                      </div>
                      <div className="border-x border-slate-200 px-4">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Tiền đặt cọc</span>
                        <span className="text-sm md:text-base font-black text-emerald-600">{formatVnd(item.depositAmount)}</span>
                      </div>
                      <div className="pl-4">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Hoàn cọc dự kiến</span>
                        <span className="text-sm md:text-base font-black text-blue-600">{formatVnd(item.refundableDeposit)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {item.status === "deal_scheduled" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => confirmBroker(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-950 hover:bg-slate-900 text-white rounded-xl transition font-bold text-xs shadow-md shadow-slate-950/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Xác nhận thanh toán
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectBroker(item)}
                          className="flex items-center justify-center px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition font-bold text-xs"
                        >
                          Thất bại
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    pending_deposit: "bg-orange-100 text-orange-700 border-orange-200",
    commitment_signed: "bg-teal-100 text-teal-700 border-teal-200",
    deal_scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    broker_confirmed: "bg-cyan-100 text-cyan-700 border-cyan-200",
    refund_requested: "bg-orange-100 text-orange-700 border-orange-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    default: "bg-gray-100 text-slate-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || styles.default}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {statusLabels[status] || status}
    </span>
  );
}
