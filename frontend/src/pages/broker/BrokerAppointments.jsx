import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Phone, 
  CheckCircle, XCircle, Eye, Filter, MoreVertical, Edit, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function BrokerAppointments() {
  const navigate = useNavigate();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const getDaysInMonth = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, date: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, date: new Date(year, month, d) });
    }
    return days;
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointment, newStatus) => {
    try {
      const response = await api.put(`/appointments/${appointment.appointmentId}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        if (newStatus === 'confirmed') {
          navigate('/broker/appointments/confirm-success', { state: { appointment: appointment } });
        } else {
          const actionLabels = {
            confirmed: 'xác nhận',
            viewed: 'xác nhận đã dẫn xem nhà',
            completed: 'hoàn tất',
            rejected: 'từ chối'
          };
          toast.success(`Đã ${actionLabels[newStatus] || 'cập nhật'} lịch hẹn`);
          fetchAppointments();
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Không thể cập nhật lịch hẹn');
    }
  };

  const handleRescheduleDirectPayment = async (appointment) => {
    const currentValue = appointment.scheduledAt ? appointment.scheduledAt.slice(0, 16) : '';
    const nextValue = window.prompt('Nhập thời gian mới cho lịch giao dịch trực tiếp (YYYY-MM-DDTHH:mm)', currentValue);
    if (!nextValue) return;
    try {
      const response = await api.put(`/appointments/${appointment.appointmentId}`, {
        scheduledAt: `${nextValue}:00`,
        note: 'Môi giới đề xuất dời lịch giao dịch trực tiếp',
      });
      if (response.data.success) {
        toast.success('Đã dời lịch giao dịch trực tiếp, chờ xác nhận lại lịch');
        fetchAppointments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể dời lịch giao dịch trực tiếp');
    }
  };

  const handleConfirmDirectPayment = async (appointment) => {
    if (!appointment.transactionId) {
      toast.error('Không tìm thấy giao dịch liên kết với lịch giao dịch trực tiếp này');
      return;
    }
    try {
      const response = await api.patch(`/transactions/${appointment.transactionId}/broker-confirm`);
      if (response.data.success) {
        toast.success('Đã xác nhận giao dịch trực tiếp thành công');
        fetchAppointments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận giao dịch trực tiếp');
    }
  };

  const handleRejectDirectPayment = async (appointment) => {
    if (!appointment.transactionId) {
      toast.error('Không tìm thấy giao dịch liên kết với lịch giao dịch trực tiếp này');
      return;
    }
    if (!window.confirm('Xác nhận giao dịch trực tiếp thất bại?')) return;
    try {
      const response = await api.patch(`/transactions/${appointment.transactionId}/broker-reject`);
      if (response.data.success) {
        toast.success('Đã xác nhận giao dịch trực tiếp thất bại');
        fetchAppointments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật giao dịch trực tiếp');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700',
        label: 'Chờ xác nhận' 
      },
      confirmed: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'Đã xác nhận' 
      },
      scheduled: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'Đã xác nhận' 
      },
      viewed: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        label: 'Đã dẫn xem nhà' 
      },
      deal_scheduled: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        label: 'Lịch giao dịch trực tiếp'
      },
      completed: { 
        bg: 'bg-slate-100', 
        text: 'text-slate-700',
        label: 'Hoàn tất' 
      },
      cancelled: { 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        label: 'Đã hủy' 
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        label: 'Từ chối' 
      }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {badge.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    let statusMatch = true;
    if (filter !== 'all') {
      if (filter === 'upcoming') {
        statusMatch = (apt.status === 'pending' || apt.status === 'confirmed' || 
                       apt.status === 'scheduled' || apt.status === 'deal_scheduled');
      } else if (filter === 'confirmed') {
        statusMatch = apt.status === 'confirmed' || apt.status === 'scheduled';
      } else {
        statusMatch = apt.status === filter;
      }
    }
    
    let typeMatch = true;
    if (selectedType === 'viewing') {
      typeMatch = apt.appointmentType !== 'direct_payment';
    } else if (selectedType === 'direct_payment') {
      typeMatch = apt.appointmentType === 'direct_payment';
    }

    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      searchMatch = (apt.customerName?.toLowerCase().includes(q) || 
                     apt.customerPhone?.includes(q) || 
                     apt.propertyTitle?.toLowerCase().includes(q));
    }

    return statusMatch && typeMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950 mb-2">Quản lý Lịch hẹn</h1>
          <p className="text-slate-600">Theo dõi và quản lý lịch xem nhà, lịch giao dịch trực tiếp của khách hàng.</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl premium-shadow border border-slate-100 p-2 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                filter === 'all' 
                  ? 'bg-slate-950 text-gold-400 shadow-md shadow-slate-950/20' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Tất cả ({appointments.length})
            </button>

            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                filter === 'pending' 
                  ? 'bg-slate-950 text-gold-400 shadow-md shadow-slate-950/20' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Chờ xác nhận ({appointments.filter(a => a.status === 'pending').length})
            </button>

            <button
              onClick={() => setFilter('confirmed')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                filter === 'confirmed' 
                  ? 'bg-slate-950 text-gold-400 shadow-md shadow-slate-950/20' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Đã xác nhận ({appointments.filter(a => ['confirmed', 'scheduled'].includes(a.status)).length})
            </button>

            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                filter === 'completed' 
                  ? 'bg-slate-950 text-gold-400 shadow-md shadow-slate-950/20' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Hoàn tất ({appointments.filter(a => a.status === 'completed').length})
            </button>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showFilterDropdown 
                  ? 'bg-slate-955 bg-slate-950 text-gold-400' 
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Bộ lọc nâng cao"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-slate-955 bg-slate-950 text-gold-400' 
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={viewMode === 'list' ? "Chuyển sang lịch biểu" : "Chuyển sang danh sách"}
            >
              <Calendar className="w-5 h-5" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl animate-fade-in origin-top-right">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Lọc nâng cao</h4>
                
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tìm kiếm nhanh</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tên khách, SĐT, BDS..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-950 transition-colors"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Loại cuộc hẹn</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedType('all')}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg transition ${selectedType === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setSelectedType('viewing')}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg transition ${selectedType === 'viewing' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Xem nhà
                    </button>
                    <button
                      onClick={() => setSelectedType('direct_payment')}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg transition ${selectedType === 'direct_payment' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Giao dịch
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedType('all');
                    setSearchQuery('');
                    setShowFilterDropdown(false);
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-700 uppercase rounded-xl transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Appointments Content (Calendar or List) */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 premium-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Tháng {currentMonth + 1}, {currentYear}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  &larr; Tháng trước
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  Tháng sau &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
              <div>CN</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentYear, currentMonth).map((cell, idx) => {
                if (!cell.day) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-2xl" />;
                }
                const cellDateStr = cell.date.toDateString();
                const isToday = new Date().toDateString() === cellDateStr;
                const cellApts = filteredAppointments.filter(apt => {
                  if (!apt.scheduledAt) return false;
                  return new Date(apt.scheduledAt).toDateString() === cellDateStr;
                });

                return (
                  <div
                    key={`day-${cell.day}`}
                    className={`aspect-square p-2 border border-slate-100 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all group ${
                      isToday ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                        isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800'
                      }`}>
                        {cell.day}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {cellApts.slice(0, 2).map(apt => (
                        <div
                          key={apt.appointmentId}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/broker/appointments/${apt.appointmentId}`);
                          }}
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer transition ${
                            apt.appointmentType === 'direct_payment'
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                          title={`${apt.customerName} - ${apt.propertyTitle}`}
                        >
                          {apt.customerName}
                        </div>
                      ))}
                      {cellApts.length > 2 && (
                        <div className="text-[7px] font-black text-slate-400 uppercase pl-1">
                          +{cellApts.length - 2} lịch hẹn
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center col-span-full">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-950 mb-2">Không có lịch hẹn</h3>
              <p className="text-slate-600 text-sm">Chưa có lịch hẹn nào khớp bộ lọc trong danh mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.appointmentId} 
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
              >
                {/* Card Header - Customer Info */}
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg ${
                        appointment.status === 'pending' ? 'bg-yellow-500' :
                        appointment.status === 'confirmed' || appointment.status === 'scheduled' ? 'bg-emerald-500' :
                        appointment.status === 'deal_scheduled' ? 'bg-indigo-500' :
                        appointment.status === 'viewed' ? 'bg-blue-500' :
                        appointment.status === 'completed' ? 'bg-gray-500' :
                        'bg-gray-400'
                      }`}>
                        {appointment.customerName?.charAt(0).toUpperCase() || 'K'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-950 text-base">{appointment.customerName}</h3>
                        {appointment.appointmentType === 'direct_payment' && (
                          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700">Giao dịch trực tiếp</p>
                        )}
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          {appointment.customerPhone}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-5">
                  <div className="flex gap-3 mb-4">
                    {appointment.propertyImage && (
                      <img 
                        src={appointment.propertyImage} 
                        alt={appointment.propertyTitle}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-950 text-base mb-2 line-clamp-2">
                        {appointment.propertyTitle}
                      </h4>
                      <p className="text-sm text-slate-600 flex items-start gap-1.5 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{appointment.propertyAddress}</span>
                      </p>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {appointment.note && (
                    <div className="mb-4 p-3 bg-emerald-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-slate-700 italic line-clamp-2">
                        "{appointment.note}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận lịch
                        </button>
                        <button
                          onClick={() => handleRescheduleDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-bold text-sm border-2 border-indigo-200"
                        >
                          <Edit className="w-4 h-4" />
                          Dời lịch
                        </button>

                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm border-2 border-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                        <button className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleConfirmDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận đã thanh toán
                        </button>
                        <button
                          onClick={() => handleRejectDirectPayment(appointment)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm border-2 border-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                          Giao dịch thất bại
                        </button>
                        <button
                          onClick={() => handleRescheduleDirectPayment(appointment)}
                          className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                          title="Dời lịch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && (appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết & Liên hệ lại
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment, 'viewed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-bold text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Đã dẫn xem nhà
                        </button>
                        <button className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.status === 'viewed' && (
                      <>
                        <button
                          onClick={() => navigate(`/broker/transactions/create?appointmentId=${appointment.appointmentId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-bold text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Tạo giao dịch cọc
                        </button>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType !== 'direct_payment' && appointment.status === 'completed' && (
                      <>
                        <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Lịch hẹn đã hoàn tất
                        </div>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appointment.appointmentType === 'direct_payment' && appointment.status === 'completed' && (
                      <>
                        <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Đã xác nhận giao dịch trực tiếp
                        </div>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(appointment.status === 'cancelled' || appointment.status === 'rejected') && (
                      <>
                        <div className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" />
                          {appointment.status === 'cancelled' ? 'Lịch hẹn đã bị hủy' : 'Lịch hẹn đã bị từ chối'}
                        </div>
                        <button
                          onClick={() => navigate(`/broker/appointments/${appointment.appointmentId}`)}
                          className="px-4 py-3 bg-gray-50 text-slate-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
