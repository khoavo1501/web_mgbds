import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, User, Phone, Mail,
  Check, ArrowLeft, Home, CalendarCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getPropertyStatusMeta } from '../../utils/propertyStatus';

export default function BookAppointment() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  
  // Get data from PropertyDetail
  const { selectedDate, selectedTime, note: initialNote } = location.state || {};
  
  // State
  const [step, setStep] = useState(2); // Start at step 2 (confirmation)
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  
  // Contact info
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    note: initialNote || ''
  });
  
  const [isEditing, setIsEditing] = useState({
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
  }, [propertyId, user, selectedDate, selectedTime, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

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
      navigate(`/properties/${propertyId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Combine selectedDate (YYYY-MM-DD) and selectedTime (HH:mm) into ISO string
      const scheduledAtString = `${selectedDate}T${selectedTime}:00`;
      
      console.log('Booking data:', {
        propertyId: parseInt(propertyId),
        scheduledAt: scheduledAtString,
        selectedDate,
        selectedTime,
        note: formData.note
      });

      const appointmentData = {
        propertyId: parseInt(propertyId),
        scheduledAt: scheduledAtString,
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
      toast.error(error.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.');
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
    return null;
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
                <p className="text-gray-600 flex items-center gap-2 mb-4 text-sm">
                  <MapPin className="w-4 h-4" />
                  {property.district}, {property.province}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase">Ngày hẹn</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      {new Date(appointmentResult.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase">Giờ hẹn</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      {appointmentResult.time} AM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/customer/appointments')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold transition-colors"
            >
              <CalendarCheck className="w-5 h-5" />
              Xem lịch của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Step 2: Confirmation Form
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <button
          onClick={() => navigate(`/properties/${propertyId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại chọn thời gian
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left - Form (3 columns) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Họ và tên *
                      <button
                        type="button"
                        onClick={() => setIsEditing({...isEditing, name: !isEditing.name})}
                        className="float-right text-green-600 text-xs font-normal hover:underline"
                      >
                        Chỉnh sửa
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        readOnly={!isEditing.name}
                        required
                        className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-medium ${
                          isEditing.name 
                            ? 'bg-white text-gray-900 focus:border-green-500 focus:outline-none' 
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      />
                      {!isEditing.name && (
                        <div className="absolute inset-0 cursor-not-allowed" onClick={() => setIsEditing({...isEditing, name: true})}></div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Số điện thoại *
                      <button
                        type="button"
                        onClick={() => setIsEditing({...isEditing, phone: !isEditing.phone})}
                        className="float-right text-green-600 text-xs font-normal hover:underline"
                      >
                        Chỉnh sửa
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        readOnly={!isEditing.phone}
                        required
                        placeholder={!formData.phone && isEditing.phone ? "Nhập số điện thoại" : ""}
                        className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-medium ${
                          isEditing.phone 
                            ? 'bg-white text-gray-900 focus:border-green-500 focus:outline-none' 
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      />
                      {!isEditing.phone && (
                        <div className="absolute inset-0 cursor-not-allowed" onClick={() => setIsEditing({...isEditing, phone: true})}></div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email *
                    <button
                      type="button"
                      onClick={() => setIsEditing({...isEditing, email: !isEditing.email})}
                      className="float-right text-green-600 text-xs font-normal hover:underline"
                    >
                      Chỉnh sửa
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      readOnly={!isEditing.email}
                      required
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-medium ${
                        isEditing.email 
                          ? 'bg-white text-gray-900 focus:border-green-500 focus:outline-none' 
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    />
                    {!isEditing.email && (
                      <div className="absolute inset-0 cursor-not-allowed" onClick={() => setIsEditing({...isEditing, email: true})}></div>
                    )}
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

          {/* Right - Summary (2 columns) */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {/* Time Summary */}
              <div className="bg-gray-900 text-white p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Tóm tắt lịch hẹn
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Ngày hẹn</p>
                      <p className="font-bold text-lg">
                        {new Date(selectedDate).toLocaleDateString('vi-VN', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Giờ hẹn</p>
                      <p className="font-bold text-lg">{selectedTime} (Sáng)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                  <span className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {getPropertyStatusMeta(property.status).label}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-gray-600 flex items-center gap-2 mb-4 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {property.district}, {property.province}
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-baseline justify-between mb-2">
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
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {property.bedrooms && <span>{property.bedrooms} PN</span>}
                      {property.area && <span>{property.area}m²</span>}
                    </div>
                  </div>

                  {/* Broker Info */}
                  {property.assignedTo && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-3">Chuyên viên tư vấn</p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{property.assignedTo.fullName}</p>
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
