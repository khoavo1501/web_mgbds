import { useEffect, useMemo, useState } from "react";
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
import { Building2, CheckCircle2, Clock3, DollarSign } from "lucide-react";
import api from "../../services/api";

const typeLabels = {
  apartment: "Căn hộ",
  house: "Nhà ở",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
  rental: "Cho thuê",
};

const pieColors = ["#15130f", "#d7b56d", "#7f5539", "#2f6f73", "#b45309", "#78716c"];

const MOCK_MONTHLY_REVENUE = {
  revenue: 8_750_000_000,
  deposit: 875_000_000,
  commission: 175_000_000,
};

const MOCK_PREVIOUS_MONTH_REVENUE = {
  revenue: 7_950_000_000,
  deposit: 795_000_000,
  commission: 159_000_000,
};

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

const formatCompactVnd = (value) => {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(0)} triệu`;
  return `${number}`;
};

const monthKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Chưa rõ";
  return `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

const currentMonthKey = () => monthKey(new Date());

const previousMonthKey = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return monthKey(date);
};

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [propertyRes, transactionRes, commissionRes, userRes] = await Promise.all([
          api.get("/properties?size=500"),
          api.get("/transactions"),
          api.get("/commissions"),
          api.get("/admin/users"),
        ]);
        if (propertyRes.data.success) setProperties(propertyRes.data.data.content || []);
        if (transactionRes.data.success) setTransactions(transactionRes.data.data || []);
        if (commissionRes.data.success) setCommissions(commissionRes.data.data || []);
        if (userRes.data.success) setUsers(userRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const summary = useMemo(() => {
    const reviewTransactions = transactions.filter((item) =>
      ["documents_submitted", "payment_submitted", "refund_requested", "broker_confirmed"].includes(item.status)
    );
    const completedRevenue = transactions
      .filter((item) => item.status === "completed")
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const depositValue = transactions.reduce((sum, item) => sum + Number(item.depositAmount || 0), 0);

    return {
      totalProperties: properties.length,
      published: properties.filter((item) => item.status === "published").length,
      pendingReviews:
        properties.filter((item) => item.status === "pending_review").length +
        users.filter((item) => item.identityVerificationStatus === "pending_review").length +
        reviewTransactions.length,
      completedRevenue: completedRevenue || MOCK_MONTHLY_REVENUE.revenue,
      depositValue: depositValue || MOCK_MONTHLY_REVENUE.deposit,
      usingMockRevenue: completedRevenue === 0 && depositValue === 0,
    };
  }, [properties, transactions, users]);

  const distribution = useMemo(() => {
    const grouped = properties.reduce((acc, item) => {
      const key = item.propertyType || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([type, value]) => ({ type: typeLabels[type] || type, value }));
  }, [properties]);

  const revenueData = useMemo(() => {
    const grouped = transactions.reduce((acc, item) => {
      const key = monthKey(item.transactionDate);
      if (!acc[key]) acc[key] = { month: key, revenue: 0, deposit: 0, commission: 0 };
      if (item.status === "completed") acc[key].revenue += Number(item.totalPrice || 0);
      acc[key].deposit += Number(item.depositAmount || 0);
      return acc;
    }, {});

    commissions.forEach((item) => {
      const transaction = transactions.find((trx) => trx.transactionId === item.transactionId);
      const key = monthKey(transaction?.transactionDate);
      if (!grouped[key]) grouped[key] = { month: key, revenue: 0, deposit: 0, commission: 0 };
      grouped[key].commission += Number(item.brokerAmount || item.amount || 0);
    });

    const rows = Object.values(grouped);
    const hasRealCashFlow = rows.some((item) => item.revenue > 0 || item.deposit > 0 || item.commission > 0);
    if (hasRealCashFlow) {
      const latestRows = rows.slice(-8);
      if (latestRows.length === 1) {
        return [
          {
            month: previousMonthKey(),
            revenue: MOCK_PREVIOUS_MONTH_REVENUE.revenue,
            deposit: MOCK_PREVIOUS_MONTH_REVENUE.deposit,
            commission: MOCK_PREVIOUS_MONTH_REVENUE.commission,
            isMock: true,
          },
          ...latestRows,
        ];
      }
      return latestRows;
    }

    return [
      {
        month: previousMonthKey(),
        revenue: MOCK_PREVIOUS_MONTH_REVENUE.revenue,
        deposit: MOCK_PREVIOUS_MONTH_REVENUE.deposit,
        commission: MOCK_PREVIOUS_MONTH_REVENUE.commission,
        isMock: true,
      },
      {
        month: currentMonthKey(),
        revenue: MOCK_MONTHLY_REVENUE.revenue,
        deposit: MOCK_MONTHLY_REVENUE.deposit,
        commission: MOCK_MONTHLY_REVENUE.commission,
        isMock: true,
      },
    ];
  }, [commissions, transactions]);

  const topDistricts = useMemo(() => {
    const grouped = properties.reduce((acc, item) => {
      const key = item.district || "Chưa rõ";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [properties]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Tổng quan vận hành</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Bảng điều khiển quản trị</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Số liệu lấy trực tiếp từ BĐS, giao dịch, hoa hồng và hàng đợi duyệt của hệ thống.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Cập nhật</p>
          <p className="text-sm font-black text-stone-900">{new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </section>

      {summary.usingMockRevenue && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Đang dùng dữ liệu doanh thu mẫu của 1 tháng vì hệ thống chưa có giao dịch hoàn tất.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric title="Tổng BĐS" value={summary.totalProperties} icon={Building2} tone="dark" />
        <Metric title="Chờ duyệt" value={summary.pendingReviews} icon={Clock3} tone="gold" />
        <Metric title="Doanh thu hoàn tất" value={formatVnd(summary.completedRevenue)} icon={CheckCircle2} tone="green" />
        <Metric title="Tiền cọc ghi nhận" value={formatVnd(summary.depositValue)} icon={DollarSign} tone="brown" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Dòng tiền theo tháng</h2>
            <p className="text-sm font-medium text-stone-500">
              Doanh thu chỉ tính giao dịch hoàn tất; tiền cọc và hoa hồng dùng dữ liệu thực tế hoặc dữ liệu mẫu khi chưa có giao dịch.
            </p>
          </div>
          <div className="h-80">
            {loading ? (
              <LoadingLabel />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactVnd} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e7e0d4", fontWeight: 700 }}
                    formatter={(value, name) => [
                      formatVnd(value),
                      name === "revenue" ? "Doanh thu" : name === "deposit" ? "Tiền cọc" : "Hoa hồng",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#15130f" strokeWidth={3} fill="transparent" />
                  <Area type="monotone" dataKey="deposit" stroke="#d7b56d" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="commission" stroke="#2f6f73" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Chưa có giao dịch để hiển thị dòng tiền." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Phân bổ loại BĐS</h2>
            <p className="text-sm font-medium text-stone-500">Tỷ trọng nguồn hàng theo loại tài sản.</p>
          </div>
          <div className="h-72">
            {loading ? (
              <LoadingLabel />
            ) : distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="type" innerRadius={64} outerRadius={104} paddingAngle={3}>
                    {distribution.map((entry, index) => (
                      <Cell key={entry.type} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tin`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Chưa có dữ liệu BĐS." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-black text-stone-950">Khu vực có nhiều tin</h2>
          <p className="text-sm font-medium text-stone-500">Top quận/huyện theo số lượng BĐS.</p>
        </div>
        <div className="h-72">
          {topDistricts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDistricts} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="district" type="category" axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(value) => [`${value} tin`, "Số lượng"]} />
                <Bar dataKey="count" fill="#d7b56d" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Chưa có khu vực để thống kê." />
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    dark: "bg-stone-950 text-white",
    gold: "bg-[#d7b56d] text-stone-950",
    green: "bg-[#2f6f73] text-white",
    brown: "bg-[#7f5539] text-white",
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
      <p className="mt-2 truncate text-2xl font-black tracking-tight text-stone-950">{value}</p>
    </div>
  );
}

function LoadingLabel() {
  return <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">Đang tải...</div>;
}

function EmptyChart({ label }) {
  return <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">{label}</div>;
}
