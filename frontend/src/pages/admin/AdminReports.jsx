import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Download,
  FileBarChart,
  Loader2,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "../../services/api";

const statusLabels = {
  pending: "Chờ khách xác nhận",
  customer_confirmed: "Đã xác nhận mua",
  contract_agreed: "Đã đồng ý hợp đồng",
  documents_submitted: "Chờ duyệt hồ sơ",
  documents_verified: "Hồ sơ hợp lệ",
  payment_submitted: "Chờ xác nhận cọc",
  deposit_confirmed: "Đã cọc",
  commitment_signed: "Đã ký cam kết",
  deal_scheduled: "Đã đặt lịch giao dịch",
  broker_confirmed: "Môi giới đã xác nhận",
  refund_requested: "Yêu cầu hoàn cọc",
  refunded: "Đã hoàn cọc",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
  paid: "Đã chi",
};

const receivedDepositStatuses = new Set([
  "payment_submitted",
  "deposit_confirmed",
  "commitment_signed",
  "deal_scheduled",
  "broker_confirmed",
  "refund_requested",
  "refunded",
  "completed",
]);

const activeCommissionStatuses = new Set([
  "deposit_confirmed",
  "commitment_signed",
  "deal_scheduled",
  "broker_confirmed",
  "refund_requested",
  "refunded",
  "completed",
]);

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("vi-VN");
};

const asNumber = (value) => Number(value || 0);

const csvHeaders = [
  "nhom_bao_cao",
  "chi_tieu",
  "ma",
  "noi_dung",
  "doi_tuong",
  "trang_thai",
  "tien_thu",
  "tien_chi",
  "loi_nhuan",
  "gia_tri_giao_dich",
  "ghi_chu",
  "ngay",
];

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const toCsv = (rows) =>
  [
    csvHeaders.map(escapeCsv).join(","),
    ...rows.map((row) => csvHeaders.map((key) => escapeCsv(row[key])).join(",")),
  ].join("\n");

const downloadCsv = (filename, rows) => {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function AdminReports() {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyRes, transactionRes, commissionRes, userRes] = await Promise.all([
        api.get("/properties?size=500"),
        api.get("/transactions"),
        api.get("/commissions"),
        api.get("/admin/users"),
      ]);
      setProperties(propertyRes.data.success ? propertyRes.data.data.content || [] : []);
      setTransactions(transactionRes.data.success ? transactionRes.data.data || [] : []);
      setCommissions(commissionRes.data.success ? commissionRes.data.data || [] : []);
      setUsers(userRes.data.success ? userRes.data.data || [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const report = useMemo(() => {
    const completedTransactions = transactions.filter((item) => item.status === "completed");
    const receivedTransactions = transactions.filter((item) => receivedDepositStatuses.has(item.status));
    const commissionTransactions = transactions.filter((item) => activeCommissionStatuses.has(item.status));
    const paidRefunds = transactions.filter((item) => item.status === "refunded");
    const pendingRefunds = transactions.filter((item) => item.status === "refund_requested");
    const pendingDeposits = transactions.filter((item) => item.status === "payment_submitted");

    const depositReceived = receivedTransactions.reduce((sum, item) => sum + asNumber(item.depositAmount), 0);
    const depositPending = pendingDeposits.reduce((sum, item) => sum + asNumber(item.depositAmount), 0);
    const refundPaid = paidRefunds.reduce((sum, item) => sum + asNumber(item.refundableDeposit), 0);
    const refundPending = pendingRefunds.reduce((sum, item) => sum + asNumber(item.refundableDeposit), 0);

    const brokerCommissionFromList = commissions.reduce((sum, item) => sum + asNumber(item.brokerAmount || item.amount), 0);
    const companyCommissionFromList = commissions.reduce((sum, item) => sum + asNumber(item.companyAmount), 0);
    const totalCommissionFromList = commissions.reduce(
      (sum, item) => sum + asNumber(item.totalCommissionAmount || item.amount),
      0
    );

    const brokerCommission =
      commissions.length > 0
        ? brokerCommissionFromList
        : commissionTransactions.reduce((sum, item) => sum + asNumber(item.brokerCommissionAmount), 0);
    const companyCommission =
      commissions.length > 0
        ? companyCommissionFromList
        : commissionTransactions.reduce((sum, item) => sum + asNumber(item.companyCommissionAmount), 0);
    const totalCommission =
      commissions.length > 0
        ? totalCommissionFromList
        : commissionTransactions.reduce((sum, item) => sum + asNumber(item.commissionDeduction), 0);

    const saleValue = completedTransactions.reduce((sum, item) => sum + asNumber(item.totalPrice), 0);
    const cashOut = refundPaid + brokerCommission;
    const cashProfit = depositReceived - cashOut;

    const rows = [
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Tổng giá trị giao dịch hoàn tất",
        tien_thu: 0,
        tien_chi: 0,
        loi_nhuan: 0,
        gia_tri_giao_dich: saleValue,
        ghi_chu: `${completedTransactions.length} giao dịch hoàn tất`,
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Tiền cọc đã ghi nhận",
        tien_thu: depositReceived,
        ghi_chu: "Các giao dịch đã gửi hoặc đã xác nhận thanh toán cọc",
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Tiền cọc chờ admin xác nhận",
        tien_thu: depositPending,
        ghi_chu: `${pendingDeposits.length} giao dịch đang chờ xác nhận cọc`,
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Tiền hoàn cọc đã chi",
        tien_chi: refundPaid,
        ghi_chu: `${paidRefunds.length} giao dịch đã hoàn cọc`,
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Tiền hoàn cọc đang chờ chi",
        tien_chi: refundPending,
        ghi_chu: `${pendingRefunds.length} giao dịch yêu cầu hoàn cọc`,
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Hoa hồng môi giới phải chi",
        tien_chi: brokerCommission,
        ghi_chu: "60% tổng hoa hồng theo giao dịch phát sinh",
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Hoa hồng công ty",
        loi_nhuan: companyCommission,
        ghi_chu: "40% tổng hoa hồng, dùng làm lợi nhuận dự kiến của hệ thống",
        ngay: formatDate(new Date()),
      },
      {
        nhom_bao_cao: "Tổng quan tài chính",
        chi_tieu: "Lợi nhuận dòng tiền tạm tính",
        tien_thu: depositReceived,
        tien_chi: cashOut,
        loi_nhuan: cashProfit,
        ghi_chu: "Tiền cọc đã thu - hoàn cọc đã chi - hoa hồng môi giới",
        ngay: formatDate(new Date()),
      },
      ...transactions.map((item) => ({
        nhom_bao_cao: "Giao dịch",
        chi_tieu: "Dòng tiền giao dịch",
        ma: item.transactionCode,
        noi_dung: item.propertyTitle,
        doi_tuong: `${item.customerName || "N/A"} / ${item.brokerName || "N/A"}`,
        trang_thai: statusLabels[item.status] || item.status,
        tien_thu: receivedDepositStatuses.has(item.status) ? asNumber(item.depositAmount) : 0,
        tien_chi:
          (item.status === "refunded" ? asNumber(item.refundableDeposit) : 0) +
          (activeCommissionStatuses.has(item.status) ? asNumber(item.brokerCommissionAmount) : 0),
        loi_nhuan: activeCommissionStatuses.has(item.status) ? asNumber(item.companyCommissionAmount) : 0,
        gia_tri_giao_dich: asNumber(item.totalPrice),
        ghi_chu: item.status === "refund_requested" ? "Đang chờ hoàn cọc cho khách hàng" : "",
        ngay: formatDate(item.transactionDate || item.dealScheduleAt),
      })),
      ...commissions.map((item) => ({
        nhom_bao_cao: "Hoa hồng",
        chi_tieu: "Chi tiết hoa hồng",
        ma: item.transactionCode || `HH-${item.commissionId}`,
        noi_dung: item.propertyTitle,
        doi_tuong: item.userName,
        trang_thai: statusLabels[item.status] || item.status,
        tien_chi: asNumber(item.brokerAmount || item.amount),
        loi_nhuan: asNumber(item.companyAmount),
        gia_tri_giao_dich: asNumber(item.transactionTotalPrice),
        ghi_chu: `Tổng hoa hồng: ${formatVnd(item.totalCommissionAmount || item.amount)}`,
      })),
      ...properties.map((item) => ({
        nhom_bao_cao: "Bất động sản",
        chi_tieu: "Nguồn hàng",
        ma: item.propertyCode,
        noi_dung: item.title,
        doi_tuong: item.assignedTo?.fullName || item.createdBy?.fullName || item.ownerName,
        trang_thai: statusLabels[item.status] || item.status,
        gia_tri_giao_dich: asNumber(item.price),
        ghi_chu: `${item.propertyType || ""} - ${item.district || ""}, ${item.province || ""}`,
        ngay: formatDate(item.createdAt),
      })),
      ...users.map((item) => ({
        nhom_bao_cao: "Người dùng",
        chi_tieu: "Tài khoản",
        ma: item.userId,
        noi_dung: item.fullName,
        doi_tuong: item.email || item.phone,
        trang_thai: item.isActive ? "Đang hoạt động" : "Đã khóa",
        ghi_chu: `${item.role || ""} - hồ sơ: ${item.identityVerificationStatus || "chưa có"}`,
        ngay: formatDate(item.createdAt),
      })),
    ];

    return {
      rows,
      summary: {
        propertyCount: properties.length,
        userCount: users.length,
        transactionCount: transactions.length,
        completedCount: completedTransactions.length,
        saleValue,
        depositReceived,
        depositPending,
        refundPaid,
        refundPending,
        brokerCommission,
        companyCommission,
        totalCommission,
        cashOut,
        cashProfit,
      },
    };
  }, [commissions, properties, transactions, users]);

  const exportCombinedReport = () => {
    downloadCsv(`bao-cao-tong-hop-mgbds-${Date.now()}.csv`, report.rows);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Báo cáo dữ liệu</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Báo cáo tổng hợp dự án</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-stone-500">
            Tổng hợp tiền thu, tiền chi, hoàn cọc, hoa hồng, lợi nhuận và dữ liệu vận hành vào một file CSV để đối soát.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={fetchData}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            disabled={loading || report.rows.length === 0}
            onClick={exportCombinedReport}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Xuất báo cáo tổng hợp
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Tiền thu"
          value={formatVnd(report.summary.depositReceived)}
          helper={`Chờ xác nhận: ${formatVnd(report.summary.depositPending)}`}
          icon={Banknote}
          tone="dark"
        />
        <Metric
          title="Tiền chi"
          value={formatVnd(report.summary.cashOut)}
          helper={`Hoàn cọc chờ chi: ${formatVnd(report.summary.refundPending)}`}
          icon={Wallet}
          tone="rose"
        />
        <Metric
          title="Lợi nhuận công ty"
          value={formatVnd(report.summary.companyCommission)}
          helper={`Tổng hoa hồng: ${formatVnd(report.summary.totalCommission)}`}
          icon={TrendingUp}
          tone="green"
        />
        <Metric
          title="Giá trị giao dịch"
          value={formatVnd(report.summary.saleValue)}
          helper={`${report.summary.completedCount} giao dịch hoàn tất`}
          icon={ReceiptText}
          tone="gold"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-950 text-white">
            <FileBarChart className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-stone-950">Nội dung file tổng hợp</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-stone-500">
            File có các nhóm dòng: tổng quan tài chính, giao dịch, hoa hồng, bất động sản và người dùng. Các cột tiền thu,
            tiền chi, lợi nhuận được chuẩn hóa để mở bằng Excel vẫn dễ lọc và cộng tổng.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Giao dịch" value={report.summary.transactionCount} />
            <MiniStat label="BĐS" value={report.summary.propertyCount} />
            <MiniStat label="Người dùng" value={report.summary.userCount} />
            <MiniStat label="Dòng xuất" value={report.rows.length} />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-[#fbf8f1] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-[#8b6f2f]">Công thức lợi nhuận</p>
          <div className="mt-4 space-y-3 text-sm font-bold text-stone-700">
            <p>Tiền thu = tiền cọc đã gửi hoặc đã xác nhận.</p>
            <p>Tiền chi = hoàn cọc đã chi + hoa hồng môi giới.</p>
            <p>Lợi nhuận công ty = 40% tổng hoa hồng phát sinh.</p>
            <p className="rounded-lg bg-white p-3 text-stone-950">
              Dòng tiền tạm tính: {formatVnd(report.summary.cashProfit)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, helper, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#fff7df] text-[#8b6f2f]",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="truncate text-xl font-black text-stone-950">{value}</p>
      <p className="mt-1 truncate text-xs font-bold text-stone-500">{helper}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-[#fbf8f1] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 text-lg font-black text-stone-950">{value}</p>
    </div>
  );
}
