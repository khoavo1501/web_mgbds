import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, User, Phone, Mail,
  Check, ArrowLeft, Home, CalendarCheck, Bed, Bath, Maximize
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentFlow() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get data from BookAppointmentNew
  const { selectedDate, selectedTime, note: initialNote } = location.state || {};
  
  // State
  const [step, setStep] = useState(2); // Start at step 2 (confirm info)
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  
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
        note: initialNote || ''
      });
    }
  }, [user, initialNote]);

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
      
      // Parse time from format "HH:MM - HH:MM" or "HH:MM"
      const timeStr = selectedTime.split(' - ')[0];
      const [hours, minutes] = timeStr.split(':');
      
      // Create date in local timezone
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const scheduledAt = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);

      // Format as LocalDateTime string (YYYY-MM-DDTHH:mm:ss) without timezone
      const pad = (num) => String(num).padStart(2, '0');
      const localDateTimeString = `${scheduledAt.getFullYear()}-${pad(scheduledAt.getMonth() + 1)}-${pad(scheduledAt.getDate())}T${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}:00`;

      console.log('Sending scheduledAt:', localDateTimeString);

      const appointmentData = {
        propertyId: parseInt(propertyId),
        scheduledAt: localDateTimeString,
        note: formData.note || 'Khách hàng đặt lịch xem nhà'
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
              Lịch hẹn đã được ghi nhận và đang chờ môi giới xác nhận.
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
            onClick={() => navigate(`/properties/${propertyId}/book-appointment`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại chọn thời gian
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Xác nhận thông tin liên hệ</h1>
          <p className="text-gray-600 mt-2">
            Thông tin liên hệ được lấy từ hồ sơ cá nhân. Kiểm tra lại trước khi xác nhận.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
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

              </form>
            </div>
          </div>

          {/* Right - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 text-white rounded-xl shadow-lg overflow-hidden sticky top-8 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                Tóm tắt lịch hẹn
              </h3>
              
              {/* Time Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Ngày hẹn</p>
                    <p className="font-bold">
                      {selectedDate.toLocaleDateString('vi-VN', { 
                        weekday: 'long', 
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

              {/* Property Info */}
              <div className="border-t border-white/20 pt-6">
                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden mb-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <h4 className="font-bold text-lg mb-2 line-clamp-2">{property.title}</h4>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{property.address || `${property.district}, ${property.province}`}</span>
                </p>

                {/* Property Details */}
                <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
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

                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <span className="text-sm text-gray-400">Giá dự kiến</span>
                  <span className="text-2xl font-bold text-green-400">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
