import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Clock, Shield } from 'lucide-react';
import api from '../../services/api';
import { cancelAppointment } from '../../services/appointmentService';
import { useReputation } from '../../context/ReputationContext';

export default function CancelAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshScore } = useReputation();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancellationInfo, setCancellationInfo] = useState(null);

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
      // Gọi API mới để lấy thông tin chi tiết về việc hủy
      const response = await api.get(`/appointments/${id}/cancellation-info`);
      if (response.data.success) {
        const data = response.data.data;
        setAppointment(data);
        setCancellationInfo({
          hoursUntilAppointment: data.hoursUntilAppointment,
          isWithin24Hours: data.isWithin24Hours,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      alert('Không thể tải thông tin lịch hẹn');
      navigate('/customer/appointments');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmedStatus = () => {
    return appointment && (
      appointment.status === 'confirmed' || 
      appointment.status === 'scheduled' ||
      appointment.status === 'viewed'
    );
  };

  const getWarningLevel = () => {
    if (!cancellationInfo) return 'low';
    
    if (cancellationInfo.isWithin24Hours && isConfirmedStatus()) {
      return 'critical'; // Hủy trong 24h và đã confirmed
    } else if (isConfirmedStatus()) {
      return 'high'; // Đã confirmed nhưng còn > 24h
    } else if (cancellationInfo.isWithin24Hours) {
      return 'medium'; // Trong 24h nhưng chưa confirmed
    }
    return 'low'; // Pending và còn xa
  };

  const getWarningMessage = () => {
    const level = getWarningLevel();
    
    switch (level) {
      case 'critical':
        return {
          title: '⚠️ Cảnh báo nghiêm trọng',
          message: 'Hủy lịch đã xác nhận trong vòng 24 giờ có thể ảnh hưởng đến điểm uy tín và quyền đặt lịch sau này.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-900',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          title: '⚠️ Cảnh báo quan trọng',
          message: 'Lịch hẹn đã được môi giới xác nhận. Việc hủy lịch có thể ảnh hưởng đến điểm uy tín.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-900',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
      case 'medium':
        return {
          title: 'Lưu ý',
          message: 'Hủy lịch trong vòng 24 giờ có thể ảnh hưởng đến điểm uy tín.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-900',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          title: 'Thông tin',
          message: 'Lịch hẹn chưa được xác nhận. Bạn có thể hủy lịch mà không ảnh hưởng đến điểm uy tín.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
    }
  };

  const handleCancel = async () => {
    const warningLevel = getWarningLevel();
    
    // Bắt buộc phải chọn lý do nếu đã confirmed
    if (isConfirmedStatus() && !selectedReason) {
      alert('Vui lòng chọn lý do hủy lịch');
      return;
    }

    let reason = selectedReason;
    
    if (reason === 'Lý do khác') {
      if (!customReason.trim()) {
        alert('Vui lòng nhập lý do hủy');
        return;
      }
      reason = customReason;
    }

    // Confirmation message tùy theo mức độ nghiêm trọng
    let confirmMessage = 'Bạn có chắc chắn muốn hủy lịch hẹn này?';
    
    if (warningLevel === 'critical') {
      confirmMessage = 'Hủy lịch trong 24 giờ có thể ảnh hưởng đến điểm uy tín. Xác nhận hủy lịch?';
    } else if (warningLevel === 'high') {
      confirmMessage = 'Lịch đã được xác nhận. Hủy lịch sẽ ảnh hưởng đến điểm uy tín. Bạn có chắc chắn?';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await cancelAppointment(id, reason);
      if (response.success) {
        // Refresh điểm uy tín
        refreshScore();
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

  const warningConfig = getWarningMessage();
  const warningLevel = getWarningLevel();

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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      CĂN HỘ CAO CẤP
                    </span>
                    {isConfirmedStatus() && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        ĐÃ XÁC NHẬN
                      </span>
                    )}
                  </div>
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
                        {cancellationInfo && cancellationInfo.hoursUntilAppointment > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Còn {cancellationInfo.hoursUntilAppointment} giờ nữa
                          </p>
                        )}
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

            {/* Warning Box - Dynamic based on status and time */}
            <div className={`rounded-2xl p-6 border-2 ${warningConfig.bgColor} ${warningConfig.borderColor}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${warningConfig.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {warningLevel === 'critical' || warningLevel === 'high' ? (
                    <AlertTriangle className={`w-6 h-6 ${warningConfig.iconColor}`} />
                  ) : (
                    <Shield className={`w-6 h-6 ${warningConfig.iconColor}`} />
                  )}
                </div>
                <div>
                  <h3 className={`text-base font-bold ${warningConfig.textColor} mb-2`}>
                    {warningConfig.title}
                  </h3>
                  <p className={`text-sm ${warningConfig.textColor} leading-relaxed`}>
                    {warningConfig.message}
                  </p>
                  
                  {/* Reputation Impact Indicator */}
                  {warningLevel !== 'low' && (
                    <div className="mt-4 pt-4 border-t border-current/20">
                      <p className={`text-xs font-bold ${warningConfig.textColor} mb-2`}>
                        Ảnh hưởng đến điểm uy tín:
                      </p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded ${
                              i < (warningLevel === 'critical' ? 5 : warningLevel === 'high' ? 3 : 1)
                                ? warningConfig.iconBg
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cancel Reasons */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Lý do hủy lịch
                {isConfirmedStatus() && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </h2>
              {isConfirmedStatus() && (
                <p className="text-sm text-gray-600 mb-4">
                  Bắt buộc phải chọn lý do vì lịch hẹn đã được xác nhận
                </p>
              )}
              
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
                    placeholder="Nhập chi tiết lý do..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                disabled={isConfirmedStatus() && !selectedReason}
                className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all ${
                  isConfirmedStatus() && !selectedReason
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : warningLevel === 'critical'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
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
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${
                  isConfirmedStatus() 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {isConfirmedStatus() ? 'Đã xác nhận' : 'Chờ xác nhận'}
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
                    <p className="text-xs text-gray-500 mb-1">Môi giới</p>
                    <p className="text-sm font-bold text-gray-900">{appointment.brokerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mã lịch hẹn</p>
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
