import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Mail, Check, X, CheckCircle, Filter } from 'lucide-react';
import { 
  getBrokerAppointmentsByStatus, 
  getBrokerAppointmentsByDate,
  confirmAppointment, 
  rejectAppointment, 
  completeAppointment 
} from '../../services/appointmentService';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [completeNote, setCompleteNote] = useState('');

  const tabs = [
    { id: 'pending', label: 'Chờ xác nhận', color: 'yellow' },
    { id: 'confirmed', label: 'Đã xác nhận', color: 'green' },
    { id: 'completed', label: 'Hoàn tất', color: 'blue' },
    { id: 'cancelled', label: 'Đã hủy', color: 'gray' },
    { id: 'rejected', label: 'Đã từ chối', color: 'red' }
  ];

  useEffect(() => {
    fetchAppointments();
  }, [activeTab, page]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getBrokerAppointmentsByStatus(activeTab, page, 10);
      if (response.success) {
        setAppointments(response.data.content);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Lỗi khi tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsByDate = async () => {
    if (!selectedDate) {
      alert('Vui lòng chọn ngày');
      return;
    }

    try {
      setLoading(true);
      const response = await getBrokerAppointmentsByDate(selectedDate);
      if (response.success) {
        setAppointments(response.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Lỗi khi tải lịch hẹn theo ngày');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    if (!window.confirm('Xác nhận lịch hẹn này?')) return;

    try {
      const response = await confirmAppointment(appointmentId);
      if (response.success) {
        alert('Xác nhận lịch hẹn thành công!');
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xác nhận lịch hẹn');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      const response = await rejectAppointment(selectedAppointment.appointmentId, rejectReason);
      if (response.success) {
        alert('Từ chối lịch hẹn thành công!');
        setShowRejectModal(false);
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi từ chối lịch hẹn');
    }
  };

  const handleComplete = async () => {
    try {
      const response = await completeAppointment(selectedAppointment.appointmentId, completeNote);
      if (response.success) {
        alert('Đánh dấu hoàn tất thành công!');
        setShowCompleteModal(false);
        fetchAppointments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi đánh dấu hoàn tất');
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

  const getTabColor = (color) => {
    const colors = {
      yellow: 'border-yellow-500 text-yellow-600',
      green: 'border-green-500 text-green-600',
      blue: 'border-blue-500 text-blue-600',
      gray: 'border-gray-500 text-gray-600',
      red: 'border-red-500 text-red-600'
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lịch hẹn của tôi</h1>
          <p className="text-gray-600">Quản lý các lịch hẹn xem bất động sản của bạn một cách dễ dàng.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(0);
              }}
              className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có lịch hẹn nào</h3>
            <p className="text-gray-500">Chưa có lịch hẹn trong danh mục này</p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <div key={appointment.appointmentId} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Property Image */}
                  <div className="lg:w-80 h-64 lg:h-auto bg-gradient-to-br from-blue-100 to-blue-50 flex-shrink-0 relative overflow-hidden">
                    {appointment.propertyImage ? (
                      <img
                        src={appointment.propertyImage}
                        alt={appointment.propertyTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-6">
                          <MapPin className="w-16 h-16 text-blue-300 mx-auto mb-2" />
                          <p className="text-sm text-blue-600 font-medium">Hình ảnh bất động sản</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 lg:p-8">
                    {/* Title and Status */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {appointment.propertyTitle}
                        </h3>
                        <p className="text-gray-600 flex items-start gap-2">
                          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{appointment.propertyAddress}</span>
                        </p>
                      </div>
                      {appointment.status === 'pending' && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                          CHỜ XÁC NHẬN
                        </span>
                      )}
                      {appointment.status === 'confirmed' && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 whitespace-nowrap">
                          ĐÃ XÁC NHẬN
                        </span>
                      )}
                      {appointment.status === 'completed' && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                          ĐÃ HOÀN THÀNH
                        </span>
                      )}
                      {appointment.status === 'cancelled' && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 whitespace-nowrap">
                          ĐÃ HỦY
                        </span>
                      )}
                      {appointment.status === 'rejected' && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 whitespace-nowrap">
                          ĐÃ TỪ CHỐI
                        </span>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      {/* Time */}
                      <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Thời gian</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-900 font-semibold">{formatDateTime(appointment.scheduledAt)}</span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Khách hàng</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-900 font-semibold">{appointment.customerName}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Số điện thoại</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-900 font-semibold">{appointment.customerPhone}</span>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Email</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-900 font-semibold text-sm break-all">{appointment.customerEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {appointment.note && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-500 mb-2 font-medium">Ghi chú:</p>
                        <p className="text-gray-700 italic">"{appointment.note}"</p>
                      </div>
                    )}

                    {/* Cancellation Reason */}
                    {appointment.cancellationReason && (
                      <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-sm font-semibold text-red-800 mb-2">Lý do hủy/từ chối:</p>
                        <p className="text-red-700">{appointment.cancellationReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirm(appointment.appointmentId)}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors shadow-sm hover:shadow"
                          >
                            <Check className="w-5 h-5" />
                            Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setRejectReason('');
                              setShowRejectModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-semibold transition-colors"
                          >
                            <X className="w-5 h-5" />
                            Từ chối
                          </button>
                        </>
                      )}

                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setCompleteNote('');
                            setShowCompleteModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-sm hover:shadow"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Đánh dấu hoàn tất
                        </button>
                      )}

                      <button
                        onClick={() => window.open(`/properties/${appointment.propertyId}`, '_blank')}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold transition-colors shadow-sm hover:shadow"
                      >
                        <MapPin className="w-5 h-5" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {totalPages > 1 && page < totalPages - 1 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold shadow-sm hover:shadow transition-all"
            >
              Xem thêm lịch hẹn ▼
            </button>
          </div>
        )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Từ chối lịch hẹn</h3>
            <p className="text-gray-600 mb-6">
              Khách hàng: <strong className="text-gray-900">{selectedAppointment?.customerName}</strong>
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Vui lòng cho biết lý do từ chối..."
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold shadow-sm hover:shadow transition-all"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 font-semibold transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Đánh dấu hoàn tất</h3>
            <p className="text-gray-600 mb-6">
              Khách hàng: <strong className="text-gray-900">{selectedAppointment?.customerName}</strong>
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ghi chú sau khi hoàn tất (tùy chọn)
              </label>
              <textarea
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Thêm ghi chú về buổi gặp..."
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm hover:shadow transition-all"
              >
                Xác nhận hoàn tất
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 font-semibold transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
