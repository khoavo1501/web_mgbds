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
      <div className="flex justify-center items-center h-screen bg-[#f7f4ef] font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const scheduledDate = new Date(appointment.scheduledAt);

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-sans py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Success Icon & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100/50 rounded-full mb-6">
            <CheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-950 tracking-tight font-black mb-3">
            Xác nhận lịch hẹn thành công!
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Bạn đã sẵn sàng để đón khách. Thông tin lịch hẹn đã được gửi đến khách hàng.
          </p>
        </div>

        {/* Appointment Card */}
        <div className="bg-white rounded-[2rem] premium-shadow border border-slate-100 overflow-hidden mb-6">
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
                  </div>
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1">
                {/* Customer Info */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-600 font-medium uppercase tracking-wide mb-2">
                    Khách hàng
                  </p>
                  <h2 className="text-2xl font-bold text-slate-950 tracking-tight font-black">
                    {appointment.customerName}
                  </h2>
                </div>

                {/* Time & Location */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 font-medium uppercase tracking-wide mb-2">
                      Thời gian hẹn
                    </p>
                    <div className="flex items-center gap-2 text-slate-950 tracking-tight font-black mb-1">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="font-bold">
                        {scheduledDate.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-950 tracking-tight font-black">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="font-bold">
                        {scheduledDate.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Property Info */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm font-semibold text-slate-600 font-medium uppercase tracking-wide mb-2">
                    Bất động sản
                  </p>
                  <h3 className="text-xl font-bold text-slate-950 tracking-tight font-black mb-2">
                    {appointment.propertyTitle}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
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
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-950 text-white rounded-xl hover:bg-slate-900 shadow-md transition-colors font-bold text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách lịch hẹn
          </button>
          <button
            onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-300 text-slate-800 rounded-xl hover:bg-[#f7f4ef] font-sans transition-colors font-bold text-base"
          >
            <Eye className="w-5 h-5" />
            Xem chi tiết lịch hẹn
          </button>
        </div>

      </div>
    </div>
  );
}
