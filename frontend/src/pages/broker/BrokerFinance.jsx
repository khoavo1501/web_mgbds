import { Wallet, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import StatCard from "../../components/StatCard";
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function BrokerFinance() {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, summaryRes] = await Promise.all([
        api.get("/commissions"),
        api.get("/commissions/summary")
      ]);
      if (commRes.data.success) {
        setCommissions(commRes.data.data);
      }
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu hoa hồng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatVnd = (value) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " VNĐ";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Thu nhập</h1>
        <p className="text-slate-500">Xem thống kê và lịch sử hoa hồng giao dịch của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Tổng thu nhập" value={formatVnd(summary.total)} trend={0} icon={Wallet} />
        <StatCard title="Đang chờ thanh toán" value={formatVnd(summary.pending)} trend={0} icon={DollarSign} />
        <StatCard title="Đã thanh toán" value={formatVnd(summary.paid)} trend={0} icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-800">Lịch sử Hoa hồng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã GD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bất động sản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hoa hồng của bạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                    Chưa có giao dịch nào phát sinh hoa hồng.
                  </td>
                </tr>
              ) : (
                commissions.map((trx) => (
                  <tr key={trx.commissionId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{trx.transactionCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.customerName || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-[200px]">{trx.propertyTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">+{formatVnd(trx.brokerAmount || trx.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${trx.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : trx.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {trx.status === 'paid' ? 'Hoàn thành' : trx.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
