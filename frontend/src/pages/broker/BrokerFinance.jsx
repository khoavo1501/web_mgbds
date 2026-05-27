import { Wallet, TrendingUp, DollarSign, Loader2, Download, Filter, MoreVertical, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function BrokerFinance() {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'paid'

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

  const filteredCommissions = commissions.filter(comm => {
    if (filter === 'all') return true;
    if (filter === 'pending') return comm.status !== 'paid' && comm.status !== 'cancelled';
    if (filter === 'paid') return comm.status === 'paid';
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          Đã thanh toán
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          Đã hủy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        Đang xử lý
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-sans p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950 mb-2">Quản lý Thu nhập</h1>
          <p className="text-slate-600">Theo dõi dòng tiền và lịch sử hoa hồng từ các giao dịch thành công.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-[#f7f4ef] font-sans transition-colors font-semibold text-sm">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm">
            <Filter className="w-4 h-4" />
            Lọc dữ liệu
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Tổng thu nhập */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +12% tháng này
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">TỔNG THU NHẬP</p>
            <p className="text-3xl font-bold text-slate-950">{formatVnd(summary.total)}</p>
            <p className="text-xs text-slate-500 mt-2">Số lượng: 03 giao dịch</p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold mt-2">Chi tiết</button>
          </div>

          {/* Đang chờ thanh toán */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex items-center gap-1 text-yellow-600 text-sm font-semibold">
                Đang xử lý
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">ĐANG CHỜ THANH TOÁN</p>
            <p className="text-3xl font-bold text-slate-950">{formatVnd(summary.pending)}</p>
            <p className="text-xs text-slate-500 mt-2">Kỳ hạn dự kiến: 15/07</p>
            <button className="text-sm text-orange-600 hover:text-orange-700 font-semibold mt-2">Xem lịch</button>
          </div>

          {/* Đã thanh toán */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                Hoàn tất
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">ĐÃ THANH TOÁN</p>
            <p className="text-3xl font-bold text-slate-950">{formatVnd(summary.paid)}</p>
            <p className="text-xs text-slate-500 mt-2">Lần cuối: 2 ngày trước</p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold mt-2">Lịch sử</button>
          </div>
        </div>

        {/* Commission History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Lịch sử Hoa hồng</h3>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">Giao dịch: Tất cả</option>
              <option value="pending">Đang xử lý</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#f7f4ef] font-sans">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">MÃ GD</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">KHÁCH HÀNG</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">BẤT ĐỘNG SẢN</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">HOA HỒNG</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">TRẠNG THÁI</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
                      <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-base font-semibold text-slate-950 mb-1">Chưa có giao dịch nào</p>
                      <p className="text-sm text-slate-500">Các giao dịch phát sinh hoa hồng sẽ xuất hiện ở đây</p>
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((trx) => (
                    <tr key={trx.commissionId} className="hover:bg-[#f7f4ef] font-sans transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-950">{trx.transactionCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                            {(trx.customerName || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-semibold text-slate-950">{trx.customerName || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-950 font-medium max-w-xs truncate">{trx.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">+{formatVnd(trx.brokerAmount || trx.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(trx.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCommissions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Hiển thị 1 - 2 của 12 giao dịch
              </p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#f7f4ef] font-sans">
                  ‹
                </button>
                <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-semibold">
                  1
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#f7f4ef] font-sans">
                  2
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#f7f4ef] font-sans">
                  3
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#f7f4ef] font-sans">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
