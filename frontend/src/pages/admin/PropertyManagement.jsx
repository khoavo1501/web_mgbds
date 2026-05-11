import { useState, useEffect } from "react";
import Badge from "../../components/Badge";
import api from "../../services/api";
import { Edit, Plus, Trash2 } from "lucide-react";

export default function PropertyManagement() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", propertyType: "Căn hộ", province: "Hà Nội", district: "Quận Hoàn Kiếm", area: "", price: "", images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800", isPrimary: true }]
  });

  const fetchProperties = async () => {
    try {
      // Admin xem tất cả BĐS, không lọc theo status
      const response = await api.get('/properties?size=100');
      if (response.data.success) {
        setProperties(response.data.data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, formData);
        alert("Cập nhật thành công!");
      } else {
        await api.post('/properties', formData);
        alert("Thêm thành công!");
      }
      setIsModalOpen(false);
      setEditingId(null);
      // Reset form
      setFormData({ 
        title: "", 
        description: "", 
        propertyType: "Căn hộ", 
        province: "Hà Nội", 
        district: "Quận Hoàn Kiếm", 
        area: "", 
        price: "", 
        images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800", isPrimary: true }] 
      });
      // Refresh danh sách
      fetchProperties();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (prop) => {
    setFormData({
      title: prop.title, description: prop.description, propertyType: prop.propertyType, province: prop.province, district: prop.district, area: prop.area, price: prop.price, images: prop.images || []
    });
    setEditingId(prop.propertyId);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa BĐS này?')) {
      try {
        const res = await api.delete(`/properties/${id}`);
        if (res.data.success) {
          alert('Xóa BĐS thành công!');
          fetchProperties();
        }
      } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      const res = await api.patch(`/properties/${propertyId}/status?status=${newStatus}`);
      if (res.data.success) {
        alert(`Đã chuyển trạng thái thành ${newStatus}!`);
        fetchProperties();
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddNew = () => {
    setFormData({ title: "", description: "", propertyType: "Căn hộ", province: "Hà Nội", district: "Quận Hoàn Kiếm", area: "", price: "", images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800", isPrimary: true }] });
    setEditingId(null);
    setIsModalOpen(true);
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Property Management</h1>
        <button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Thêm BĐS
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                </td>
              </tr>
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <tr key={property.propertyId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{property.title}</div>
                    <div className="text-sm text-slate-500">{property.district}, {property.province}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {property.price.toLocaleString()} VNĐ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{property.createdBy?.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <select 
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.propertyId, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                        property.status === 'published' ? 'bg-green-100 text-green-800' :
                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        property.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(property)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button onClick={() => handleDelete(property.propertyId)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">
                  No properties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Cập nhật BĐS' : 'Thêm mới BĐS'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700">Tiêu đề</label><input type="text" name="title" required value={formData.title} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
              <div><label className="block text-sm font-medium text-slate-700">Mô tả</label><textarea name="description" required rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">Loại BĐS</label><select name="propertyType" value={formData.propertyType} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border"><option>Căn hộ</option><option>Nhà riêng</option><option>Đất nền</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700">Giá (VNĐ)</label><input type="number" name="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
                <div><label className="block text-sm font-medium text-slate-700">Diện tích</label><input type="number" name="area" required value={formData.area} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
                <div><label className="block text-sm font-medium text-slate-700">Tỉnh/Thành</label><input type="text" name="province" required value={formData.province} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
                <div><label className="block text-sm font-medium text-slate-700">Quận/Huyện</label><input type="text" name="district" required value={formData.district} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 p-2 border" /></div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
