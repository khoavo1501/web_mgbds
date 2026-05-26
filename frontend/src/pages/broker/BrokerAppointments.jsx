import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Phone, 
  CheckCircle, XCircle, Eye, Filter, MoreVertical, Edit
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
        alert(`Đã ${newStatus === 'confirmed' ? 'xác nhận' : newStatus === 'completed' ? 'hoàn tất' : 'từ chối'} lịch hẹn`);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Không thể cập nhật lịch hẹn');
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
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'Đã xác nhận' 
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
              apt.status === 'scheduled' || apt.status === 'viewed');
    }
    if (filter === 'confirmed') {
      return apt.status === 'confirmed' || apt.status === 'scheduled' || apt.status === 'viewed';
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === 'all' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === 'upcoming' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sắp tới
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === 'pending' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Chờ xác nhận
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === 'confirmed' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Đã xác nhận
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === 'completed' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hoàn tất
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <Calendar className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Appointments Grid */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Không có lịch hẹn</h3>
            <p className="text-slate-600 text-sm">Chưa có lịch hẹn nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.appointmentId} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Card Header - Customer Info */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        appointment.status === 'pending' ? 'bg-blue-100' :
                        appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'viewed' ? 'bg-emerald-100' :
                        'bg-slate-100'
                      }`}>
                        <User className={`w-6 h-6 ${
                          appointment.status === 'pending' ? 'text-blue-600' :
                          appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'viewed' ? 'text-emerald-600' :
                          'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{appointment.customerName}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
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
                  <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                    {appointment.propertyImage && (
                      <img 
                        src={appointment.propertyImage} 
                        alt={appointment.propertyTitle}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm mb-1.5 line-clamp-1">
                        {appointment.propertyTitle}
                      </h4>
                      <p className="text-xs text-slate-600 flex items-start gap-1 mb-2">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{appointment.propertyAddress}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
                    <div className="mb-4 p-3 bg-emerald-50 rounded-xl border-l-3 border-l-emerald-400">
                      <div className="flex gap-2">
                        <span className="text-emerald-600 text-lg leading-none mt-0.5">"</span>
                        <p className="text-sm text-slate-700 italic line-clamp-2 flex-1">
                          {appointment.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-sm shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointmentId, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm border border-red-200"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                        <button className="px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'viewed') && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold text-sm shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết báo cáo
                        </button>
                        <button className="px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        Chỉ đường & Liên hệ
                      </button>
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
