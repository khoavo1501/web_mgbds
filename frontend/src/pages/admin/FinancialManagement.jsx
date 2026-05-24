import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Search,
  TrendingUp,
  Wallet,
  XCircle,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import DocumentViewerModal from "../../components/DocumentViewerModal";

const statusLabels = {
  pending: "Chờ khách xác nhận",
  customer_confirmed: "Đã xác nhận mua",
  documents_submitted: "Chờ kiểm tra hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Đang xác minh thanh toán",
  deposit_confirmed: "Đã xác nhận cọc",
  commitment_signed: "Đã ký cam kết",
  deal_scheduled: "Đã đặt lịch giao dịch",
  broker_confirmed: "Broker đã xác nhận",
  refund_requested: "Yêu cầu hoàn cọc",
  refunded: "Đã hoàn cọc",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  paid: "Đã chi",
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  customer_confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  documents_submitted: "bg-amber-50 text-amber-800 ring-amber-200",
  documents_verified: "bg-sky-50 text-sky-700 ring-sky-200",
  payment_submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  deposit_confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  commitment_signed: "bg-teal-50 text-teal-700 ring-teal-200",
  deal_scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  broker_confirmed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  refund_requested: "bg-orange-50 text-orange-700 ring-orange-200",
  refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const paymentMethodLabels = {
  transfer: "Chuyển khoản",
  bank_transfer: "Chuyển khoản",
  cash: "Tiền mặt",
};

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const formatCompactVnd = (value) => {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(0)} triệu`;
  return formatVnd(number);
};

const getMonthKey = (date) => {
  if (!date) return "Chưa rõ";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Chưa rõ";
  return `T${parsed.getMonth() + 1}/${parsed.getFullYear().toString().slice(-2)}`;
};

export default function FinancialManagement() {
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [commissionSummary, setCommissionSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState("transactions");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionRes, commissionRes, summaryRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/commissions"),
        api.get("/commissions/summary"),
      ]);

      setTransactions(transactionRes.data.success ? transactionRes.data.data || [] : []);
      setCommissions(commissionRes.data.success ? commissionRes.data.data || [] : []);
      setCommissionSummary(summaryRes.data.success ? summaryRes.data.data || {} : {});
    } catch (error) {
      console.error("Failed to load financial management data", error);
      showToast("error", error.response?.data?.message || "Không tải được dữ liệu tài chính.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleTransactionStatus = async (transaction, status) => {
    setProcessingId(transaction.transactionId);
    try {
      const response = await api.patch(`/transactions/${transaction.transactionId}/status?status=${status}`);
      if (response.data.success) {
        const actionMessages = {
          documents_verified: `Đã xác minh hồ sơ ${transaction.transactionCode}.`,
          deposit_confirmed: `Đã xác nhận cọc ${transaction.transactionCode}.`,
          refunded: `Đã ghi nhận hoàn cọc ${transaction.transactionCode}.`,
          cancelled: `Đã hủy giao dịch ${transaction.transactionCode}.`,
        };
        showToast(
          status === "cancelled" ? "error" : "success",
          actionMessages[status] || `Đã cập nhật ${transaction.transactionCode}.`
        );
        await fetchFinanceData();
      } else {
        showToast("error", response.data.message || "Cập nhật giao dịch thất bại.");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Không thể cập nhật trạng thái giao dịch.");
    } finally {
      setProcessingId(null);
    }
  };

  const summary = useMemo(() => {
    const completed = transactions.filter((item) => item.status === "completed");
    const pending = transactions.filter((item) => item.status === "pending");
    const depositConfirmed = transactions.filter((item) => item.status === "deposit_confirmed");
    const cancelled = transactions.filter((item) => item.status === "cancelled");

    return {
      revenue: completed.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
      deposits: transactions.reduce((sum, item) => sum + Number(item.depositAmount || 0), 0),
      pendingValue: pending.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
      completedCount: completed.length,
      pendingCount: pending.length,
      depositConfirmedCount: depositConfirmed.length,
      cancelledCount: cancelled.length,
      totalCount: transactions.length,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, item) => {
      const key = getMonthKey(item.transactionDate);
      if (!acc[key]) {
        acc[key] = { month: key, revenue: 0, deposit: 0, commission: 0 };
      }
      if (item.status === "completed") {
        acc[key].revenue += Number(item.totalPrice || 0);
      }
      acc[key].deposit += Number(item.depositAmount || 0);
      return acc;
    }, {});

    commissions.forEach((item) => {
      const transaction = transactions.find((trx) => trx.transactionId === item.transactionId);
      const key = getMonthKey(transaction?.transactionDate);
      if (!grouped[key]) {
        grouped[key] = { month: key, revenue: 0, deposit: 0, commission: 0 };
      }
      grouped[key].commission += Number(item.brokerAmount || item.amount || 0);
    });

    return Object.values(grouped).slice(-8);
  }, [commissions, transactions]);

  const brokerData = useMemo(() => {
    const grouped = commissions.reduce((acc, item) => {
      const key = item.userName || "Chưa rõ";
      if (!acc[key]) {
        acc[key] = { broker: key, amount: 0 };
      }
      acc[key].amount += Number(item.brokerAmount || item.amount || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [commissions]);

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [item.transactionCode, item.propertyTitle, item.customerName, item.brokerName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [searchTerm, statusFilter, transactions]);

  const filteredCommissions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return commissions.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [item.transactionCode, item.propertyTitle, item.userName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [commissions, searchTerm, statusFilter]);

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

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Tài chính vận hành</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Quản lý giao dịch & hoa hồng</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Theo dõi tiền cọc, doanh thu giao dịch hoàn tất và hoa hồng môi giới từ dữ liệu backend.
          </p>
        </div>
        <button
          onClick={fetchFinanceData}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Doanh thu hoàn tất" value={formatVnd(summary.revenue)} helper={`${summary.completedCount} giao dịch`} icon={Banknote} tone="dark" />
        <Metric title="Tiền cọc ghi nhận" value={formatVnd(summary.deposits)} helper={`${summary.totalCount} giao dịch`} icon={CreditCard} tone="gold" />
        <Metric title="Cọc chờ xác nhận" value={summary.pendingCount} helper={`${summary.depositConfirmedCount} giao dịch đã xác nhận cọc`} icon={Clock3} tone="amber" />
        <Metric title="Hoa hồng đã chi" value={formatVnd(commissionSummary.paid)} helper={`Tổng: ${formatVnd(commissionSummary.total)}`} icon={BadgeCheck} tone="green" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-stone-950">Dòng tiền theo tháng</h2>
              <p className="text-sm font-medium text-stone-500">Doanh thu chỉ tính giao dịch đã hoàn tất, tiền cọc tính toàn bộ giao dịch.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              {formatCompactVnd(summary.revenue)}
            </div>
          </div>
          <div className="h-80">
            {loading ? (
              <LoadingState label="Đang tải biểu đồ..." />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="financeRevenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#15130f" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#15130f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#78716c", fontSize: 12 }}
                    tickFormatter={formatCompactVnd}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e7e0d4", fontWeight: 700 }}
                    formatter={(value, name) => [
                      formatVnd(value),
                      name === "revenue" ? "Doanh thu" : name === "deposit" ? "Tiền cọc" : "Hoa hồng",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#15130f" strokeWidth={3} fill="url(#financeRevenue)" />
                  <Area type="monotone" dataKey="deposit" stroke="#d7b56d" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="commission" stroke="#2f6f73" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Chưa có dòng tiền" description="Tạo giao dịch để biểu đồ tài chính có dữ liệu." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Hoa hồng theo môi giới</h2>
            <p className="text-sm font-medium text-stone-500">Xếp hạng theo tổng hoa hồng phát sinh.</p>
          </div>
          <div className="h-80">
            {loading ? (
              <LoadingState label="Đang tải hoa hồng..." />
            ) : brokerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brokerData} layout="vertical" margin={{ left: 28 }}>
                  <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCompactVnd} />
                  <YAxis dataKey="broker" type="category" axisLine={false} tickLine={false} width={110} />
                  <Tooltip formatter={(value) => [formatVnd(value), "Hoa hồng"]} />
                  <Bar dataKey="amount" fill="#d7b56d" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Chưa có hoa hồng" description="Hoa hồng sẽ được tạo khi có giao dịch mới." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-lg bg-stone-100 p-1">
            <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")}>
              Giao dịch
            </TabButton>
            <TabButton active={activeTab === "commissions"} onClick={() => setActiveTab("commissions")}>
              Hoa hồng
            </TabButton>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm mã, BĐS, khách hàng..."
                className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm font-bold text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-[#d7b56d] sm:w-72"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm font-black text-stone-800 outline-none transition-colors focus:border-[#d7b56d]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận cọc</option>
              <option value="customer_confirmed">Đã xác nhận mua</option>
              <option value="documents_submitted">Chờ kiểm tra hồ sơ</option>
              <option value="documents_verified">Hồ sơ hợp lệ</option>
              <option value="payment_submitted">Đang xác minh thanh toán</option>
              <option value="deposit_confirmed">Đã xác nhận cọc</option>
              <option value="commitment_signed">Đã ký cam kết</option>
              <option value="deal_scheduled">Đã đặt lịch giao dịch</option>
              <option value="broker_confirmed">Broker đã xác nhận</option>
              <option value="refund_requested">Yêu cầu hoàn cọc</option>
              <option value="refunded">Đã hoàn cọc</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
              <option value="paid">Đã chi hoa hồng</option>
            </select>
          </div>
        </div>

        {activeTab === "transactions" ? (
          <TransactionTable
            loading={loading}
            rows={filteredTransactions}
            processingId={processingId}
            onStatusChange={handleTransactionStatus}
          />
        ) : (
          <CommissionTable loading={loading} rows={filteredCommissions} />
        )}
      </section>
    </div>
  );
}

function Metric({ title, value, helper, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#d7b56d] text-stone-950",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-[#2f6f73] text-white",
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-stone-950 xl:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-bold text-stone-500">{helper}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-md px-4 text-sm font-black transition-colors ${
        active ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusStyles[status] || statusStyles.pending}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function TransactionTable({ loading, rows, processingId, onStatusChange }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedPaymentTx, setSelectedPaymentTx] = useState(null);

  if (loading) return <TableLoading label="Đang tải giao dịch..." />;
  if (rows.length === 0) {
    return <EmptyState title="Không có giao dịch phù hợp" description="Thử đổi bộ lọc hoặc tạo giao dịch mới từ tài khoản môi giới." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1160px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">Giao dịch</th>
            <th className="px-5 py-3 text-left">Bất động sản</th>
            <th className="px-5 py-3 text-left">Khách hàng</th>
            <th className="px-5 py-3 text-left">Môi giới</th>
            <th className="px-5 py-3 text-right">Giá trị</th>
            <th className="px-5 py-3 text-right">Cọc</th>
            <th className="px-5 py-3 text-right">Còn lại</th>
            <th className="px-5 py-3 text-left">Thanh toán</th>
            <th className="px-5 py-3 text-left">Trạng thái</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((item) => (
            <tr 
              key={item.transactionId} 
              className={`transition-colors hover:bg-[#fbf8f1] ${
                item.status === "documents_submitted" || item.status === "payment_submitted" ? "cursor-pointer" : ""
              }`}
              onClick={() => {
                if (item.status === "documents_submitted") setSelectedTx(item);
                if (item.status === "payment_submitted") setSelectedPaymentTx(item);
              }}
            >
              <td className="px-5 py-4">
                <p className="font-black text-stone-950">{item.transactionCode}</p>
                <p className="mt-1 text-xs font-bold text-stone-500">
                  {item.transactionDate ? new Date(item.transactionDate).toLocaleDateString("vi-VN") : "Chưa có ngày"}
                </p>
              </td>
              <td className="max-w-[230px] px-5 py-4">
                <p className="truncate text-sm font-black text-stone-900">{item.propertyTitle || "N/A"}</p>
                <p className="mt-1 text-xs font-bold text-stone-500">{item.propertyCode || "Không có mã BĐS"}</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-black text-stone-900">{item.customerName || "N/A"}</p>
                <p className="mt-1 text-xs font-bold text-stone-500">{item.customerPhone || item.customerEmail || ""}</p>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-stone-700">{item.brokerName || "N/A"}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-950">{formatVnd(item.totalPrice)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-[#8b6f2f]">{formatVnd(item.depositAmount)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-700">{formatVnd(item.remainingAmount)}</td>
              <td className="px-5 py-4 text-sm font-bold text-stone-600">
                {paymentMethodLabels[item.paymentMethod] || item.paymentMethod || "N/A"}
              </td>
              <td className="px-5 py-4">
                <StatusPill status={item.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  {item.status === "documents_submitted" ? (
                    <>
                      <ActionButton
                        title="Kiểm tra hồ sơ"
                        disabled={processingId === item.transactionId}
                        onClick={() => setSelectedTx(item)}
                        tone="success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        title="Hủy giao dịch"
                        disabled={processingId === item.transactionId}
                        onClick={() => onStatusChange(item, "cancelled")}
                        tone="danger"
                      >
                        <XCircle className="h-4 w-4" />
                      </ActionButton>
                    </>
                  ) : item.status === "payment_submitted" ? (
                    <>
                      <ActionButton
                        title="Xác nhận cọc"
                        disabled={processingId === item.transactionId}
                        onClick={() => setSelectedPaymentTx(item)}
                        tone="success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        title="Hủy giao dịch"
                        disabled={processingId === item.transactionId}
                        onClick={() => onStatusChange(item, "cancelled")}
                        tone="danger"
                      >
                        <XCircle className="h-4 w-4" />
                      </ActionButton>
                    </>
                  ) : item.status === "refund_requested" ? (
                    <>
                      <ActionButton
                        title="Xác nhận đã hoàn cọc"
                        disabled={processingId === item.transactionId}
                        onClick={() => onStatusChange(item, "refunded")}
                        tone="success"
                      >
                        {processingId === item.transactionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </ActionButton>
                    </>
                  ) : item.status === "pending" || item.status === "customer_confirmed" || item.status === "documents_verified" || item.status === "deposit_confirmed" ? (
                    <>
                      <ActionButton
                        title="Hủy giao dịch"
                        disabled={processingId === item.transactionId}
                        onClick={() => onStatusChange(item, "cancelled")}
                        tone="danger"
                      >
                        <XCircle className="h-4 w-4" />
                      </ActionButton>
                    </>
                  ) : (
                    <span className="text-xs font-black text-stone-400">Đã xử lý</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {selectedTx && (
        <DocumentVerificationModal 
          transaction={selectedTx} 
          onClose={() => setSelectedTx(null)} 
          onVerified={() => {
            setSelectedTx(null);
            onStatusChange(selectedTx, "documents_verified");
          }} 
        />
      )}

      {selectedPaymentTx && (
        <PaymentVerificationModal 
          transaction={selectedPaymentTx} 
          onClose={() => setSelectedPaymentTx(null)} 
          onVerified={() => {
            setSelectedPaymentTx(null);
            onStatusChange(selectedPaymentTx, "deposit_confirmed");
          }} 
          onReject={() => {
            setSelectedPaymentTx(null);
            onStatusChange(selectedPaymentTx, "cancelled");
          }}
        />
      )}
    </div>
  );
}

function PaymentVerificationModal({ transaction, onClose, onVerified, onReject }) {
  const receiptDoc = (transaction.documents || []).find(d => d.documentType === 'receipt');
  const [viewDoc, setViewDoc] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          <div>
            <h2 className="text-xl font-black text-stone-950">Xác nhận thanh toán</h2>
            <p className="mt-1 text-sm font-medium text-stone-500">Mã giao dịch: {transaction.transactionCode}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="font-bold text-stone-900 mb-2">Biên lai chuyển khoản</h3>
            {receiptDoc ? (
              <div 
                className="block max-w-full overflow-hidden rounded-lg border border-stone-200 cursor-pointer hover:opacity-90"
                onClick={() => setViewDoc({ url: receiptDoc.url, name: receiptDoc.fileName, type: receiptDoc.url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' })}
              >
                {receiptDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-32 bg-stone-100 flex items-center justify-center text-stone-500 font-bold">PDF Document</div>
                ) : (
                  <img src={receiptDoc.url} alt="Biên lai" className="w-full h-auto object-contain max-h-64" />
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Chưa có biên lai.</p>
            )}
          </div>
          <div className="flex justify-between items-center bg-stone-50 p-4 rounded-lg border border-stone-200">
            <span className="font-bold text-stone-700">Số tiền cần cọc:</span>
            <span className="font-black text-emerald-600 text-lg">{new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(transaction.depositAmount || 0))} VNĐ</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 border-t border-stone-200 p-6">
          <button onClick={onReject} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-200">
            Từ chối (Hủy GD)
          </button>
          <button onClick={onVerified} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            Xác nhận đã nhận tiền
          </button>
        </div>
      </div>
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

function DocumentVerificationModal({ transaction, onClose, onVerified }) {
  const [docs, setDocs] = useState(transaction.documents || []);
  const [loading, setLoading] = useState(false);
  const [rejectReasons, setRejectReasons] = useState({});
  const [viewDoc, setViewDoc] = useState(null);

  const handleAction = async (docId, action) => {
    setLoading(true);
    try {
      const url = `/transactions/${transaction.transactionId}/documents/${docId}/${action}`;
      const reason = rejectReasons[docId] || "Không hợp lệ";
      const params = action === 'reject' ? { reason } : {};
      const res = await api.patch(url, null, { params });
      
      if (res.data.success) {
        setDocs(current => current.map(d => d.documentId === docId ? { ...d, status: action === 'verify' ? 'verified' : 'rejected' } : d));
      } else {
        alert(res.data.message || "Thao tác thất bại");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái tài liệu");
    } finally {
      setLoading(false);
    }
  };

  const allProcessed = docs.length > 0 && docs.every(d => d.status === 'verified' || d.status === 'rejected');
  const allVerified = docs.length > 0 && docs.every(d => d.status === 'verified');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          <div>
            <h2 className="text-xl font-black text-stone-950">Kiểm tra hồ sơ</h2>
            <p className="mt-1 text-sm font-medium text-stone-500">Mã giao dịch: {transaction.transactionCode}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {docs.length === 0 ? (
            <p className="text-sm text-stone-500">Không có hồ sơ nào được tải lên.</p>
          ) : (
            docs.map(doc => (
              <div key={doc.documentId} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-stone-900">{doc.documentType}</h3>
                    <button 
                      onClick={() => setViewDoc({ url: doc.url, name: doc.fileName, type: doc.url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' })} 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {doc.fileName || 'Xem tài liệu'}
                    </button>
                  </div>
                  <StatusPill status={doc.status} />
                </div>
                
                {doc.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="text" 
                      placeholder="Lý do từ chối (nếu có)" 
                      className="flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm outline-none"
                      value={rejectReasons[doc.documentId] || ''}
                      onChange={e => setRejectReasons(p => ({ ...p, [doc.documentId]: e.target.value }))}
                    />
                    <button 
                      onClick={() => handleAction(doc.documentId, 'reject')}
                      disabled={loading || !rejectReasons[doc.documentId]}
                      className="rounded bg-rose-100 px-3 py-1.5 text-sm font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleAction(doc.documentId, 'verify')}
                      disabled={loading}
                      className="rounded bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                    >
                      Xác minh
                    </button>
                  </div>
                )}
                {doc.status === 'rejected' && doc.rejectReason && (
                  <p className="text-sm text-rose-600 mt-2">Lý do: {doc.rejectReason}</p>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end gap-3 border-t border-stone-200 p-6">
          <button onClick={onClose} className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-200">
            Đóng
          </button>
          {allProcessed && allVerified && (
            <button onClick={onVerified} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
              Hoàn tất xác minh
            </button>
          )}
        </div>
      </div>
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

function CommissionTable({ loading, rows }) {
  if (loading) return <TableLoading label="Đang tải hoa hồng..." />;
  if (rows.length === 0) {
    return <EmptyState title="Không có hoa hồng phù hợp" description="Hoa hồng được sinh tự động khi tạo giao dịch." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">Hoa hồng</th>
            <th className="px-5 py-3 text-left">Mã giao dịch</th>
            <th className="px-5 py-3 text-left">Bất động sản</th>
            <th className="px-5 py-3 text-left">Môi giới</th>
            <th className="px-5 py-3 text-right">Giá trị giao dịch</th>
            <th className="px-5 py-3 text-right">Tổng HH</th>
            <th className="px-5 py-3 text-right">Môi giới 60%</th>
            <th className="px-5 py-3 text-right">Công ty 40%</th>
            <th className="px-5 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((item) => (
            <tr key={item.commissionId} className="transition-colors hover:bg-[#fbf8f1]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f6f73] text-white">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-black text-stone-950">#{item.commissionId}</p>
                    <p className="text-xs font-bold text-stone-500">2% chia 60/40</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm font-black text-stone-900">{item.transactionCode || "N/A"}</td>
              <td className="max-w-[260px] px-5 py-4 text-sm font-bold text-stone-700">
                <p className="truncate">{item.propertyTitle || "N/A"}</p>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-stone-700">{item.userName || "N/A"}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-950">{formatVnd(item.transactionTotalPrice)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-950">{formatVnd(item.totalCommissionAmount)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-[#8b6f2f]">{formatVnd(item.brokerAmount || item.amount)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-[#2f6f73]">{formatVnd(item.companyAmount)}</td>
              <td className="px-5 py-4">
                <StatusPill status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({ title, onClick, disabled, tone, children }) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

function TableLoading({ label }) {
  return (
    <div className="flex items-center justify-center py-20 text-sm font-bold text-stone-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
        <ReceiptText className="h-7 w-7" />
      </div>
      <p className="text-lg font-black text-stone-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-stone-500">{description}</p>
    </div>
  );
}
