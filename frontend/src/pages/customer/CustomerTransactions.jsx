import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Clock3,
  CreditCard,
  FileCheck2,
  FileClock,
  Landmark,
  Loader2,
  QrCode,
  ReceiptText,
  Send,
  ShieldCheck,
  Square,
  Upload,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import AnimatedTimeline from "../../components/AnimatedTimeline";
import { useAuth } from "../../context/AuthContext";
import CountdownTimer from "../../components/common/CountdownTimer";
import DocumentViewerModal from "../../components/DocumentViewerModal";

const activeStatuses = new Set([
  "pending",
  "pending_deposit",
  "customer_confirmed",
  "documents_submitted",
  "documents_verified",
  "payment_submitted",
  "deposit_confirmed",
  "deal_scheduled",
  "broker_confirmed",
  "refund_requested",
]);

const statusLabels = {
  pending: "Chờ khách xác nhận",
  pending_deposit: "Chờ đặt cọc",
  customer_confirmed: "Đã xác nhận mua",
  documents_submitted: "Chờ kiểm tra hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Đang xác minh thanh toán",
  deposit_confirmed: "Đã xác nhận cọc",
  deal_scheduled: "Đã đặt lịch giao dịch",
  broker_confirmed: "Giao dịch thành công",
  refund_requested: "Chờ hoàn cọc",
  refunded: "Đã hoàn cọc",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const paymentStatusLabels = {
  pending: "Chờ thanh toán",
  submitted: "Chờ hệ thống xác nhận",
  confirmed: "Đã xác nhận",
  refund_requested: "Yêu cầu hoàn cọc",
  refunded: "Đã hoàn cọc",
};

const methodLabels = {
  transfer: "Chuyển khoản",
  bank_transfer: "Chuyển khoản",
  cash: "Tiền mặt",
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  pending_deposit: "bg-orange-50 text-orange-800 ring-orange-200",
  customer_confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  documents_submitted: "bg-amber-50 text-amber-800 ring-amber-200",
  documents_verified: "bg-sky-50 text-sky-700 ring-sky-200",
  payment_submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  deposit_confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  deal_scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  broker_confirmed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  refund_requested: "bg-orange-50 text-orange-700 ring-orange-200",
  refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

const bankInfo = {
  bank: "MGBDS Bank",
  accountNumber: "190020262225",
  accountName: "CONG TY MGBDS",
};

const formatVnd = (value) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0))} VNĐ`;

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  return new Date(value).toLocaleDateString("vi-VN");
};

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà phố",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
};

const dealMorningSlots = ["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];
const dealAfternoonSlots = ["14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"];

const getDaysInMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(date.getFullYear(), date.getMonth(), day));
  }
  return days;
};

const isPastDate = (date) => {
  if (!date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const toDateInputValue = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStep = (status) => {
  if (status === "pending") return 1;
  if (status === "customer_confirmed") return 2;
  if (status === "documents_submitted") return 2; // Step 2 is active, but we show payment
  if (status === "documents_verified" || status === "payment_submitted") return 3;
  if (["deposit_confirmed", "deal_scheduled", "broker_confirmed", "refund_requested", "refunded", "completed"].includes(status)) return 4;
  return 1;
};

export default function CustomerTransactions({ activeOnly = false, detail = false }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchParams] = useSearchParams();
  const { transactionId } = useParams();

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

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
  }, [showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const visibleTransactions = useMemo(() => {
    const rows = activeOnly
      ? transactions.filter((item) => activeStatuses.has(item.status))
      : transactions;
    return rows.slice().sort((a, b) => Number(b.transactionId || 0) - Number(a.transactionId || 0));
  }, [activeOnly, transactions]);

  useEffect(() => {
    if (selectedId || visibleTransactions.length === 0) return;
    if (transactionId) {
      setSelectedId(Number(transactionId));
      return;
    }
    const initialPropertyId = searchParams.get("propertyId");
    const matched = initialPropertyId
      ? visibleTransactions.find((item) => String(item.propertyId) === String(initialPropertyId))
      : null;
    setSelectedId((matched || visibleTransactions[0]).transactionId);
  }, [searchParams, selectedId, transactionId, visibleTransactions]);

  const selected = transactions.find((item) => item.transactionId === Number(transactionId || selectedId)) || null;

  const summary = useMemo(
    () => ({
      total: visibleTransactions.length,
      active: visibleTransactions.filter((item) => activeStatuses.has(item.status)).length,
      completed: visibleTransactions.filter((item) => item.status === "completed").length,
      value: visibleTransactions.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    }),
    [visibleTransactions]
  );

  const updateTransaction = (nextTransaction) => {
    setTransactions((current) =>
      current.map((item) => (item.transactionId === nextTransaction.transactionId ? nextTransaction : item))
    );
    setSelectedId(nextTransaction.transactionId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {toast && (
        <div className="fixed right-6 top-6 z-[60] rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md px-5 py-3.5 text-sm font-extrabold text-slate-800 shadow-2xl">
          {toast}
        </div>
      )}

      <section className="mb-8 border-b border-slate-100 pb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-450">Giao dịch bất động sản</p>
          </div>
          <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-900">
            {activeOnly ? "Bất động sản đang giao dịch" : "Lịch sử giao dịch"}
          </h1>
          <p className="mt-2 max-w-2xl text-xs font-semibold text-slate-500 leading-relaxed">
            Theo dõi từng bất động sản, hồ sơ, thanh toán và lịch sử xác nhận từ hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTransactions}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
        >
          Làm mới
        </button>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric icon={ReceiptText} label="Tổng giao dịch" value={summary.total} />
        <Metric icon={Clock3} label="Đang giao dịch" value={summary.active} />
        <Metric icon={CheckCircle2} label="Hoàn tất" value={summary.completed} />
        <Metric icon={Banknote} label="Tổng giá trị" value={formatVnd(summary.value)} />
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Đang tải giao dịch...
        </div>
      ) : detail ? (
        selected ? (
          <TransactionWorkspace transaction={selected} onUpdated={updateTransaction} showToast={showToast} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-sm font-bold text-slate-500">Không tìm thấy giao dịch.</p>
          </div>
        )
      ) : visibleTransactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            {activeOnly ? "Bạn chưa có bất động sản nào đang giao dịch." : "Bạn chưa có lịch sử giao dịch."}
          </p>
        </div>
      ) : (
        <TransactionList transactions={visibleTransactions} />
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 premium-shadow hover:scale-[1.02] hover:shadow-md transition-all duration-300">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
        <Icon className="h-5.5 w-5.5" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function TransactionList({ transactions }) {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {transactions.map((item) => (
        <article
          key={item.transactionId}
          className="rounded-2xl border border-slate-100 bg-white p-5 premium-shadow hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Building2 className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {item.propertyCode || item.transactionCode}
                </p>
                <h2 className="mt-1 line-clamp-2 text-sm font-black text-slate-900 leading-snug">
                  {item.propertyTitle || "Bất động sản"}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill status={item.status} />
                  <span className="text-xs font-semibold text-slate-400">{formatDate(item.transactionDate)}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <MiniMoney label="Tiền cọc" value={item.depositAmount} />
              <MiniMoney label="Còn lại" value={item.status === 'completed' ? "0 VNĐ" : formatVnd(item.remainingAmount)} />
            </div>
          </div>
          <Link
            to={`/customer/transactions/${item.transactionId}`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            Xem chi tiết
          </Link>
        </article>
      ))}
    </section>
  );
}

function MiniMoney({ label, value }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{typeof value === 'number' ? formatVnd(value) : value}</p>
    </div>
  );
}

function TransactionWorkspace({ transaction, onUpdated, showToast }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ cccdFront: null, cccdBack: null, residence: null });
  const [dealDate, setDealDate] = useState("");
  const [dealTime, setDealTime] = useState("");
  const [dealCalendarMonth, setDealCalendarMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const step = getStep(transaction.status);
  const allFilesReady = !!files.cccdFront && !!files.cccdBack && !!files.residence;
  const hasRefundBankInfo = !!user?.bankName && !!user?.bankAccountNumber && !!user?.bankAccountHolder;

  const runAction = async (action, successMessage) => {
    setSubmitting(true);
    try {
      const nextTransaction = await action();
      onUpdated(nextTransaction);
      showToast(successMessage);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || "Không thể cập nhật giao dịch");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPurchase = () =>
    runAction(async () => {
      const response = await api.patch(`/transactions/${transaction.transactionId}/confirm-purchase`);
      if (response.data.data?.status !== "documents_verified") {
        navigate("/customer/profile", {
          state: {
            returnTo: `/customer/transactions/${transaction.transactionId}`,
            message: "Cập nhật hồ sơ xác thực để hệ thống xác nhận trước khi thanh toán.",
          },
        });
      }
      return response.data.data;
    }, "Đã xác nhận giao dịch");

  const submitDocuments = () =>
    runAction(async () => {
      if (!files.cccdFront || !files.cccdBack || !files.residence) {
        throw new Error("Vui lòng tải lên 2 mặt CCCD và xác nhận cư trú");
      }
      
      const upload = async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/uploads/documents', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { type: 'customer-documents' } 
        });
        return res.data.data.url;
      };

      const cccdFrontUrl = await upload(files.cccdFront);
      const cccdBackUrl = await upload(files.cccdBack);
      const residenceUrl = await upload(files.residence);

      const response = await api.post(`/transactions/${transaction.transactionId}/documents`, null, {
        params: { cccdFrontUrl, cccdBackUrl, residenceUrl }
      });
      return response.data.data;
    }, "Đã gửi hồ sơ");

  const submitPayment = () =>
    runAction(async () => {
      if (!files.receipt) throw new Error("Vui lòng tải lên biên lai chuyển khoản");
      const fd = new FormData();
      fd.append('file', files.receipt);
      const uploadRes = await api.post('/uploads/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { type: 'payment-receipts' } 
      });
      const receiptUrl = uploadRes.data.data.url;

      const response = await api.patch(`/transactions/${transaction.transactionId}/payment-submitted?receiptUrl=${encodeURIComponent(receiptUrl)}`);
      return response.data.data;
    }, "Đã ghi nhận thanh toán, chờ hệ thống xác nhận");

  const scheduleDeal = () =>
    runAction(async () => {
      if (!dealDate || !dealTime) {
        throw new Error("Vui lòng chọn thời gian giao dịch trực tiếp");
      }
      const startTime = dealTime.includes(" - ") ? dealTime.split(" - ")[0] : dealTime;
      const response = await api.patch(`/transactions/${transaction.transactionId}/schedule-deal`, {
        scheduledAt: `${dealDate}T${startTime}:00`,
      });
      return response.data.data;
    }, "Đã đặt lịch giao dịch trực tiếp");

  const requestRefund = () =>
    runAction(async () => {
      if (!hasRefundBankInfo) {
        throw new Error("Vui lòng cập nhật thông tin tài khoản ngân hàng trong trang cá nhân trước khi yêu cầu hoàn cọc");
      }
      const response = await api.patch(`/transactions/${transaction.transactionId}/refund-request`);
      return response.data.data;
    }, "Đã gửi yêu cầu hoàn cọc");

  const confirmRefund = () =>
    runAction(async () => {
      const response = await api.patch(`/transactions/${transaction.transactionId}/confirm-refund`);
      return response.data.data;
    }, "Đã xác nhận đã nhận tiền cọc thành công");


  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Đã copy ${label}`);
    } catch {
      showToast(`Không thể copy ${label}`);
    }
  };

  return (
    <main className="rounded-3xl border border-slate-100 bg-white/90 backdrop-blur-xl premium-shadow overflow-hidden animate-scale-in">
      <div className="border-b border-slate-100 p-6 sm:p-8 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                {transaction.transactionCode}
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-905 leading-tight">
              {transaction.propertyTitle || "Bất động sản"}
            </h2>
            <p className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Môi giới phụ trách:</span>
              <span className="text-slate-800 font-bold">{transaction.brokerName || "Chưa cập nhật"}</span>
            </p>
          </div>
          <StatusPill status={transaction.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ValueBox icon={Banknote} label="Giá trị giao dịch" value={formatVnd(transaction.totalPrice)} />
          <ValueBox icon={CreditCard} label="Số tiền cọc" value={formatVnd(transaction.depositAmount)} />
          <ValueBox icon={Clock3} label="Còn lại" value={transaction.status === 'completed' ? "0 VNĐ" : formatVnd(transaction.remainingAmount)} />
        </div>
      </div>

      <div className="border-b border-slate-100 p-6 sm:p-8 bg-slate-50/20">
        <AnimatedTimeline 
          steps={[
            { id: 'customer_confirmed', label: 'Xác nhận' },
            { id: 'documents_submitted', label: 'Hồ sơ' },
            { id: 'payment_submitted', label: 'Cọc 10%' },
            { id: 'deposit_confirmed', label: 'Lịch giao dịch' },
            { id: 'deal_scheduled', label: 'Trực tiếp' },
            { id: 'completed', label: 'Hoàn tất' }
          ]} 
          currentStatus={transaction.status} 
          activeStepId={
            ['broker_confirmed', 'refund_requested', 'refunded', 'completed'].includes(transaction.status)
              ? 'completed'
              : transaction.status
          }
        />
      </div>

      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <PropertySnapshot transaction={transaction} />

          {/* Countdown timer if pending, confirmed or submitted */}
          {["pending", "customer_confirmed", "documents_submitted", "payment_submitted"].includes(transaction.status) && transaction.expiredAt && (
            <CountdownTimer expiredAt={transaction.expiredAt} />
          )}

          {transaction.status === "pending" && (
            <Panel icon={ShieldCheck} title="Xác nhận & Đồng ý hợp đồng">
              <p className="text-xs font-semibold text-slate-500 mb-5 leading-relaxed">
                Vui lòng xem kỹ nội dung hợp đồng đặt cọc mẫu dưới đây. Sau khi đồng ý, bạn có thể gửi hồ sơ bắt buộc cho hệ thống.
              </p>
              
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <button type="button" onClick={() => setViewDocument({ url: "/contracts/contract1.png", name: "Hợp đồng mẫu trang 1", type: "image" })} className="block border border-slate-150 rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                  <img src="/contracts/contract1.png" alt="Hợp đồng 1" className="w-full h-auto object-cover" />
                </button>
                <button type="button" onClick={() => setViewDocument({ url: "/contracts/contract2.png", name: "Hợp đồng mẫu trang 2", type: "image" })} className="block border border-slate-150 rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                  <img src="/contracts/contract2.png" alt="Hợp đồng 2" className="w-full h-auto object-cover" />
                </button>
                <button type="button" onClick={() => setViewDocument({ url: "/contracts/contract3.png", name: "Hợp đồng mẫu trang 3", type: "image" })} className="block border border-slate-150 rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                  <img src="/contracts/contract3.png" alt="Hợp đồng 3" className="w-full h-auto object-cover" />
                </button>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-amber-250 bg-amber-50/40 p-4 text-xs font-bold text-amber-900 cursor-pointer transition-all hover:bg-amber-50">
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-amber-600 rounded cursor-pointer" defaultChecked />
                Tôi đã đọc và đồng ý với các điều khoản trong hợp đồng để tiếp tục quy trình giao dịch.
              </label>
              <button
                type="button"
                onClick={confirmPurchase}
                disabled={submitting}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-850 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
              >
                Xác nhận và tiếp tục
              </button>
            </Panel>
          )}

          {transaction.status === "documents_submitted" && (
            <Panel icon={Upload} title="Chuẩn bị hồ sơ">
              <p className="text-sm font-medium text-slate-500">
                Tải lên đầy đủ CCCD và sổ hộ khẩu để hệ thống tạo thông tin trên hợp đồng điện tử.
              </p>
              
              {/* Show rejection reasons if any */}
              {transaction.documents?.some(d => d.status === "rejected") && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="text-sm font-bold text-red-800 mb-2">Hồ sơ bị từ chối:</h4>
                  <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                    {transaction.documents.filter(d => d.status === "rejected").map(d => (
                      <li key={d.documentId}>
                        <strong>{d.documentType}:</strong> {d.rejectReason || "Không hợp lệ"}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs font-bold text-red-600">Vui lòng tải lên lại các giấy tờ bị từ chối.</p>
                </div>
              )}
              <div className="mt-5 grid gap-4 md:grid-cols-2 max-w-lg">
                <UploadBox label="CCCD mặt trước" file={files.cccdFront} onChange={(file) => setFiles((current) => ({ ...current, cccdFront: file }))} />
                <UploadBox label="CCCD mặt sau" file={files.cccdBack} onChange={(file) => setFiles((current) => ({ ...current, cccdBack: file }))} />
                <UploadBox label="Sổ hộ khẩu hoặc xác nhận cư trú" file={files.residence} onChange={(file) => setFiles((current) => ({ ...current, residence: file }))} />
              </div>
              <button
                type="button"
                onClick={submitDocuments}
                disabled={!allFilesReady || submitting}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Gửi hồ sơ
              </button>
            </Panel>
          )}

          {transaction.status === "customer_confirmed" && (
            <Notice
              icon={FileClock}
              title="Hồ sơ khách hàng chưa được duyệt"
              description="Cập nhật hồ sơ cá nhân gồm CCCD hai mặt và xác nhận cư trú để hệ thống xác nhận trước khi thanh toán đặt cọc."
              tone="amber"
            />
          )}

          {(transaction.status === "documents_verified" || transaction.status === "payment_submitted") && (
            <PaymentPanel
              transaction={transaction}
              submitting={submitting}
              onCopy={copyValue}
              files={files}
              setFiles={setFiles}
              onSubmitPayment={submitPayment}
            />
          )}

          {transaction.status === "deposit_confirmed" && (
            <Panel icon={CalendarDays} title="Đặt lịch giao dịch trực tiếp">
              <p className="text-sm font-medium text-slate-500">
                Tiền cọc đã được hệ thống xác nhận. Chọn thời gian gặp môi giới để thanh toán phần còn lại trực tiếp với người bán.
              </p>
              <DealSchedulePicker
                currentMonth={dealCalendarMonth}
                selectedDate={dealDate}
                selectedTime={dealTime}
                onMonthChange={setDealCalendarMonth}
                onDateChange={(date) => {
                  setDealDate(toDateInputValue(date));
                  setDealTime("");
                }}
                onTimeChange={setDealTime}
              />
              <button
                type="button"
                onClick={scheduleDeal}
                disabled={submitting || !dealDate || !dealTime}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" />
                Đặt lịch giao dịch
              </button>
            </Panel>
          )}

          {transaction.status === "deal_scheduled" && (
            <Notice
              icon={Clock3}
              title="Đang chờ môi giới xác nhận"
              description="Sau buổi giao dịch trực tiếp, môi giới sẽ xác nhận người mua đã thanh toán phần còn lại và hoàn tất ủy quyền với người bán."
              tone="amber"
            />
          )}

          {transaction.status === "broker_confirmed" && (
            <Panel icon={Banknote} title="Yêu cầu hoàn cọc">
              <p className="text-sm font-medium text-slate-500">
                Môi giới đã xác nhận giao dịch trực tiếp thành công. Bạn có thể yêu cầu hoàn phần tiền cọc sau khi trừ hoa hồng.
              </p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Số tiền hoàn dự kiến: {formatVnd(transaction.refundableDeposit)}
              </div>
              {!hasRefundBankInfo && (
                <Link to="/customer/profile" className="mt-4 inline-flex text-sm font-black text-rose-700 hover:text-rose-800">
                  Cập nhật tài khoản ngân hàng để nhận hoàn cọc
                </Link>
              )}
              <button
                type="button"
                onClick={requestRefund}
                disabled={submitting || !hasRefundBankInfo}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Yêu cầu hoàn cọc
              </button>
            </Panel>
          )}

          {transaction.status === "refund_requested" && (
            <Notice
              icon={Clock3}
              title="Đang chờ hoàn cọc"
              description="Yêu cầu hoàn cọc của bạn đã được gửi thành công. Quản trị viên đang tiến hành kiểm tra hồ sơ giao dịch và chuyển khoản hoàn lại tiền cọc (sau khi trừ phí hoa hồng môi giới) cho bạn."
              tone="amber"
            />
          )}

          {transaction.status === "refunded" && (
            <Panel icon={CheckCircle2} title="Hệ thống đã hoàn cọc">
              <p className="text-sm font-medium text-slate-500 mb-4 leading-relaxed">
                Quản trị viên đã thực hiện hoàn trả tiền cọc thành công vào thông tin tài khoản ngân hàng của bạn. Vui lòng kiểm tra tài khoản của mình và bấm nút xác nhận dưới đây.
              </p>
              <button
                type="button"
                onClick={confirmRefund}
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận đã nhận tiền cọc
              </button>
            </Panel>
          )}

          {transaction.status === "completed" && (
            <Notice
              icon={CheckCircle2}
              title="Giao dịch đã hoàn tất"
              description="Hồ sơ pháp lý, tiền cọc và thanh toán đã được xác nhận hoàn tất thành công. Bất động sản đã chuyển sang trạng thái đã bán."
              tone="green"
            />
          )}


          {transaction.status === "cancelled" && (
            <Notice
              icon={FileClock}
              title="Giao dịch đã hủy"
              description="Giao dịch này không thành công và đã được đóng."
              tone="rose"
            />
          )}
        </section>

        <aside className="space-y-4">
          <TimelinePanel transaction={transaction} />
          <PaymentHistory payments={transaction.payments || []} />
          <DocumentList documents={transaction.documents || []} onView={setViewDocument} />
        </aside>
      </div>
      <DocumentViewerModal
        isOpen={!!viewDocument}
        onClose={() => setViewDocument(null)}
        documentUrl={viewDocument?.url}
        documentName={viewDocument?.name}
        documentType={viewDocument?.type}
      />
    </main>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[status] || statusStyles.pending}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function ValueBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md flex items-center gap-3.5">
      <span className="p-2.5 bg-slate-50 text-slate-500 rounded-xl shrink-0">
        <Icon className="h-5.5 w-5.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-base font-black text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

// StepBar removed in favor of AnimatedTimeline

function Panel({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 premium-shadow">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <Icon className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b border-slate-50 tracking-tight leading-snug">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function PropertySnapshot({ transaction }) {
  const isSold = transaction.status === "completed";
  const isLocked = ["deposit_confirmed", "deal_scheduled", "broker_confirmed"].includes(transaction.status);

  return (
    <div className="rounded-2xl border border-slate-150/60 bg-gradient-to-br from-slate-50 to-slate-100/30 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-100">
          <Building2 className="h-5.5 w-5.5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {transaction.propertyCode || "BĐS"}
            </p>
            {isSold && (
              <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-rose-700 border border-rose-100">Đã bán</span>
            )}
            {!isSold && isLocked && (
              <span className="rounded-md bg-amber-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-amber-700 border border-amber-100">Đang giao dịch</span>
            )}
          </div>
          <h3 className="mt-1.5 text-xl font-black text-slate-900 leading-tight">{transaction.propertyTitle}</h3>
          <p className="mt-2 text-xs font-semibold text-slate-450 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            {[propertyTypeLabels[transaction.propertyType] || transaction.propertyType, transaction.propertyDistrict, transaction.propertyProvince]
              .filter(Boolean)
              .join(" · ") || "Chưa cập nhật vị trí"}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ValueBox icon={Banknote} label="Giá BĐS" value={formatVnd(transaction.propertyPrice || transaction.totalPrice)} />
            <ValueBox icon={Square} label="Diện tích" value={transaction.propertyArea ? `${Number(transaction.propertyArea).toLocaleString("vi-VN")} m²` : "Chưa cập nhật"} />
            <ValueBox icon={CreditCard} label="Cọc 10%" value={formatVnd(transaction.depositAmount)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelinePanel({ transaction }) {
  const rows = [
    {
      label: "Lịch xem nhà",
      value: transaction.appointmentScheduledAt
        ? new Date(transaction.appointmentScheduledAt).toLocaleString("vi-VN")
        : "Không có dữ liệu",
      sub: transaction.appointmentStatus ? `Trạng thái: ${transaction.appointmentStatus}` : transaction.appointmentNote,
    },
    {
      label: "Lịch giao dịch",
      value: transaction.dealScheduleAt
        ? new Date(transaction.dealScheduleAt).toLocaleString("vi-VN")
        : "Chưa đặt lịch",
      sub: "Bên mua, bên bán và môi giới",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
        <Clock3 className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Lịch hẹn & giao dịch</h3>
      </div>
      <div className="space-y-3.5">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-100/60 bg-slate-50/60 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{row.label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{row.value}</p>
            {row.sub && <p className="mt-1 text-[10px] font-bold text-slate-450 leading-relaxed">{row.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommissionSplit({ transaction }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
        <Banknote className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Hoa hồng</h3>
      </div>
      <div className="space-y-2">
        <MoneyLine label="Tổng khấu trừ" value={transaction.commissionDeduction} />
        <MoneyLine label="Môi giới nhận 60%" value={transaction.brokerCommissionAmount} />
        <MoneyLine label="Công ty giữ 40%" value={transaction.companyCommissionAmount} />
      </div>
    </div>
  );
}

function MoneyLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/60 border border-slate-100/55 px-3.5 py-2.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-900">{formatVnd(value)}</span>
    </div>
  );
}

function UploadBox({ label, file, onChange }) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:bg-slate-100">
      {file ? <FileCheck2 className="h-8 w-8 text-emerald-600" /> : <Upload className="h-8 w-8 text-slate-400" />}
      <span className="mt-3 text-sm font-black text-slate-800">{label}</span>
      <span className="mt-1 max-w-full truncate text-xs font-bold text-slate-500">{file?.name || "Chọn file"}</span>
      <input type="file" className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

function DealSchedulePicker({ currentMonth, selectedDate, selectedTime, onMonthChange, onDateChange, onTimeChange }) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-950">
            Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
          </h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-950"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-black text-slate-400">
              {day}
            </div>
          ))}
          {getDaysInMonth(currentMonth).map((date, index) => {
            const value = toDateInputValue(date);
            const disabled = isPastDate(date);
            const active = selectedDate === value;
            return (
              <button
                key={date ? value : `empty-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => onDateChange(date)}
                className={`aspect-square rounded-lg text-sm font-black transition ${
                  !date ? "invisible" : ""
                } ${
                  active
                    ? "bg-slate-950 text-white"
                    : disabled
                      ? "cursor-not-allowed bg-white text-slate-300"
                      : "bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                {date?.getDate() || ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-950">Khung giờ giao dịch</h4>
        {!selectedDate ? (
          <p className="mt-4 text-sm font-bold text-slate-500">Chọn ngày trước để xem khung giờ.</p>
        ) : (
          <div className="mt-4 space-y-5">
            <TimeSlotGroup label="Buổi sáng" slots={dealMorningSlots} selectedTime={selectedTime} onTimeChange={onTimeChange} />
            <TimeSlotGroup label="Buổi chiều" slots={dealAfternoonSlots} selectedTime={selectedTime} onTimeChange={onTimeChange} />
          </div>
        )}
      </div>
    </div>
  );
}

function TimeSlotGroup({ label, slots, selectedTime, onTimeChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onTimeChange(slot)}
            className={`h-10 rounded-lg border px-3 text-sm font-black transition ${
              selectedTime === slot
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaymentPanel({ transaction, submitting, onCopy, files, setFiles, onSubmitPayment }) {
  const [checkedItems, setCheckedItems] = useState({ qr: false, account: false, content: false });

  const transferContent = `${transaction.transactionCode} ${transaction.customerName || ""}`.trim();
  const isSubmitted = transaction.status === "payment_submitted";

  const allChecked = checkedItems.qr && checkedItems.account && checkedItems.content;

  return (
    <Panel icon={QrCode} title="Thanh toán chuyển khoản">
      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center relative group cursor-pointer" onClick={() => setCheckedItems(prev => ({...prev, qr: !prev.qr}))}>
          <div className="absolute top-2 right-2">
             <input type="checkbox" checked={checkedItems.qr} onChange={() => {}} className="w-5 h-5 accent-slate-900 pointer-events-none" />
          </div>
          <div className="mx-auto flex aspect-square w-full max-w-44 items-center justify-center rounded-lg bg-white shadow-inner transition-transform group-hover:scale-105">
            <QrCode className="h-28 w-28 text-slate-950" />
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">Quét QR đặt cọc</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={checkedItems.account} onChange={() => setCheckedItems(prev => ({...prev, account: !prev.account}))} className="w-5 h-5 accent-slate-900 cursor-pointer" />
            <div className="flex-1">
              <CopyLine label="Số tài khoản" value={`${bankInfo.accountNumber} - ${bankInfo.bank} (${bankInfo.accountName})`} onCopy={onCopy} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={checkedItems.content} onChange={() => setCheckedItems(prev => ({...prev, content: !prev.content}))} className="w-5 h-5 accent-slate-900 cursor-pointer" />
            <div className="flex-1">
              <CopyLine label="Nội dung CK" value={transferContent} onCopy={onCopy} />
            </div>
          </div>
          <div className="flex items-center gap-3 pl-8">
            <div className="flex-1">
              <CopyLine label="Số tiền" value={formatVnd(transaction.depositAmount)} onCopy={onCopy} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <label className="block text-sm font-bold text-slate-700 mb-2">Biên lai chuyển khoản <span className="text-red-500">*</span></label>
        <div className="max-w-xs">
          <UploadBox label="Tải lên biên lai" file={files?.receipt} onChange={(file) => setFiles((current) => ({ ...current, receipt: file }))} />
        </div>
      </div>
      <button
        type="button"
        onClick={onSubmitPayment}
        disabled={submitting || isSubmitted || !files?.receipt || !allChecked}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitted ? "Đang chờ hệ thống xác nhận" : "Tôi đã chuyển khoản"}
      </button>
    </Panel>
  );
}

function CopyLine({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-950"
      >
        <ClipboardCopy className="h-4 w-4" />
      </button>
    </div>
  );
}

function Notice({ icon: Icon, title, description, tone }) {
  const styles = {
    amber: "border-amber-100 border-l-4 border-l-amber-500 bg-amber-50/40 text-amber-900",
    green: "border-emerald-100 border-l-4 border-l-emerald-500 bg-emerald-50/40 text-emerald-900",
    rose: "border-rose-100 border-l-4 border-l-rose-500 bg-rose-50/40 text-rose-900",
  };

  return (
    <div className={`rounded-xl border p-5 sm:p-6 shadow-sm transition-all duration-300 ${styles[tone]}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/95 text-slate-800 shadow-sm border border-slate-100">
          <Icon className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black tracking-tight leading-snug">{title}</h3>
          <p className="mt-1.5 text-xs font-semibold opacity-90 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ payments }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
        <Landmark className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Lịch sử thanh toán</h3>
      </div>
      <div className="space-y-3">
        {payments.length === 0 ? (
          <p className="text-xs font-bold text-slate-450 italic py-2">Chưa có khoản thanh toán.</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.paymentId} className="rounded-xl border border-slate-100/60 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{formatVnd(payment.amount)}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-450">
                    {methodLabels[payment.paymentMethod] || payment.paymentMethod || "Chưa cập nhật"} · {formatDate(payment.paymentDate)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[9px] font-extrabold text-slate-700 border border-slate-200">
                  {paymentStatusLabels[payment.paymentStatus] || payment.paymentStatus}
                </span>
              </div>
              {payment.confirmedByName && (
                <p className="mt-2 text-[10px] font-bold text-emerald-700">Xác nhận bởi {payment.confirmedByName}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getDocumentTypeName(type) {
  switch (type) {
    case 'cccd': return 'Căn cước công dân';
    case 'cccd_front': return 'CCCD mặt trước';
    case 'cccd_back': return 'CCCD mặt sau';
    case 'household': return 'Sổ hộ khẩu / Xác nhận cư trú';
    case 'residence': return 'Sổ hộ khẩu / Xác nhận cư trú';
    case 'marriage': return 'Giấy xác nhận tình trạng hôn nhân';
    case 'receipt': return 'Biên lai chuyển khoản';
    case 'contract': return 'Hợp đồng giao dịch';
    default: return 'Tài liệu đính kèm';
  }
}

function DocumentList({ documents, onView }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
        <FileCheck2 className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Hồ sơ đã gửi</h3>
      </div>
      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-xs font-bold text-slate-450 italic py-2">Chưa gửi hồ sơ.</p>
        ) : (
          documents.map((document) => (
            <button
              type="button"
              key={document.documentId}
              onClick={() => onView({
                url: document.url,
                name: document.fileName || getDocumentTypeName(document.documentType),
                type: document.url?.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
              })}
              className="block w-full rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:shadow-sm cursor-pointer"
            >
              {getDocumentTypeName(document.documentType)}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
