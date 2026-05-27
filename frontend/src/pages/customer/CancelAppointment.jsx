import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Clock, Shield } from 'lucide-react';
import api from '../../services/api';
import { cancelAppointment, getCancellationInfo } from '../../services/appointmentService';
import { useReputation } from '../../context/ReputationContext';
import CancelWarningModal from '../../components/common/CancelWarningModal';
import { useToast } from '../../context/ToastContext';

export default function CancelAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshScore } = useReputation();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

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
      const response = await getCancellationInfo(id);
      console.log('Cancellation info response:', response);
      
      if (response.success) {
        const data = response.data;
        setAppointment(data);
        setCancellationInfo({
          hoursUntilAppointment: data.hoursUntilAppointment,
          isWithin24Hours: data.isWithin24Hours,
          status: data.status,
          isConfirmed: data.isConfirmed,
          cancelPointsPenalty: data.cancelPointsPenalty
        });
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
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
    // Bắt buộc phải chọn lý do nếu đã confirmed
    if (isConfirmedStatus() && !selectedReason) {
      toast.error('Vui lòng chọn lý do hủy lịch');
      return;
    }

    let reason = selectedReason;
    
    if (reason === 'Lý do khác') {
      if (!customReason.trim()) {
        toast.error('Vui lòng nhập lý do hủy');
        return;
      }
      reason = customReason;
    }

    // Hiển thị modal cảnh báo
    setShowWarningModal(true);
  };

  const performCancel = async () => {
    try {
      let reason = selectedReason;
      if (reason === 'Lý do khác') {
        reason = customReason;
      }

      const response = await cancelAppointment(id, reason);
      if (response.success) {
        // Refresh điểm uy tín
        refreshScore();
        toast.success('Hủy lịch thành công!');
        navigate('/customer/appointments');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch');
    }
  };

  const handleConfirmCancel = async () => {
    setShowWarningModal(false);
    await performCancel();
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
    <div className="min-h-screen bg-[#f7f4ef] py-10 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer/appointments')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-950 mb-8 font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        {/* Cancel Warning Modal */}
        <CancelWarningModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onConfirm={handleConfirmCancel}
          hoursUntil={cancellationInfo?.hoursUntilAppointment || 0}
          pointsPenalty={cancellationInfo?.cancelPointsPenalty || 0}
          isWithin24Hours={cancellationInfo?.isWithin24Hours || false}
          isConfirmed={cancellationInfo?.isConfirmed || false}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 tracking-tight">Hủy lịch hẹn</h1>
          <p className="text-slate-600 font-medium">Vui lòng cung cấp lý do hủy để chúng tôi hỗ trợ bạn tốt hơn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointment Info & Reasons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning Box - Dynamic based on status and time */}
            <div className={`rounded-[2rem] p-6 sm:p-8 border-2 premium-shadow ${warningConfig.bgColor} ${warningConfig.borderColor}`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${warningConfig.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {warningLevel === 'critical' || warningLevel === 'high' ? (
                    <AlertTriangle className={`w-6 h-6 ${warningConfig.iconColor}`} />
                  ) : (
                    <Shield className={`w-6 h-6 ${warningConfig.iconColor}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-black ${warningConfig.textColor} mb-2`}>
                    {warningConfig.title}
                  </h3>
                  <p className={`text-sm font-medium ${warningConfig.textColor} leading-relaxed opacity-90`}>
                    {warningConfig.message}
                  </p>
                  
                  {/* Reputation Impact Indicator */}
                  {warningLevel !== 'low' && (
                    <div className="mt-5 pt-5 border-t border-current/10">
                      <p className={`text-[10px] uppercase tracking-widest font-black ${warningConfig.textColor} mb-2 opacity-80`}>
                        Mức độ ảnh hưởng uy tín:
                      </p>
                      <div className="flex gap-1.5 max-w-xs">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 flex-1 rounded-full ${
                              i < (warningLevel === 'critical' ? 5 : warningLevel === 'high' ? 3 : 1)
                                ? warningConfig.iconBg.replace('100', '400')
                                : 'bg-white/40'
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
            <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-950 mb-2 flex items-center gap-2">
                Lý do hủy lịch
                {isConfirmedStatus() && (
                  <span className="text-rose-500" title="Bắt buộc">*</span>
                )}
              </h2>
              {isConfirmedStatus() && (
                <p className="text-xs font-bold text-rose-500 mb-6 bg-rose-50 inline-block px-3 py-1.5 rounded-lg">
                  Bắt buộc phải chọn lý do vì lịch hẹn đã được xác nhận
                </p>
              )}
              
              <div className="space-y-3 mt-4">
                {cancelReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      selectedReason === reason
                        ? 'bg-slate-950 text-white shadow-lg scale-[1.01]'
                        : 'bg-[#f8f6f2] text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Custom Reason Input */}
              {selectedReason === 'Lý do khác' && (
                <div className="mt-5 animate-in slide-in-from-top-2">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows="4"
                    placeholder="Nhập chi tiết lý do (ít nhất 10 ký tự)..."
                    className="w-full px-5 py-4 bg-[#f8f6f2] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-950 focus:border-slate-950 text-sm font-medium text-slate-900 outline-none transition-all resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate('/customer/appointments')}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-black transition-all premium-shadow order-2 sm:order-1 sm:w-1/3"
              >
                Giữ lịch hẹn
              </button>
              <button
                onClick={handleCancel}
                disabled={isConfirmedStatus() && !selectedReason}
                className={`px-8 py-4 rounded-2xl font-black transition-all order-1 sm:order-2 sm:w-2/3 flex items-center justify-center gap-2 ${
                  isConfirmedStatus() && !selectedReason
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : warningLevel === 'critical'
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 hover:-translate-y-0.5'
                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 hover:-translate-y-0.5'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                Xác nhận hủy lịch
              </button>
            </div>
          </div>

          {/* Right Column - Property Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] premium-shadow border border-slate-100 overflow-hidden sticky top-8">
              {/* Property Image */}
              <div className="relative h-56 bg-slate-100">
                {appointment.propertyImage ? (
                  <img
                    src={appointment.propertyImage}
                    alt={appointment.propertyTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                
                <span className={`absolute top-4 left-4 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  isConfirmedStatus() 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                }`}>
                  {isConfirmedStatus() ? 'Đã xác nhận' : 'Chờ xác nhận'}
                </span>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-1">Mã lịch hẹn</p>
                  <p className="text-white font-mono text-lg tracking-wider">#{appointment.appointmentId}</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-lg font-black text-slate-950 mb-3 line-clamp-2 leading-tight">
                  {appointment.propertyTitle}
                </h3>
                <div className="flex items-start gap-2 mb-6">
                  <div className="p-1.5 bg-slate-50 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 leading-relaxed">{appointment.propertyAddress}</span>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Calendar className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời gian xem</p>
                      <p className="text-sm font-bold text-slate-950">
                        {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Shield className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Chuyên viên tư vấn</p>
                      <p className="text-sm font-bold text-slate-950">{appointment.brokerName}</p>
                    </div>
                  </div>
                </div>
                
                {cancellationInfo && cancellationInfo.hoursUntilAppointment > 0 && (
                  <div className="mt-6 p-4 bg-[#f8f6f2] rounded-2xl border border-slate-200/60 flex items-center gap-3">
                     <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                     <p className="text-xs font-bold text-slate-600">
                        Còn <span className="text-slate-950 font-black">{cancellationInfo.hoursUntilAppointment} giờ</span> nữa đến thời gian hẹn.
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
