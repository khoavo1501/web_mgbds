import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, Calendar, Clock, MapPin, User, Mail, 
  Bell, AlertCircle, CheckSquare, ArrowLeft, Eye
} from 'lucide-react';

export default function AppointmentConfirmSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    // Try to get appointment from location.state first
    let appointmentData = location.state?.appointment;
    
    // If not found, try sessionStorage
    if (!appointmentData) {
      const stored = sessionStorage.getItem('confirmedAppointment');
      if (stored) {
        appointmentData = JSON.parse(stored);
        sessionStorage.removeItem('confirmedAppointment'); // Clean up
      }
    }
    
    if (appointmentData) {
      setAppointment(appointmentData);
    } else {
      // No appointment data, redirect back
      navigate('/broker/appointments');
    }
  }, [location, navigate]);

  if (!appointment) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const scheduledDate = new Date(appointment.scheduledAt);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Success Icon & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 rounded-full mb-6">
            <CheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Xác nhận lịch hẹn thành công!
          </h1>
          <p className="text-lg text-slate-600">
            Bạn đã sẵn sàng để đón khách. Thông tin lịch hẹn đã được gửi đến khách hàng.
          </p>
        </div>

        {/* Appointment Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex gap-6">
              {/* Property Image */}
              {appointment.propertyImage && (
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={appointment.propertyImage} 
                      alt={appointment.propertyTitle}
                      className="w-64 h-64 object-cover rounded-xl"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                      Đang giao dịch
                    </span>
                  </div>
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1">
                {/* Customer Info */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Khách hàng
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {appointment.customerName}
                  </h2>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Khách hàng tiềm năng
                  </p>
                </div>

                {/* Time & Location */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Thời gian hẹn
                    </p>
                    <div className="flex items-center gap-2 text-slate-900 mb-1">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="font-bold">
                        {scheduledDate.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="font-bold">
                        {scheduledDate.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Địa điểm đón khách
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          Tại văn phòng EstateLink hoặc Trực tiếp tại căn hộ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Bất động sản
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {appointment.propertyTitle}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {appointment.propertyAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate('/broker/appointments')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách lịch hẹn
          </button>
          <button
            onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold text-base"
          >
            <Eye className="w-5 h-5" />
            Xem chi tiết lịch hẹn
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email đã gửi */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Email đã gửi</h3>
                <p className="text-sm text-slate-600">
                  Hệ thống đã tự động gửi xác nhận lịch hẹn đến email của khách hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Nhắc nhở */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Nhắc nhở</h3>
                <p className="text-sm text-slate-600">
                  Chúng tôi sẽ nhắc bạn 2 tiếng trước giờ hẹn để chuẩn bị đón tiếp khách hàng tốt nhất.
                </p>
              </div>
            </div>
          </div>

          {/* Chuẩn bị */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Chuẩn bị</h3>
                <p className="text-sm text-slate-600">
                  Xem lại lịch sử tìm kiếm của khách hàng để có buổi tư vấn hiệu quả hơn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
