import { useState, useEffect } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import api from "../../services/api";

export default function CreateTransaction() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    idCard: '',
    propertyId: '',
    propertyTitle: '',
    price: '',
    completionDate: '',
    depositAmount: '',
    paymentMethod: 'bank_transfer',
    note: ''
  });

  useEffect(() => {
    api.get('/appointments')
      .then(res => {
        if (res.data.success) {
          // You may want to filter for appointments with specific status (e.g. 'scheduled' or 'completed')
          setAppointments(res.data.data);
        }
      })
      .catch(err => console.error("Lỗi khi lấy lịch hẹn:", err));
  }, []);

  const handleAppChange = async (e) => {
    const val = e.target.value;
    setSelectedAppId(val);
    const app = appointments.find(a => a.appointmentId === Number(val));
    if (app) {
      setFormData(prev => ({
        ...prev,
        customerName: app.customerName || '',
        propertyId: app.propertyId || '',
        propertyTitle: app.propertyTitle || ''
      }));
      // Lấy thông tin BĐS để điền giá tự động
      try {
        const propRes = await api.get('/properties/' + app.propertyId);
        if (propRes.data.success) {
          setFormData(prev => ({
            ...prev,
            price: propRes.data.data.price || ''
          }));
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin BĐS:", err);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customerName: '',
        propertyId: '',
        propertyTitle: '',
        price: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.propertyId) {
      alert("Vui lòng chọn lịch hẹn/bất động sản.");
      return;
    }

    try {
      // Giả lập gửi API tạo transaction
      const payload = {
        appointmentId: Number(selectedAppId),
        ...formData,
        price: Number(formData.price),
        depositAmount: Number(formData.depositAmount)
      };
      
      console.log("Submitting transaction:", payload);
      alert("Tạo giao dịch đặt cọc thành công!");
      
      // Reset form sau khi tạo xong
      setSelectedAppId("");
      setFormData({
        customerName: '', phone: '', email: '', idCard: '',
        propertyId: '', propertyTitle: '', price: '', completionDate: '',
        depositAmount: '', paymentMethod: 'bank_transfer', note: ''
      });
    } catch (err) {
      alert("Có lỗi xảy ra khi tạo giao dịch.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Tạo Giao dịch Đặt cọc</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        
        {/* Chọn lịch hẹn */}
        <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 mb-6">
          <label className="mb-2 block text-sm font-semibold text-blue-900">Chọn Khách hàng từ Lịch hẹn đã đặt</label>
          <select 
            className="w-full px-4 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedAppId}
            onChange={handleAppChange}
            required
          >
            <option value="">-- Chọn khách hàng / lịch hẹn --</option>
            {appointments.map(app => (
              <option key={app.appointmentId} value={app.appointmentId}>
                Khách: {app.customerName} | BĐS: {app.propertyTitle} ({new Date(app.scheduledAt).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-blue-600">Việc chọn lịch hẹn sẽ tự động điền thông tin khách hàng và bất động sản tương ứng.</p>
        </div>

        {/* Thông tin khách hàng */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Khách hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="customerName" value={formData.customerName} onChange={handleChange} label="Họ và tên" required placeholder="Nguyễn Văn A" readOnly={!!selectedAppId} />
            <Input name="phone" value={formData.phone} onChange={handleChange} label="Số điện thoại" required placeholder="0901234567" />
            <Input name="email" value={formData.email} onChange={handleChange} label="Địa chỉ email" type="email" placeholder="khachhang@email.com" />
            <Input name="idCard" value={formData.idCard} onChange={handleChange} label="CMND / CCCD / Hộ chiếu" required placeholder="012345678901" />
          </div>
        </div>

        {/* Thông tin bất động sản */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Bất động sản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
               <Input name="propertyTitle" value={formData.propertyTitle} onChange={handleChange} label="Tên Bất động sản" readOnly placeholder="Sẽ tự động điền khi chọn lịch hẹn" className="bg-slate-50 cursor-not-allowed" />
            </div>
            <Input name="price" value={formData.price} onChange={handleChange} label="Giá thỏa thuận (VNĐ)" type="number" required placeholder="VD: 2500000000" />
            <Input name="completionDate" value={formData.completionDate} onChange={handleChange} label="Ngày dự kiến hoàn tất" type="date" required />
          </div>
        </div>

        {/* Thông tin tài chính */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Tài chính</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="depositAmount" value={formData.depositAmount} onChange={handleChange} label="Số tiền đặt cọc (VNĐ)" type="number" required placeholder="VD: 100000000" />
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức thanh toán</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                <option value="credit_card">Thẻ tín dụng</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú thêm</label>
              <textarea 
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Các điều khoản hoặc điều kiện đặc biệt..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button variant="outline" type="button">Hủy</Button>
          <Button type="submit">Tạo giao dịch</Button>
        </div>
      </form>
    </div>
  );
}
