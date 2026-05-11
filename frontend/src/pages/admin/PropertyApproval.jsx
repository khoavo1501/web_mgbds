import { useState, useEffect } from "react";
import Badge from "../../components/Badge";
import api from "../../services/api";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function PropertyApproval() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchPendingProperties = async () => {
    try {
      // Lấy tất cả BĐS có status pending
      const response = await api.get('/properties?status=pending&size=100');
      if (response.data.success) {
        setProperties(response.data.data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const handleApprove = async (propertyId) => {
    if (window.confirm('Bạn có chắc muốn duyệt BĐS này?')) {
      try {
        const res = await api.patch(`/properties/${propertyId}/status?status=published`);
        if (res.data.success) {
          alert('Đã duyệt BĐS thành công!');
          fetchPendingProperties();
        }
      } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleReject = async (propertyId) => {
    const reason = prompt('Lý do từ chối (tùy chọn):');
    if (reason !== null) { // User clicked OK (even if empty)
      try {
        // Có thể thêm API để lưu lý do từ chối
        const res = await api.patch(`/properties/${propertyId}/status?status=rejected`);
        if (res.data.success) {
          alert('Đã từ chối BĐS!');
          fetchPendingProperties();
        }
      } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleViewDetail = (property) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Duyệt Bất Động Sản</h1>
          <p className="text-sm text-slate-500 mt-1">
            Có {properties.length} BĐS đang chờ duyệt
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã BĐS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Giá (VNĐ)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-500">
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                </td>
              </tr>
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <tr key={property.propertyId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {property.propertyCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="max-w-xs truncate">{property.title}</div>
                    <div className="text-xs text-slate-500">{property.district}, {property.province}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {property.propertyType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {property.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {property.createdBy?.fullName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(property.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetail(property)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleApprove(property.propertyId)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Duyệt"
                    >
                      <CheckCircle className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleReject(property.propertyId)}
                      className="text-red-600 hover:text-red-900"
                      title="Từ chối"
                    >
                      <XCircle className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-500">
                  Không có BĐS nào đang chờ duyệt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedProperty.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Mã: {selectedProperty.propertyCode}</p>
              </div>
              <Badge status="warning">Chờ duyệt</Badge>
            </div>

            {/* Images */}
            {selectedProperty.images && selectedProperty.images.length > 0 && (
              <div className="mb-4">
                <img 
                  src={selectedProperty.images[0].url} 
                  alt={selectedProperty.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Loại BĐS</label>
                <p className="text-slate-900">{selectedProperty.propertyType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Giá</label>
                <p className="text-slate-900 font-bold">{selectedProperty.price.toLocaleString()} VNĐ</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Diện tích</label>
                <p className="text-slate-900">{selectedProperty.area} m²</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                <p className="text-slate-900">{selectedProperty.district}, {selectedProperty.province}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Người tạo</label>
                <p className="text-slate-900">{selectedProperty.createdBy?.fullName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ngày tạo</label>
                <p className="text-slate-900">{new Date(selectedProperty.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700">Mô tả</label>
              <p className="text-slate-900 mt-1 whitespace-pre-wrap">{selectedProperty.description}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-slate-700 bg-white hover:bg-gray-50"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  handleReject(selectedProperty.propertyId);
                  setIsDetailModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Từ chối
              </button>
              <button 
                onClick={() => {
                  handleApprove(selectedProperty.propertyId);
                  setIsDetailModalOpen(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Duyệt BĐS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
