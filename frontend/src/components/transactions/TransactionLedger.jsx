import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  CreditCard,
  Download,
  FileCheck2,
  Mail,
  Phone,
  QrCode,
  ReceiptText,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import api from "../../services/api";

const statusLabels = {
  pending: "Chờ khách xác nhận",
  customer_confirmed: "Đã xác nhận mua",
  documents_submitted: "Chờ kiểm tra hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Đang xác minh thanh toán",
  deposit_confirmed: "Đã xác nhận cọc",
  commitment_signed: "Đã ký cam kết",
  final_payment_submitted: "Chờ xác nhận thanh toán",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  customer_confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  documents_submitted: "bg-amber-50 text-amber-800 ring-amber-200",
  documents_verified: "bg-sky-50 text-sky-700 ring-sky-200",
  payment_submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  deposit_confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  commitment_signed: "bg-teal-50 text-teal-700 ring-teal-200",
  final_payment_submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

const paymentMethodLabels = {
  transfer: "Chuyển khoản",
  bank_transfer: "Chuyển khoản",
  cash: "Tiền mặt",
};

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function TransactionLedger({
  transactions,
  loading,
  title,
  description,
  emptyText,
  viewer = "customer",
  enableCustomerFlow = false,
  initialPropertyId,
}) {
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!initialPropertyId || selected || transactions.length === 0) return;
    const match = transactions.find((item) => String(item.propertyId) === String(initialPropertyId));
    if (match) setSelected(match);
  }, [initialPropertyId, selected, transactions]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const grouped = useMemo(() => {
    const map = transactions.reduce((acc, item) => {
      const key = item.propertyId || item.propertyCode || "unknown";
      if (!acc[key]) {
        acc[key] = {
          propertyId: item.propertyId,
          propertyCode: item.propertyCode,
          propertyTitle: item.propertyTitle || "Bất động sản",
          rows: [],
        };
      }
      acc[key].rows.push(item);
      return acc;
    }, {});

    return Object.values(map);
  }, [transactions]);

  const summary = useMemo(
    () => ({
      total: transactions.length,
      active: transactions.filter((item) => item.status === "pending" || item.status === "deposit_confirmed").length,
      completed: transactions.filter((item) => item.status === "completed").length,
      value: transactions.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    }),
    [transactions]
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-[60] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xl">
          {toast}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Giao dịch bất động sản</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">{description}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Tổng giao dịch" value={summary.total} icon={ReceiptText} tone="dark" />
        <Metric label="Đang giao dịch" value={summary.active} icon={Clock3} tone="amber" />
        <Metric label="Hoàn tất" value={summary.completed} icon={CheckCircle2} tone="green" />
        <Metric label="Tổng giá trị" value={formatVnd(summary.value)} icon={Banknote} tone="slate" />
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Đang tải giao dịch...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-sm font-bold text-slate-500">{emptyText}</p>
        </div>
      ) : (
        <section className="space-y-5">
          {grouped.map((group) => (
            <article key={group.propertyId || group.propertyCode} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">{group.propertyCode || "Không có mã BĐS"}</p>
                  <h2 className="truncate text-base font-black text-slate-950">{group.propertyTitle}</h2>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.rows.map((item) => (
                  <button
                    key={item.transactionId}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_130px]"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.transactionCode}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.transactionDate)}
                      </p>
                    </div>
                    <PersonBlock
                      label={viewer === "broker" ? "Khách hàng" : "Môi giới"}
                      name={viewer === "broker" ? item.customerName : item.brokerName}
                      sub={viewer === "broker" ? item.customerPhone || item.customerEmail : item.brokerEmail}
                    />
                    <MoneyBlock label="Đã thanh toán/cọc" value={formatVnd(item.depositAmount)} />
                    <MoneyBlock label="Còn lại" value={formatVnd(item.remainingAmount)} muted />
                    <div className="flex items-center lg:justify-end">
                      <StatusPill status={item.status} />
                    </div>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {selected && (
        enableCustomerFlow &&
        viewer === "customer" &&
        ["pending", "customer_confirmed", "documents_submitted", "documents_verified", "payment_submitted", "deposit_confirmed"].includes(selected.status) ? (
          <CustomerDealFlow transaction={selected} onClose={() => setSelected(null)} showToast={showToast} />
        ) : (
          <TransactionDetail transaction={selected} viewer={viewer} onClose={() => setSelected(null)} />
        )
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }) {
  const tones = {
    dark: "bg-slate-950 text-white",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusStyles[status] || statusStyles.pending}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function PersonBlock({ label, name, sub }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{name || "N/A"}</p>
      {sub && <p className="mt-0.5 text-xs font-bold text-slate-500">{sub}</p>}
    </div>
  );
}

function MoneyBlock({ label, value, muted }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${muted ? "text-slate-600" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function TransactionDetail({ transaction, viewer, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">{transaction.transactionCode}</p>
            <h2 className="text-2xl font-black text-slate-950">{transaction.propertyTitle}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{transaction.propertyCode || "Không có mã BĐS"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <DetailCard label="Tổng giá trị" value={formatVnd(transaction.totalPrice)} icon={Banknote} />
          <DetailCard label="Đã thanh toán/cọc" value={formatVnd(transaction.depositAmount)} icon={CreditCard} />
          <DetailCard label="Còn lại" value={formatVnd(transaction.remainingAmount)} icon={Clock3} />
        </div>

        <div className="grid gap-4 border-t border-slate-100 p-6 md:grid-cols-2">
          <InfoLine icon={CalendarDays} label="Ngày giao dịch" value={formatDate(transaction.transactionDate)} />
          <InfoLine icon={CreditCard} label="Hình thức thanh toán" value={paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod || "N/A"} />
          <InfoLine icon={UserRound} label={viewer === "broker" ? "Khách hàng" : "Môi giới"} value={viewer === "broker" ? transaction.customerName : transaction.brokerName} />
          <InfoLine icon={Mail} label="Email" value={viewer === "broker" ? transaction.customerEmail : transaction.brokerEmail} />
          {viewer === "broker" && <InfoLine icon={Phone} label="Số điện thoại" value={transaction.customerPhone || "N/A"} />}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Trạng thái</p>
            <StatusPill status={transaction.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-slate-800">{value || "N/A"}</p>
      </div>
    </div>
  );
}

function CustomerDealFlow({ transaction, onClose, showToast }) {
  const [current, setCurrent] = useState(transaction);
  const [docs, setDocs] = useState({ cccd: null, household: null, marriage: null });
  const [submitting, setSubmitting] = useState(false);

  const stepByStatus = {
    pending: 1,
    customer_confirmed: 2,
    documents_submitted: 3,
    documents_verified: 4,
    payment_submitted: 4,
    deposit_confirmed: 5,
    completed: 5,
  };
  const step = stepByStatus[current.status] || 1;

  const allDocsReady = docs.cccd && docs.household && docs.marriage;

  const handleDownload = (name) => {
    const content = `%PDF-1.1\n1 0 obj <<>> endobj\ntrailer <<>>\n%% ${name} - ${current.transactionCode}`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}-${current.transactionCode}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Đã tải mẫu ${name}`);
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã copy ${label}`);
    } catch {
      showToast(`Không copy được ${label}`);
    }
  };

  const confirmPurchase = async () => {
    setSubmitting(true);
    try {
      const response = await api.patch(`/transactions/${current.transactionId}/confirm-purchase`);
      setCurrent(response.data.data);
      showToast("Đã xác nhận mua");
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể xác nhận giao dịch");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDocuments = async () => {
    if (!allDocsReady) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cccd", docs.cccd);
      formData.append("household", docs.household);
      formData.append("marriage", docs.marriage);
      const response = await api.post(`/transactions/${current.transactionId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrent(response.data.data);
      showToast("Đã gửi hồ sơ");
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể gửi hồ sơ");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    setSubmitting(true);
    try {
      const response = await api.patch(`/transactions/${current.transactionId}/payment-submitted`);
      setCurrent(response.data.data);
      showToast("Đã ghi nhận yêu cầu xác minh thanh toán");
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể gửi xác nhận thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">{current.transactionCode}</p>
            <h2 className="text-2xl font-black text-slate-950">Tiến hành giao dịch mua BĐS</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{current.propertyTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-5">
          <div className="grid gap-3 md:grid-cols-5">
            {[
              "Xác nhận GD",
              "Chuẩn bị hồ sơ",
              "Kiểm tra hồ sơ",
              "Thanh toán",
              "Hoàn tất",
            ].map((label, index) => (
              <div
                key={label}
                className={`rounded-lg border px-3 py-3 ${
                  step >= index + 1 ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <p className="text-[11px] font-black uppercase tracking-wider">Bước {index + 1}</p>
                <p className="mt-1 text-sm font-black">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div>
                <h3 className="text-xl font-black text-slate-950">Xác nhận giao dịch</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Kiểm tra lại thông tin BĐS và chọn đồng ý mua để chuyển sang bước chuẩn bị hồ sơ.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <DetailCard label="Giá trị giao dịch" value={formatVnd(current.totalPrice)} icon={Banknote} />
                  <DetailCard label="Số tiền đặt cọc" value={formatVnd(current.depositAmount)} icon={CreditCard} />
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-black text-amber-900">Điều khoản xác nhận</p>
                <label className="mt-4 flex items-start gap-3 text-sm font-bold text-amber-900">
                  <input type="checkbox" className="mt-1" defaultChecked />
                  Tôi đồng ý MUA bất động sản này và tiếp tục quy trình giao dịch.
                </label>
                <button
                  onClick={confirmPurchase}
                  disabled={submitting}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  Xác nhận và tiếp tục
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-black text-slate-950">Chuẩn bị hồ sơ</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Tải các mẫu PDF hệ thống cung cấp, sau đó upload đủ 3 mục bắt buộc.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {["Phiếu yêu cầu giao dịch", "Mẫu xác nhận thông tin", "Mẫu cam kết thanh toán"].map((name) => (
                  <button
                    key={name}
                    onClick={() => handleDownload(name)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                  >
                    <span className="text-sm font-black text-slate-800">{name}</span>
                    <Download className="h-4 w-4 text-slate-500" />
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <UploadBox label="CCCD" onChange={(file) => setDocs((current) => ({ ...current, cccd: file }))} file={docs.cccd} />
                <UploadBox label="Sổ hộ khẩu" onChange={(file) => setDocs((current) => ({ ...current, household: file }))} file={docs.household} />
                <UploadBox label="Giấy xác nhận hôn nhân" onChange={(file) => setDocs((current) => ({ ...current, marriage: file }))} file={docs.marriage} />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!allDocsReady}
                  onClick={submitDocuments}
                  className="flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Gửi hồ sơ
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-amber-950">Chờ admin kiểm tra hồ sơ</h3>
                  <p className="mt-2 text-sm font-bold text-amber-800">
                    Hồ sơ đã được gửi. Khi admin xác minh hợp lệ, giao dịch sẽ tự chuyển sang bước thanh toán.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border-8 border-white bg-white shadow-inner">
                  <QrCode className="h-36 w-36 text-slate-950" />
                </div>
                <p className="mt-4 text-sm font-black text-slate-900">QR thanh toán đặt cọc</p>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">Thanh toán chuyển khoản</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Chuyển khoản theo thông tin dưới đây, sau đó bấm “Tôi đã chuyển khoản”.
                </p>
                <div className="mt-5 space-y-3">
                  <CopyLine label="Ngân hàng" value="MGBDS Bank" onCopy={handleCopy} />
                  <CopyLine label="Số tài khoản" value="190020262225" onCopy={handleCopy} />
                  <CopyLine label="Chủ tài khoản" value="CONG TY MGBDS" onCopy={handleCopy} />
                  <CopyLine label="Nội dung CK" value={`${current.transactionCode} ${current.customerName || ""}`} onCopy={handleCopy} />
                  <CopyLine label="Số tiền" value={formatVnd(current.depositAmount)} onCopy={handleCopy} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={submitPayment}
                    disabled={submitting || current.status === "payment_submitted"}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {current.status === "payment_submitted" ? "Đang xác minh" : "Tôi đã chuyển khoản"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-lg bg-gradient-to-br from-sky-600 to-emerald-600 p-8 text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h3 className="mt-6 text-3xl font-black">Giao dịch thành công!</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SuccessLine label="Mã giao dịch" value={current.transactionCode} />
                <SuccessLine label="Ngày giao dịch" value={formatDate(current.transactionDate)} />
                <SuccessLine label="Giá trị" value={formatVnd(current.totalPrice)} />
                <SuccessLine label="Trạng thái" value={current.status === "completed" ? "Đã bán" : "Đã xác nhận cọc"} />
              </div>
              <button
                onClick={onClose}
                className="mt-8 rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadBox({ label, file, onChange }) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:bg-slate-100">
      {file ? <FileCheck2 className="h-8 w-8 text-emerald-600" /> : <Upload className="h-8 w-8 text-slate-400" />}
      <span className="mt-3 text-sm font-black text-slate-800">{label}</span>
      <span className="mt-1 max-w-full truncate text-xs font-bold text-slate-500">{file?.name || "Chọn file bất kỳ"}</span>
      <input type="file" className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

function CopyLine({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
      </div>
      <button onClick={() => onCopy(value, label)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-950">
        <ClipboardCopy className="h-4 w-4" />
      </button>
    </div>
  );
}

function SuccessLine({ label, value }) {
  return (
    <div className="rounded-lg bg-white/15 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
