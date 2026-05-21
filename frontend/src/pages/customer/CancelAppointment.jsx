import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { cancelAppointment } from '../../services/appointmentService';

export default function CancelAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const cancelReasons = [
    'Tôi đã đổi ý',
    'Đã tìm được bất động sản khác',
    'Có việc đột xuất không thể tham gia',
    'Lý do khác'
  ];

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      alert('Không thể tải thông tin lịch hẹn');
      navigate('/customer/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    let reason = selectedReason;
    
    if (!reason) {
      alert('Vui lòng chọn lý do hủy lịch');
      return;
    }

    if (reason === 'Lý do khác') {
      if (!customReason.trim()) {
        alert('Vui lòng nhập lý do hủy');
        return;
      }
      reason = customReason;
    }

    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      return;
    }

    try {
      const response = await cancelAppointment(id, reason);
      if (response.success) {
        alert('Hủy lịch thành công!');
        navigate('/customer/appointments');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi hủy lịch');
    }
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer/appointments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Hủy lịch hẹn</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointment Info & Reasons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Thông tin lịch hẹn</h2>
              
              <div className="flex gap-4">
                {/* Property Image */}
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  {appointment.propertyImage ? (
                    <img
                      src={appointment.propertyImage}
                      alt={appointment.propertyTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full mb-2">
                    CĂN HỘ CAO CẤP
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {appointment.propertyTitle}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-900 font-semibold">
                          {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}, {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{appointment.propertyAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-900 mb-2">Lưu ý quan trọng</h3>
                  <p className="text-sm text-red-800 leading-relaxed">
                    Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị xóa khỏi hệ thống và chuyên viên tư vấn sẽ được thông báo. Việc hủy lịch quá sớt giờ có thể ảnh hưởng đến điểm uy tín của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel Reasons */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Lý do hủy lịch</h2>
              
              <div className="space-y-3">
                {cancelReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all ${
                      selectedReason === reason
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-900'
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Custom Reason Input */}
              {selectedReason === 'Lý do khác' && (
                <div className="mt-4">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows="4"
                    placeholder="Nhập chi tiết lý do (không bắt buộc)..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Xác nhận hủy lịch hẹn
              </button>
              <button
                onClick={() => navigate('/customer/appointments')}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-lg transition-all"
              >
                Giữ lịch hẹn
              </button>
            </div>
          </div>

          {/* Right Column - Property Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-200">
                {appointment.propertyImage ? (
                  <img
                    src={appointment.propertyImage}
                    alt={appointment.propertyTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Đang xem xét
                </span>
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {appointment.propertyTitle}
                </h3>
                <p className="text-gray-600 flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span className="text-sm">{appointment.propertyAddress}</span>
                </p>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                    <p className="text-sm font-bold text-gray-900">{appointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mã yêu cầu</p>
                    <p className="text-sm font-bold text-gray-900">#{appointment.appointmentId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
