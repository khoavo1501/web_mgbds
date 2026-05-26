import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../components/Input";
import Button from "../../components/Button";
import api from "../../services/api";

export default function CreateTransaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    idCard: '',
    propertyId: '',
    propertyTitle: '',
    customerId: '',
    price: '',
    completionDate: '',
    depositAmount: '',
    paymentMethod: 'transfer',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const calculateDefaultDeposit = (price) => {
    const numericPrice = Number(price || 0);
    return numericPrice > 0 ? Math.round(numericPrice * 0.1) : "";
  };

  useEffect(() => {
    api.get('/appointments')
      .then(res => {
        if (res.data.success) {
          const apps = (res.data.data || []).filter((item) => item.status === "viewed");
          setAppointments(apps);
          
          // Auto-select from URL
          const urlAppId = searchParams.get('appointmentId');
          if (urlAppId && apps.find(a => a.appointmentId === Number(urlAppId))) {
            handleAppSelection(urlAppId, apps);
          }
        }
      })
      .catch(err => console.error("Lỗi khi lấy lịch hẹn:", err));
  }, [searchParams]);

  const handleAppSelection = async (val, appsList = appointments) => {
    setSelectedAppId(val);
    const app = appsList.find(a => a.appointmentId === Number(val));
    if (app) {
      // Calculate default completion date (+15 days)
      const d = new Date();
      d.setDate(d.getDate() + 15);
      const defaultDate = d.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        customerName: app.customerName || '',
        phone: app.customerPhone || '',
        email: app.customerEmail || '',
        idCard: '', // Auto-filled if exists later
        customerId: app.customerId || '',
        propertyId: app.propertyId || '',
        propertyTitle: app.propertyTitle || '',
        completionDate: defaultDate
      }));
      // Lấy thông tin BĐS để điền giá tự động
      try {
        const propRes = await api.get('/properties/' + app.propertyId);
        if (propRes.data.success) {
          setFormData(prev => ({
            ...prev,
            price: propRes.data.data.price || '',
            depositAmount: calculateDefaultDeposit(propRes.data.data.price || '')
          }));
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin BĐS:", err);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customerName: '', phone: '', email: '', idCard: '',
        customerId: '', propertyId: '', propertyTitle: '',
        price: '', depositAmount: '', completionDate: ''
      }));
    }
  };

  const handleAppChange = (e) => {
    handleAppSelection(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "price" ? { depositAmount: calculateDefaultDeposit(value) } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.propertyId) {
      alert("Vui lòng chọn lịch hẹn/bất động sản.");
      return;
    }
    if (!formData.customerId) {
      alert("Lịch hẹn không có thông tin khách hàng hợp lệ.");
      return;
    }
    if (Number(formData.depositAmount) > Number(formData.price)) {
      alert("Tiền cọc không được lớn hơn giá trị giao dịch.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        propertyId: Number(formData.propertyId),
        customerId: Number(formData.customerId),
        appointmentId: Number(selectedAppId),
        totalPrice: Number(formData.price),
        depositAmount: Number(formData.depositAmount || 0),
        paymentMethod: formData.paymentMethod,
        note: formData.note
      };

      const response = await api.post("/transactions", payload);
      if (!response.data.success) {
        alert(response.data.message || "Tạo giao dịch thất bại.");
        return;
      }

      alert(`Tạo giao dịch đặt cọc thành công: ${response.data.data.transactionCode}`);
      navigate("/broker/transactions/history");
      
      setSelectedAppId("");
      setFormData({
        customerName: '', phone: '', email: '', idCard: '',
        customerId: '', propertyId: '', propertyTitle: '', price: '', completionDate: '',
        depositAmount: '', paymentMethod: 'transfer', note: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tạo giao dịch.");
    } finally {
      setSubmitting(false);
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
                Khách: {app.customerName} | BĐS: {app.propertyTitle} | {app.status} ({new Date(app.scheduledAt).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
          {appointments.length === 0 && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Chưa có lịch hẹn hợp lệ cho broker này. Hãy xác nhận lịch hẹn hoặc tạo lịch xem nhà trước.
            </p>
          )}
          <p className="mt-2 text-xs text-blue-600">Việc chọn lịch hẹn sẽ tự động điền thông tin khách hàng và bất động sản tương ứng.</p>
        </div>

        {/* Thông tin khách hàng */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Khách hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="customerName" value={formData.customerName} onChange={handleChange} label="Họ và tên" required placeholder="Nguyễn Văn A" readOnly className="bg-slate-50 cursor-not-allowed" />
            <Input name="phone" value={formData.phone} onChange={handleChange} label="Số điện thoại" placeholder="Tự động điền từ lịch hẹn" readOnly className="bg-slate-50 cursor-not-allowed" />
            <Input name="email" value={formData.email} onChange={handleChange} label="Địa chỉ email" type="email" placeholder="Tự động điền từ lịch hẹn" readOnly className="bg-slate-50 cursor-not-allowed" />
            <Input name="idCard" value={formData.idCard} onChange={handleChange} label="CMND / CCCD / Hộ chiếu" placeholder="Sẽ bổ sung sau" readOnly className="bg-slate-50 cursor-not-allowed" />
          </div>
        </div>

        {/* Thông tin bất động sản */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Bất động sản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
               <Input name="propertyTitle" value={formData.propertyTitle} onChange={handleChange} label="Tên Bất động sản" readOnly placeholder="Sẽ tự động điền khi chọn lịch hẹn" className="bg-slate-50 cursor-not-allowed" />
            </div>
            <Input name="price" value={formData.price} onChange={handleChange} label="Giá thỏa thuận (VNĐ)" type="number" required placeholder="VD: 2500000000" readOnly className="bg-slate-50 cursor-not-allowed" />
            <Input name="completionDate" value={formData.completionDate} onChange={handleChange} label="Ngày dự kiến hoàn tất" type="date" required readOnly className="bg-slate-50 cursor-not-allowed" />
          </div>
        </div>

        {/* Thông tin tài chính */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Tài chính</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="depositAmount" value={formData.depositAmount} onChange={handleChange} label="Số tiền thanh toán/cọc (VNĐ)" type="number" required placeholder="VD: 100000000" readOnly className="bg-slate-50 cursor-not-allowed" />
            <p className="col-span-1 md:col-span-2 text-xs font-semibold text-slate-500">
              Mặc định cọc 10%. Nếu số tiền bằng toàn bộ giá trị giao dịch, hệ thống sẽ tự động hoàn tất và chuyển BĐS sang đã bán.
            </p>
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức thanh toán</label>
              <select name="paymentMethod" value={formData.paymentMethod} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-slate-50 cursor-not-allowed text-slate-500">
                <option value="transfer">Chuyển khoản ngân hàng</option>
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
          <Button type="submit" disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo giao dịch"}</Button>
        </div>
      </form>
    </div>
  );
}
