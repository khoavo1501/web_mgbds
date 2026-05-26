import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, ChevronLeft, ChevronRight, ArrowRight, Building2, MapPin, Bed, Bath, Maximize
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentNew() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
  }, [propertyId, user]);

  const fetchPropertyDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${propertyId}`);
      if (response.data.success) {
        setProperty(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      alert('Không thể tải thông tin bất động sản');
    } finally {
      setLoading(false);
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
      alert('Vui lòng chọn ngày và giờ');
      return;
    }

    // Navigate sang BookAppointmentFlow với date/time đã chọn
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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy bất động sản</h3>
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chọn thời gian xem nhà</h1>
          <p className="text-gray-600">
            Vui lòng chọn ngày và giờ phù hợp để chuyên viên tư vấn của chúng tôi có thể sắp xếp đón tiếp bạn tốt nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Calendar & Time Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600 py-3 text-sm">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={`
                      aspect-square rounded-xl flex items-center justify-center text-base font-bold
                      transition-all
                      ${!date ? 'invisible' : ''}
                      ${isDateDisabled(date) 
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                        : 'hover:bg-green-50 hover:scale-105'}
                      ${selectedDate && date && selectedDate.toDateString() === date.toDateString() 
                        ? 'bg-green-600 text-white hover:bg-green-700 scale-105 shadow-lg' 
                        : 'text-gray-900'}
                    `}
                  >
                    {date ? date.getDate() : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedDate.toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                
                {/* Morning */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Buổi Sáng</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {morningSlots.map(timeSlot => {
                      const isSelected = selectedTime === timeSlot;
                      
                      return (
                        <button
                          key={timeSlot}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={`
                            py-3 px-4 rounded-xl text-sm font-bold transition-all border-2
                            ${isSelected 
                              ? 'bg-green-600 text-white border-green-600 scale-105 shadow-lg' 
                              : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-300'}
                          `}
                        >
                          {timeSlot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Buổi Chiều</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {afternoonSlots.map(timeSlot => {
                      const isSelected = selectedTime === timeSlot;
                      
                      return (
                        <button
                          key={timeSlot}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={`
                            py-3 px-4 rounded-xl text-sm font-bold transition-all border-2
                            ${isSelected 
                              ? 'bg-green-600 text-white border-green-600 scale-105 shadow-lg' 
                              : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-300'}
                          `}
                        >
                          {timeSlot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Ghi chú cho chuyên viên (Tùy chọn)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                    placeholder="Ví dụ: Tôi muốn xem thêm phòng ngủ lớn..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right - Property Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
              {/* Property Image */}
              <div className="relative aspect-video bg-gray-200">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {property.status === 'published' && (
                  <span className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ĐANG BÁN
                  </span>
                )}
              </div>

              {/* Property Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                <p className="text-gray-600 flex items-center gap-2 mb-4 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {property.address || `${property.district}, ${property.province}`}
                </p>
                
                {/* Property Details */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      <span>{property.bedrooms} PN</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      <span>{property.bathrooms} WC</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span>{property.area}m²</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Giá dự kiến</span>
                    <span className="text-2xl font-bold text-green-600">
                      {property.price ? 
                        (property.price >= 1000000000 ? 
                          `${(property.price / 1000000000).toFixed(1)} tỷ` : 
                          `${(property.price / 1000000).toFixed(0)} triệu`
                        ) : 
                        'Liên hệ'
                      }
                    </span>
                  </div>
                </div>

                {/* Selected Time Summary */}
                {selectedDate && selectedTime && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Thời gian đã chọn</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          Ngày xem: {selectedDate.toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          Giờ xem: {selectedTime.split(' - ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
                >
                  Xác nhận đặt lịch
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <p className="text-center text-xs text-gray-500 mt-3">
                  Bằng cách nhấn xác nhận, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
