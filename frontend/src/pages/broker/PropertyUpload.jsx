import { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Map, Loader2, X, FileText, Plus, Trash2, File, Shield, List, PenSquare, Eye } from 'lucide-react';
import PropertyPreview from '../../components/broker/PropertyPreview';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const amenitiesList = ['Hồ bơi','Phòng gym','Sân vườn','Ban công','Gara ô tô','An ninh 24/7','Thang máy','Gần trường học','Gần bệnh viện','Gần chợ/siêu thị','Sân thượng','Khu BBQ'];

const wardList = [
  'Phường Hải Châu', 'Phường Hòa Cường', 'Phường Thanh Khê', 'Phường An Khê', 
  'Phường An Hải', 'Phường Sơn Trà', 'Phường Ngũ Hành Sơn', 'Phường Hòa Khánh', 
  'Phường Hải Vân', 'Phường Liên Chiểu', 'Phường Cẩm Lệ', 'Phường Hòa Xuân', 
  'Phường Tam Kỳ', 'Phường Quảng Phú', 'Phường Hương Trà', 'Phường Bàn Thạch', 
  'Phường Điện Bàn', 'Phường Điện Bàn Đông', 'Phường An Thắng', 'Phường Điện Bàn Bắc', 
  'Phường Hội An', 'Phường Hội An Đông', 'Phường Hội An Tây'
];

const InputField = ({ label, required, icon: Icon, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white`}
      />
    </div>
  </div>
);

const SectionCard = ({ num, title, icon: SIcon, children }) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow duration-300">
    <h3 className="text-base font-bold text-zinc-900 mb-5 flex items-center gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-sm">
        {num}
      </span>
      {SIcon && <SIcon className="w-4 h-4 text-zinc-400 -ml-1" />}
      {title}
    </h3>
    {children}
  </section>
);

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const statusLabel = (s) => {
  switch (s) {
    case 'published': return { text: 'Đã đăng', cls: 'bg-emerald-100 text-emerald-700' };
    case 'pending':   return { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' };
    case 'sold':      return { text: 'Đã bán', cls: 'bg-blue-100 text-blue-700' };
    case 'rejected':  return { text: 'Từ chối', cls: 'bg-red-100 text-red-700' };
    default:          return { text: s, cls: 'bg-zinc-100 text-zinc-600' };
  }
};

const formatPrice = (p) => {
  if (!p) return '--';
  return new Intl.NumberFormat('vi-VN').format(p) + ' VNĐ';
};

// ─── Tab: Danh sách BĐS của tôi ───────────────────────────────────────────────
function MyProperties({ onEdit, showToast }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(() => {
    setLoading(true);
    api.get('/properties?size=100')
      .then(res => {
        if (res.data.success) setProperties(res.data.data.content || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa BĐS này?')) return;
    try {
      const res = await api.delete('/properties/' + id);
      if (res.data.success) {
        showToast('success', 'Xóa thành công!');
        fetchProperties();
      }
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Xóa thất bại');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
    </div>
  );

  if (properties.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
      <List className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">Chưa có bất động sản nào</p>
      <p className="text-sm mt-1">Hãy đăng tin đầu tiên của bạn!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {properties.map(p => {
        const st = statusLabel(p.status);
        return (
          <div key={p.propertyId} className="group bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4 items-start">
            {/* Ảnh thumbnail */}
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
              {p.images && p.images.length > 0
                ? <img src={p.images.find(i => i.isPrimary)?.url || p.images[0].url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-300"><Eye className="w-6 h-6" /></div>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">{p.title}</h4>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors" title="Xem / Sửa">
                      <PenSquare className="w-4 h-4" />
                    </button>
                    {p.status === 'pending' && (
                      <button onClick={() => handleDelete(p.propertyId)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-1">{p.propertyCode} · {p.propertyType}</p>
              <p className="text-xs text-zinc-500 mb-2 line-clamp-1">{p.district}, {p.province}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="font-semibold text-blue-600">{formatPrice(p.price)}</span>
                <span>·</span>
                <span>{p.area} m²</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PropertyUpload() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'list'
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', type: 'Nhà ở', price: '', area: '', address: '', ward: 'Phường Hải Châu',
    description: '', amenities: [], images: [], 
    redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
    commitment: false, status: 'Nháp',
    isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const legalInputRef = useRef(null);

  const debouncedPreview = useDebounce(formData, 400);

  const isLocked = editingId && formData.status !== 'pending' && formData.status !== 'Nháp';

  const handleEditProperty = useCallback((prop) => {
    const typeMapReverse = { 'house': 'Nhà ở', 'land': 'Đất nền', 'apartment': 'Chung cư', 'rental': 'Cho thuê' };
    setFormData({
      title: prop.title || '',
      type: typeMapReverse[prop.propertyType] || 'Nhà ở',
      price: prop.price || '',
      area: prop.area || '',
      ward: prop.district ? (wardList.find(w => prop.district.includes(w)) || 'Phường Hải Châu') : 'Phường Hải Châu',
      address: prop.district ? prop.district.replace(new RegExp(`,?\\s*(${wardList.join('|')})`), '').trim() : '',
      description: prop.description || '',
      amenities: prop.amenities || [],
      images: (prop.images || []).map(i => ({ id: i.imageId || Math.random().toString(), url: i.url, preview: i.url, isPrimary: i.isPrimary })),
      redBookFile: prop.redBookUrl ? { name: 'Sổ đỏ.pdf', url: prop.redBookUrl } : null,
      householdRegistrationFile: prop.householdRegistrationUrl ? { name: 'Sổ hộ khẩu.pdf', url: prop.householdRegistrationUrl } : null,
      ownerIdFile: prop.ownerIdUrl ? { name: 'Căn cước công dân.pdf', url: prop.ownerIdUrl } : null,
      commitment: true,
      status: prop.status || 'Nháp',
      isExclusive: prop.isExclusive || false,
      ownerName: prop.ownerName || '',
      ownerPhone: prop.ownerPhone || '',
      brokerageContractFile: prop.brokerageContractUrl ? { name: 'Hợp đồng môi giới.pdf', url: prop.brokerageContractUrl } : null
    });
    setEditingId(prop.propertyId);
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewTabClick = useCallback(() => {
    setEditingId(null);
    setFormData({
      title: '', type: 'Nhà ở', price: '', area: '', address: '', ward: 'Phường Hải Châu',
      description: '', amenities: [], images: [], 
      redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
      commitment: false, status: 'Nháp',
      isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
    });
    setActiveTab('new');
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const toggleAmenity = useCallback((a) => {
    setFormData(p => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a]
    }));
  }, []);

  const handleDragOver = useCallback(e => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(e => { e.preventDefault(); setIsDragging(false); }, []);
  const processFiles = useCallback((files) => {
    const newImages = files.map(f => ({
      file: f, preview: URL.createObjectURL(f),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setFormData(p => ({ ...p, images: [...p.images, ...newImages].slice(0, 10) }));
  }, []);
  const handleDrop = useCallback(e => {
    e.preventDefault(); setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  }, [processFiles]);

  const removeImage = useCallback((id) => {
    setFormData(p => ({ ...p, images: p.images.filter(i => i.id !== id) }));
  }, []);

  const handleSingleFileChange = useCallback((name, file) => {
    if (file) {
      setFormData(p => ({ ...p, [name]: { file, name: file.name, size: (file.size / 1024 / 1024).toFixed(2) } }));
    } else {
      setFormData(p => ({ ...p, [name]: null }));
    }
  }, []);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const uploadImageFile = useCallback(async (file) => {
    const data = new FormData();
    data.append('file', file);
    const res = await api.post('/uploads/images', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Upload ảnh thất bại');
    }
    return res.data.data.url;
  }, []);

  const handleSaveDraft = useCallback(() => {
    setFormData(p => ({ ...p, status: 'Nháp' }));
    showToast('success', 'Đã lưu nháp thành công!');
  }, [showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return showToast('error', 'Vui lòng nhập tiêu đề BĐS.');
    if (!formData.price) return showToast('error', 'Vui lòng nhập mức giá.');
    if (!formData.area) return showToast('error', 'Vui lòng nhập diện tích.');
    if (!formData.ward) return showToast('error', 'Vui lòng chọn phường.');
    if (formData.isExclusive) {
      if (!formData.ownerName.trim()) return showToast('error', 'Vui lòng nhập tên chủ nhà.');
      if (!formData.ownerPhone.trim()) return showToast('error', 'Vui lòng nhập SĐT chủ nhà.');
      if (!formData.brokerageContractFile) return showToast('error', 'Vui lòng upload Hợp đồng môi giới độc quyền.');
    }
    if (!formData.commitment) return showToast('error', 'Vui lòng xác nhận cam kết thông tin.');

    // Map loại BĐS tiếng Việt → giá trị backend
    const typeMap = { 'Nhà ở': 'house', 'Đất nền': 'land', 'Chung cư': 'apartment', 'Cho thuê': 'rental' };

    setIsSubmitting(true);
    try {
      const uploadedImages = [];
      for (let idx = 0; idx < formData.images.length; idx += 1) {
        const img = formData.images[idx];
        const url = img.file ? await uploadImageFile(img.file) : (img.url || img.preview || '');
        if (url) {
          uploadedImages.push({ url, isPrimary: idx === 0 });
        }
      }

      let brokerageContractUrl = '';
      if (formData.isExclusive && formData.brokerageContractFile) {
        if (formData.brokerageContractFile.file) {
          const contractData = new FormData();
          contractData.append('file', formData.brokerageContractFile.file);
          const contractRes = await api.post('/uploads/documents', contractData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { type: 'contracts' }
          });
          if (contractRes.data.success) {
            brokerageContractUrl = contractRes.data.data.url;
          }
        } else {
          brokerageContractUrl = formData.brokerageContractFile.url;
        }
      }

      // Helper function to upload document
      const uploadDoc = async (docFile, type) => {
        if (!docFile) return '';
        if (!docFile.file) return docFile.url; // Already uploaded
        const formData = new FormData();
        formData.append('file', docFile.file);
        const res = await api.post('/uploads/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { type }
        });
        return res.data.success ? res.data.data.url : '';
      };

      const redBookUrl = await uploadDoc(formData.redBookFile, 'legal');
      const householdRegistrationUrl = await uploadDoc(formData.householdRegistrationFile, 'legal');
      const ownerIdUrl = await uploadDoc(formData.ownerIdFile, 'legal');

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        propertyType: typeMap[formData.type] || formData.type,
        province: 'Đà Nẵng',
        district: formData.address.trim() ? `${formData.address.trim()}, ${formData.ward}` : formData.ward,
        area: Number(formData.area),
        price: Number(formData.price),
        images: uploadedImages,
        isExclusive: formData.isExclusive,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        brokerageContractUrl: brokerageContractUrl,
        redBookUrl,
        householdRegistrationUrl,
        ownerIdUrl
      };

      const res = editingId 
        ? await api.put('/properties/' + editingId, payload)
        : await api.post('/properties', payload);

      if (res.data.success) {
        showToast('success', editingId ? 'Cập nhật BĐS thành công!' : 'Bất động sản đã được gửi và đang chờ Admin kiểm duyệt!');
        // Reset form
        setEditingId(null);
        setFormData({
          title: '', type: 'Nhà ở', price: '', area: '', address: '', ward: 'Phường Hải Châu',
          description: '', amenities: [], images: [], 
          redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
          commitment: false, status: 'Nháp',
          isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
        });
        // Chuyển sang tab danh sách để thấy ngay
        setTimeout(() => setActiveTab('list'), 800);
      } else {
        showToast('error', res.data.message || 'Thao tác thất bại.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, showToast, editingId, uploadImageFile]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border flex items-center gap-3 backdrop-blur-sm ${
              toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-600" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">Đăng tin Bất Động Sản</h2>
        <p className="text-sm text-zinc-500">Quản lý và đăng tin bất động sản của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={handleNewTabClick}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}>
          <PenSquare className="w-4 h-4" /> {editingId ? 'Cập nhật tin' : 'Đăng tin mới'}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}>
          <List className="w-4 h-4" /> BĐS của tôi
        </button>
      </div>

      {/* Tab: BĐS của tôi */}
      {activeTab === 'list' && <MyProperties key={activeTab} onEdit={handleEditProperty} showToast={showToast} />}

      {/* Tab: Đăng tin mới */}
      {activeTab === 'new' && (
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Form */}
          <div className="flex-1 w-full space-y-6">
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
              <fieldset disabled={isLocked} className={`space-y-6 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>

              {/* Section 1 */}
              <SectionCard num={1} title="Thông tin cơ bản">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    label="Tiêu đề BĐS" required name="title"
                    value={formData.title} onChange={handleChange}
                    placeholder="VD: Bán căn hộ cao cấp Quận 7..." className="col-span-full"
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Loại BĐS <span className="text-red-500">*</span>
                    </label>
                    <select name="type" value={formData.type} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white">
                      <option>Nhà ở</option>
                      <option>Đất nền</option>
                      <option>Chung cư</option>
                      <option>Cho thuê</option>
                    </select>
                  </div>
                  <InputField label="Mức giá (VNĐ)" required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="VD: 2500000000" />
                  <InputField label="Diện tích (m²)" required name="area" value={formData.area} onChange={handleChange} type="number" placeholder="VD: 85" />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Phường <span className="text-red-500">*</span>
                    </label>
                    <select name="ward" value={formData.ward} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white">
                      {wardList.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <InputField label="Địa chỉ cụ thể" icon={Map} name="address" value={formData.address} onChange={handleChange} placeholder="Số nhà, Tên đường..." className="col-span-full" />
                </div>
              </SectionCard>

              {/* Section 2 */}
              <SectionCard num={2} title="Mô tả chi tiết">
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-sm font-medium text-zinc-700">Mô tả BĐS</label>
                    <span className={`text-xs font-medium ${formData.description.length > 900 ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    rows={4} maxLength={1000}
                    placeholder="Mô tả chi tiết về bất động sản, tiện ích xung quanh, ưu điểm nổi bật..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-3 block">Tiện ích nổi bật</label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          formData.amenities.includes(a)
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                        }`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Section 3 - Images */}
              <SectionCard num={3} title="Hình ảnh thực tế">
                <div className="flex justify-end mb-4 -mt-2">
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {formData.images.length}/10 ảnh
                  </span>
                </div>
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => !isLocked && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl w-full flex flex-col items-center justify-center py-12 px-4 text-center transition-all ${!isLocked && 'cursor-pointer'} ${
                    isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-zinc-200 bg-zinc-50/30 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => processFiles(Array.from(e.target.files))} />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white shadow-sm text-zinc-400'}`}>
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-700 mb-1">Kéo thả ảnh vào đây</h4>
                  <p className="text-xs text-zinc-400">hoặc click để chọn file từ máy tính</p>
                  <p className="text-[11px] text-zinc-400 mt-3 font-medium bg-zinc-100 px-3 py-1 rounded-full">
                    JPG, PNG — Tối đa 10 ảnh (mỗi ảnh &lt; 5MB)
                  </p>
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                        <img src={img.preview || img.url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shadow">
                            Ảnh bìa
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Section 4 - Legal */}
              <SectionCard num={4} icon={Shield} title="Thông tin pháp lý">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Sổ đỏ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Sổ đỏ / Sổ hồng</label>
                    <div className="relative">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('redBookFile', e.target.files[0])} />
                      <div className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${formData.redBookFile ? 'border-emerald-300 bg-emerald-50' : 'border-zinc-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                        {formData.redBookFile ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-700 truncate">{formData.redBookFile.name}</p>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('redBookFile', null); }} className="relative z-20 text-zinc-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm text-zinc-500">Tải lên sổ đỏ...</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sổ hộ khẩu */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Sổ hộ khẩu chủ BĐS</label>
                    <div className="relative">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('householdRegistrationFile', e.target.files[0])} />
                      <div className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${formData.householdRegistrationFile ? 'border-emerald-300 bg-emerald-50' : 'border-zinc-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                        {formData.householdRegistrationFile ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-700 truncate">{formData.householdRegistrationFile.name}</p>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('householdRegistrationFile', null); }} className="relative z-20 text-zinc-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm text-zinc-500">Tải lên hộ khẩu...</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CCCD */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">CCCD chủ BĐS</label>
                    <div className="relative">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('ownerIdFile', e.target.files[0])} />
                      <div className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${formData.ownerIdFile ? 'border-emerald-300 bg-emerald-50' : 'border-zinc-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                        {formData.ownerIdFile ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-700 truncate">{formData.ownerIdFile.name}</p>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('ownerIdFile', null); }} className="relative z-20 text-zinc-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm text-zinc-500">Tải lên CCCD...</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-emerald-700">Bảo mật</p>
                    <p className="text-[11px] text-emerald-500">Tất cả giấy tờ của khách hàng được mã hóa và bảo vệ an toàn tuyệt đối</p>
                  </div>
                </div>

                {/* BĐS Độc quyền checkbox & fields */}
                <div className="mb-6 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                  <label className="flex items-start gap-3 cursor-pointer group mb-4">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" name="isExclusive" checked={formData.isExclusive} onChange={handleChange} className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-zinc-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center group-hover:border-blue-400">
                        {formData.isExclusive && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-zinc-800">Đây là Bất động sản độc quyền</span>
                      <p className="text-xs text-zinc-500 mt-0.5">Yêu cầu cung cấp thông tin chủ nhà và hợp đồng môi giới</p>
                    </div>
                  </label>

                  {formData.isExclusive && (
                    <div className="space-y-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Tên chủ nhà" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Nguyễn Văn A" required />
                        <InputField label="Số điện thoại chủ nhà" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="0901234567" required />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          Hợp đồng môi giới độc quyền <span className="text-red-500">*</span>
                        </label>
                        {formData.brokerageContractFile ? (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200">
                            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-700 truncate">{formData.brokerageContractFile.name}</p>
                              <p className="text-[11px] text-zinc-400">Đã chọn</p>
                            </div>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, brokerageContractFile: null }))} className="text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setFormData(p => ({ ...p, brokerageContractFile: { file: e.target.files[0], name: e.target.files[0].name } }));
                                }
                              }} 
                            />
                            <div className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 transition-colors">
                              <UploadCloud className="w-5 h-5 text-zinc-400" />
                              <span className="text-sm text-zinc-500 font-medium">Tải lên hợp đồng</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-5 border-t border-zinc-100">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" name="commitment" checked={formData.commitment} onChange={handleChange} className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-zinc-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center group-hover:border-blue-400">
                        {formData.commitment && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-zinc-600 leading-relaxed">
                      Tôi cam kết thông tin đăng tải và hình ảnh là hoàn toàn chính xác, đúng với thực tế và chịu trách nhiệm với tin đăng này.
                    </span>
                  </label>
                </div>
              </SectionCard>
              </fieldset>
            </form>
          </div>

          {/* Preview + Actions */}
          <div className="w-full xl:w-[400px] shrink-0 self-start sticky top-6">
            <PropertyPreview data={debouncedPreview} />
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit" form="upload-form"
                disabled={isSubmitting || isLocked}
                className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none">
                {isSubmitting
                  ? (<><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>)
                  : (editingId ? 'Cập nhật tin ngay' : 'Đăng tin ngay')}
              </button>
              <button type="button" onClick={handleSaveDraft} disabled={isLocked}
                className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-white text-zinc-700 font-bold rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                Lưu nháp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
