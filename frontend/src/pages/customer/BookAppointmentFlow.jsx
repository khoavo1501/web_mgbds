import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, User, Phone, Mail,
  Check, ArrowLeft, Home, CalendarCheck, Bed, Bath, Maximize
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function BookAppointmentFlow() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
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
      toast.error('Không thể tải thông tin bất động sản');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn ngày và giờ');
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
      toast.error(error.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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

  // Step 3: Success Screen
  if (step === 3 && appointmentResult) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-xl w-full relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mb-5 shadow-xl shadow-emerald-500/30 ring-4 ring-white">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 tracking-tight">Đặt lịch thành công!</h1>
            <p className="text-slate-600 text-sm font-medium max-w-sm mx-auto">
              Lịch hẹn đã được ghi nhận. Chuyên viên tư vấn của chúng tôi sẽ liên hệ để xác nhận với bạn trong thời gian sớm nhất.
            </p>
          </div>

          <div className="bg-white rounded-2xl premium-shadow p-5 mb-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-32 h-40 sm:h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-slate-300" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-900 mb-1.5 line-clamp-2">{property.title}</h3>
                <p className="text-slate-500 flex items-center gap-1.5 mb-4 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-gold-500" />
                  <span className="line-clamp-1">{property.address || `${property.district}, ${property.province}`}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Ngày hẹn</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gold-500" />
                      {appointmentResult.date.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Giờ hẹn</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold-500" />
                      {appointmentResult.time.split(' - ')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/customer/appointments')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
            >
              <CalendarCheck className="w-4 h-4" />
              Xem lịch của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all hover:border-slate-300 text-sm"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10 font-sans text-slate-900 relative">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          
          {/* Left - Form */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center sm:text-left mb-2">
              <button
                onClick={() => navigate(`/properties/${propertyId}/book-appointment`)}
                className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 hover:text-gold-600 mb-6 transition-colors font-bold w-full sm:w-auto text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại chọn thời gian
              </button>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 tracking-tight">Xác nhận thông tin</h1>
              <p className="text-slate-600 text-sm font-medium mx-auto sm:mx-0">
                Thông tin liên hệ được lấy từ hồ sơ cá nhân của bạn. Vui lòng kiểm tra lại thật kỹ trước khi gửi yêu cầu.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 premium-shadow border border-slate-100 max-w-2xl mx-auto lg:mx-0 w-full">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!editMode.name}
                        className={`w-full px-4 py-3 rounded-xl transition-all outline-none font-medium text-sm ${
                          editMode.name 
                            ? 'border-2 border-gold-400 bg-white ring-4 ring-gold-400/20 text-slate-900' 
                            : 'border-2 border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditMode({...editMode, name: !editMode.name})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gold-600 hover:text-gold-700 font-bold px-2 py-1 rounded-md hover:bg-gold-50 transition-colors"
                      >
                        {editMode.name ? 'Xong' : 'Sửa'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!editMode.phone}
                        className={`w-full px-4 py-3 rounded-xl transition-all outline-none font-medium text-sm ${
                          editMode.phone 
                            ? 'border-2 border-gold-400 bg-white ring-4 ring-gold-400/20 text-slate-900' 
                            : 'border-2 border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditMode({...editMode, phone: !editMode.phone})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gold-600 hover:text-gold-700 font-bold px-2 py-1 rounded-md hover:bg-gold-50 transition-colors"
                      >
                        {editMode.phone ? 'Xong' : 'Sửa'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!editMode.email}
                      className={`w-full px-4 py-3 rounded-xl transition-all outline-none font-medium text-sm ${
                        editMode.email 
                          ? 'border-2 border-gold-400 bg-white ring-4 ring-gold-400/20 text-slate-900' 
                          : 'border-2 border-slate-100 bg-slate-50 text-slate-600'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setEditMode({...editMode, email: !editMode.email})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gold-600 hover:text-gold-700 font-bold px-2 py-1 rounded-md hover:bg-gold-50 transition-colors"
                    >
                      {editMode.email ? 'Xong' : 'Sửa'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lời nhắn cho chuyên viên (Tùy chọn)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-gold-400 focus:bg-white focus:ring-4 focus:ring-gold-400/20 outline-none transition-all resize-none text-sm font-medium text-slate-800"
                    placeholder="Ví dụ: Tôi muốn hỏi thêm về thủ tục pháp lý của dự án này..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded-xl font-black transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-base shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-1 hover:from-gold-300 hover:to-gold-500"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Đang xử lý đặt lịch...
                      </>
                    ) : (
                      'Hoàn tất đặt lịch'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-950 text-white rounded-2xl premium-shadow overflow-hidden sticky top-8 border border-slate-800 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="p-6 pb-0 pt-6">
                <h3 className="text-lg font-black mb-5 flex items-center gap-2">
                  <div className="p-2 bg-gold-500/20 rounded-lg">
                    <CalendarCheck className="w-4 h-4 text-gold-400" />
                  </div>
                  Tóm tắt lịch hẹn
                </h3>
                
                {/* Time Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Calendar className="w-5 h-5 mt-0.5 text-gold-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày hẹn</p>
                      <p className="font-bold">
                        {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Clock className="w-5 h-5 mt-0.5 text-gold-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ hẹn</p>
                      <p className="font-bold text-lg text-gold-400">{selectedTime.split(' - ')[0]}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="border-t border-white/10 mt-2 p-6">
                <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-5 border border-white/10">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                </div>
                
                <h4 className="font-bold text-base mb-2 line-clamp-2 leading-snug text-slate-200">{property.title}</h4>
                <p className="text-sm text-slate-400 flex items-start gap-2 mb-5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gold-500/50" />
                  <span className="line-clamp-2 leading-relaxed">{property.address || `${property.district}, ${property.province}`}</span>
                </p>

                {/* Property Details */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-300 mb-5">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.bedrooms} PN</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.bathrooms} WC</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                      <Maximize className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.area}m²</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-white/10">
                  <span className="text-sm font-bold text-slate-400">Giá dự kiến</span>
                  <span className="text-xl font-black text-white">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
