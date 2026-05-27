import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, Phone, Mail, Eye, Edit, Trash2, Clock, Building2 } from 'lucide-react';
import { getMyAppointments } from '../../services/appointmentService';

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, [page, filterStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointments...');
      const response = await getMyAppointments(page, 10);
      console.log('Full Response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.content:', response.data?.content);
      
      if (response.success) {
        // Backend có thể trả về Page object hoặc array trực tiếp
        let allAppointments = [];
        
        if (response.data.content) {
          // Trường hợp Page object
          allAppointments = response.data.content;
        } else if (Array.isArray(response.data)) {
          // Trường hợp array trực tiếp
          allAppointments = response.data;
        } else {
          console.error('Unexpected data structure:', response.data);
          allAppointments = [];
        }
        
        console.log('All appointments:', allAppointments);
        console.log('Filter status:', filterStatus);
        
        // Filter by status
        let filtered = allAppointments;
        if (filterStatus !== 'all') {
          filtered = allAppointments.filter(apt => {
            console.log(`Appointment ${apt.appointmentId} status: ${apt.status}`);
            return apt.status === filterStatus;
          });
        }
        
        console.log('Filtered appointments:', filtered);
        setAppointments(filtered);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.error('API returned success=false');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', error.response?.data);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Chờ xác nhận' },
      confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Đã xác nhận' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã hoàn thành' },
      cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Đã hủy' },
      rejected: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Bị từ chối' },
      scheduled: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Đã lên lịch' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 mb-3 tracking-tight">Lịch hẹn của tôi</h1>
          <p className="text-slate-600 text-base font-medium">Quản lý và theo dõi trạng thái các lịch hẹn xem bất động sản của bạn.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 hide-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-gold-50 premium-shadow border border-slate-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              filterStatus === 'confirmed'
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-gold-50 premium-shadow border border-slate-100'
            }`}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              filterStatus === 'pending'
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-gold-50 premium-shadow border border-slate-100'
            }`}
          >
            Chờ xác nhận
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              filterStatus === 'completed'
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-gold-50 premium-shadow border border-slate-100'
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl premium-shadow border border-slate-100">
            <Calendar className="mx-auto h-20 w-20 text-slate-300 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-3">Chưa có lịch hẹn nào</h3>
            <p className="text-slate-500 mb-8 font-medium">Bạn chưa có lịch hẹn xem bất động sản nào trong mục này.</p>
            <button
              onClick={() => navigate('/properties')}
              className="px-8 py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded-xl hover:from-gold-300 hover:to-gold-500 font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Khám phá bất động sản ngay
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {appointments.map((appointment) => (
              <div key={appointment.appointmentId} className="bg-white rounded-[2rem] premium-shadow border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1.5 overflow-hidden relative group">
                
                {/* Subtle Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gold-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Alert Banner for Pending Appointments */}
                {appointment.status === 'pending' && (
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 sm:px-8 py-3.5 flex items-center gap-3 text-white relative z-10 shadow-sm">
                    <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">ĐANG CHỜ XÁC NHẬN</h4>
                      <p className="text-xs text-amber-50 font-medium">
                        Lịch hẹn đang chờ chuyên viên xác nhận.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row p-4 gap-6 sm:gap-8 relative z-10">
                  {/* Property Image - Inset Style */}
                  <div className="md:w-[300px] h-60 md:h-auto bg-slate-100 rounded-3xl overflow-hidden flex-shrink-0 relative premium-shadow border border-slate-100/50 group-hover:shadow-lg transition-shadow">
                    {appointment.propertyImage ? (
                      <img
                        src={appointment.propertyImage}
                        alt={appointment.propertyTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(appointment.propertyTitle)}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <Building2 className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    {/* Gradient Overlay for Image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center py-2 md:py-4 pr-2 md:pr-4">
                    <div className="mb-6">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-gold-600 transition-colors">
                        {appointment.propertyTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="p-1.5 bg-gold-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gold-500" />
                        </div>
                        <span className="text-slate-600 font-medium text-sm sm:text-base">{appointment.propertyAddress}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Left Column */}
                      <div className="space-y-4 p-5 rounded-2xl bg-[#f8f6f2] border border-gold-500/10">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Thời gian</p>
                          <div className="flex items-center gap-2.5 text-slate-900">
                            <Calendar className="w-4 h-4 text-gold-500" />
                            <span className="font-bold text-sm sm:text-base">{formatDateTime(appointment.scheduledAt)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Liên hệ</p>
                          <div className="flex items-center gap-2.5 text-slate-900">
                            <Phone className="w-4 h-4 text-gold-500" />
                            <span className="font-bold text-sm sm:text-base">{appointment.contactPhone || appointment.customerPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Chuyên viên tư vấn</p>
                          <div className="flex items-center gap-2.5 text-slate-900">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-sm sm:text-base">{appointment.brokerName}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</p>
                          <div className="flex items-center gap-2.5 text-slate-900">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-sm sm:text-base">{appointment.brokerEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {appointment.note && (
                      <div className="mb-6 p-4 sm:p-5 bg-gold-50/50 rounded-2xl border border-gold-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gold-400/10 rounded-full blur-2xl"></div>
                        <p className="text-xs font-black text-gold-600 mb-2 uppercase tracking-wider">Ghi chú của bạn</p>
                        <p className="text-slate-700 italic font-medium text-sm leading-relaxed">"{appointment.note}"</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 mt-auto">
                      <button
                        onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}`)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md hover:shadow-lg text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>

                      {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                        <>
                          <button
                            onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}/reschedule`)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all text-sm"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                            Dời lịch
                          </button>

                          <button
                            onClick={() => navigate(`/customer/appointments/${appointment.appointmentId}/cancel`)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 font-bold transition-all text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hủy lịch
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {totalPages > 1 && page < totalPages - 1 && (
          <div className="text-center mt-12">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-black transition-all shadow-sm hover:shadow-md"
            >
              Tải thêm lịch hẹn ▾
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
