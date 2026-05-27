import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, 
  Building2, CheckCircle, XCircle, AlertCircle,
  Edit, Trash2 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProperties, setRelatedProperties] = useState([]);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.data);
        // Fetch related properties
        fetchRelatedProperties();
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProperties = async () => {
    try {
      const response = await api.get('/properties?page=0&size=3');
      if (response.data.success) {
        setRelatedProperties(response.data.data.content || []);
      }
    } catch (error) {
      console.error('Error fetching related properties:', error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        icon: Clock, 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        text: 'text-yellow-800', 
        label: 'Chờ xác nhận' 
      },
      confirmed: { 
        icon: CheckCircle, 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        text: 'text-green-800', 
        label: 'Đã xác nhận' 
      },
      completed: { 
        icon: CheckCircle, 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        text: 'text-blue-800', 
        label: 'Hoàn tất' 
      },
      cancelled: { 
        icon: XCircle, 
        bg: 'bg-gray-50', 
        border: 'border-gray-200',
        text: 'text-gray-800', 
        label: 'Đã hủy' 
      },
      rejected: { 
        icon: XCircle, 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        text: 'text-red-800', 
        label: 'Bị từ chối' 
      },
      scheduled: { 
        icon: CheckCircle, 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        text: 'text-green-800', 
        label: 'Đã lên lịch' 
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy lịch hẹn</h3>
          <button
            onClick={() => navigate('/customer/appointments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <button onClick={() => navigate('/')} className="hover:text-gray-900">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate('/customer/appointments')} className="hover:text-gray-900">Lịch hẹn</button>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Chi tiết lịch hẹn</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left - Property Image */}
            <div className="relative h-96 lg:h-auto bg-gray-200">
              {appointment.propertyImage ? (
                <img
                  src={appointment.propertyImage}
                  alt={appointment.propertyTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-24 h-24 text-gray-400" />
                </div>
              )}
              <span className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                {statusConfig.label}
              </span>
            </div>

            {/* Right - Appointment Info */}
            <div className="p-8 lg:p-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {appointment.propertyTitle}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mb-8">
                <MapPin className="w-5 h-5" />
                {appointment.propertyAddress}
              </p>

              {/* Meeting Location Highlight */}
              <div className="mb-8 p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Địa điểm xem nhà</h3>
                    <p className="text-base font-semibold text-gray-900 mb-3">
                      {appointment.propertyAddress}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.propertyAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      <MapPin className="w-4 h-4" />
                      Xem trên bản đồ
                    </a>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Time */}
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold uppercase">Thời gian</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(appointment.scheduledAt).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} {new Date(appointment.scheduledAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                {/* Broker */}
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-semibold uppercase">Môi giới</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {appointment.brokerName}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-semibold uppercase">Số điện thoại</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {appointment.contactPhone || appointment.customerPhone}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold uppercase">Email</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 break-all">
                    {appointment.brokerEmail}
                  </p>
                </div>
              </div>

              {/* Note */}
              {appointment.note && (
                <div className="mb-8 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-semibold mb-1">Ghi chú:</p>
                  <p className="text-gray-700 italic">"{appointment.note}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/properties/${appointment.propertyId}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold transition-colors shadow-sm hover:shadow"
                >
                  <Building2 className="w-5 h-5" />
                  Xem chi tiết bất động sản
                </button>

                {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                  <>
                    <button
                      onClick={() => navigate(`/customer/appointments/${id}/reschedule`)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                      Dời lịch
                    </button>
                    <button
                      onClick={() => navigate(`/customer/appointments/${id}/cancel`)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-semibold transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      Hủy lịch
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Properties Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Có thể bạn quan tâm</h2>
            <button 
              onClick={() => navigate('/properties')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Xem tất cả
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProperties.length > 0 ? (
              relatedProperties.map((property) => (
                <div 
                  key={property.propertyId} 
                  onClick={() => navigate(`/properties/${property.propertyId}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images.find(img => img.isPrimary)?.url || property.images[0]?.url} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                      <MapPin className="w-4 h-4" />
                      {property.address || `${property.district}, ${property.province}`}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-green-600">
                        {property.price ? 
                          (property.price >= 1000000000 ? 
                            `${(property.price / 1000000000).toFixed(1)} tỷ` : 
                            `${(property.price / 1000000).toFixed(0)} triệu`
                          ) : 
                          'Liên hệ'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {property.area ? `${property.area}m²` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-video bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
