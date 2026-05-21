import { useEffect, useState } from 'react';
import { Calendar, Filter, Search, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import appointmentService from '../../services/appointmentService';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    brokerId: '',
    customerId: '',
    propertyId: '',
    startDate: '',
    endDate: '',
  });

  const fetchAppointments = async (page = 0) => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointmentsForAdmin(page, 10, filters);
      if (response.success) {
        setAppointments(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await appointmentService.getAppointmentStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchStatistics();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchAppointments(0);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      brokerId: '',
      customerId: '',
      propertyId: '',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => fetchAppointments(0), 100);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700 border-red-200' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-950">Quản lý lịch hẹn</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Theo dõi và quản lý tất cả lịch hẹn xem bất động sản
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tổng lịch hẹn</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{statistics.total || 0}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Chờ xác nhận</p>
                  <p className="mt-2 text-3xl font-extrabold text-yellow-600">{statistics.pending || 0}</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Đã xác nhận</p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-600">{statistics.confirmed || 0}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Hoàn thành</p>
                  <p className="mt-2 text-3xl font-extrabold text-green-600">{statistics.completed || 0}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-950">Bộ lọc</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">ID Môi giới</label>
              <input
                type="text"
                value={filters.brokerId}
                onChange={(e) => handleFilterChange('brokerId', e.target.value)}
                placeholder="Nhập ID môi giới"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">ID Khách hàng</label>
              <input
                type="text"
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
                placeholder="Nhập ID khách hàng"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">ID Bất động sản</label>
              <input
                type="text"
                value={filters.propertyId}
                onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                placeholder="Nhập ID BĐS"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Search className="h-4 w-4" />
              Áp dụng
            </button>
            <button
              onClick={handleClearFilters}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Môi giới
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Bất động sản
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                      Không có lịch hẹn nào
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.appointmentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        #{appointment.appointmentId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {appointment.customerName || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">{appointment.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {appointment.brokerName || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">{appointment.brokerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-sm font-medium text-slate-900">
                          {appointment.propertyTitle || `BĐS #${appointment.propertyId}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {formatDateTime(appointment.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(appointment.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <div className="text-sm font-medium text-slate-600">
                Trang {currentPage + 1} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAppointments(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => fetchAppointments(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
