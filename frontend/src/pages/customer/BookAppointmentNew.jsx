import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, ChevronLeft, ChevronRight, ArrowRight, Building2, MapPin, Bed, Bath, Maximize
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AppointmentWarningModal from '../../components/common/AppointmentWarningModal';
import { useToast } from '../../context/ToastContext';

export default function BookAppointmentNew() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  
  // Warning modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [canBook, setCanBook] = useState(true);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');

  // Time slots
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
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPropertyDetail();
    checkCanBookAppointment();
    fetchBookedAppointments();
  }, [propertyId, user]);

  const fetchBookedAppointments = async () => {
    try {
      const response = await api.get(`/appointments/property/${propertyId}`);
      if (response.data.success) {
        setBookedAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching property appointments:', error);
    }
  };

  const fetchPropertyDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${propertyId}`);
      if (response.data.success) {
        setProperty(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Không thể tải thông tin bất động sản');
    } finally {
      setLoading(false);
    }
  };

  const checkCanBookAppointment = async () => {
    try {
      const response = await api.get(`/appointments/can-book/${propertyId}`);
      if (response.data.success) {
        const canBookResult = response.data.data;
        setCanBook(canBookResult);
        
        // Hiển thị warning modal nếu không thể đặt lịch
        if (!canBookResult) {
          setShowWarningModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking can book:', error);
      // Nếu API lỗi, vẫn cho phép đặt lịch (fail-safe)
      setCanBook(true);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isTimeSlotBooked = (date, timeSlot) => {
    if (!date) return false;
    const [startTime] = timeSlot.split(' - ');
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const timeString = `${startTime}:00`;
    
    return bookedAppointments.some(app => {
       if (['cancelled', 'rejected'].includes(app.status)) return false;
       if (!app.scheduledAt) return false;
       const appDateStr = app.scheduledAt.split('T')[0];
       const appTimeStr = app.scheduledAt.split('T')[1]?.substring(0, 8);
       return appDateStr === dateString && appTimeStr === timeString;
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setSelectedTime(null); // Reset time when date changes
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn ngày và giờ');
      return;
    }

    // Kiểm tra lại trước khi submit
    if (!canBook) {
      setShowWarningModal(true);
      return;
    }

    // Navigate sang BookAppointmentFlow (Bước 2: Điền thông tin)
    navigate(`/properties/${propertyId}/book-flow`, {
      state: {
        selectedDate: selectedDate,
        selectedTime: selectedTime,
        note: note
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-3xl premium-shadow max-w-md w-full">
          <Building2 className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-5 text-xl font-bold text-slate-900">Không tìm thấy bất động sản</h3>
          <p className="mt-2 text-sm text-slate-500">Bất động sản này có thể đã bị gỡ hoặc không tồn tại.</p>
          <button
            onClick={() => navigate('/properties')}
            className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-gold-300 hover:to-gold-500 transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10 font-sans text-slate-900 relative">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left - Calendar & Time Selection */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center sm:text-left mb-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 hover:text-gold-600 mb-6 transition-colors font-bold w-full sm:w-auto text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay lại chi tiết</span>
              </button>
              
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 tracking-tight">Chọn thời gian xem nhà</h1>
              <p className="text-slate-600 text-sm font-medium">
                Vui lòng chọn ngày và giờ phù hợp để chuyên viên tư vấn có thể sắp xếp đón tiếp bạn chu đáo nhất.
              </p>
            </div>
            {/* Calendar */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 premium-shadow border border-slate-100 max-w-2xl mx-auto lg:mx-0 w-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900 capitalize flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold-500" />
                  Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                </h3>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="text-center font-extrabold text-slate-600 py-2 text-sm uppercase tracking-wider">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={`
                      h-10 sm:h-12 w-full rounded-xl flex items-center justify-center text-sm font-bold
                      transition-all duration-300
                      ${!date ? 'invisible' : ''}
                      ${isDateDisabled(date) 
                        ? 'text-slate-300 cursor-not-allowed bg-slate-50' 
                        : 'hover:bg-gold-50 hover:text-gold-600 hover:-translate-y-0.5 hover:shadow-sm'}
                      ${selectedDate && date && selectedDate.toDateString() === date.toDateString() 
                        ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white hover:bg-gold-500 scale-105 shadow-md shadow-gold-500/30' 
                        : (date && !isDateDisabled(date) ? 'text-slate-700 bg-white border border-slate-100' : '')}
                    `}
                  >
                    {date ? date.getDate() : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 premium-shadow border border-slate-100 animate-fade-in max-w-2xl mx-auto lg:mx-0 w-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2.5 bg-gold-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian dự kiến</p>
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                </div>
                
                {/* Morning */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Buổi Sáng
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {morningSlots.map(timeSlot => {
                      const isSelected = selectedTime === timeSlot;
                      const isBooked = isTimeSlotBooked(selectedDate, timeSlot);
                      return (
                        <button
                          key={timeSlot}
                          disabled={isBooked}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={`
                            py-2.5 px-2 rounded-lg text-sm font-bold transition-all duration-300
                            ${isSelected 
                              ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-white shadow-md shadow-gold-500/30' 
                              : isBooked 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-600'}
                          `}
                        >
                          {timeSlot}
                          {isBooked && <span className="block text-[10px] font-normal">Đã đặt</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> Buổi Chiều
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {afternoonSlots.map(timeSlot => {
                      const isSelected = selectedTime === timeSlot;
                      const isBooked = isTimeSlotBooked(selectedDate, timeSlot);
                      return (
                        <button
                          key={timeSlot}
                          disabled={isBooked}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={`
                            py-2.5 px-2 rounded-lg text-sm font-bold transition-all duration-300
                            ${isSelected 
                              ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-white shadow-md shadow-gold-500/30' 
                              : isBooked 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-600'}
                          `}
                        >
                          {timeSlot}
                          {isBooked && <span className="block text-[10px] font-normal">Đã đặt</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Ghi chú cho chuyên viên (Tùy chọn)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-gold-400 focus:bg-white focus:ring-4 focus:ring-gold-400/20 outline-none transition-all resize-none text-sm font-medium text-slate-900"
                    placeholder="Ví dụ: Tôi muốn xem thêm phòng tiện ích..."
                  />
                  <p className="text-xs font-medium text-slate-500 mt-2 flex items-start gap-1">
                    <div className="mt-0.5 text-gold-500">*</div>
                    <span>
                      Bằng cách nhấn tiếp tục, bạn đồng ý với <span className="text-gold-600 hover:underline cursor-pointer">Điều khoản sử dụng</span> của NhaDatPro.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right - Property Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-950 text-white rounded-2xl premium-shadow overflow-hidden sticky top-8 border border-slate-800 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              {/* Property Image */}
              <div className="relative h-56 bg-slate-800">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="inline-block px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-3">
                    THÔNG TIN BẤT ĐỘNG SẢN
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-6 pt-0 relative z-10">
                <h3 className="text-xl font-black text-white mb-3 leading-tight line-clamp-2">{property.title}</h3>
                <p className="text-slate-400 flex items-start gap-2 mb-6 text-sm font-medium">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gold-400" />
                  <span className="leading-relaxed">{property.address || `${property.district}, ${property.province}`}</span>
                </p>
                
                {/* Property Details */}
                <div className="flex flex-wrap items-center gap-3 mb-6 text-sm font-bold text-slate-300">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span>{property.bedrooms} PN</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <Bath className="w-4 h-4 text-slate-400" />
                      <span>{property.bathrooms} WC</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <Maximize className="w-4 h-4 text-slate-400" />
                      <span>{property.area}m²</span>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-400">Giá dự kiến</span>
                    <span className="text-2xl font-black text-gold-400">
                      {property.price ? 
                        (property.price >= 1000000000 ? 
                          `${(property.price / 1000000000).toFixed(1).replace('.0', '')} tỷ` : 
                          `${(property.price / 1000000).toFixed(0)} triệu`
                        ) : 
                        'Liên hệ'
                      }
                    </span>
                  </div>
                </div>

                {/* Selected Time Summary */}
                {selectedDate && selectedTime && (
                  <div className="p-5 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-6 animate-fade-in">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gold-400 mb-3">Lịch hẹn của bạn</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-gold-500/20">
                          <Calendar className="w-4 h-4 text-gold-400" />
                        </div>
                        <span className="font-bold text-white">
                          {selectedDate.toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-gold-500/20">
                          <Clock className="w-4 h-4 text-gold-400" />
                        </div>
                        <span className="font-bold text-white">
                          {selectedTime.split(' - ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded-xl font-black transition-all disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-base shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-1 hover:from-gold-300 hover:to-gold-500"
                >
                  Tiếp tục điền thông tin
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      <AppointmentWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onViewAppointments={() => navigate('/customer/appointments')}
      />
    </div>
  );
}
