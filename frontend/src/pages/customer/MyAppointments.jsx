import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Phone, Mail, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { getMyAppointments } from '../../services/appointmentService';

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, [page, filterStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getMyAppointments(page, 10);
      if (response.success) {
        let filtered = response.data.content;
        if (filterStatus !== 'all') {
          filtered = filtered.filter(apt => apt.status === filterStatus);
        }
        setAppointments(filtered);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Lỗi khi tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xác nhận' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã hoàn thành' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bị từ chối' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Lịch hẹn của tôi</h1>
        <p className="text-gray-600">Quản lý các lịch hẹn xem bất động sản của bạn một cách dễ dàng.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-colors ${
            filterStatus === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterStatus('confirmed')}
          className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-colors ${
            filterStatus === 'confirmed'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sắp tới
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-colors ${
            filterStatus === 'pending'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Chờ xác nhận
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-colors ${
            filterStatus === 'completed'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Đã hoàn thành
        </button>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
          <p className="text-gray-500 mb-6">Hãy đặt lịch xem bất động sản yêu thích của bạn</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Khám phá bất động sản
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentId} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Property Image */}
                <div className="md:w-72 h-64 md:h-auto bg-gray-200 flex-shrink-0">
                  {appointment.propertyImage ? (
                    <img
                      src={appointment.propertyImage}
                      alt={appointment.propertyTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(appointment.propertyTitle)}`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://via.placeholder.com/400x300?text=${encodeURIComponent(appointment.propertyTitle)}`}
                      alt={appointment.propertyTitle}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {appointment.propertyTitle}
                      </h3>
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900 font-medium">{appointment.propertyAddress}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.propertyAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 mt-1"
                          >
                            <MapPin className="w-3 h-3" />
                            Xem bản đồ
                          </a>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Thời gian</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">{formatDateTime(appointment.scheduledAt)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">{appointment.contactPhone || appointment.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Môi giới</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">{appointment.brokerName}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">E-mail</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">{appointment.brokerEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {appointment.note && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Ghi chú:</p>
                      <p className="text-gray-700 italic">"{appointment.note}"</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}`)}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </button>

                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <>
                        <button
                          onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}/reschedule`)}
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Dời lịch
                        </button>

                        <button
                          onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}/cancel`)}
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hủy lịch
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {totalPages > 1 && page < totalPages - 1 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
          >
            Xem thêm lịch hẹn ▼
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
