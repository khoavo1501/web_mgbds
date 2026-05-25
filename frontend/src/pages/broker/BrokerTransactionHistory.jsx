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
  commitment_signed: "bg-teal-50 text-teal-700 ring-teal-200",
  deal_scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  broker_confirmed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  refund_requested: "bg-orange-50 text-orange-700 ring-orange-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  default: "bg-slate-100 text-slate-700 ring-slate-200",
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
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xl">
          {toast}
        </div>
      )}

      <section className="mb-6 border-b border-slate-200 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Quản lý giao dịch</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">BĐS đang giao dịch</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Theo dõi các bất động sản đang trong giao dịch, chờ khách ký cam kết và xác nhận thanh toán cho người bán.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchTransactions}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Làm mới
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric icon={Building2} label="BĐS đang giao dịch" value={summary.total} />
        <Metric icon={Clock3} label="Chờ xác nhận thanh toán" value={summary.waitingBroker} />
        <Metric icon={Banknote} label="Tổng tiền cọc" value={formatVnd(summary.deposits)} />
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">
          Đang tải giao dịch...
        </div>
      ) : activeTransactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-sm font-bold text-slate-500">Chưa có bất động sản nào đang giao dịch.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {activeTransactions.map((item) => (
            <article key={item.transactionId} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {item.propertyCode || item.transactionCode}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">
                    {item.propertyTitle || "Bất động sản"}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Khách hàng: {item.customerName || "Chưa cập nhật"} · {formatDate(item.transactionDate)}
                  </p>
                  {item.dealScheduleAt && (
                    <p className="mt-1 text-sm font-bold text-sky-700">
                      Lịch giao dịch: {new Date(item.dealScheduleAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
                <StatusPill status={item.status} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Money label="Giá trị" value={item.totalPrice} />
                <Money label="Cọc" value={item.depositAmount} />
                <Money label="Hoàn cọc dự kiến" value={item.refundableDeposit} />
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {item.status === "deal_scheduled" && (
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => rejectBroker(item)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 hover:bg-rose-100"
                    >
                      Giao dịch thất bại
                    </button>
                  <button
                    type="button"
                    onClick={() => confirmBroker(item)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Xác nhận đã thanh toán cho người bán
                  </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
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
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[status] || statusStyles.default}`}>
      {statusLabels[status] || status}
    </span>
  );
}
