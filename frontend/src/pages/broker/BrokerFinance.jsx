import { Wallet, TrendingUp, DollarSign } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function BrokerFinance() {
  const transactions = [
    { id: "TRX-001", client: "Nguyễn Văn A", property: "Căn hộ Vinhomes Central Park", amount: 12000000, date: "2024-03-15", status: "completed" },
    { id: "TRX-002", client: "Trần Thị B", property: "Biệt thự Thảo Điền", amount: 35000000, date: "2024-03-10", status: "completed" },
    { id: "TRX-003", client: "Lê Văn C", property: "Đất nền Quận 9", amount: 8000000, date: "2024-03-05", status: "pending" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Thu nhập</h1>
        <p className="text-slate-500">Xem thống kê và lịch sử hoa hồng giao dịch của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Tổng thu nhập (Tháng này)" value="47,000,000 VNĐ" trend={15} icon={Wallet} />
        <StatCard title="Đang chờ thanh toán" value="8,000,000 VNĐ" trend={0} icon={DollarSign} />
        <StatCard title="Giao dịch thành công" value="2" trend={5} icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-800">Lịch sử Hoa hồng</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã GD</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bất động sản</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Số tiền (VNĐ)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((trx) => (
              <tr key={trx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{trx.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{trx.property}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">+{trx.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{trx.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {trx.status === 'completed' ? 'Đã nhận' : 'Đang xử lý'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
