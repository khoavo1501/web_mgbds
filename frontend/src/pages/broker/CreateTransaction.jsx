import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { 
  ArrowLeft, 
  FileSignature, 
  User, 
  Building, 
  CreditCard, 
  AlertCircle, 
  ClipboardList
} from "lucide-react";

export default function CreateTransaction() {
  const navigate = useNavigate();
  const toast = useToast();
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
      toast.error("Vui lòng chọn lịch hẹn/bất động sản.");
      return;
    }
    if (!formData.customerId) {
      toast.error("Lịch hẹn không có thông tin khách hàng hợp lệ.");
      return;
    }
    if (Number(formData.depositAmount) > Number(formData.price)) {
      toast.error("Tiền cọc không được lớn hơn giá trị giao dịch.");
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
        toast.error(response.data.message || "Tạo giao dịch thất bại.");
        return;
      }

      toast.success(`Tạo giao dịch đặt cọc thành công: ${response.data.data.transactionCode}`);
      navigate("/broker/transactions/history");
      
      setSelectedAppId("");
      setFormData({
        customerName: '', phone: '', email: '', idCard: '',
        customerId: '', propertyId: '', propertyTitle: '', price: '', completionDate: '',
        depositAmount: '', paymentMethod: 'transfer', note: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo giao dịch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-fade-in">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 group cursor-pointer"
        type="button"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </button>

      <div className="flex items-center gap-3.5 mb-8">
        <span className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
          <FileSignature className="w-6 h-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Tạo Giao dịch Đặt cọc</h1>
          <p className="text-xs text-slate-500 mt-1">Chọn lịch hẹn đã dẫn xem để tiến hành thiết lập hợp đồng cọc</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl premium-shadow border border-slate-100">
        
        {/* Chọn lịch hẹn */}
        <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl shadow-inner relative overflow-hidden">
          <label className="mb-2 block text-xs font-black text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Bước 1: Chọn Khách hàng & Lịch hẹn tương ứng
          </label>
          <select 
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-850 font-semibold shadow-sm transition-all cursor-pointer text-sm"
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
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs font-bold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Chưa có lịch hẹn hợp lệ cho broker này. Hãy xác nhận lịch hẹn hoặc tạo lịch xem nhà trước.
            </div>
          )}
          <p className="mt-2 text-xs text-slate-455 flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-slate-400"></span>
            Việc chọn lịch hẹn sẽ tự động điền thông tin khách hàng và bất động sản tương ứng.
          </p>
        </div>

        {!selectedAppId ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30 flex flex-col items-center justify-center">
            <div className="p-4 bg-slate-100/80 text-slate-400 rounded-full mb-4">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Chưa có thông tin lịch hẹn</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Vui lòng chọn khách hàng từ danh sách lịch hẹn ở trên để tự động tải thông tin giao dịch đặt cọc.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-scale-in">
            {/* Thông tin khách hàng & Bất động sản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Thông tin khách hàng */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                    <User className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin Khách hàng</h3>
                </div>
                
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Họ và tên</span>
                    <span className="text-base font-bold text-slate-900">{formData.customerName || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Số điện thoại</span>
                      <span className="text-sm font-bold text-slate-800">{formData.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Địa chỉ email</span>
                      <span className="text-sm font-bold text-slate-800 break-all">{formData.email || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin bất động sản */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Building className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin Bất động sản</h3>
                </div>
                
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Tên Bất động sản</span>
                    <span className="text-base font-bold text-slate-900 line-clamp-1">{formData.propertyTitle || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Giá thỏa thuận</span>
                      <span className="text-sm font-extrabold text-amber-600">
                        {formData.price ? Number(formData.price).toLocaleString('vi-VN') + ' VNĐ' : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Dự kiến hoàn tất</span>
                      <span className="text-sm font-bold text-slate-800">
                        {formData.completionDate ? new Date(formData.completionDate).toLocaleDateString('vi-VN') : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Thông tin tài chính */}
            <div className="bg-slate-50/50 p-5 sm:p-6 rounded-xl border border-slate-150 shadow-inner space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200/50 pb-3">
                <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Thông tin Tài chính & Giao dịch</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Số tiền thanh toán/cọc */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
                  <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block mb-1">Số tiền thanh toán/cọc (Cố định 10%)</span>
                  <span className="text-xl font-black text-emerald-600">
                    {formData.depositAmount ? Number(formData.depositAmount).toLocaleString('vi-VN') + ' VNĐ' : "—"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Mặc định cọc 10%. Nếu số tiền bằng toàn bộ giá trị giao dịch, hệ thống sẽ tự động hoàn tất và chuyển BĐS sang đã bán.
                  </p>
                </div>

                {/* Hình thức thanh toán */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block mb-1.5">Hình thức thanh toán</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100/50">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Chuyển khoản ngân hàng (Mặc định)
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Tất cả các giao dịch cọc trực tuyến đều được xử lý và ghi nhận thông qua chuyển khoản ngân hàng.
                  </p>
                </div>

                {/* Ghi chú thêm */}
                <div className="col-span-1 md:col-span-2">
                  <label className="mb-2 block text-xs font-black text-slate-700 tracking-wider uppercase">Ghi chú thêm</label>
                  <textarea 
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-slate-800 font-medium placeholder:text-slate-400 bg-white shadow-sm transition-all"
                    rows="3"
                    placeholder="Nhập các điều khoản hoặc điều kiện đặc biệt khác của giao dịch..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={() => navigate(-1)} className="cursor-pointer">Hủy</Button>
          {selectedAppId && (
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 cursor-pointer">
              {submitting ? "Đang tạo..." : "Tạo giao dịch"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
