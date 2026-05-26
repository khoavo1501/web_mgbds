import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Building2,
  CalendarCheck2,
  ChevronDown,
  Download,
  FileBarChart,
  FileSpreadsheet,
  Loader2,
  Percent,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../../services/api";

// ─── Status labels & sets ────────────────────────────────────────────
const statusLabels = {
  pending: "Chờ khách xác nhận",
  customer_confirmed: "Đã xác nhận mua",
  contract_agreed: "Đã đồng ý hợp đồng",
  documents_submitted: "Chờ kiểm tra hồ sơ",
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

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà ở",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
  rental: "Cho thuê",
};

// ─── Formatting helpers ──────────────────────────────────────────────
const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const formatCompactVnd = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`;
  return `${n.toLocaleString("vi-VN")}`;
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("vi-VN");
};

const asNumber = (value) => Number(value || 0);

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
};

// ─── Date range presets ──────────────────────────────────────────────
const getPresetRange = (preset) => {
  const now = new Date();
  switch (preset) {
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
      return { start, end };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
};

const isWithinRange = (dateStr, range) => {
  if (!range.start || !range.end) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= range.start && d <= range.end;
};

// ─── Pie colors ──────────────────────────────────────────────────────
const pieColors = ["#15130f", "#d7b56d", "#7f5539", "#2f6f73", "#b45309", "#78716c", "#059669", "#dc2626", "#6366f1"];

// ─── CSV helpers ─────────────────────────────────────────────────────
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const downloadCsv = (filename, headers, rows) => {
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ─── Excel export ────────────────────────────────────────────────────
const downloadExcel = (filename, sheets) => {
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
};

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════
export default function AdminReports() {
  // Raw data
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [preset, setPreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeTab, setActiveTab] = useState("financial");
  const [exporting, setExporting] = useState(false);

  // ─── Data fetching ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyRes, transactionRes, commissionRes, userRes, appointmentRes, leadRes] = await Promise.all([
        api.get("/properties?size=500"),
        api.get("/transactions"),
        api.get("/commissions"),
        api.get("/admin/users"),
        api.get("/appointments/admin/all?size=500").catch(() => ({ data: { success: false } })),
        api.get("/leads").catch(() => ({ data: { success: false } })),
      ]);
      setProperties(propertyRes.data.success ? propertyRes.data.data?.content || propertyRes.data.data || [] : []);
      setTransactions(transactionRes.data.success ? transactionRes.data.data || [] : []);
      setCommissions(commissionRes.data.success ? commissionRes.data.data || [] : []);
      setUsers(userRes.data.success ? userRes.data.data || [] : []);
      setAppointments(
        appointmentRes.data.success ? appointmentRes.data.data?.content || appointmentRes.data.data || [] : []
      );
      setLeads(leadRes.data.success ? leadRes.data.data || [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Date range ────────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return {
        start: new Date(customFrom + "T00:00:00"),
        end: new Date(customTo + "T23:59:59"),
      };
    }
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  // Filtered data by date range
  const filtered = useMemo(() => {
    const txDateField = (tx) => tx.transactionDate || tx.dealScheduleAt;
    return {
      transactions: transactions.filter((t) => isWithinRange(txDateField(t), dateRange)),
      properties: properties.filter((p) => isWithinRange(p.createdAt, dateRange)),
      commissions: commissions.filter((c) => isWithinRange(c.createdAt || c.transactionDate, dateRange)),
      appointments: appointments.filter((a) => isWithinRange(a.scheduledAt, dateRange)),
      leads: leads.filter((l) => isWithinRange(l.createdAt, dateRange)),
      users: users, // users always show all
    };
  }, [transactions, properties, commissions, appointments, leads, users, dateRange]);

  // ─── Report computation ────────────────────────────────────────────
  const report = useMemo(() => {
    const { transactions: txs, properties: props, commissions: cms, appointments: appts, leads: lds } = filtered;

    const completedTx = txs.filter((t) => t.status === "completed");
    const receivedTx = txs.filter((t) => receivedDepositStatuses.has(t.status));
    const commissionTx = txs.filter((t) => activeCommissionStatuses.has(t.status));
    const paidRefunds = txs.filter((t) => t.status === "refunded");
    const pendingRefunds = txs.filter((t) => t.status === "refund_requested");
    const pendingDeposits = txs.filter((t) => t.status === "payment_submitted");

    const saleValue = completedTx.reduce((sum, t) => sum + asNumber(t.totalPrice), 0);
    const depositReceived = receivedTx.reduce((sum, t) => sum + asNumber(t.depositAmount), 0);
    const depositPending = pendingDeposits.reduce((sum, t) => sum + asNumber(t.depositAmount), 0);
    const refundPaid = paidRefunds.reduce((sum, t) => sum + asNumber(t.refundableDeposit), 0);
    const refundPending = pendingRefunds.reduce((sum, t) => sum + asNumber(t.refundableDeposit), 0);

    const brokerCommission =
      cms.length > 0
        ? cms.reduce((s, c) => s + asNumber(c.brokerAmount || c.amount), 0)
        : commissionTx.reduce((s, t) => s + asNumber(t.brokerCommissionAmount), 0);
    const companyCommission =
      cms.length > 0
        ? cms.reduce((s, c) => s + asNumber(c.companyAmount), 0)
        : commissionTx.reduce((s, t) => s + asNumber(t.companyCommissionAmount), 0);
    const totalCommission =
      cms.length > 0
        ? cms.reduce((s, c) => s + asNumber(c.totalCommissionAmount || c.amount), 0)
        : commissionTx.reduce((s, t) => s + asNumber(t.commissionDeduction), 0);

    const totalPropertyValue = props.reduce((s, p) => s + asNumber(p.price), 0);
    const cashOut = refundPaid + brokerCommission;
    const cashProfit = depositReceived - cashOut;
    const conversionRate = txs.length > 0 ? ((completedTx.length / txs.length) * 100).toFixed(1) : "0.0";

    return {
      totalPropertyValue,
      propertyCount: props.length,
      transactionCount: txs.length,
      completedCount: completedTx.length,
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
      conversionRate,
      appointmentCount: appts.length,
      appointmentsCompleted: appts.filter((a) => a.status === "completed").length,
      leadCount: lds.length,
      userCount: users.length,
      brokerCount: users.filter((u) => u.role === "broker").length,
      customerCount: users.filter((u) => u.role === "customer").length,
    };
  }, [filtered, users]);

  // ─── Chart: Revenue by month ───────────────────────────────────────
  const revenueChartData = useMemo(() => {
    const grouped = {};
    for (const tx of filtered.transactions) {
      const key = monthKey(tx.transactionDate || tx.dealScheduleAt);
      if (!key) continue;
      if (!grouped[key]) grouped[key] = { month: key, revenue: 0, deposit: 0, commission: 0 };
      if (tx.status === "completed") grouped[key].revenue += asNumber(tx.totalPrice);
      if (receivedDepositStatuses.has(tx.status)) grouped[key].deposit += asNumber(tx.depositAmount);
      if (activeCommissionStatuses.has(tx.status)) {
        grouped[key].commission += asNumber(tx.brokerCommissionAmount) + asNumber(tx.companyCommissionAmount);
      }
    }
    // Sort by date
    const monthOrder = (mk) => {
      const [m, y] = mk.replace("T", "").split("/");
      return Number(y) * 100 + Number(m);
    };
    return Object.values(grouped).sort((a, b) => monthOrder(a.month) - monthOrder(b.month));
  }, [filtered.transactions]);

  // ─── Chart: Transaction status distribution ────────────────────────
  const statusDistribution = useMemo(() => {
    const grouped = {};
    for (const tx of filtered.transactions) {
      const label = statusLabels[tx.status] || tx.status;
      grouped[label] = (grouped[label] || 0) + 1;
    }
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filtered.transactions]);

  // ─── Chart: Top brokers ────────────────────────────────────────────
  const topBrokers = useMemo(() => {
    const grouped = {};
    for (const c of filtered.commissions) {
      const name = c.userName || "Không rõ";
      if (!grouped[name]) grouped[name] = { broker: name, amount: 0 };
      grouped[name].amount += asNumber(c.brokerAmount || c.amount);
    }
    // Fallback from transactions
    if (Object.keys(grouped).length === 0) {
      for (const tx of filtered.transactions.filter((t) => activeCommissionStatuses.has(t.status))) {
        const name = tx.brokerName || "Không rõ";
        if (!grouped[name]) grouped[name] = { broker: name, amount: 0 };
        grouped[name].amount += asNumber(tx.brokerCommissionAmount);
      }
    }
    return Object.values(grouped)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered.commissions, filtered.transactions]);

  // ─── Chart: Conversion funnel ──────────────────────────────────────
  const funnelData = useMemo(() => {
    const apptCount = filtered.appointments.length || report.leadCount || 0;
    const txCount = filtered.transactions.length;
    const completedCount = report.completedCount;
    return [
      { name: "Lịch hẹn / Lead", value: Math.max(apptCount, txCount, 1), fill: "#d7b56d" },
      { name: "Giao dịch tạo", value: Math.max(txCount, 1), fill: "#2f6f73" },
      { name: "Hoàn tất", value: Math.max(completedCount, 0), fill: "#15130f" },
    ];
  }, [filtered.appointments, filtered.transactions, report]);

  // ─── Financial summary rows ────────────────────────────────────────
  const financialRows = useMemo(
    () => [
      { chi_tieu: "Tổng giá trị giao dịch hoàn tất", thu: 0, chi: 0, loi_nhuan: 0, gia_tri: report.saleValue, ghi_chu: `${report.completedCount} giao dịch hoàn tất` },
      { chi_tieu: "Tiền cọc đã ghi nhận", thu: report.depositReceived, chi: 0, loi_nhuan: 0, gia_tri: 0, ghi_chu: "Các GD đã gửi hoặc xác nhận cọc" },
      { chi_tieu: "Tiền cọc chờ xác nhận", thu: report.depositPending, chi: 0, loi_nhuan: 0, gia_tri: 0, ghi_chu: `${filtered.transactions.filter((t) => t.status === "payment_submitted").length} GD chờ` },
      { chi_tieu: "Tiền hoàn cọc đã chi", thu: 0, chi: report.refundPaid, loi_nhuan: 0, gia_tri: 0, ghi_chu: `${filtered.transactions.filter((t) => t.status === "refunded").length} GD đã hoàn` },
      { chi_tieu: "Tiền hoàn cọc chờ chi", thu: 0, chi: report.refundPending, loi_nhuan: 0, gia_tri: 0, ghi_chu: `${filtered.transactions.filter((t) => t.status === "refund_requested").length} GD chờ hoàn` },
      { chi_tieu: "Hoa hồng môi giới phải chi", thu: 0, chi: report.brokerCommission, loi_nhuan: 0, gia_tri: 0, ghi_chu: "60% tổng hoa hồng" },
      { chi_tieu: "Lợi nhuận hoa hồng công ty", thu: 0, chi: 0, loi_nhuan: report.companyCommission, gia_tri: 0, ghi_chu: "40% tổng hoa hồng" },
      { chi_tieu: "Lợi nhuận dòng tiền tạm tính", thu: report.depositReceived, chi: report.cashOut, loi_nhuan: report.cashProfit, gia_tri: 0, ghi_chu: "Thu − Chi (hoàn cọc + HH broker)" },
    ],
    [report, filtered.transactions]
  );

  // ─── Export logic ──────────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    const headers = ["nhom", "chi_tieu", "ma", "noi_dung", "doi_tuong", "trang_thai", "tien_thu", "tien_chi", "loi_nhuan", "gia_tri", "ghi_chu", "ngay"];
    const rows = [
      ...financialRows.map((r) => ({ nhom: "Tổng quan tài chính", ...r, ma: "", noi_dung: "", doi_tuong: "", trang_thai: "", tien_thu: r.thu, tien_chi: r.chi, gia_tri: r.gia_tri, ngay: formatDate(new Date()) })),
      ...filtered.transactions.map((t) => ({
        nhom: "Giao dịch", chi_tieu: "Chi tiết GD", ma: t.transactionCode, noi_dung: t.propertyTitle,
        doi_tuong: `${t.customerName || "N/A"} / ${t.brokerName || "N/A"}`, trang_thai: statusLabels[t.status] || t.status,
        tien_thu: receivedDepositStatuses.has(t.status) ? asNumber(t.depositAmount) : 0,
        tien_chi: (t.status === "refunded" ? asNumber(t.refundableDeposit) : 0) + (activeCommissionStatuses.has(t.status) ? asNumber(t.brokerCommissionAmount) : 0),
        loi_nhuan: activeCommissionStatuses.has(t.status) ? asNumber(t.companyCommissionAmount) : 0,
        gia_tri: asNumber(t.totalPrice), ghi_chu: "", ngay: formatDate(t.transactionDate || t.dealScheduleAt),
      })),
      ...filtered.properties.map((p) => ({
        nhom: "Bất động sản", chi_tieu: "Nguồn hàng", ma: p.propertyCode, noi_dung: p.title,
        doi_tuong: p.assignedTo?.fullName || p.createdBy?.fullName || p.ownerName || "",
        trang_thai: statusLabels[p.status] || p.status, tien_thu: 0, tien_chi: 0, loi_nhuan: 0,
        gia_tri: asNumber(p.price), ghi_chu: `${propertyTypeLabels[p.propertyType] || p.propertyType || ""} - ${p.district || ""}, ${p.province || ""}`,
        ngay: formatDate(p.createdAt),
      })),
      ...users.map((u) => ({
        nhom: "Người dùng", chi_tieu: "Tài khoản", ma: u.userId, noi_dung: u.fullName,
        doi_tuong: u.email || u.phone || "", trang_thai: u.isActive ? "Đang hoạt động" : "Đã khóa",
        tien_thu: 0, tien_chi: 0, loi_nhuan: 0, gia_tri: 0,
        ghi_chu: `${u.role || ""} - hồ sơ: ${u.identityVerificationStatus || "chưa có"}`,
        ngay: formatDate(u.createdAt),
      })),
    ];
    downloadCsv(`bao-cao-tong-hop-MGBDS-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }, [financialRows, filtered, users]);

  const handleExportExcel = useCallback(() => {
    setExporting(true);
    try {
      const sheets = [
        {
          name: "Tổng quan tài chính",
          data: financialRows.map((r) => ({
            "Chỉ tiêu": r.chi_tieu,
            "Tiền thu (VNĐ)": r.thu,
            "Tiền chi (VNĐ)": r.chi,
            "Lợi nhuận (VNĐ)": r.loi_nhuan,
            "Giá trị GD (VNĐ)": r.gia_tri,
            "Ghi chú": r.ghi_chu,
          })),
        },
        {
          name: "Chi tiết giao dịch",
          data: filtered.transactions.map((t) => ({
            "Mã GD": t.transactionCode,
            "BĐS": t.propertyTitle,
            "Khách hàng": t.customerName || "N/A",
            "Môi giới": t.brokerName || "N/A",
            "Giá trị (VNĐ)": asNumber(t.totalPrice),
            "Tiền cọc (VNĐ)": asNumber(t.depositAmount),
            "Trạng thái": statusLabels[t.status] || t.status,
            "Ngày": formatDate(t.transactionDate || t.dealScheduleAt),
          })),
        },
        {
          name: "Chi tiết hoa hồng",
          data: filtered.commissions.map((c) => ({
            "Mã GD": c.transactionCode || `HH-${c.commissionId}`,
            "BĐS": c.propertyTitle || "",
            "Môi giới": c.userName || "",
            "HH Broker (VNĐ)": asNumber(c.brokerAmount || c.amount),
            "HH Công ty (VNĐ)": asNumber(c.companyAmount),
            "Tổng HH (VNĐ)": asNumber(c.totalCommissionAmount || c.amount),
            "Trạng thái": statusLabels[c.status] || c.status,
          })),
        },
        {
          name: "Danh sách BĐS",
          data: filtered.properties.map((p) => ({
            "Mã BĐS": p.propertyCode,
            "Tiêu đề": p.title,
            "Loại": propertyTypeLabels[p.propertyType] || p.propertyType,
            "Giá (VNĐ)": asNumber(p.price),
            "Tỉnh/TP": p.province,
            "Quận/Huyện": p.district,
            "Trạng thái": statusLabels[p.status] || p.status,
            "Ngày tạo": formatDate(p.createdAt),
          })),
        },
        {
          name: "Người dùng",
          data: users.map((u) => ({
            ID: u.userId,
            "Họ tên": u.fullName,
            Email: u.email,
            SĐT: u.phone || "",
            "Vai trò": u.role,
            "Trạng thái": u.isActive ? "Hoạt động" : "Khóa",
            "Xác minh": u.identityVerificationStatus || "chưa có",
            "Ngày tạo": formatDate(u.createdAt),
          })),
        },
      ];
      downloadExcel(`bao-cao-tong-hop-MGBDS-${new Date().toISOString().slice(0, 10)}.xlsx`, sheets);
    } finally {
      setExporting(false);
    }
  }, [financialRows, filtered, users]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Báo cáo dữ liệu</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Báo cáo tổng hợp dự án</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-stone-500">
            Tổng hợp toàn bộ dữ liệu tài chính, giao dịch, BĐS, hoa hồng, lịch hẹn và người dùng — hỗ trợ lọc theo khoảng thời gian và xuất file Excel/CSV.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm transition-all hover:bg-stone-50 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Làm mới
          </button>
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm transition-all hover:bg-stone-50 active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || exporting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-black text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Xuất Excel
          </button>
        </div>
      </section>

      {/* ─── DATE FILTER ──────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-black text-stone-700">Khoảng thời gian:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "this_month", label: "Tháng này" },
            { key: "this_quarter", label: "Quý này" },
            { key: "this_year", label: "Năm nay" },
            { key: "custom", label: "Tùy chọn" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPreset(item.key)}
              className={`inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-bold transition-all ${
                preset === item.key
                  ? "bg-stone-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-800 outline-none focus:border-[#d7b56d]"
            />
            <span className="text-sm font-bold text-stone-400">đến</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-800 outline-none focus:border-[#d7b56d]"
            />
          </div>
        )}
      </section>

      {/* ─── KPI CARDS ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng giá trị BĐS"
          value={formatVnd(report.totalPropertyValue)}
          helper={`${report.propertyCount} bất động sản`}
          icon={Building2}
          tone="dark"
        />
        <KpiCard
          title="Doanh thu hoàn tất"
          value={formatVnd(report.saleValue)}
          helper={`${report.completedCount} giao dịch hoàn tất`}
          icon={ReceiptText}
          tone="gold"
        />
        <KpiCard
          title="Tiền cọc đã thu"
          value={formatVnd(report.depositReceived)}
          helper={`Chờ xác nhận: ${formatVnd(report.depositPending)}`}
          icon={Banknote}
          tone="green"
        />
        <KpiCard
          title="Tiền chi"
          value={formatVnd(report.cashOut)}
          helper={`Hoàn cọc chờ: ${formatVnd(report.refundPending)}`}
          icon={Wallet}
          tone="rose"
        />
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="HH Môi giới"
          value={formatVnd(report.brokerCommission)}
          helper={`Tổng HH: ${formatVnd(report.totalCommission)}`}
          icon={Users}
          tone="brown"
        />
        <KpiCard
          title="Lợi nhuận Công ty"
          value={formatVnd(report.companyCommission)}
          helper={`Dòng tiền tạm tính: ${formatVnd(report.cashProfit)}`}
          icon={TrendingUp}
          tone="teal"
        />
        <KpiCard
          title="Tỷ lệ chuyển đổi"
          value={`${report.conversionRate}%`}
          helper={`${report.completedCount}/${report.transactionCount} giao dịch`}
          icon={Percent}
          tone="purple"
        />
        <KpiCard
          title="Lịch hẹn"
          value={report.appointmentCount}
          helper={`Hoàn tất: ${report.appointmentsCompleted} | Lead: ${report.leadCount}`}
          icon={CalendarCheck2}
          tone="amber"
        />
      </section>

      {/* ─── CHARTS ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Revenue chart */}
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Dòng tiền theo tháng</h2>
            <p className="text-sm font-medium text-stone-500">Doanh thu từ GD hoàn tất, tiền cọc và hoa hồng phát sinh.</p>
          </div>
          <div className="h-80">
            {loading ? (
              <LoadingLabel />
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#15130f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#15130f" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gradDeposit" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#d7b56d" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#d7b56d" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} tickFormatter={formatCompactVnd} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e7e0d4", fontWeight: 700 }}
                    formatter={(value, name) => [
                      formatVnd(value),
                      name === "revenue" ? "Doanh thu" : name === "deposit" ? "Tiền cọc" : "Hoa hồng",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#15130f" strokeWidth={3} fill="url(#gradRevenue)" />
                  <Area type="monotone" dataKey="deposit" stroke="#d7b56d" strokeWidth={2} fill="url(#gradDeposit)" />
                  <Area type="monotone" dataKey="commission" stroke="#2f6f73" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Chưa có giao dịch để hiển thị dòng tiền." />
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-5">
            <LegendDot color="#15130f" label="Doanh thu" />
            <LegendDot color="#d7b56d" label="Tiền cọc" />
            <LegendDot color="#2f6f73" label="Hoa hồng" />
          </div>
        </div>

        {/* Status distribution pie */}
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Phân bổ trạng thái GD</h2>
            <p className="text-sm font-medium text-stone-500">Tỷ trọng các trạng thái giao dịch hiện tại.</p>
          </div>
          <div className="h-72">
            {loading ? (
              <LoadingLabel />
            ) : statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={100} paddingAngle={2}>
                    {statusDistribution.map((entry, i) => (
                      <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} GD`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Chưa có giao dịch." />
            )}
          </div>
          {statusDistribution.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {statusDistribution.slice(0, 6).map((s, i) => (
                <LegendDot key={s.name} color={pieColors[i % pieColors.length]} label={`${s.name} (${s.value})`} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Top brokers */}
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Top môi giới</h2>
            <p className="text-sm font-medium text-stone-500">Xếp hạng theo tổng hoa hồng phát sinh.</p>
          </div>
          <div className="h-64">
            {loading ? (
              <LoadingLabel />
            ) : topBrokers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBrokers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCompactVnd} />
                  <YAxis dataKey="broker" type="category" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => [formatVnd(val), "Hoa hồng"]} />
                  <Bar dataKey="amount" fill="#d7b56d" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Chưa có dữ liệu hoa hồng." />
            )}
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Phễu chuyển đổi</h2>
            <p className="text-sm font-medium text-stone-500">
              Lịch hẹn/Lead → Giao dịch tạo → Hoàn tất. Tỷ lệ chuyển đổi: <span className="font-black text-[#2f6f73]">{report.conversionRate}%</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-4">
            {funnelData.map((item, idx) => {
              const maxVal = funnelData[0].value || 1;
              const widthPct = Math.max(20, (item.value / maxVal) * 100);
              return (
                <div key={item.name} className="w-full">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-700">{item.name}</span>
                    <span className="text-sm font-black text-stone-950">{item.value}</span>
                  </div>
                  <div className="h-10 w-full rounded-lg bg-stone-100">
                    <div
                      className="flex h-10 items-center justify-end rounded-lg px-3 transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: item.fill }}
                    >
                      {widthPct > 30 && (
                        <span className="text-xs font-black text-white">
                          {idx > 0 ? `${((item.value / funnelData[idx - 1].value) * 100 || 0).toFixed(0)}%` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DETAIL TABS ──────────────────────────────────────── */}
      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-lg bg-stone-100 p-1">
            {[
              { key: "financial", label: "Tài chính" },
              { key: "transactions", label: "Giao dịch" },
              { key: "properties", label: "BĐS" },
              { key: "users", label: "Người dùng" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`h-9 rounded-md px-4 text-sm font-black transition-colors ${
                  activeTab === tab.key ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-stone-400">
            {activeTab === "financial" && `${financialRows.length} chỉ tiêu`}
            {activeTab === "transactions" && `${filtered.transactions.length} giao dịch`}
            {activeTab === "properties" && `${filtered.properties.length} bất động sản`}
            {activeTab === "users" && `${users.length} người dùng`}
          </p>
        </div>

        {activeTab === "financial" && <FinancialTable rows={financialRows} loading={loading} />}
        {activeTab === "transactions" && <TransactionTable rows={filtered.transactions} loading={loading} />}
        {activeTab === "properties" && <PropertyTable rows={filtered.properties} loading={loading} />}
        {activeTab === "users" && <UserTable rows={users} loading={loading} />}
      </section>

      {/* ─── FORMULA CARD ─────────────────────────────────────── */}
      <section className="rounded-lg border border-stone-200 bg-[#fbf8f1] p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-[#8b6f2f]">Công thức lợi nhuận</p>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm font-bold text-stone-700 md:grid-cols-2 xl:grid-cols-4">
          <p className="rounded-lg bg-white p-3">Tiền thu = cọc đã gửi hoặc đã xác nhận</p>
          <p className="rounded-lg bg-white p-3">Tiền chi = hoàn cọc đã chi + HH broker</p>
          <p className="rounded-lg bg-white p-3">Lợi nhuận CT = 40% tổng hoa hồng</p>
          <p className="rounded-lg bg-white p-3 font-black text-stone-950">Dòng tiền tạm tính: {formatVnd(report.cashProfit)}</p>
        </div>
      </section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════

function KpiCard({ title, value, helper, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#fff7df] text-[#8b6f2f]",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    brown: "bg-[#7f5539] text-white",
    teal: "bg-[#2f6f73] text-white",
    purple: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <div className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="truncate text-xl font-black text-stone-950">{value}</p>
      <p className="mt-1 truncate text-xs font-bold text-stone-500">{helper}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold text-stone-500">{label}</span>
    </div>
  );
}

function LoadingLabel() {
  return (
    <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Đang tải...
    </div>
  );
}

function EmptyChart({ label }) {
  return <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">{label}</div>;
}

// ─── Financial Table ─────────────────────────────────────────────────
function FinancialTable({ rows, loading }) {
  if (loading) return <TableLoading />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[800px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">Chỉ tiêu</th>
            <th className="px-5 py-3 text-right">Tiền thu</th>
            <th className="px-5 py-3 text-right">Tiền chi</th>
            <th className="px-5 py-3 text-right">Lợi nhuận</th>
            <th className="px-5 py-3 text-right">Giá trị GD</th>
            <th className="px-5 py-3 text-left">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, i) => (
            <tr key={i} className={`transition-colors hover:bg-[#fbf8f1] ${i === rows.length - 1 ? "bg-stone-50 font-black" : ""}`}>
              <td className="px-5 py-4 text-sm font-bold text-stone-900">{row.chi_tieu}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-emerald-700">{row.thu ? formatVnd(row.thu) : "—"}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-rose-700">{row.chi ? formatVnd(row.chi) : "—"}</td>
              <td className={`px-5 py-4 text-right text-sm font-black ${row.loi_nhuan < 0 ? "text-rose-700" : "text-[#2f6f73]"}`}>
                {row.loi_nhuan ? formatVnd(row.loi_nhuan) : "—"}
              </td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-700">{row.gia_tri ? formatVnd(row.gia_tri) : "—"}</td>
              <td className="px-5 py-4 text-sm font-medium text-stone-500">{row.ghi_chu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Transaction Table ───────────────────────────────────────────────
function TransactionTable({ rows, loading }) {
  if (loading) return <TableLoading />;
  if (rows.length === 0) return <TableEmpty label="Không có giao dịch nào trong khoảng thời gian này." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">Mã GD</th>
            <th className="px-5 py-3 text-left">Bất động sản</th>
            <th className="px-5 py-3 text-left">Khách hàng</th>
            <th className="px-5 py-3 text-left">Môi giới</th>
            <th className="px-5 py-3 text-right">Giá trị</th>
            <th className="px-5 py-3 text-right">Tiền cọc</th>
            <th className="px-5 py-3 text-left">Trạng thái</th>
            <th className="px-5 py-3 text-left">Ngày</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((tx) => (
            <tr key={tx.transactionId} className="transition-colors hover:bg-[#fbf8f1]">
              <td className="px-5 py-4">
                <p className="font-black text-stone-950">{tx.transactionCode}</p>
              </td>
              <td className="max-w-[200px] px-5 py-4">
                <p className="truncate text-sm font-bold text-stone-900">{tx.propertyTitle || "N/A"}</p>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-stone-700">{tx.customerName || "N/A"}</td>
              <td className="px-5 py-4 text-sm font-bold text-stone-700">{tx.brokerName || "N/A"}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-950">{formatVnd(tx.totalPrice)}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-[#8b6f2f]">{formatVnd(tx.depositAmount)}</td>
              <td className="px-5 py-4">
                <StatusPill status={tx.status} />
              </td>
              <td className="px-5 py-4 text-sm font-medium text-stone-500">{formatDate(tx.transactionDate || tx.dealScheduleAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Property Table ──────────────────────────────────────────────────
function PropertyTable({ rows, loading }) {
  if (loading) return <TableLoading />;
  if (rows.length === 0) return <TableEmpty label="Không có BĐS nào trong khoảng thời gian này." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">Mã BĐS</th>
            <th className="px-5 py-3 text-left">Tiêu đề</th>
            <th className="px-5 py-3 text-left">Loại hình</th>
            <th className="px-5 py-3 text-right">Giá</th>
            <th className="px-5 py-3 text-left">Khu vực</th>
            <th className="px-5 py-3 text-left">Trạng thái</th>
            <th className="px-5 py-3 text-left">Ngày tạo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((p) => (
            <tr key={p.propertyId} className="transition-colors hover:bg-[#fbf8f1]">
              <td className="px-5 py-4 font-black text-stone-950">{p.propertyCode}</td>
              <td className="max-w-[250px] px-5 py-4">
                <p className="truncate text-sm font-bold text-stone-900">{p.title}</p>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-stone-700">
                {propertyTypeLabels[p.propertyType] || p.propertyType}
              </td>
              <td className="px-5 py-4 text-right text-sm font-black text-stone-950">{formatVnd(p.price)}</td>
              <td className="px-5 py-4 text-sm font-medium text-stone-600">
                {[p.district, p.province].filter(Boolean).join(", ")}
              </td>
              <td className="px-5 py-4">
                <StatusPill status={p.status} />
              </td>
              <td className="px-5 py-4 text-sm font-medium text-stone-500">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── User Table ──────────────────────────────────────────────────────
function UserTable({ rows, loading }) {
  if (loading) return <TableLoading />;
  if (rows.length === 0) return <TableEmpty label="Không có người dùng nào." />;

  const roleLabels = { admin: "Quản trị", broker: "Môi giới", customer: "Khách hàng" };
  const roleStyles = {
    admin: "bg-violet-50 text-violet-700 ring-violet-200",
    broker: "bg-amber-50 text-amber-800 ring-amber-200",
    customer: "bg-sky-50 text-sky-700 ring-sky-200",
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[800px] w-full">
        <thead className="bg-[#fbf8f1] text-xs font-black uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-5 py-3 text-left">ID</th>
            <th className="px-5 py-3 text-left">Họ tên</th>
            <th className="px-5 py-3 text-left">Email</th>
            <th className="px-5 py-3 text-left">Vai trò</th>
            <th className="px-5 py-3 text-left">Trạng thái</th>
            <th className="px-5 py-3 text-left">Xác minh</th>
            <th className="px-5 py-3 text-left">Ngày tạo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((u) => (
            <tr key={u.userId} className="transition-colors hover:bg-[#fbf8f1]">
              <td className="px-5 py-4 font-black text-stone-950">#{u.userId}</td>
              <td className="px-5 py-4 text-sm font-bold text-stone-900">{u.fullName}</td>
              <td className="px-5 py-4 text-sm font-medium text-stone-600">{u.email || u.phone || "—"}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${roleStyles[u.role] || "bg-stone-50 text-stone-600 ring-stone-200"}`}>
                  {roleLabels[u.role] || u.role}
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
                    u.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"
                  }`}
                >
                  {u.isActive ? "Hoạt động" : "Đã khóa"}
                </span>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-stone-600">{u.identityVerificationStatus || "chưa có"}</td>
              <td className="px-5 py-4 text-sm font-medium text-stone-500">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared table components ─────────────────────────────────────────
function StatusPill({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    pending_review: "bg-amber-50 text-amber-800 ring-amber-200",
    customer_confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    documents_submitted: "bg-amber-50 text-amber-800 ring-amber-200",
    documents_verified: "bg-sky-50 text-sky-700 ring-sky-200",
    payment_submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    deposit_confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    commitment_signed: "bg-teal-50 text-teal-700 ring-teal-200",
    deal_scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
    broker_confirmed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    refund_requested: "bg-orange-50 text-orange-700 ring-orange-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    in_transaction: "bg-blue-50 text-blue-700 ring-blue-200",
    sold: "bg-stone-100 text-stone-700 ring-stone-200",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles[status] || "bg-stone-50 text-stone-600 ring-stone-200"}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function TableLoading() {
  return (
    <div className="flex h-32 items-center justify-center text-sm font-bold text-stone-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Đang tải dữ liệu...
    </div>
  );
}

function TableEmpty({ label }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm font-bold text-stone-400">
      <FileBarChart className="mr-2 h-5 w-5" />
      {label}
    </div>
  );
}
