import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, User, Phone, Mail,
  Check, ArrowLeft, Home, CalendarCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentFlow() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get data from PropertyDetail
  const { selectedDate: initialDate, selectedTime: initialTime, note: initialNote } = location.state || {};
  
  // State
  const [step, setStep] = useState(initialDate && initialTime ? 2 : 1); // Start at step 2 if coming from PropertyDetail
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  
  // Booking data
  const [selectedDate] = useState(initialDate);
  const [selectedTime] = useState(initialTime);
  const [noteForBroker] = useState(initialNote || '');
  
  // Step 2: Contact info
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    note: ''
  });
  
  // Edit mode for each field
  const [editMode, setEditMode] = useState({
    name: false,
    phone: false,
    email: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Redirect if no booking data
    if (!selectedDate || !selectedTime) {
      navigate(`/properties/${propertyId}`);
      return;
    }
    
    fetchPropertyDetail();
  }, [propertyId, user, selectedDate, selectedTime]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        note: noteForBroker || ''
      });
    }
  }, [user, noteForBroker]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      alert('Vui lòng chọn ngày và giờ');
      return;
    }

    try {
      setSubmitting(true);
      
      const [hours, minutes] = selectedTime.split(':');
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentData = {
        propertyId: parseInt(propertyId),
        scheduledAt: scheduledAt.toISOString(),
        note: formData.note || noteForBroker || 'Khách hàng đặt lịch xem nhà'
      };

      const response = await api.post('/appointments', appointmentData);
      
      if (response.data.success) {
        setAppointmentResult({
          property: property,
          date: selectedDate,
          time: selectedTime,
          appointment: response.data.data
        });
        setStep(3);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Success Screen
  if (step === 3 && appointmentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Đặt lịch thành công!</h1>
            <p className="text-gray-600">
              Cảm ơn bạn đã tin tưởng EstateLink Pro. Lịch hẹn của bạn đã được xác nhận với đại lý.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                <p className="text-gray-600 flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4" />
                  {property.address || `${property.district}, ${property.province}`}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">NGÀY HẸN</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {appointmentResult.date.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">GIỜ HẸN</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {appointmentResult.time.split(' - ')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/customer/appointments')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold transition-colors"
            >
              <CalendarCheck className="w-5 h-5" />
              Xem lịch của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bạn cần hỗ trợ? <button className="text-blue-600 hover:underline font-semibold">Liên hệ với chúng tôi</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => step === 1 ? navigate(`/properties/${propertyId}`) : handleBackToStep1()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {step === 1 ? 'Quay lại chi tiết' : 'Quay lại chọn thời gian'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 ? 'Chọn thời gian xem nhà' : 'Xác nhận thông tin liên hệ'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 1 
              ? 'Vui lòng chọn ngày và giờ phù hợp để chuyên viên tư vấn của chúng tôi có thể sắp xếp đón tiếp bạn tốt nhất.'
              : 'Thông tin liên hệ của bạn được lấy từ hồ sơ cá nhân. Vui lòng kiểm tra lại trước khi xác nhận.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Step 1: Select Time */}
              {step === 1 && (
                <div>
                  {/* Calendar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={previousMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                        <div key={day} className="text-center font-bold text-gray-600 py-2 text-sm">
                          {day}
                        </div>
                      ))}
                      
                      {getDaysInMonth(currentMonth).map((date, index) => (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          disabled={isDateDisabled(date)}
                          className={`
                            aspect-square rounded-lg flex items-center justify-center text-sm font-bold
                            transition-colors
                            ${!date ? 'invisible' : ''}
                            ${isDateDisabled(date) ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50'}
                            ${selectedDate && date && selectedDate.toDateString() === date.toDateString() 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
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
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      
                      {/* Morning */}
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-3">Buổi Sáng</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {morningSlots.map(timeSlot => {
                            const isBooked = isTimeSlotBooked(selectedDate, timeSlot);
                            const isSelected = selectedTime === timeSlot;
                            
                            return (
                              <button
                                key={timeSlot}
                                onClick={() => handleTimeSelect(timeSlot)}
                                disabled={isBooked}
                                className={`
                                  py-3 px-4 rounded-lg text-sm font-bold transition-colors border-2
                                  ${isBooked 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : 'hover:bg-green-50 border-gray-200'}
                                  ${isSelected 
                                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                    : ''}
                                `}
                              >
                                {timeSlot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Afternoon */}
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-3">Buổi Chiều</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {afternoonSlots.map(timeSlot => {
                            const isBooked = isTimeSlotBooked(selectedDate, timeSlot);
                            const isSelected = selectedTime === timeSlot;
                            
                            return (
                              <button
                                key={timeSlot}
                                onClick={() => handleTimeSelect(timeSlot)}
                                disabled={isBooked}
                                className={`
                                  py-3 px-4 rounded-lg text-sm font-bold transition-colors border-2
                                  ${isBooked 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : 'hover:bg-green-50 border-gray-200'}
                                  ${isSelected 
                                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                    : ''}
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
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Ghi chú cho chuyên viên (Tùy chọn)
                        </label>
                        <textarea
                          value={noteForBroker}
                          onChange={(e) => setNoteForBroker(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                          placeholder="Ví dụ: Tôi muốn hỏi thêm về pháp lý của căn hộ này..."
                        />
                      </div>

                      {/* Next Button */}
                      <div className="mt-8">
                        <button
                          type="button"
                          onClick={handleNextToStep2}
                          disabled={!selectedDate || !selectedTime}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
                        >
                          <Calendar className="w-5 h-5" />
                          Xác nhận lịch đặt
                        </button>
                        <p className="text-center text-sm text-gray-500 mt-3">
                          Lịch hẹn sẽ ở trạng thái chờ xác nhận sau khi đặt thành công.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Họ và tên *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          disabled={!editMode.name}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                            editMode.name 
                              ? 'border-green-500 bg-white focus:outline-none' 
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setEditMode({...editMode, name: !editMode.name})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {editMode.name ? 'Xong' : 'Sửa'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          disabled={!editMode.phone}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                            editMode.phone 
                              ? 'border-green-500 bg-white focus:outline-none' 
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setEditMode({...editMode, phone: !editMode.phone})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {editMode.phone ? 'Xong' : 'Sửa'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={!editMode.email}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                          editMode.email 
                            ? 'border-green-500 bg-white focus:outline-none' 
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditMode({...editMode, email: !editMode.email})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        {editMode.email ? 'Xong' : 'Sửa'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Lời nhắn cho chuyên viên (Tùy chọn)
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                      placeholder="Tôi muốn hỏi thêm về pháp lý của căn hộ này..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận đặt lịch'
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Bằng cách nhấn xác nhận, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Right - Property Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-8">
              {/* Selected Time Summary (only show when time is selected) */}
              {selectedDate && selectedTime && (
                <div className="bg-gray-900 text-white p-6 mb-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Tóm tắt lịch hẹn
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-400">Ngày hẹn</p>
                        <p className="font-bold">
                          {selectedDate.toLocaleDateString('vi-VN', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-400">Giờ hẹn</p>
                        <p className="font-bold">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Info */}
              <div className="relative">
                <div className="aspect-video bg-gray-200">
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
                      Đang bán
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-gray-600 flex items-center gap-2 mb-4 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {property.address || `${property.district}, ${property.province}`}
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">Giá dự kiến</span>
                      <span className="text-2xl font-bold text-green-600">
                        {property.price ? 
                          (property.price >= 1000000000 ? 
                            `${(property.price / 1000000000).toFixed(1)} tỷ VND` : 
                            `${(property.price / 1000000).toFixed(0)} triệu VND`
                          ) : 
                          'Liên hệ'
                        }
                      </span>
                    </div>
                    
                    {property.area && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Diện tích</span>
                        <span className="font-bold text-gray-900">{property.area}m²</span>
                      </div>
                    )}
                  </div>

                  {/* Broker Info */}
                  {property.assignedTo && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Chuyên viên tư vấn</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{property.assignedTo.fullName}</p>
                          {property.assignedTo.phone && (
                            <p className="text-xs text-gray-600">{property.assignedTo.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
