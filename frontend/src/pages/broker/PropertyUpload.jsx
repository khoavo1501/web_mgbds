import { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Map, Loader2, X, FileText, Plus, Trash2, File, Shield, List, PenSquare, Eye, Sparkles } from 'lucide-react';
import PropertyPreview from '../../components/broker/PropertyPreview';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import page1 from '../../assets/images/contracts/page1.png';
import page2 from '../../assets/images/contracts/page2.png';
import page3 from '../../assets/images/contracts/page3.png';

const wardList = [
  'Phường Hải Châu', 'Phường Hòa Cường', 'Phường Thanh Khê', 'Phường An Khê', 
  'Phường An Hải', 'Phường Sơn Trà', 'Phường Ngũ Hành Sơn', 'Phường Hòa Khánh', 
  'Phường Hải Vân', 'Phường Liên Chiểu', 'Phường Cẩm Lệ', 'Phường Hòa Xuân', 
  'Phường Tam Kỳ', 'Phường Quảng Phú', 'Phường Hương Trà', 'Phường Bàn Thạch', 
  'Phường Điện Bàn', 'Phường Điện Bàn Đông', 'Phường An Thắng', 'Phường Điện Bàn Bắc', 
  'Phường Hội An', 'Phường Hội An Đông', 'Phường Hội An Tây'
];

const propertyTypes = [
  { label: 'Căn hộ', value: 'apartment' },
  { label: 'Nhà riêng', value: 'house' },
  { label: 'Đất nền', value: 'land' },
  { label: 'Biệt thự', value: 'villa' },
  { label: 'Shophouse', value: 'shophouse' },
];

const InputField = ({ label, required, icon: Icon, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm bg-white/50 backdrop-blur-sm hover:bg-white`}
      />
    </div>
  </div>
);

const SectionCard = ({ num, title, icon: SIcon, children }) => (
  <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 -z-10"></div>
    <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-4">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-base font-black shadow-lg shadow-blue-500/30">
        {num}
        <div className="absolute -inset-1 bg-blue-500 rounded-2xl opacity-20 blur-sm"></div>
      </div>
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
    case 'pending':   return { text: 'Chờ kiểm tra', cls: 'bg-amber-100 text-amber-700' };
    case 'pending_review':
    case 'sold':      return { text: 'Đã bán', cls: 'bg-blue-100 text-blue-700' };
    case 'rejected':  return { text: 'Từ chối', cls: 'bg-rose-100 text-rose-700' };
    default:          return { text: s, cls: 'bg-slate-100 text-slate-600' };
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
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mr-3 text-blue-500" /> <span className="font-medium text-lg">Đang tải dữ liệu...</span>
    </div>
  );

  if (properties.length === 0) return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-sm">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <List className="w-10 h-10 text-slate-300" />
      </div>
      <p className="font-bold text-lg text-slate-600">Chưa có bất động sản nào</p>
      <p className="text-sm mt-2 text-slate-400">Đăng tin đầu tiên để bắt đầu quản lý nguồn hàng.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map(p => {
        const st = statusLabel(p.status);
        return (
          <div key={p.propertyId} className="group bg-white/80 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all p-5 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shrink-0 bg-slate-100 relative">
              {p.images && p.images.length > 0
                ? <img src={p.images.find(i => i.isPrimary)?.url || p.images[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-slate-300"><Eye className="w-8 h-8" /></div>
              }
              <div className="absolute top-3 right-3">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md ${st.cls}`}>{st.text}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <h4 className="text-base font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{p.title}</h4>
              <p className="text-sm text-slate-400 mb-3">{p.propertyCode} · {p.propertyType}</p>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 mt-auto">
                <Map className="w-4 h-4 text-slate-400" />
                <span className="line-clamp-1">{p.district}, {p.province}</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-blue-600 text-lg">{formatPrice(p.price)}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {p.area}m²</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <button onClick={() => onEdit(p)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl transition-colors" title="Xem / Sửa">
                    <PenSquare className="w-4 h-4" />
                  </button>
                  {['pending', 'pending_review'].includes(p.status) && (
                    <button onClick={() => handleDelete(p.propertyId)} className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-2 rounded-xl transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
    title: '', type: 'Căn hộ', price: '', area: '', address: '', ward: 'Phường Hải Châu',
    description: '', images: [], 
    redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
    commitment: false, status: 'Nháp',
    isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const debouncedPreview = useDebounce(formData, 400);

  const isLocked = editingId && !['pending', 'pending_review', 'Nháp'].includes(formData.status);

  // Form Validation
  const isBasicInfoComplete = !!(formData.title.trim() && formData.type && formData.price && formData.area && formData.ward);
  const isDescComplete = !!formData.description.trim();
  const isImagesComplete = formData.images.length > 0;
  const isFormComplete = isBasicInfoComplete && isDescComplete && isImagesComplete && formData.commitment;

  const handleEditProperty = useCallback((prop) => {
    const typeMapReverse = { apartment: 'Căn hộ', house: 'Nhà riêng', land: 'Đất nền', villa: 'Biệt thự', shophouse: 'Shophouse' };
    setFormData({
      title: prop.title || '',
      type: typeMapReverse[prop.propertyType] || 'Căn hộ',
      price: prop.price || '',
      area: prop.area || '',
      ward: prop.district ? (wardList.find(w => prop.district.includes(w)) || 'Phường Hải Châu') : 'Phường Hải Châu',
      address: prop.district ? prop.district.replace(new RegExp(`,?\\s*(${wardList.join('|')})`), '').trim() : '',
      description: prop.description || '',
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
      title: '', type: 'Căn hộ', price: '', area: '', address: '', ward: 'Phường Hải Châu',
      description: '', images: [], 
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
    if (!isFormComplete) return showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');

    // Map loại BĐS tiếng Việt → giá trị backend
    const typeMap = { 'Căn hộ': 'apartment', 'Nhà riêng': 'house', 'Đất nền': 'land', 'Biệt thự': 'villa', 'Shophouse': 'shophouse' };

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
        const formD = new FormData();
        formD.append('file', docFile.file);
        const res = await api.post('/uploads/documents', formD, {
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
        brokerageContractUrl: brokerageContractUrl,
        redBookUrl,
        householdRegistrationUrl,
        ownerIdUrl
      };

      const res = editingId 
        ? await api.put('/properties/' + editingId, payload)
        : await api.post('/properties', payload);

      if (res.data.success) {
        showToast('success', editingId ? 'Cập nhật BĐS thành công.' : 'Bất động sản đã được gửi và đang chờ hệ thống xét duyệt.');
        // Reset form
        setEditingId(null);
        setFormData({
          title: '', type: 'Căn hộ', price: '', area: '', address: '', ward: 'Phường Hải Châu',
          description: '', images: [], 
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
  }, [formData, showToast, editingId, uploadImageFile, isFormComplete]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full relative">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[120px]"></div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 backdrop-blur-xl ${
              toast.type === 'error' ? 'bg-rose-50/90 border-rose-200/60 text-rose-800' : 'bg-emerald-50/90 border-emerald-200/60 text-emerald-800'
            }`}>
            <div className={`p-2 rounded-xl ${toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:bg-black/5 p-1.5 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="mb-10 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4" /> Bất động sản
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Đăng tin Bất động sản</h2>
        <p className="text-slate-500 text-base max-w-2xl leading-relaxed">Cung cấp đầy đủ thông tin về bất động sản được đăng bán, đảm bảo tính xác thực và pháp lý hợp lệ. Những tin đăng chi tiết sẽ thu hút khách hàng tốt hơn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-10">
        <button
          onClick={handleNewTabClick}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'new' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-transparent' 
              : 'bg-white/70 backdrop-blur-md shadow-sm border border-slate-200/60 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-blue-100/50 hover:bg-white'
          }`}>
          <PenSquare className="w-5 h-5" /> {editingId ? 'Cập nhật tin' : 'Đăng tin mới'}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'list' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-transparent' 
              : 'bg-white/70 backdrop-blur-md shadow-sm border border-slate-200/60 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-blue-100/50 hover:bg-white'
          }`}>
          <List className="w-5 h-5" /> BĐS của tôi
        </button>
      </div>

      {/* Tab: BĐS của tôi */}
      {activeTab === 'list' && <MyProperties key={activeTab} onEdit={handleEditProperty} showToast={showToast} />}

      {/* Tab: Đăng tin mới */}
      {activeTab === 'new' && (
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Form */}
          <div className="flex-1 w-full space-y-8">
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-8">
              <fieldset disabled={isLocked} className={`space-y-8 transition-opacity duration-300 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>

              {/* Section 1 */}
              <SectionCard num={1} title="Thông tin cơ bản">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Tiêu đề BĐS" required name="title"
                    value={formData.title} onChange={handleChange}
                    placeholder="VD: Bán căn hộ cao cấp Quận 7..." className="col-span-full"
                  />
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Loại BĐS <span className="text-rose-500">*</span>
                    </label>
                    <select name="type" value={formData.type} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm appearance-none bg-white/50 backdrop-blur-sm hover:bg-white transition-all cursor-pointer">
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.label}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Mức giá (VNĐ)" required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="VD: 2500000000" />
                  <InputField label="Diện tích (m²)" required name="area" value={formData.area} onChange={handleChange} type="number" placeholder="VD: 85" />
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phường <span className="text-rose-500">*</span>
                    </label>
                    <select name="ward" value={formData.ward} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm appearance-none bg-white/50 backdrop-blur-sm hover:bg-white transition-all cursor-pointer">
                      {wardList.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <InputField label="Địa chỉ cụ thể" icon={Map} name="address" value={formData.address} onChange={handleChange} placeholder="Số nhà, Tên đường..." className="col-span-full" />
                </div>
              </SectionCard>

              {/* Section 2 */}
              <SectionCard num={2} title="Mô tả chi tiết">
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-slate-700">Mô tả BĐS <span className="text-rose-500">*</span></label>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${formData.description.length > 900 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    rows={5} maxLength={1000}
                    placeholder="Mô tả chi tiết về bất động sản, tiện ích xung quanh, ưu điểm nổi bật..."
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm resize-none transition-all bg-white/50 backdrop-blur-sm hover:bg-white leading-relaxed"
                  />
                </div>
              </SectionCard>

              {/* Section 3 - Images */}
              <SectionCard num={3} title="Hình ảnh thực tế">
                <div className="flex justify-between items-center mb-4 -mt-2">
                  <p className="text-sm text-slate-500 font-medium">Thêm ít nhất 1 hình ảnh <span className="text-rose-500">*</span></p>
                  <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                    {formData.images.length}/10 ẢNH
                  </span>
                </div>
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => !isLocked && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2rem] w-full flex flex-col items-center justify-center py-14 px-6 text-center transition-all duration-300 ${!isLocked && 'cursor-pointer'} ${
                    isDragging ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-xl shadow-blue-500/10' : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400'
                  }`}>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => processFiles(Array.from(e.target.files))} />
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 ${isDragging ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/40 rotate-12' : 'bg-white shadow-md text-slate-400'}`}>
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-800 mb-2">Kéo thả ảnh vào đây</h4>
                  <p className="text-sm text-slate-500 mb-6">hoặc click để chọn file từ máy tính</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    JPG, PNG — Tối đa 10 ảnh (mỗi ảnh &lt; 5MB)
                  </p>
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
                        <img src={img.preview || img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button type="button" onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                            className="bg-rose-500/90 text-white p-2.5 rounded-xl hover:bg-rose-600 hover:scale-110 shadow-lg transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-lg shadow-lg">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {/* Sổ đỏ */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-slate-700">Sổ đỏ / Sổ hồng</label>
                    <div className="relative group">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('redBookFile', e.target.files[0])} />
                      <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all duration-300 text-center ${formData.redBookFile ? 'border-emerald-400 bg-emerald-50/80 shadow-inner' : 'border-slate-200 bg-slate-50/50 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                        {formData.redBookFile ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-xs font-bold text-emerald-800 line-clamp-1 px-2">{formData.redBookFile.name}</p>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('redBookFile', null); }} className="relative z-20 text-xs font-bold text-rose-500 hover:text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm mt-1">
                              Xóa file
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-xs font-bold text-slate-500">Tải lên sổ đỏ</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sổ hộ khẩu */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-slate-700">Sổ hộ khẩu chủ BĐS</label>
                    <div className="relative group">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('householdRegistrationFile', e.target.files[0])} />
                      <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all duration-300 text-center ${formData.householdRegistrationFile ? 'border-emerald-400 bg-emerald-50/80 shadow-inner' : 'border-slate-200 bg-slate-50/50 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                        {formData.householdRegistrationFile ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-xs font-bold text-emerald-800 line-clamp-1 px-2">{formData.householdRegistrationFile.name}</p>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('householdRegistrationFile', null); }} className="relative z-20 text-xs font-bold text-rose-500 hover:text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm mt-1">
                              Xóa file
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-xs font-bold text-slate-500">Tải lên hộ khẩu</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CCCD */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-slate-700">CCCD chủ BĐS</label>
                    <div className="relative group">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleSingleFileChange('ownerIdFile', e.target.files[0])} />
                      <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all duration-300 text-center ${formData.ownerIdFile ? 'border-emerald-400 bg-emerald-50/80 shadow-inner' : 'border-slate-200 bg-slate-50/50 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                        {formData.ownerIdFile ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-xs font-bold text-emerald-800 line-clamp-1 px-2">{formData.ownerIdFile.name}</p>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSingleFileChange('ownerIdFile', null); }} className="relative z-20 text-xs font-bold text-rose-500 hover:text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm mt-1">
                              Xóa file
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-xs font-bold text-slate-500">Tải lên CCCD</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 mb-8 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-800 mb-1">Bảo mật thông tin tối đa</p>
                    <p className="text-xs font-medium text-emerald-600/80">Tất cả giấy tờ pháp lý của khách hàng được mã hóa nhiều lớp và bảo vệ an toàn tuyệt đối trên hệ thống.</p>
                  </div>
                </div>


                {/* BĐS Độc quyền info */}
                <div className="mb-8 p-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div className="space-y-5 relative z-10">
                    <div className="text-sm font-medium text-slate-600 leading-relaxed">
                      <span className="font-black text-slate-900 block mb-2 text-base flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" /> Bất động sản độc quyền (Exclusive)
                      </span>
                      Là hình thức mà bạn (Broker) là người đại diện duy nhất được quyền phân phối và bán bất động sản này trong một thời gian nhất định, đảm bảo quyền lợi và hoa hồng cao nhất.
                    </div>
                    <div className="font-bold text-slate-800 mb-3 bg-white/60 inline-block px-4 py-1.5 rounded-full text-xs">Mẫu Hợp đồng môi giới độc quyền tham khảo:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {[page1, page2, page3].map((page, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-white shadow-md cursor-zoom-in group relative aspect-[3/4] bg-white">
                          <img src={page} alt={`Hợp đồng trang ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onClick={() => window.open(page, '_blank')} />
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-4">
                            <span className="text-white font-bold text-xs bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">Phóng to</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100 mt-8">
                  <label className="flex items-start gap-4 cursor-pointer group bg-slate-50/50 p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                    <div className="relative flex items-center mt-0.5 shrink-0">
                      <input type="checkbox" name="commitment" checked={formData.commitment} onChange={handleChange} className="peer sr-only" />
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-300 flex items-center justify-center group-hover:border-blue-400 group-hover:shadow-sm">
                        <svg className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${formData.commitment ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700 block mb-1">Xác nhận thông tin <span className="text-rose-500">*</span></span>
                      <span className="text-xs font-medium text-slate-500 leading-relaxed block">
                        Tôi cam kết mọi thông tin đăng tải và hình ảnh cung cấp là hoàn toàn chính xác, đúng với thực tế và chịu hoàn toàn trách nhiệm pháp lý với tin đăng này.
                      </span>
                    </div>
                  </label>
                </div>
              </SectionCard>
              </fieldset>
            </form>
          </div>

          {/* Preview + Actions */}
          <div className="w-full xl:w-[420px] shrink-0 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-2 pr-1 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {/* Preview Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" /> Xem trước tin đăng
              </h3>
              <PropertyPreview data={debouncedPreview} />
            </div>

            {/* Action Buttons */}
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_-10px_40px_rgb(0,0,0,0.05)] p-6 sticky bottom-0 z-20">
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  form="upload-form"
                  disabled={isSubmitting || isLocked || !isFormComplete}
                  className={`w-full flex justify-center items-center gap-2 px-6 py-4 font-black rounded-2xl transition-all duration-300 ${
                    !isFormComplete || isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] hover:-translate-y-0.5'
                  }`}>
                  {isSubmitting
                    ? (<><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>)
                    : (editingId ? 'LƯU CẬP NHẬT' : 'ĐĂNG TIN NGAY')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLocked}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  Lưu nháp
                </button>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tiến độ nhập liệu</h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {Math.round(((isBasicInfoComplete ? 1 : 0) + (isDescComplete ? 1 : 0) + (isImagesComplete ? 1 : 0) + (formData.commitment ? 1 : 0)) / 4 * 100)}%
                </span>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Thông tin cơ bản', done: isBasicInfoComplete },
                  { label: 'Mô tả & Tiện ích', done: isDescComplete },
                  { label: 'Hình ảnh (ít nhất 1)', done: isImagesComplete },
                  { label: 'Xác nhận cam kết', done: formData.commitment }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${item.done ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20' : 'bg-slate-100 border border-slate-200'}`}>
                      {item.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${item.done ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
