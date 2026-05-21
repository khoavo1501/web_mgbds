import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, User, Phone, Mail,
  ArrowLeft, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const { property, selectedDate, selectedTime } = location.state || {};
  
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Redirect if no booking data
    if (!property || !selectedDate || !selectedTime) {
      navigate('/properties');
      return;
    }

    // Load user info
    if (user) {
      setContactInfo({
        name: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user, property, selectedDate, selectedTime, navigate]);

  const handleSubmit = async () => {
    // Validation
    if (!contactInfo.name || !contactInfo.phone || !contactInfo.email) {
      alert('Vui lòng điền đầy đủ thông tin liên hệ');
      return;
    }

    // Clean phone number - remove all non-digit characters
    const cleanPhone = contactInfo.phone.replace(/\D/g, '');
    
    // Validate phone number length
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      alert('Số điện thoại phải có 10-11 chữ số');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      alert('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/appointments', {
        propertyId: property.propertyId,
        scheduledAt: `${selectedDate}T${selectedTime}:00`,
        note: note.trim() || 'Khách hàng đặt lịch từ trang chi tiết bất động sản',
        contactName: contactInfo.name.trim(),
        contactPhone: cleanPhone,
        contactEmail: contactInfo.email.trim()
      });

      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.';
      alert(errorMessage);
      console.error('Booking error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return null;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTimeRange = (time) => {
    const [hours, minutes] = time.split(':');
    const startHour = parseInt(hours);
    const endHour = startHour + 1;
    return `${time} - ${String(endHour).padStart(2, '0')}:${minutes} (Sáng)`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại chọn thời gian
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xác nhận thông tin liên hệ
        </h1>
        <p className="text-gray-600 mb-8">
          Thông tin liên hệ của bạn được lấy từ hồ sơ cá nhân. Vui lòng kiểm tra lại trước khi xác nhận.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-6">
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                    <button
                      type="button"
                      onClick={() => setContactInfo({ ...contactInfo, name: user?.fullName || '' })}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-normal"
                    >
                      Chỉnh sửa
                    </button>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    placeholder="Trần Thị Mỹ"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                      <button
                        type="button"
                        onClick={() => setContactInfo({ ...contactInfo, phone: user?.phone || '' })}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-normal"
                      >
                        Chỉnh sửa
                      </button>
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => {
                        // Only allow digits and limit to 11 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setContactInfo({ ...contactInfo, phone: value });
                      }}
                      placeholder="0901234567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nhập 10-11 chữ số, không có khoảng trắng</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                      <button
                        type="button"
                        onClick={() => setContactInfo({ ...contactInfo, email: user?.email || '' })}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-normal"
                      >
                        Chỉnh sửa
                      </button>
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      placeholder="my.tran@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lời nhắn cho chuyên viên <span className="text-gray-500 font-normal">(Tùy chọn)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows="4"
                    placeholder="Tôi muốn hỏi thêm về pháp lý của căn hộ này..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !contactInfo.name || !contactInfo.phone || !contactInfo.email}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Xác nhận đặt lịch
                    </>
                  )}
                </button>

                {/* Terms */}
                <p className="text-xs text-center text-gray-500">
                  Bằng cách nhấn xác nhận, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 text-white rounded-xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-6 h-6" />
                <h2 className="text-xl font-bold">Tóm tắt lịch hẹn</h2>
              </div>

              {/* Date & Time */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Ngày hẹn
                  </div>
                  <p className="text-lg font-bold">{formatDate(selectedDate)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Giờ hẹn
                  </div>
                  <p className="text-lg font-bold">{formatTimeRange(selectedTime)}</p>
                </div>
              </div>

              {/* Property Card */}
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 relative">
                  {property.images?.[0]?.url ? (
                    <img 
                      src={property.images[0].url} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Đang bán
                  </span>
                </div>

                <div className="p-4 text-gray-900">
                  <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                  <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {property.address}, {property.district}, {property.province}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Giá dự kiến</p>
                      <p className="font-bold text-lg text-blue-600">
                        {property.price ? `${(property.price / 1000000000).toFixed(1)} tỷ VNĐ` : 'Liên hệ'}
                      </p>
                    </div>
                    {property.bedrooms && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Phòng ngủ</p>
                        <p className="font-semibold">{property.bedrooms} PN</p>
                      </div>
                    )}
                    {property.area && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Diện tích</p>
                        <p className="font-semibold">{property.area} m²</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Broker Info */}
              {property.assignedTo && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Chuyên viên tư vấn</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{property.assignedTo.fullName}</p>
                      <p className="text-sm text-gray-400">Môi giới</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-3xl w-full">
            {/* Success Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
              Đặt lịch thành công!
            </h1>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Cảm ơn bạn đã tin tưởng EstateLink Pro. Lịch hẹn<br />
              của bạn đã được xác nhận với đại lý.
            </p>

            {/* Appointment Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 max-w-2xl mx-auto">
              <div className="flex flex-col">
                {/* Property Image & Info */}
                <div className="flex">
                  {/* Property Image */}
                  <div className="w-1/3 bg-gray-200">
                    {property?.images?.[0]?.url ? (
                      <img 
                        src={property.images[0].url} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h2>
                    <p className="text-gray-600 flex items-center gap-2 mb-6">
                      <MapPin className="w-4 h-4" />
                      {property.address}, {property.district}, {property.province}
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 uppercase mb-2">Ngày hẹn</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="w-5 h-5" />
                          <span className="text-lg font-semibold">
                            {new Date(selectedDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 uppercase mb-2">Giờ hẹn</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg font-semibold">{selectedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Location Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">
                        📍 Địa điểm xem nhà
                      </h3>
                      <p className="text-base font-semibold text-gray-900 mb-3">
                        {property.address}, {property.ward && `${property.ward}, `}{property.district}, {property.province}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.district}, ${property.province}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        Xem đường đi trên Google Maps
                      </a>
                      <p className="text-xs text-gray-600 mt-3">
                        💡 Lưu ý: Vui lòng đến đúng giờ. Nếu có thay đổi, hãy liên hệ với môi giới.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 max-w-2xl mx-auto mb-8">
              <button
                onClick={() => navigate('/customer/appointments')}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Xem lịch của tôi
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Về trang chủ
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-gray-500">
              Bạn cần hỗ trợ? Liên hệ với chúng tôi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
