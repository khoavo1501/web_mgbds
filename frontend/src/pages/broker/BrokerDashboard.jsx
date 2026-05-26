import { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp, TrendingDown, Tag, User, Clock, CheckCircle, XCircle, Edit, Megaphone, GraduationCap, ArrowRight, DollarSign, FileText, AlertCircle, Home, Eye, Heart, BarChart3, Activity, Bell, Settings, Plus, Search, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import transactionService from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";

const appointmentStatusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
  scheduled: "Đã lên lịch",
};

const transactionStatusLabels = {
  pending_deposit: "Chờ đặt cọc",
  deposit_confirmed: "Đã đặt cọc",
  documents_submitted: "Đã nộp hồ sơ",
  payment_submitted: "Đã thanh toán",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

const getAppointmentBadge = (status) => {
  if (status === "confirmed" || status === "completed" || status === "scheduled") return "success";
  if (status === "cancelled" || status === "rejected") return "danger";
  return "warning";
};

export default function BrokerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [combinedItems, setCombinedItems] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 24,
    customerTrend: 12,
    todayAppointments: 12,
    appointmentTrend: -5,
    successfulTransactions: 3,
    transactionTrend: 20,
    totalRevenue: 120000000,
    activeProperties: 8,
    totalViews: 1250,
    viewsTrend: 15
  });
  const [topProperties, setTopProperties] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        // Lọc lịch hẹn sắp tới (pending, confirmed, scheduled)
        const upcomingAppointments = res.data.data
          .filter(apt => ['pending', 'confirmed', 'scheduled'].includes(apt.status))
          .map(apt => ({
            ...apt,
            type: 'appointment',
            dateTime: new Date(apt.scheduledAt)
          }));
        setAppointments(upcomingAppointments);
        
        // Cập nhật số lịch hẹn hôm nay
        const today = new Date().toDateString();
        const todayCount = res.data.data.filter(apt => 
          new Date(apt.scheduledAt).toDateString() === today &&
          ['pending', 'confirmed', 'scheduled'].includes(apt.status)
        ).length;
        setStats(prev => ({ ...prev, todayAppointments: todayCount }));
      }
    } catch (err) {
      console.error("Lỗi tải lịch hẹn", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await transactionService.getMyTransactions();
      if (res.success) {
        // Lọc giao dịch đang hoạt động (không phải completed, cancelled, expired)
        const activeTransactions = res.data
          .filter(txn => !['completed', 'cancelled', 'expired'].includes(txn.status))
          .map(txn => ({
            ...txn,
            type: 'transaction',
            dateTime: txn.expiredAt ? new Date(txn.expiredAt) : new Date(txn.createdAt)
          }));
        setTransactions(activeTransactions);
        
        // Cập nhật số giao dịch thành công
        const completedCount = res.data.filter(txn => txn.status === 'completed').length;
        setStats(prev => ({ ...prev, successfulTransactions: completedCount }));
      }
    } catch (err) {
      console.error("Lỗi tải giao dịch", err);
    }
  };

  const fetchTopProperties = async () => {
    try {
      const res = await api.get('/properties/my-properties');
      if (res.data.success) {
        // Lấy top 5 BĐS có nhiều lượt xem nhất
        const sorted = res.data.data
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5);
        setTopProperties(sorted);
        
        // Cập nhật tổng số BĐS đang hoạt động
        const activeCount = res.data.data.filter(p => p.status === 'available').length;
        const totalViews = res.data.data.reduce((sum, p) => sum + (p.views || 0), 0);
        setStats(prev => ({ ...prev, activeProperties: activeCount, totalViews }));
      }
    } catch (err) {
      console.error("Lỗi tải BĐS", err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Tạo danh sách hoạt động gần đây từ appointments và transactions
      const activities = [];
      
      // Thêm appointments gần đây
      appointments.slice(0, 3).forEach(apt => {
        activities.push({
          id: `apt-${apt.appointmentId}`,
          type: 'appointment',
          title: `Lịch hẹn xem ${apt.propertyTitle}`,
          description: `Khách hàng ${apt.customerName}`,
          time: apt.scheduledAt,
          icon: Calendar,
          color: 'blue'
        });
      });
      
      // Thêm transactions gần đây
      transactions.slice(0, 2).forEach(txn => {
        activities.push({
          id: `txn-${txn.transactionId}`,
          type: 'transaction',
          title: `Giao dịch ${txn.propertyTitle}`,
          description: `${transactionStatusLabels[txn.status]}`,
          time: txn.createdAt,
          icon: DollarSign,
          color: 'green'
        });
      });
      
      // Sắp xếp theo thời gian
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivities(activities.slice(0, 5));
    } catch (err) {
      console.error("Lỗi tải hoạt động", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchTransactions();
    fetchTopProperties();
  }, []);

  // Kết hợp và sắp xếp lịch hẹn + giao dịch theo thời gian
  useEffect(() => {
    const combined = [...appointments, ...transactions]
      .sort((a, b) => a.dateTime - b.dateTime)
      .slice(0, 10); // Chỉ lấy 10 items gần nhất
    setCombinedItems(combined);
    fetchRecentActivities();
  }, [appointments, transactions]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}`, { status });
      if (res.data.success) {
        alert("Cập nhật lịch hẹn thành công!");
        fetchAppointments();
      }
    } catch (err) {
      alert("Lỗi khi cập nhật lịch hẹn: " + (err.response?.data?.message || err.message));
    }
  };

  const openRescheduleModal = (apt) => {
    setBookingDate(apt.scheduledAt.split('T')[0]);
    setBookingTime(apt.scheduledAt.split('T')[1].substring(0, 5));
    setRescheduleId(apt.appointmentId);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (bookingDate && bookingTime && rescheduleId) {
      const scheduledAt = `${bookingDate}T${bookingTime}:00`;
      try {
        const res = await api.put(`/appointments/${rescheduleId}`, {
          scheduledAt: scheduledAt,
          note: "Môi giới đề xuất dời lịch"
        });
        if (res.data.success) {
          alert(`Đã dời lịch hẹn thành công!`);
          setRescheduleId(null);
          fetchAppointments();
        }
      } catch (err) {
        alert("Lỗi khi dời lịch: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header với Quick Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Môi giới
              </h1>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Online
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Chào mừng trở lại, <span className="font-semibold text-gray-900">{user?.fullName || 'Môi giới'}</span> 👋
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/broker/properties/create" 
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Đăng tin mới
            </Link>
            <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 font-semibold text-gray-700 transition-all hover:scale-105">
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 font-semibold text-gray-700 transition-all hover:scale-105 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Khách hàng tiềm năng */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.customerTrend}%
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Khách hàng tiềm năng</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalCustomers}</p>
                <p className="text-gray-400 text-xs">So với tháng trước</p>
              </div>
            </div>
          </div>

          {/* Lịch hẹn hôm nay */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                  stats.appointmentTrend >= 0 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  {stats.appointmentTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stats.appointmentTrend >= 0 ? '+' : ''}{stats.appointmentTrend}%
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Lịch hẹn hôm nay</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.todayAppointments}</p>
                <p className="text-gray-400 text-xs">Cần chuẩn bị tài liệu</p>
              </div>
            </div>
          </div>

          {/* Giao dịch thành công */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <Tag className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.transactionTrend}%
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Giao dịch thành công</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.successfulTransactions}</p>
                <p className="text-gray-400 text-xs">Tháng này</p>
              </div>
            </div>
          </div>

          {/* Doanh thu dự kiến */}
          <div className="group bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-white text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.transactionTrend}%
                </div>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-2">Hoa hồng dự kiến</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-white/80 text-xs">VNĐ tháng này</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Lịch hẹn & Giao dịch (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lịch hẹn & Giao dịch sắp tới */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Lịch trình sắp tới</h2>
                  <p className="text-gray-500 text-sm">Quản lý lịch hẹn và giao dịch của bạn</p>
                </div>
                <div className="flex gap-2">
                  <Link 
                    to="/broker/appointments" 
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Lịch hẹn
                  </Link>
                  <Link 
                    to="/broker/transactions/history" 
                    className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1 px-4 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Giao dịch
                  </Link>
                </div>
              </div>
              
              <div className="space-y-6">
                {combinedItems.length > 0 ? combinedItems.map((item, index) => {
              const itemDate = item.dateTime;
              const isToday = itemDate.toDateString() === new Date().toDateString();
              const isTomorrow = itemDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              // Render Appointment
              if (item.type === 'appointment') {
                return (
                  <div key={`apt-${item.appointmentId}`} className="flex relative">
                    {/* Timeline */}
                    {index !== combinedItems.length - 1 && (
                      <div className="absolute left-[52px] top-20 bottom-[-24px] w-0.5 bg-gray-200"></div>
                    )}
                    
                    {/* Time Badge */}
                    <div className="flex-shrink-0 w-24">
                      <div className={`text-center py-2 px-3 rounded-lg ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <div className="text-xs font-semibold uppercase">
                          {isToday ? 'HÔM NAY' : isTomorrow ? 'MAI' : itemDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="text-xl font-bold mt-1">
                          {itemDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Appointment Card */}
                    <div className="ml-6 bg-white rounded-xl border-2 border-blue-200 p-5 flex-1 hover:border-blue-400 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{item.propertyTitle}</h3>
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'confirmed' || item.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                              item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointmentStatusLabels[item.status] || item.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>Khách hàng: <span className="font-semibold">{item.customerName}</span></span>
                          </div>
                          {item.note && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-gray-700 italic">
                                <span className="font-semibold">Ghi chú:</span> {item.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(item.appointmentId, 'confirmed')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Xác nhận
                            </button>
                            <button 
                              onClick={() => openRescheduleModal(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Dời lịch
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(item.appointmentId, 'rejected')}
                              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-sm transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Từ chối
                            </button>
                          </>
                        )}
                        {(item.status === 'confirmed' || item.status === 'scheduled') && (
                          <>
                            <button 
                              onClick={() => navigate(`/broker/appointments/${item.appointmentId}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors"
                            >
                              Chi tiết
                            </button>
                            <button 
                              onClick={() => openRescheduleModal(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Dời lịch
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Render Transaction
              if (item.type === 'transaction') {
                return (
                  <div key={`txn-${item.transactionId}`} className="flex relative">
                    {/* Timeline */}
                    {index !== combinedItems.length - 1 && (
                      <div className="absolute left-[52px] top-20 bottom-[-24px] w-0.5 bg-gray-200"></div>
                    )}
                    
                    {/* Time Badge */}
                    <div className="flex-shrink-0 w-24">
                      <div className={`text-center py-2 px-3 rounded-lg ${
                        item.status === 'pending_deposit' ? 'bg-red-600 text-white' : 'bg-green-100 text-green-700'
                      }`}>
                        <div className="text-xs font-semibold uppercase">
                          {item.status === 'pending_deposit' ? 'Hạn cọc' : 'Giao dịch'}
                        </div>
                        <div className="text-xl font-bold mt-1">
                          {itemDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Transaction Card */}
                    <div className="ml-6 bg-white rounded-xl border-2 border-green-200 p-5 flex-1 hover:border-green-400 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{item.propertyTitle}</h3>
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                              item.status === 'pending_deposit' ? 'bg-red-100 text-red-800' :
                              item.status === 'deposit_confirmed' ? 'bg-green-100 text-green-800' :
                              item.status === 'documents_submitted' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'payment_submitted' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transactionStatusLabels[item.status] || item.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>Khách hàng: <span className="font-semibold">{item.customerName}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span>Giá trị: <span className="font-semibold text-green-600">{item.totalAmount?.toLocaleString('vi-VN')} VNĐ</span></span>
                          </div>
                          {item.status === 'pending_deposit' && item.expiredAt && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500 flex items-start gap-2">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">
                                <span className="font-semibold">Cảnh báo:</span> Khách hàng cần đặt cọc trước {new Date(item.expiredAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button 
                          onClick={() => navigate(`/broker/transactions/history`)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return null;
                }) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">Chưa có lịch hẹn hoặc giao dịch nào</p>
                    <p className="text-gray-400 text-sm mt-2">Các hoạt động mới sẽ xuất hiện ở đây</p>
                    <Link 
                      to="/broker/properties" 
                      className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all hover:scale-105"
                    >
                      <Home className="w-5 h-5" />
                      Xem BĐS của tôi
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
        {/* Top BĐS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top BĐS của bạn</h3>
            <Link to="/broker/properties" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {topProperties.length > 0 ? topProperties.map((property, idx) => (
              <div key={property.propertyId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    #{idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      {property.views || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Heart className="w-3 h-3" />
                      {property.favorites || 0}
                    </div>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )) : (
              <div className="text-center py-8">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Chưa có BĐS nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.color === 'blue' ? 'bg-blue-100' :
                    activity.color === 'green' ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      activity.color === 'blue' ? 'text-blue-600' :
                      activity.color === 'green' ? 'text-green-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.time).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-4">Thống kê tháng này</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/90">BĐS đang bán</span>
              </div>
              <span className="text-xl font-bold">{stats.activeProperties}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/90">Tổng lượt xem</span>
              </div>
              <span className="text-xl font-bold">{stats.totalViews}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/90">Tỷ lệ chuyển đổi</span>
              </div>
              <span className="text-xl font-bold">
                {stats.totalCustomers > 0 ? ((stats.successfulTransactions / stats.totalCustomers) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
          <Link 
            to="/broker/analytics" 
            className="flex items-center justify-center gap-2 mt-6 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 font-semibold transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Xem báo cáo chi tiết
          </Link>
        </div>
      </div>
    </div>

        {/* Bottom Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Đẩy tin thông minh */}
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Megaphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Đẩy tin thông minh</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Bạn có 3 tin đăng sắp hết hạn. Sử dụng lượt đẩy tin để tăng 200% lượt xem.
                </p>
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group-hover:gap-3 transition-all">
                  Thực hiện ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Kỹ năng chốt sale */}
          <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Kỹ năng chốt sale</h3>
                <p className="text-gray-700 text-sm mb-4">
                  MGBDS Academy vừa cập nhật khóa học "Xử lý từ chối trong BĐS cao cấp".
                </p>
                <button className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm group-hover:gap-3 transition-all">
                  Học ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Hỗ trợ khách hàng */}
          <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Hỗ trợ 24/7</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Cần hỗ trợ? Đội ngũ chăm sóc khách hàng luôn sẵn sàng giúp đỡ bạn.
                </p>
                <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm group-hover:gap-3 transition-all">
                  Liên hệ ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dời lịch hẹn</h2>
            <form onSubmit={handleReschedule}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày xem mới</label>
                <input 
                  type="date" 
                  required 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none" 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ xem mới</label>
                <input 
                  type="time" 
                  required 
                  value={bookingTime} 
                  onChange={(e) => setBookingTime(e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none" 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setRescheduleId(null)} 
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Xác nhận dời lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
