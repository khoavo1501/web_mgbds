import { useState, useEffect } from "react";
import api from "../../services/api";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import Badge from "../../components/Badge";

export default function BrokerProperties() {
  const [properties, setProperties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "Căn hộ",
    province: "Hà Nội",
    district: "Quận Hoàn Kiếm",
    area: "",
    price: "",
    images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800", isPrimary: true }]
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Broker xem tất cả BĐS (có thể lọc theo assignedTo ở backend sau)
      const res = await api.get('/properties?size=100');
      if (res.data.success) {
        // Here we just fetch all properties. In a real app, API should support filtering by assignedTo.
        // For simplicity we just show them, assuming the logged in broker can see them or the backend will filter.
        setProperties(res.data.data.content);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách BĐS", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, formData);
        alert("Cập nhật BĐS thành công!");
      } else {
        await api.post('/properties', formData);
        alert("Thêm BĐS thành công!");
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
      title: prop.title,
      description: prop.description,
      propertyType: prop.propertyType,
      province: prop.province,
      district: prop.district,
      area: prop.area,
      price: prop.price,
      images: prop.images || []
    });
    setEditingId(prop.propertyId);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
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
    setEditingId(null);
    setIsModalOpen(true);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Bất động sản cá nhân</h1>
        <button 
          onClick={handleAddNew}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm BĐS
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã BĐS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Giá (VNĐ)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((prop) => (
              <tr key={prop.propertyId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{prop.propertyCode}</td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{prop.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{prop.propertyType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{prop.price.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <select 
                    value={prop.status}
                    onChange={(e) => handleStatusChange(prop.propertyId, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                      prop.status === 'published' ? 'bg-green-100 text-green-800' :
                      prop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      prop.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      prop.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    {/* Broker không được chuyển sang Published - chỉ Admin */}
                    <option value="published" disabled>Published (Admin only)</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button onClick={() => handleEdit(prop)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Cập nhật BĐS' : 'Thêm mới BĐS'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Tiêu đề</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea name="description" required rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Loại BĐS</label>
                  <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="Căn hộ">Căn hộ</option>
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Đất nền">Đất nền</option>
                    <option value="Biệt thự">Biệt thự</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Giá</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Diện tích (m2)</label>
                  <input type="number" name="area" required value={formData.area} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                  <input type="text" name="province" required value={formData.province} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Quận/Huyện</label>
                  <input type="text" name="district" required value={formData.district} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-slate-700 bg-white hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
