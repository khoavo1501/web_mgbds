import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Banknote,
  Building2,
  CheckCircle2,
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
} from "lucide-react";
import api from "../../services/api";
import AnimatedTimeline from "../../components/AnimatedTimeline";

const activeStatuses = new Set([
  "pending",
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
  submitted: "Chờ admin xác nhận",
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

const getStep = (status) => {
  if (status === "pending") return 1;
  if (status === "customer_confirmed") return 2;
  if (status === "documents_submitted") return 2; // Step 2 is active, but we show payment
  if (status === "payment_submitted") return 3;
  if (status === "deposit_confirmed" || status === "completed") return 4;
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed right-6 top-6 z-[60] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xl">
          {toast}
        </div>
      )}

      <section className="mb-6 border-b border-slate-200 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Giao dịch bất động sản</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {activeOnly ? "Bất động sản đang giao dịch" : "Lịch sử giao dịch"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Theo dõi từng bất động sản, hồ sơ, thanh toán và lịch sử xác nhận từ hệ thống.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTransactions}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function TransactionList({ transactions }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {transactions.map((item) => (
        <article
          key={item.transactionId}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {item.propertyCode || item.transactionCode}
              </p>
              <h2 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">
                {item.propertyTitle || "Bất động sản"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                <span className="text-xs font-bold text-slate-500">{formatDate(item.transactionDate)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <MiniMoney label="Cọc" value={item.depositAmount} />
            <MiniMoney label="Còn lại" value={item.status === 'completed' ? "0 VNĐ" : formatVnd(item.remainingAmount)} />
          </div>
          <Link
            to={`/customer/transactions/${item.transactionId}`}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white hover:bg-slate-800"
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
  const [files, setFiles] = useState({ cccd: null, household: null });
  const [dealDate, setDealDate] = useState("");
  const [dealTime, setDealTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const step = getStep(transaction.status);
  const allFilesReady = !!files.cccd && !!files.household;

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
      return response.data.data;
    }, "Đã xác nhận giao dịch");

  const submitDocuments = () =>
    runAction(async () => {
      if (!files.cccd || !files.household) {
        throw new Error("Vui lòng tải lên CCCD và Sổ hộ khẩu");
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

      const cccdUrl = await upload(files.cccd);
      const householdUrl = await upload(files.household);

      const response = await api.post(`/transactions/${transaction.transactionId}/documents`, null, {
        params: { cccdUrl, householdUrl }
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
    }, "Đã ghi nhận thanh toán, chờ admin xác nhận");

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Đã copy ${label}`);
    } catch {
      showToast(`Không thể copy ${label}`);
    }
  };

  return (
    <main className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              {transaction.transactionCode}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {transaction.propertyTitle || "Bất động sản"}
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              Môi giới phụ trách: {transaction.brokerName || "Chưa cập nhật"}
            </p>
          </div>
          <StatusPill status={transaction.status} />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <ValueBox icon={Banknote} label="Giá trị giao dịch" value={formatVnd(transaction.totalPrice)} />
          <ValueBox icon={CreditCard} label="Số tiền cọc" value={formatVnd(transaction.depositAmount)} />
          <ValueBox icon={Clock3} label="Còn lại" value={transaction.status === 'completed' ? "0 VNĐ" : formatVnd(transaction.remainingAmount)} />
        </div>
      </div>

      <div className="border-b border-slate-100 p-6">
        <AnimatedTimeline 
          steps={[
            { id: 'customer_confirmed', label: 'Xác nhận' },
            { id: 'documents_submitted', label: 'Hồ sơ' },
            { id: 'payment_submitted', label: 'Cọc 10%' },
            { id: 'completed', label: 'Hoàn tất' }
          ]} 
          currentStatus={transaction.status} 
          activeStepId={
            ['deposit_confirmed', 'completed'].includes(transaction.status)
              ? 'completed'
              : transaction.status
          }
        />
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <PropertySnapshot transaction={transaction} />

          {/* Countdown timer if pending, confirmed or submitted */}
          {["pending", "customer_confirmed", "documents_submitted", "payment_submitted"].includes(transaction.status) && transaction.expiredAt && (
            <CountdownTimer expiredAt={transaction.expiredAt} />
          )}

          {transaction.status === "pending" && (
            <Panel icon={ShieldCheck} title="Xác nhận & Đồng ý hợp đồng">
              <p className="text-sm font-medium text-slate-500 mb-4">
                Vui lòng xem kỹ nội dung hợp đồng đặt cọc mẫu dưới đây. Sau khi đồng ý, bạn có thể gửi hồ sơ bắt buộc cho hệ thống.
              </p>
              
              <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <a href="/contracts/contract1.png" target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  <img src="/contracts/contract1.png" alt="Hợp đồng 1" className="w-full h-auto object-cover" />
                </a>
                <a href="/contracts/contract2.png" target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  <img src="/contracts/contract2.png" alt="Hợp đồng 2" className="w-full h-auto object-cover" />
                </a>
                <a href="/contracts/contract3.png" target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  <img src="/contracts/contract3.png" alt="Hợp đồng 3" className="w-full h-auto object-cover" />
                </a>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900 cursor-pointer">
                <input type="checkbox" className="mt-1" defaultChecked />
                Tôi đã đọc và đồng ý với các điều khoản trong hợp đồng để tiếp tục quy trình giao dịch.
              </label>
              <button
                type="button"
                onClick={confirmPurchase}
                disabled={submitting}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Xác nhận và tiếp tục
              </button>
            </Panel>
          )}

          {["customer_confirmed", "documents_submitted"].includes(transaction.status) && (
            <Panel icon={Upload} title="Chuẩn bị hồ sơ">
              <p className="text-sm font-medium text-slate-500">
                Upload đầy đủ CCCD và Sổ hộ khẩu của bạn để hệ thống tạo thông tin trên hợp đồng điện tử.
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
                <UploadBox label="Căn cước công dân (Bản gốc)" file={files.cccd} onChange={(file) => setFiles((current) => ({ ...current, cccd: file }))} />
                <UploadBox label="Sổ hộ khẩu (Hoặc Xác nhận cư trú)" file={files.household} onChange={(file) => setFiles((current) => ({ ...current, household: file }))} />
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

          {(transaction.status === "documents_submitted" || transaction.status === "payment_submitted") && (
            <PaymentPanel
              transaction={transaction}
              submitting={submitting}
              onCopy={copyValue}
              files={files}
              setFiles={setFiles}
              onSubmitPayment={submitPayment}
            />
          )}

          {(transaction.status === "deposit_confirmed" || transaction.status === "completed") && (
            <Notice
              icon={CheckCircle2}
              title="Giao dịch đã hoàn tất"
              description="Hồ sơ pháp lý và tiền cọc của bạn đã được admin xác nhận thành công. Bất động sản đã chuyển sang trạng thái đã bán."
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
          <CommissionSplit transaction={transaction} />
          <PaymentHistory payments={transaction.payments || []} />
          <DocumentList documents={transaction.documents || []} />
        </aside>
      </div>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

// StepBar removed in favor of AnimatedTimeline

function Panel({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              {transaction.propertyCode || "BĐS"}
            </p>
            {isSold && (
              <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">Đã bán</span>
            )}
            {!isSold && isLocked && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">Đang giao dịch</span>
            )}
          </div>
          <h3 className="mt-1 text-xl font-black text-slate-950">{transaction.propertyTitle}</h3>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {[propertyTypeLabels[transaction.propertyType] || transaction.propertyType, transaction.propertyDistrict, transaction.propertyProvince]
              .filter(Boolean)
              .join(" · ") || "Chưa cập nhật vị trí"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-black text-slate-950">Lịch hẹn & giao dịch</h3>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">{row.label}</p>
            <p className="mt-1 text-sm font-black text-slate-950">{row.value}</p>
            {row.sub && <p className="mt-1 text-xs font-bold text-slate-500">{row.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommissionSplit({ transaction }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-black text-slate-950">Hoa hồng</h3>
      </div>
      <div className="mt-4 space-y-2">
        <MoneyLine label="Tổng khấu trừ" value={transaction.commissionDeduction} />
        <MoneyLine label="Môi giới nhận 60%" value={transaction.brokerCommissionAmount} />
        <MoneyLine label="Công ty giữ 40%" value={transaction.companyCommissionAmount} />
      </div>
    </div>
  );
}

function MoneyLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-950">{formatVnd(value)}</span>
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
        {isSubmitted ? "Đang chờ admin xác nhận" : "Tôi đã chuyển khoản"}
      </button>
    </Panel>
  );
}

function CountdownTimer({ expiredAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiredAt).getTime();
      const diff = expiration - now;

      if (diff <= 0) {
        setTimeLeft("Đã hết hạn");
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock3 className="h-5 w-5 text-red-600" />
        <div>
          <h4 className="text-sm font-bold text-red-800">Thời gian giữ chỗ còn lại</h4>
          <p className="text-xs text-red-600 font-medium mt-0.5">Vui lòng hoàn thành hồ sơ và thanh toán trước khi hết hạn.</p>
        </div>
      </div>
      <div className="text-2xl font-black text-red-700 tracking-wider font-mono bg-white px-4 py-2 rounded-lg border border-red-100 shadow-sm">
        {timeLeft}
      </div>
    </div>
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
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };

  return (
    <div className={`rounded-lg border p-6 ${styles[tone]}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-2 text-sm font-bold opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ payments }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-black text-slate-950">Lịch sử thanh toán</h3>
      </div>
      <div className="mt-4 space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm font-bold text-slate-500">Chưa có khoản thanh toán.</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.paymentId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{formatVnd(payment.amount)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {methodLabels[payment.paymentMethod] || payment.paymentMethod || "Chưa cập nhật"} · {formatDate(payment.paymentDate)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                  {paymentStatusLabels[payment.paymentStatus] || payment.paymentStatus}
                </span>
              </div>
              {payment.confirmedByName && (
                <p className="mt-2 text-xs font-bold text-emerald-700">Xác nhận bởi {payment.confirmedByName}</p>
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
    case 'household': return 'Sổ hộ khẩu / Xác nhận cư trú';
    case 'marriage': return 'Giấy xác nhận tình trạng hôn nhân';
    case 'receipt': return 'Biên lai chuyển khoản';
    case 'contract': return 'Hợp đồng giao dịch';
    default: return 'Tài liệu đính kèm';
  }
}

function DocumentList({ documents }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-black text-slate-950">Hồ sơ đã gửi</h3>
      </div>
      <div className="mt-4 space-y-2">
        {documents.length === 0 ? (
          <p className="text-sm font-bold text-slate-500">Chưa gửi hồ sơ.</p>
        ) : (
          documents.map((document) => (
            <a
              key={document.documentId}
              href={document.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {getDocumentTypeName(document.documentType)}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
