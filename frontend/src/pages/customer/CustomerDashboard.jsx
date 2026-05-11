import { useState, useEffect } from "react";
import api from "../../services/api";
import PropertyCard from "../../components/PropertyCard";
import Badge from "../../components/Badge";
import { useFavorites } from "../../context/FavoritesContext";
import { Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách lịch hẹn", err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (bookingDate && bookingTime && bookingProperty) {
      const scheduledAt = `${bookingDate}T${bookingTime}:00`;
      try {
        const res = await api.post('/appointments', {
          propertyId: bookingProperty.propertyId,
          scheduledAt: scheduledAt,
          note: "Khách hàng hẹn xem qua portal"
        });
        if (res.data.success) {
          alert(`Đã đặt lịch hẹn xem thành công!`);
          setBookingProperty(null);
          setBookingDate("");
          setBookingTime("");
          setActiveTab("appointments");
          fetchAppointments();
        }
      } catch (err) {
        alert("Lỗi khi đặt lịch: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (bookingDate && bookingTime && rescheduleId) {
      const scheduledAt = `${bookingDate}T${bookingTime}:00`;
      try {
        const res = await api.put(`/appointments/${rescheduleId}`, {
          scheduledAt: scheduledAt,
          note: "Khách hàng dời lịch"
        });
        if (res.data.success) {
          alert(`Đã dời lịch hẹn xem thành công!`);
          setRescheduleId(null);
          setBookingDate("");
          setBookingTime("");
          fetchAppointments();
        }
      } catch (err) {
        alert("Lỗi khi dời lịch: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const openRescheduleModal = (apt) => {
    setBookingDate(apt.scheduledAt.split('T')[0]);
    setBookingTime(apt.scheduledAt.split('T')[1].substring(0, 5));
    setRescheduleId(apt.appointmentId);
  };

  const handleCancel = async (id) => {
    if (window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
      try {
        const res = await api.delete(`/appointments/${id}`);
        if (res.data.success) {
          alert('Đã hủy lịch hẹn');
          fetchAppointments();
        }
      } catch (err) {
        alert("Lỗi khi hủy lịch hẹn: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "appointments"
                ? "border-red-500 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "favorites"
                ? "border-red-500 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            Favorite Properties
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.length > 0 ? appointments.map((apt) => (
                <tr key={apt.appointmentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{apt.propertyTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(apt.scheduledAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(apt.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Badge status={apt.status === 'confirmed' ? 'success' : apt.status === 'cancelled' ? 'danger' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {apt.status === 'pending' && (
                      <div className="flex gap-3">
                        <button onClick={() => openRescheduleModal(apt)} className="text-indigo-600 hover:text-indigo-800 font-medium">Dời lịch</button>
                        <button onClick={() => handleCancel(apt.appointmentId)} className="text-red-600 hover:text-red-800 font-medium">Hủy</button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">Chưa có lịch hẹn nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.length > 0 ? (
            favorites.map((property) => (
              <div key={property.propertyId} className="flex flex-col">
                <PropertyCard property={property} />
                <button 
                  onClick={() => setBookingProperty(property)}
                  className="mt-2 flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Hẹn xem BĐS này
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-slate-500">
              Bạn chưa có bất động sản quan tâm nào.
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Hẹn xem BĐS</h2>
            <p className="mb-4 text-slate-600">
              Đặt lịch hẹn xem cho: <span className="font-semibold text-slate-800">{bookingProperty.title}</span>
            </p>
            <form onSubmit={handleBookAppointment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày xem</label>
                <input 
                  type="date" 
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-red-500 focus:border-red-500" 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Giờ xem</label>
                <input 
                  type="time" 
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-red-500 focus:border-red-500" 
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setBookingProperty(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-slate-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Xác nhận đặt lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
