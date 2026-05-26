import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, 
  CheckCircle, XCircle, Edit, MessageSquare, Building2,
  AlertCircle, FileText, MapPinned, BedDouble, Bath, Maximize,
  DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import SuccessModal from '../../components/common/SuccessModal';

export default function BrokerAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [brokerNote, setBrokerNote] = useState('');

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.data);
        const scheduledDate = new Date(response.data.data.scheduledAt);
        setNewDate(scheduledDate.toISOString().split('T')[0]);
        setNewTime(scheduledDate.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      alert('Không thể tải thông tin lịch hẹn');
      navigate('/broker/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await api.put(`/appointments/${id}`, {
        status: newStatus,
        note: brokerNote || appointment.note
      });
      
      if (response.data.success) {
        alert(`Đã ${newStatus === 'confirmed' ? 'xác nhận' : newStatus === 'completed' ? 'hoàn tất' : 'từ chối'} lịch hẹn`);
        fetchAppointmentDetail();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Không thể cập nhật lịch hẹn');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      const scheduledAt = `${newDate}T${newTime}:00`;
      const response = await api.put(`/appointments/${id}`, {
        scheduledAt: scheduledAt,
        note: brokerNote || 'Môi giới đề xuất dời lịch'
      });
      
      if (response.data.success) {
        setShowRescheduleModal(false);
        setShowSuccessModal(true);
        fetchAppointmentDetail();
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      alert('❌ Không thể dời lịch: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        dot: 'bg-amber-500',
        label: 'Chờ xác nhận',
        icon: AlertCircle
      },
      confirmed: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        dot: 'bg-emerald-500',
        label: 'Đã xác nhận',
        icon: CheckCircle
      },
      scheduled: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        dot: 'bg-emerald-500',
        label: 'Đã xác nhận',
        icon: CheckCircle
      },
      viewed: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        dot: 'bg-emerald-500',
        label: 'Đã xác nhận',
        icon: CheckCircle
      },
      completed: { 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        dot: 'bg-slate-500',
        label: 'Hoàn tất',
        icon: CheckCircle
      },
      cancelled: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        dot: 'bg-red-500',
        label: 'Đã hủy',
        icon: XCircle
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        dot: 'bg-red-500',
        label: 'Từ chối',
        icon: XCircle
      }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${badge.bg} ${badge.text} border border-${badge.text.replace('text-', '')}/20`}>
        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
        {badge.label}
      </span>
    );
  };

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

  if (!appointment) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-semibold text-lg">Không tìm thấy lịch hẹn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <button
              onClick={() => navigate('/broker/appointments')}
              className="hover:text-slate-900 transition-colors"
            >
              Appointments
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold text-slate-900">Detail #APT-{appointment.appointmentId}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết lịch hẹn</h1>
            <div className="flex items-center gap-3">
              {appointment.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-semibold text-sm border border-amber-200">
                    ● Chờ xác nhận
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                  >
                    Dời lịch
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm"
                  >
                    Xác nhận lịch hẹn
                  </button>
                </>
              )}
              {(appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'viewed') && (
                <>
                  {getStatusBadge(appointment.status)}
                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                  >
                    Dời lịch
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('completed')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-sm"
                  >
                    Đánh dấu hoàn tất
                  </button>
                </>
              )}
              {appointment.status === 'completed' && getStatusBadge(appointment.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Property Image */}
                  {appointment.propertyImage && (
                    <div className="flex-shrink-0">
                      <img 
                        src={appointment.propertyImage} 
                        alt={appointment.propertyTitle}
                        className="w-48 h-48 object-cover rounded-xl"
                      />
                    </div>
                  )}
                  
                  {/* Property Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">{appointment.propertyTitle}</h2>
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          Nhà riêng
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-slate-600 mb-4">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">{appointment.propertyAddress}</p>
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Maximize className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">85 m²</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">4 Phòng ngủ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">3 WC</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-slate-900">12.5 Tỷ</p>
                    </div>

                    {/* View Details Link */}
                    <a
                      href={`/properties/${appointment.propertyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Xem chi tiết căn hộ
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Thông tin lịch hẹn
                </h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Ngày hẹn</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Thời gian</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Địa điểm</p>
                    <p className="font-semibold text-slate-900">Tại vị trí bất động sản</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Request Card */}
            {appointment.note && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Yêu cầu khách hàng
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-slate-300">
                    <p className="text-slate-700 italic">
                      <span className="font-semibold not-italic">"</span>
                      {appointment.note}
                      <span className="font-semibold not-italic">"</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Broker Notes Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Ghi chú của môi giới
                </h3>
                <textarea
                  value={brokerNote}
                  onChange={(e) => setBrokerNote(e.target.value)}
                  placeholder="Nhập ghi chú nội bộ về khách hàng hoặc lịch trình chuẩn bị..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-sm"
                />
                <button className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-sm">
                  Lưu ghi chú
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
                  Thông tin khách hàng
                </h3>
                
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{appointment.customerName}</h4>
                  <p className="text-sm text-slate-600">Khách hàng tiềm năng • Hà Nội</p>
                </div>

                <div className="space-y-3 mb-4">
                  <a
                    href={`tel:${appointment.customerPhone}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">{appointment.customerPhone}</span>
                  </a>
                  <a
                    href={`mailto:${appointment.customerEmail}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900 truncate">{appointment.customerEmail}</span>
                  </a>
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-sm">
                  <MessageSquare className="w-4 h-4" />
                  Chat với khách hàng
                </button>
              </div>
            </div>

            {/* Interaction History Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
                  Lịch sử tương tác
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Yêu cầu đặt lịch</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} • 10:15
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Liên hệ qua điện thoại</p>
                      <p className="text-xs text-slate-600 mt-0.5">22/05/2026 • 15:30</p>
                      <p className="text-xs text-slate-500 mt-1 italic">Khách gọi lại về thủ tục sang tên.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Khách xem tin đăng</p>
                      <p className="text-xs text-slate-600 mt-0.5">22/05/2026 • 09:12</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Dời lịch hẹn</h3>
            </div>
            <form onSubmit={handleReschedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày mới</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Giờ mới</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lý do dời lịch (tùy chọn)</label>
                <textarea
                  value={brokerNote}
                  onChange={(e) => setBrokerNote(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do dời lịch..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Đã dời lịch hẹn thành công!"
        message="Lịch hẹn đã được cập nhật với thời gian mới."
        details={[
          {
            icon: 'bell',
            label: 'Thông báo',
            text: 'Thông báo đã được gửi đến khách hàng.'
          },
          {
            icon: 'user',
            label: 'Yêu cầu xác nhận',
            text: 'Khách hàng cần xác nhận lại lịch hẹn mới.'
          },
          {
            icon: 'clock',
            label: 'Trạng thái',
            text: 'Chờ xác nhận'
          }
        ]}
      />
    </div>
  );
}
