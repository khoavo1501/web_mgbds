import { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp } from "lucide-react";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import { Link } from "react-router-dom";
import api from "../../services/api";

const appointmentStatusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận lịch",
  viewed: "Đã dẫn khách xem nhà",
  cancelled: "Đã hủy",
};

const getAppointmentBadge = (status) => {
  if (status === "confirmed" || status === "viewed") return "success";
  if (status === "cancelled") return "danger";
  return "warning";
};

export default function BrokerDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi tải lịch hẹn", err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}`, { status });
      if (res.data.success) {
        alert("Cập nhật lịch hẹn thành công!");
        fetchAppointments();
      }
    } catch {
      alert("Lỗi khi cập nhật lịch hẹn");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

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
          note: "Broker dời lịch"
        });
        if (res.data.success) {
          alert(`Đã dời lịch hẹn xem thành công!`);
          setRescheduleId(null);
          fetchAppointments();
        }
      } catch (err) {
        alert("Lỗi khi dời lịch: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Tổng quan Môi giới</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Khách hàng tiềm năng" value="24" trend={12} icon={Users} />
        <StatCard title="Lịch hẹn" value={appointments.length.toString()} trend={-5} icon={Calendar} />
        <StatCard title="Giao dịch thành công" value="3" trend={20} icon={TrendingUp} />
      </div>

      {/* Lịch hẹn sắp tới */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Lịch hẹn sắp tới</h2>
        <div className="space-y-6">
          {appointments.length > 0 ? appointments.map((apt, index) => (
            <div key={apt.appointmentId} className="flex relative">
              {index !== appointments.length - 1 && (
                <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-gray-200"></div>
              )}
              <div className="flex-shrink-0 w-12 text-sm font-bold text-slate-500 pt-1">
                {new Date(apt.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="ml-4 bg-gray-50 rounded-lg p-4 flex-1 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">{apt.propertyTitle}</h4>
                    <p className="text-sm text-slate-500 mt-1">Khách hàng: {apt.customerName}</p>
                    <p className="text-sm text-slate-500">Ngày: {new Date(apt.scheduledAt).toLocaleDateString('vi-VN')}</p>
                    <p className="text-sm text-slate-500 mt-1 text-red-600">Ghi chú: {apt.note}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={getAppointmentBadge(apt.status)}>
                      {appointmentStatusLabels[apt.status] || apt.status}
                    </Badge>
                    {apt.status === 'pending' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <button onClick={() => handleUpdateStatus(apt.appointmentId, 'confirmed')} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">Xác nhận</button>
                        <button onClick={() => openRescheduleModal(apt)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">Dời lịch</button>
                        <button onClick={() => handleUpdateStatus(apt.appointmentId, 'cancelled')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Từ chối</button>
                      </div>
                    )}
                    {apt.status === 'confirmed' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <button onClick={() => handleUpdateStatus(apt.appointmentId, 'viewed')} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">Xác nhận đã dẫn khách xem nhà</button>
                        <button onClick={() => openRescheduleModal(apt)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">Dời lịch</button>
                      </div>
                    )}
                    {apt.status === 'viewed' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <Link to={`/broker/transactions/create?appointmentId=${apt.appointmentId}`} className="text-xs text-center font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Tạo Giao Dịch Đặt Cọc</Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-slate-500 text-center py-4">Chưa có lịch hẹn nào</div>
          )}
        </div>
      </div>
      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Dời lịch hẹn</h2>
            <form onSubmit={handleReschedule}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày xem mới</label>
                <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Giờ xem mới</label>
                <input type="time" required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRescheduleId(null)} className="px-4 py-2 border rounded">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Xác nhận dời lịch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
