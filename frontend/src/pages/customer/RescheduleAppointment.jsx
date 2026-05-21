import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { updateAppointment } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export default function RescheduleAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    note: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const timeSlots = [
    '09:00 - 10:00',
    '10:30 - 11:30',
    '14:00 - 15:00',
    '15:30 - 16:30',
    '17:00 - 18:00',
    '19:00 - 20:00'
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
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      alert('Không thể tải thông tin lịch hẹn');
      navigate('/customer/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!rescheduleData.scheduledDate) {
      alert('Vui lòng chọn ngày xem nhà mới');
      return;
    }

    if (!rescheduleData.scheduledTime) {
      alert('Vui lòng chọn khung giờ');
      return;
    }

    if (!rescheduleData.note || !rescheduleData.note.trim()) {
      alert('Vui lòng nhập lý do thay đổi');
      return;
    }

    // Combine date and time
    const [startTime] = rescheduleData.scheduledTime.split(' - ');
    const scheduledAt = `${rescheduleData.scheduledDate}T${startTime}:00`;

    // Check if time is in the future
    const selectedDateTime = new Date(scheduledAt);
    const now = new Date();
    if (selectedDateTime <= now) {
      alert('Vui lòng chọn thời gian trong tương lai');
      return;
    }

    try {
      const payload = {
        scheduledAt,
        note: rescheduleData.note,
        contactName: rescheduleData.contactName,
        contactPhone: rescheduleData.contactPhone,
        contactEmail: rescheduleData.contactEmail
      };

      console.log('Sending payload:', payload);

      const response = await updateAppointment(id, payload);
      if (response.success) {
        alert('Dời lịch thành công! Vui lòng chờ môi giới xác nhận lại.');
        navigate('/customer/appointments');
      }
    } catch (error) {
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Lỗi khi dời lịch');
    }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer/appointments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Dời lịch hẹn</h1>
          <p className="text-gray-600">
            Vui lòng điều chỉnh thông tin thời gian để dời lịch xem bất động sản.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Appointment Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Thông tin lịch hẹn tại</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">THỜI GIAN</p>
                  <p className="text-base font-bold text-gray-900">
                    {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}, Thứ Ba - {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">DỰ ÁN</p>
                  <p className="text-base font-bold text-gray-900">
                    {appointment.propertyTitle.split(' - ')[0]}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {appointment.propertyAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* New Schedule Selection */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Chọn lịch mới</h2>
              </div>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Ngày xem nhà mới
                </label>
                <input
                  type="date"
                  value={rescheduleData.scheduledDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Khung giờ khả dụng
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleData({ ...rescheduleData, scheduledTime: slot })}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        rescheduleData.scheduledTime === slot
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reason for Change */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Lý do thay đổi</h2>
              </div>

              <textarea
                value={rescheduleData.note}
                onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })}
                rows="4"
                placeholder="Nhập chi tiết lý do (không bắt buộc)..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Xác nhận dời lịch
              </button>
              <button
                onClick={() => navigate('/customer/appointments')}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-lg transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>

          {/* Right Column - Property Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-200">
                {appointment.propertyImage ? (
                  <img
                    src={appointment.propertyImage}
                    alt={appointment.propertyTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Đang xem xét
                </span>
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {appointment.propertyTitle}
                </h3>
                <p className="text-gray-600 flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span className="text-sm">{appointment.propertyAddress}</span>
                </p>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                    <p className="text-sm font-bold text-gray-900">{appointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mã yêu cầu</p>
                    <p className="text-sm font-bold text-gray-900">#{appointment.appointmentId}</p>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">
                        Việc dời lịch cần được khách hàng xác nhận lại trong vòng 2 giờ kể từ khi yêu cầu được gửi đi
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
