import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, AlertCircle, UserRound } from 'lucide-react';
import api from '../../services/api';
import { updateAppointment, getRescheduleInfo } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { useReputation } from '../../context/ReputationContext';
import RescheduleWarningModal from '../../components/common/RescheduleWarningModal';
import { useToast } from '../../context/ToastContext';

export default function RescheduleAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { refreshScore } = useReputation();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [rescheduleInfo, setRescheduleInfo] = useState(null);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    note: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const morningSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00'
  ];

  const afternoonSlots = [
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00'
  ];

  useEffect(() => {
    fetchAppointmentDetail();
    // Auto-fill contact info from logged-in user
    if (user) {
      setRescheduleData(prev => ({
        ...prev,
        contactName: user.fullName || '',
        contactPhone: user.phone || '',
        contactEmail: user.email || ''
      }));
    }
  }, [id, user]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.data);
        fetchBookedAppointments(response.data.data.propertyId);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
      navigate('/customer/appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedAppointments = async (propertyId) => {
    try {
      const response = await api.get(`/appointments/property/${propertyId}`);
      if (response.data.success) {
        setBookedAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching property appointments:', error);
    }
  };

  const isTimeSlotBooked = (dateStr, timeSlot) => {
    if (!dateStr) return false;
    const [startTime] = timeSlot.split(' - ');
    const timeString = `${startTime}:00`;
    
    return bookedAppointments.some(app => {
       if (app.appointmentId === parseInt(id)) return false;
       if (['cancelled', 'rejected'].includes(app.status)) return false;
       if (!app.scheduledAt) return false;
       const appDateStr = app.scheduledAt.split('T')[0];
       const appTimeStr = app.scheduledAt.split('T')[1]?.substring(0, 8);
       return appDateStr === dateStr && appTimeStr === timeString;
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!rescheduleData.scheduledDate) {
      toast.error('Vui lòng chọn ngày xem nhà mới');
      return;
    }

    if (!rescheduleData.scheduledTime) {
      toast.error('Vui lòng chọn khung giờ');
      return;
    }

    // Note is optional
    // if (!rescheduleData.note || !rescheduleData.note.trim()) {
    //   toast.error('Vui lòng nhập lý do thay đổi');
    //   return;
    // }

    // Combine date and time
    const [startTime] = rescheduleData.scheduledTime.split(' - ');
    const scheduledAt = `${rescheduleData.scheduledDate}T${startTime}:00`;

    // Check if time is in the future
    const selectedDateTime = new Date(scheduledAt);
    const now = new Date();
    if (selectedDateTime <= now) {
      toast.error('Vui lòng chọn thời gian trong tương lai');
      return;
    }

    // Kiểm tra xem lịch hẹn đã được confirmed chưa
    try {
      const infoResponse = await getRescheduleInfo(id);
      console.log('Reschedule info response:', infoResponse);
      
      if (infoResponse.success && infoResponse.data) {
        const info = infoResponse.data;
        setRescheduleInfo(info);
        
        console.log('Is confirmed:', info.isConfirmed);
        console.log('Points penalty:', info.reschedulePointsPenalty);
        
        // Nếu lịch hẹn đã confirmed và có penalty (số âm), hiển thị modal cảnh báo
        if (info.isConfirmed && info.reschedulePointsPenalty !== null && info.reschedulePointsPenalty !== undefined) {
          setShowWarningModal(true);
          return;
        }
      }
      
      // Nếu chưa confirmed hoặc không có penalty, dời lịch trực tiếp
      await performReschedule();
    } catch (error) {
      console.error('Error checking reschedule info:', error);
      // Nếu có lỗi khi check, vẫn cho phép dời lịch
      await performReschedule();
    }
  };

  const performReschedule = async () => {
    try {
      const [startTime] = rescheduleData.scheduledTime.split(' - ');
      const scheduledAt = `${rescheduleData.scheduledDate}T${startTime}:00`;

      const payload = {
        scheduledAt,
        note: rescheduleData.note,
        contactName: rescheduleData.contactName,
        contactPhone: rescheduleData.contactPhone,
        contactEmail: rescheduleData.contactEmail
      };

      const response = await updateAppointment(id, payload);
      if (response.success) {
        // Refresh điểm uy tín
        refreshScore();
        toast.success('Dời lịch thành công! Vui lòng chờ môi giới xác nhận lại.');
        navigate('/customer/appointments');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi dời lịch');
    }
  };

  const handleConfirmReschedule = async () => {
    setShowWarningModal(false);
    await performReschedule();
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
    <div className="min-h-screen bg-[#f7f4ef] py-10 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer/appointments')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-950 mb-8 font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        {/* Reschedule Warning Modal */}
        <RescheduleWarningModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onConfirm={handleConfirmReschedule}
          hoursUntil={rescheduleInfo?.hoursUntilAppointment || 0}
          pointsPenalty={rescheduleInfo?.reschedulePointsPenalty || 0}
          isWithin24Hours={rescheduleInfo?.isWithin24Hours || false}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 tracking-tight">Dời lịch hẹn</h1>
          <p className="text-slate-600 font-medium">
            Vui lòng chọn thời gian mới phù hợp với bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Appointment Info */}
            <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                </div>
                <h2 className="text-xl font-black text-slate-950">Lịch xem hiện tại</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-[#f8f6f2] rounded-2xl border border-slate-200/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">THỜI GIAN</p>
                  <p className="text-sm font-bold text-slate-950 leading-tight">
                    {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="p-4 bg-[#f8f6f2] rounded-2xl border border-slate-200/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">DỰ ÁN</p>
                  <p className="text-sm font-bold text-slate-950 leading-tight line-clamp-1 mb-1">
                    {appointment.propertyTitle}
                  </p>
                  <p className="text-xs font-medium text-slate-500 line-clamp-1">
                    {appointment.propertyAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* New Schedule Selection */}
            <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Calendar className="w-5 h-5 text-slate-500" />
                </div>
                <h2 className="text-xl font-black text-slate-950">Chọn lịch trình mới</h2>
              </div>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Ngày xem nhà mới
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={rescheduleData.scheduledDate}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 bg-[#f8f6f2] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-950 focus:border-slate-950 text-sm font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer uppercase tracking-wider"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Khung giờ đề xuất
                </label>
                
                {/* Morning */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Buổi Sáng
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {morningSlots.map((slot) => {
                      const isBooked = isTimeSlotBooked(rescheduleData.scheduledDate, slot);
                      return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setRescheduleData({ ...rescheduleData, scheduledTime: slot })}
                        className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          rescheduleData.scheduledTime === slot
                            ? 'bg-slate-950 text-white shadow-lg scale-[1.02]'
                            : isBooked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-[#f8f6f2] text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        {slot}
                        {isBooked && <span className="block text-[10px] font-normal">Đã đặt</span>}
                      </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> Buổi Chiều
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {afternoonSlots.map((slot) => {
                      const isBooked = isTimeSlotBooked(rescheduleData.scheduledDate, slot);
                      return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setRescheduleData({ ...rescheduleData, scheduledTime: slot })}
                        className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          rescheduleData.scheduledTime === slot
                            ? 'bg-slate-950 text-white shadow-lg scale-[1.02]'
                            : isBooked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-[#f8f6f2] text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        {slot}
                        {isBooked && <span className="block text-[10px] font-normal">Đã đặt</span>}
                      </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason for Change */}
            <div className="bg-white rounded-[2rem] premium-shadow p-6 sm:p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-slate-950">Ghi chú thêm</h2>
              </div>

              <textarea
                value={rescheduleData.note}
                onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })}
                rows="4"
                placeholder="Nhập chi tiết yêu cầu thay đổi (không bắt buộc)..."
                className="w-full px-5 py-4 bg-[#f8f6f2] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-950 focus:border-slate-950 text-sm font-medium text-slate-900 outline-none transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate('/customer/appointments')}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-black transition-all premium-shadow order-2 sm:order-1 sm:w-1/3"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-4 bg-slate-950 text-white rounded-2xl hover:bg-slate-800 font-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 order-1 sm:order-2 sm:w-2/3 flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5 text-white/80" />
                Xác nhận dời lịch hẹn
              </button>
            </div>
          </div>

          {/* Right Column - Property Info */}
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
                
                <span className="absolute top-4 left-4 bg-amber-500 text-white shadow-lg shadow-amber-500/30 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  Đang xem xét
                </span>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-1">Mã yêu cầu dời</p>
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
                      <UserRound className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Khách hàng</p>
                      <p className="text-sm font-bold text-slate-950">{appointment.customerName}</p>
                    </div>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    Yêu cầu dời lịch của bạn sẽ được gửi tới chuyên viên tư vấn để xác nhận lại.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
