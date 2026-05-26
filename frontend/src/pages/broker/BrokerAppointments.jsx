import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Phone, 
  CheckCircle, XCircle, Eye, Filter, MoreVertical, Edit, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function BrokerAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        const actionLabels = {
          confirmed: 'xác nhận',
          viewed: 'xác nhận đã dẫn xem nhà',
          completed: 'hoàn tất',
          rejected: 'từ chối'
        };
        alert(`Đã ${actionLabels[newStatus] || 'cập nhật'} lịch hẹn`);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Không thể cập nhật lịch hẹn');
    }
  };

  const handleRescheduleDirectPayment = async (appointment) => {
    const currentValue = appointment.scheduledAt ? appointment.scheduledAt.slice(0, 16) : '';
    const nextValue = window.prompt('Nhập thời gian mới cho lịch giao dịch trực tiếp (YYYY-MM-DDTHH:mm)', currentValue);
    if (!nextValue) return;
    try {
      const response = await api.put(`/appointments/${appointment.appointmentId}`, {
        scheduledAt: `${nextValue}:00`,
        note: 'Môi giới đề xuất dời lịch giao dịch trực tiếp',
      });
      if (response.data.success) {
        alert('Đã dời lịch giao dịch trực tiếp, chờ xác nhận lại lịch');
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể dời lịch giao dịch trực tiếp');
    }
  };

  const handleConfirmDirectPayment = async (appointment) => {
    if (!appointment.transactionId) {
      alert('Không tìm thấy giao dịch liên kết với lịch giao dịch trực tiếp này');
      return;
    }
    try {
      const response = await api.patch(`/transactions/${appointment.transactionId}/broker-confirm`);
      if (response.data.success) {
        alert('Đã xác nhận giao dịch trực tiếp thành công');
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xác nhận giao dịch trực tiếp');
    }
  };

  const handleRejectDirectPayment = async (appointment) => {
    if (!appointment.transactionId) {
      alert('Không tìm thấy giao dịch liên kết với lịch giao dịch trực tiếp này');
      return;
    }
    if (!window.confirm('Xác nhận giao dịch trực tiếp thất bại?')) return;
    try {
      const response = await api.patch(`/transactions/${appointment.transactionId}/broker-reject`);
      if (response.data.success) {
        alert('Đã xác nhận giao dịch trực tiếp thất bại');
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật giao dịch trực tiếp');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700',
        label: 'Chờ xác nhận' 
      },
      confirmed: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'Đã xác nhận' 
      },
      scheduled: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'Đã xác nhận' 
      },
      viewed: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        label: 'Đã dẫn xem nhà' 
      },
      deal_scheduled: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        label: 'Lịch giao dịch trực tiếp'
      },
      completed: { 
        bg: 'bg-slate-100', 
        text: 'text-slate-700',
        label: 'Hoàn tất' 
      },
      cancelled: { 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        label: 'Đã hủy' 
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        label: 'Từ chối' 
      }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {badge.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return (apt.status === 'pending' || apt.status === 'confirmed' || 
              apt.status === 'scheduled' || apt.status === 'deal_scheduled');
    }
    if (filter === 'confirmed') {
      return apt.status === 'confirmed' || apt.status === 'scheduled';
    }
    return apt.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Lịch hẹn</h1>
          <p className="text-gray-600">Theo dõi và quản lý lịch xem nhà, lịch giao dịch trực tiếp của khách hàng.</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tất cả ({appointments.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'upcoming' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Sắp tới ({appointments.filter(a => ['pending', 'confirmed', 'scheduled', 'deal_scheduled'].includes(a.status)).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'pending' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Chờ xác nhận ({appointments.filter(a => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'confirmed' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Đã xác nhận ({appointments.filter(a => ['confirmed', 'scheduled'].includes(a.status)).length})
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'viewed' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Đã dẫn xem nhà ({appointments.filter(a => a.status === 'viewed').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filter === 'completed' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Hoàn tất ({appointments.filter(a => a.status === 'completed').length})
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Appointments Grid */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có lịch hẹn</h3>
            <p className="text-gray-600 text-sm">Chưa có lịch hẹn nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.appointmentId} 
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
              >
                {/* Card Header - Customer Info */}
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg ${
                        appointment.status === 'pending' ? 'bg-yellow-500' :
                        appointment.status === 'confirmed' || appointment.status === 'scheduled' ? 'bg-green-500' :
                        appointment.status === 'deal_scheduled' ? 'bg-indigo-500' :
                        appointment.status === 'viewed' ? 'bg-blue-500' :
                        appointment.status === 'completed' ? 'bg-gray-500' :
                        'bg-gray-400'
                      }`}>
                        {appointment.customerName?.charAt(0).toUpperCase() || 'K'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{appointment.customerName}</h3>
                        {appointment.appointmentType === 'direct_payment' && (
                          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700">Giao dịch trực tiếp</p>
                        )}
                        <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          {appointment.customerPhone}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-5">
                  <div className="flex gap-3 mb-4">
                    {appointment.propertyImage && (
                      <img 
                        src={appointment.propertyImage} 
                        alt={appointment.propertyTitle}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
                        {appointment.propertyTitle}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-start gap-1.5 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{appointment.propertyAddress}</span>
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {appointment.note && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-gray-700 italic line-clamp-2">
                        "{appointment.note}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận lịch
                        </button>
                        <button
                          onClick={() => handleRescheduleDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-bold text-sm border-2 border-indigo-200"
                        >
                          <Edit className="w-4 h-4" />
                          Dời lịch
                        </button>

                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm border-2 border-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                        <button className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleConfirmDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận đã thanh toán
                        </button>
                        <button
                          onClick={() => handleRejectDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm border-2 border-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                          Giao dịch thất bại
                        </button>
                        <button
                          onClick={() => handleRescheduleDirectPayment(appointment)}
                          className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                          title="Dời lịch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && (appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết & Liên hệ lại
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'viewed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Đã dẫn xem nhà
                        </button>
                        <button className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.status === 'viewed' && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/transactions/create?appointmentId=${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-bold text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Tạo giao dịch cọc
                        </button>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && appointment.status === 'completed' && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Chấp nhận
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm border-2 border-red-300">
                          <XCircle className="w-4 h-4" />
                          Hủy yêu cầu
                        </button>
                      </>
                    )}
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'completed' && (
                      <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                        Đã xác nhận giao dịch trực tiếp
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
