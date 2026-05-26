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
import { ArrowUpRight, Building2, CheckCircle2, Clock3, DollarSign } from "lucide-react";
import api from "../../services/api";

const revenueData = [
  { month: "T1", revenue: 2.4, commission: 0.28 },
  { month: "T2", revenue: 3.1, commission: 0.36 },
  { month: "T3", revenue: 4.8, commission: 0.55 },
  { month: "T4", revenue: 3.9, commission: 0.42 },
  { month: "T5", revenue: 5.6, commission: 0.64 },
  { month: "T6", revenue: 7.2, commission: 0.81 },
];

const typeLabels = {
  apartment: "Căn hộ",
  house: "Nhà ở",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
  rental: "Cho thuê",
};

const pieColors = ["#15130f", "#d7b56d", "#7f5539", "#2f6f73", "#b45309", "#78716c"];

const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get("/properties?size=100");
        if (response.data.success) {
          setProperties(response.data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch admin dashboard properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const summary = useMemo(() => {
    const totalValue = properties.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return {
      total: properties.length,
      pending: properties.filter((item) => item.status === "pending").length,
      published: properties.filter((item) => item.status === "published").length,
      totalValue,
    };
  }, [properties]);

  const distribution = useMemo(() => {
    const grouped = properties.reduce((acc, item) => {
      const key = item.propertyType || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, value]) => ({
      type: typeLabels[type] || type,
      value,
    }));
  }, [properties]);

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
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Tổng quan vận hành</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Bảng điều khiển quản trị</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Theo dõi doanh thu, trạng thái kiểm duyệt và phân bổ nguồn hàng bất động sản trong hệ thống.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Cập nhật</p>
          <p className="text-sm font-black text-stone-900">{new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric title="Tổng BĐS" value={summary.total} icon={Building2} tone="dark" />
        <Metric title="Chờ duyệt" value={summary.pending} icon={Clock3} tone="gold" />
        <Metric title="Đã xuất bản" value={summary.published} icon={CheckCircle2} tone="green" />
        <Metric title="Tổng giá trị nguồn hàng" value={formatVnd(summary.totalValue)} icon={DollarSign} tone="brown" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-950">Doanh thu theo tháng</h2>
              <p className="text-sm font-medium text-stone-500">Đơn vị: tỷ VNĐ, hiển thị doanh thu và hoa hồng.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
              +28.4%
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#d7b56d" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#d7b56d" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#e7e0d4", fontWeight: 700 }}
                  formatter={(value, name) => [`${value} tỷ`, name === "revenue" ? "Doanh thu" : "Hoa hồng"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#15130f" strokeWidth={3} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="commission" stroke="#2f6f73" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-stone-950">Phân bổ loại BĐS</h2>
            <p className="text-sm font-medium text-stone-500">Dựa trên dữ liệu đang có trong hệ thống.</p>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">Đang tải...</div>
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
              <div className="flex h-full items-center justify-center text-sm font-bold text-stone-400">
                Chưa có dữ liệu BĐS.
              </div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {distribution.map((item, index) => (
              <div key={item.type} className="flex items-center gap-2 text-sm font-bold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                <span className="truncate">{item.type}</span>
                <span className="ml-auto text-stone-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-black text-stone-950">Khu vực có nhiều tin</h2>
          <p className="text-sm font-medium text-stone-500">Top quận/huyện theo số lượng bất động sản.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDistricts} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="#e7e0d4" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis dataKey="district" type="category" axisLine={false} tickLine={false} width={120} />
              <Tooltip formatter={(value) => [`${value} tin`, "Số lượng"]} />
              <Bar dataKey="count" fill="#d7b56d" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-stone-950">{value}</p>
    </div>
  );
}
