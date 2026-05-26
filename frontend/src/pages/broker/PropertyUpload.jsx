import { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Map, Loader2, X, FileText, Plus, Trash2, File, Shield, List, PenSquare, Eye } from 'lucide-react';
import PropertyPreview from '../../components/broker/PropertyPreview';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const wardList = [
  'PhÆ°á»ng Háº£i ChÃ¢u', 'PhÆ°á»ng HÃ²a CÆ°á»ng', 'PhÆ°á»ng Thanh KhÃª', 'PhÆ°á»ng An KhÃª', 
  'PhÆ°á»ng An Háº£i', 'PhÆ°á»ng SÆ¡n TrÃ ', 'PhÆ°á»ng NgÅ© HÃ nh SÆ¡n', 'PhÆ°á»ng HÃ²a KhÃ¡nh', 
  'PhÆ°á»ng Háº£i VÃ¢n', 'PhÆ°á»ng LiÃªn Chiá»ƒu', 'PhÆ°á»ng Cáº©m Lá»‡', 'PhÆ°á»ng HÃ²a XuÃ¢n', 
  'PhÆ°á»ng Tam Ká»³', 'PhÆ°á»ng Quáº£ng PhÃº', 'PhÆ°á»ng HÆ°Æ¡ng TrÃ ', 'PhÆ°á»ng BÃ n Tháº¡ch', 
  'PhÆ°á»ng Äiá»‡n BÃ n', 'PhÆ°á»ng Äiá»‡n BÃ n ÄÃ´ng', 'PhÆ°á»ng An Tháº¯ng', 'PhÆ°á»ng Äiá»‡n BÃ n Báº¯c', 
  'PhÆ°á»ng Há»™i An', 'PhÆ°á»ng Há»™i An ÄÃ´ng', 'PhÆ°á»ng Há»™i An TÃ¢y'
];

const propertyTypes = [
  { label: 'CÄƒn há»™', value: 'apartment' },
  { label: 'NhÃ  riÃªng', value: 'house' },
  { label: 'Äáº¥t ná»n', value: 'land' },
  { label: 'Biá»‡t thá»±', value: 'villa' },
  { label: 'Shophouse', value: 'shophouse' },
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
  <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-3">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold">
        {num}
      </span>
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
    case 'published': return { text: 'ÄÃ£ Ä‘Äƒng', cls: 'bg-emerald-100 text-emerald-700' };
    case 'pending':   return { text: 'Chá» duyá»‡t', cls: 'bg-amber-100 text-amber-700' };
    case 'pending_review':
    case 'sold':      return { text: 'ÄÃ£ bÃ¡n', cls: 'bg-blue-100 text-blue-700' };
    case 'rejected':  return { text: 'Tá»« chá»‘i', cls: 'bg-red-100 text-red-700' };
    default:          return { text: s, cls: 'bg-zinc-100 text-zinc-600' };
  }
};

const formatPrice = (p) => {
  if (!p) return '--';
  return new Intl.NumberFormat('vi-VN').format(p) + ' VNÄ';
};

// â”€â”€â”€ Tab: Danh sÃ¡ch BÄS cá»§a tÃ´i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (!window.confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a BÄS nÃ y?')) return;
    try {
      const res = await api.delete('/properties/' + id);
      if (res.data.success) {
        showToast('success', 'XÃ³a thÃ nh cÃ´ng!');
        fetchProperties();
      }
    } catch (e) {
      showToast('error', e.response?.data?.message || 'XÃ³a tháº¥t báº¡i');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Äang táº£i...
    </div>
  );

  if (properties.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
      <List className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">ChÆ°a cÃ³ báº¥t Ä‘á»™ng sáº£n nÃ o</p>
      <p className="text-sm mt-1">HÃ£y Ä‘Äƒng tin Ä‘áº§u tiÃªn cá»§a báº¡n!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {properties.map(p => {
        const st = statusLabel(p.status);
        return (
          <div key={p.propertyId} className="group bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4 items-start">
            {/* áº¢nh thumbnail */}
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
                    <button onClick={() => onEdit(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors" title="Xem / Sá»­a">
                      <PenSquare className="w-4 h-4" />
                    </button>
                    {['pending', 'pending_review'].includes(p.status) && (
                      <button onClick={() => handleDelete(p.propertyId)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="XÃ³a">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-1">{p.propertyCode} Â· {p.propertyType}</p>
              <p className="text-xs text-zinc-500 mb-2 line-clamp-1">{p.district}, {p.province}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="font-semibold text-blue-600">{formatPrice(p.price)}</span>
                <span>Â·</span>
                <span>{p.area} mÂ²</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PropertyUpload() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'list'
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', type: 'CÄƒn há»™', price: '', area: '', address: '', ward: 'PhÆ°á»ng Háº£i ChÃ¢u',
    description: '', images: [], 
    redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
    commitment: false, status: 'NhÃ¡p',
    isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const legalInputRef = useRef(null);

  const debouncedPreview = useDebounce(formData, 400);

  const isLocked = editingId && !['pending', 'pending_review', 'Nháp'].includes(formData.status);

  const handleEditProperty = useCallback((prop) => {
    const typeMapReverse = { apartment: 'CÄƒn há»™', house: 'NhÃ  riÃªng', land: 'Äáº¥t ná»n', villa: 'Biá»‡t thá»±', shophouse: 'Shophouse' };
    setFormData({
      title: prop.title || '',
      type: typeMapReverse[prop.propertyType] || 'CÄƒn há»™',
      price: prop.price || '',
      area: prop.area || '',
      ward: prop.district ? (wardList.find(w => prop.district.includes(w)) || 'PhÆ°á»ng Háº£i ChÃ¢u') : 'PhÆ°á»ng Háº£i ChÃ¢u',
      address: prop.district ? prop.district.replace(new RegExp(`,?\\s*(${wardList.join('|')})`), '').trim() : '',
      description: prop.description || '',
      images: (prop.images || []).map(i => ({ id: i.imageId || Math.random().toString(), url: i.url, preview: i.url, isPrimary: i.isPrimary })),
      redBookFile: prop.redBookUrl ? { name: 'Sá»• Ä‘á».pdf', url: prop.redBookUrl } : null,
      householdRegistrationFile: prop.householdRegistrationUrl ? { name: 'Sá»• há»™ kháº©u.pdf', url: prop.householdRegistrationUrl } : null,
      ownerIdFile: prop.ownerIdUrl ? { name: 'CÄƒn cÆ°á»›c cÃ´ng dÃ¢n.pdf', url: prop.ownerIdUrl } : null,
      commitment: true,
      status: prop.status || 'NhÃ¡p',
      isExclusive: prop.isExclusive || false,
      ownerName: prop.ownerName || '',
      ownerPhone: prop.ownerPhone || '',
      brokerageContractFile: prop.brokerageContractUrl ? { name: 'Há»£p Ä‘á»“ng mÃ´i giá»›i.pdf', url: prop.brokerageContractUrl } : null
    });
    setEditingId(prop.propertyId);
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewTabClick = useCallback(() => {
    setEditingId(null);
    setFormData({
      title: '', type: 'CÄƒn há»™', price: '', area: '', address: '', ward: 'PhÆ°á»ng Háº£i ChÃ¢u',
      description: '', images: [], 
      redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
      commitment: false, status: 'NhÃ¡p',
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
      throw new Error(res.data.message || 'Upload áº£nh tháº¥t báº¡i');
    }
    return res.data.data.url;
  }, []);

  const handleSaveDraft = useCallback(() => {
    setFormData(p => ({ ...p, status: 'NhÃ¡p' }));
    showToast('success', 'ÄÃ£ lÆ°u nhÃ¡p thÃ nh cÃ´ng!');
  }, [showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return showToast('error', 'Vui lÃ²ng nháº­p tiÃªu Ä‘á» BÄS.');
    if (!formData.price) return showToast('error', 'Vui lÃ²ng nháº­p má»©c giÃ¡.');
    if (!formData.area) return showToast('error', 'Vui lÃ²ng nháº­p diá»‡n tÃ­ch.');
    if (!formData.ward) return showToast('error', 'Vui lÃ²ng chá»n phÆ°á»ng.');
    if (!formData.ownerName.trim()) return showToast('error', 'Vui lÃ²ng nháº­p tÃªn chá»§ nhÃ .');
    if (!formData.ownerPhone.trim()) return showToast('error', 'Vui lÃ²ng nháº­p SÄT chá»§ nhÃ .');
    if (formData.isExclusive) {
      if (!formData.brokerageContractFile) return showToast('error', 'Vui lÃ²ng upload Há»£p Ä‘á»“ng mÃ´i giá»›i Ä‘á»™c quyá»n.');
    }
    if (!formData.commitment) return showToast('error', 'Vui lÃ²ng xÃ¡c nháº­n cam káº¿t thÃ´ng tin.');

    // Map loáº¡i BÄS tiáº¿ng Viá»‡t â†’ giÃ¡ trá»‹ backend
    const typeMap = { 'CÄƒn há»™': 'apartment', 'NhÃ  riÃªng': 'house', 'Äáº¥t ná»n': 'land', 'Biá»‡t thá»±': 'villa', 'Shophouse': 'shophouse' };

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
        province: 'ÄÃ  Náºµng',
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
        showToast('success', editingId ? 'Cáº­p nháº­t BÄS thÃ nh cÃ´ng!' : 'Báº¥t Ä‘á»™ng sáº£n Ä‘Ã£ Ä‘Æ°á»£c gá»­i vÃ  Ä‘ang chá» Admin kiá»ƒm duyá»‡t!');
        // Reset form
        setEditingId(null);
        setFormData({
          title: '', type: 'CÄƒn há»™', price: '', area: '', address: '', ward: 'PhÆ°á»ng Háº£i ChÃ¢u',
          description: '', images: [], 
          redBookFile: null, householdRegistrationFile: null, ownerIdFile: null,
          commitment: false, status: 'NhÃ¡p',
          isExclusive: false, ownerName: '', ownerPhone: '', brokerageContractFile: null
        });
        // Chuyá»ƒn sang tab danh sÃ¡ch Ä‘á»ƒ tháº¥y ngay
        setTimeout(() => setActiveTab('list'), 800);
      } else {
        showToast('error', res.data.message || 'Thao tÃ¡c tháº¥t báº¡i.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lá»—i káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§.');
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">ÄÄƒng tin Báº¥t Ä‘á»™ng sáº£n</h2>
        <p className="text-gray-600">Cung cáº¥p Ä‘áº§y Ä‘á»§ thÃ´ng tin vá» báº¥t Ä‘á»™ng sáº£n Ä‘Æ°á»£c Ä‘Äƒng bÃ¡n, Ä‘áº£m báº£o tÃ­nh xÃ¡c thá»±c vÃ  phÃ¡p lÃ½ há»£p lá»‡.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleNewTabClick}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'new' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
          }`}>
          <PenSquare className="w-4 h-4" /> {editingId ? 'Cáº­p nháº­t tin' : 'ÄÄƒng tin má»›i'}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
          }`}>
          <List className="w-4 h-4" /> BÄS cá»§a tÃ´i
        </button>
      </div>

      {/* Tab: BÄS cá»§a tÃ´i */}
      {activeTab === 'list' && <MyProperties key={activeTab} onEdit={handleEditProperty} showToast={showToast} />}

      {/* Tab: ÄÄƒng tin má»›i */}
      {activeTab === 'new' && (
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Form */}
          <div className="flex-1 w-full space-y-6">
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
              <fieldset disabled={isLocked} className={`space-y-6 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>

              {/* Section 1 */}
              <SectionCard num={1} title="ThÃ´ng tin cÆ¡ báº£n">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    label="TiÃªu Ä‘á» BÄS" required name="title"
                    value={formData.title} onChange={handleChange}
                    placeholder="VD: BÃ¡n cÄƒn há»™ cao cáº¥p Quáº­n 7..." className="col-span-full"
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Loáº¡i BÄS <span className="text-red-500">*</span>
                    </label>
                    <select name="type" value={formData.type} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white">
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.label}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Má»©c giÃ¡ (VNÄ)" required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="VD: 2500000000" />
                  <InputField label="Diá»‡n tÃ­ch (mÂ²)" required name="area" value={formData.area} onChange={handleChange} type="number" placeholder="VD: 85" />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      PhÆ°á»ng <span className="text-red-500">*</span>
                    </label>
                    <select name="ward" value={formData.ward} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white">
                      {wardList.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <InputField label="Äá»‹a chá»‰ cá»¥ thá»ƒ" icon={Map} name="address" value={formData.address} onChange={handleChange} placeholder="Sá»‘ nhÃ , TÃªn Ä‘Æ°á»ng..." className="col-span-full" />
                </div>
              </SectionCard>

              {/* Section 2 */}
              <SectionCard num={2} title="MÃ´ táº£ chi tiáº¿t">
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-sm font-medium text-zinc-700">MÃ´ táº£ BÄS</label>
                    <span className={`text-xs font-medium ${formData.description.length > 900 ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    rows={4} maxLength={1000}
                    placeholder="MÃ´ táº£ chi tiáº¿t vá» báº¥t Ä‘á»™ng sáº£n, tiá»‡n Ã­ch xung quanh, Æ°u Ä‘iá»ƒm ná»•i báº­t..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none transition-all"
                  />
                </div>
              </SectionCard>

              {/* Section 3 - Images */}
              <SectionCard num={3} title="HÃ¬nh áº£nh thá»±c táº¿">
                <div className="flex justify-end mb-4 -mt-2">
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {formData.images.length}/10 áº£nh
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
                  <h4 className="text-sm font-bold text-zinc-700 mb-1">KÃ©o tháº£ áº£nh vÃ o Ä‘Ã¢y</h4>
                  <p className="text-xs text-zinc-400">hoáº·c click Ä‘á»ƒ chá»n file tá»« mÃ¡y tÃ­nh</p>
                  <p className="text-[11px] text-zinc-400 mt-3 font-medium bg-zinc-100 px-3 py-1 rounded-full">
                    JPG, PNG â€” Tá»‘i Ä‘a 10 áº£nh (má»—i áº£nh &lt; 5MB)
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
                            áº¢nh bÃ¬a
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Section 4 - Legal */}
              <SectionCard num={4} icon={Shield} title="ThÃ´ng tin phÃ¡p lÃ½">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Sá»• Ä‘á» */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Sá»• Ä‘á» / Sá»• há»“ng</label>
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
                            <p className="text-sm text-zinc-500">Táº£i lÃªn sá»• Ä‘á»...</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sá»• há»™ kháº©u */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Sá»• há»™ kháº©u chá»§ BÄS</label>
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
                            <p className="text-sm text-zinc-500">Táº£i lÃªn há»™ kháº©u...</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CCCD */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">CCCD chá»§ BÄS</label>
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
                            <p className="text-sm text-zinc-500">Táº£i lÃªn CCCD...</p>
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
                    <p className="text-sm font-semibold text-emerald-700">Báº£o máº­t</p>
                    <p className="text-[11px] text-emerald-500">Táº¥t cáº£ giáº¥y tá» cá»§a khÃ¡ch hÃ ng Ä‘Æ°á»£c mÃ£ hÃ³a vÃ  báº£o vá»‡ an toÃ n tuyá»‡t Ä‘á»‘i</p>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="TÃªn chá»§ nhÃ " name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Nguyá»…n VÄƒn A" required />
                  <InputField label="Sá»‘ Ä‘iá»‡n thoáº¡i chá»§ nhÃ " name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="0901234567" required />
                </div>

                {/* BÄS Äá»™c quyá»n checkbox & fields */}
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
                      <span className="text-sm font-semibold text-zinc-800">ÄÃ¢y lÃ  Báº¥t Ä‘á»™ng sáº£n Ä‘á»™c quyá»n</span>
                      <p className="text-xs text-zinc-500 mt-0.5">YÃªu cáº§u cung cáº¥p há»£p Ä‘á»“ng mÃ´i giá»›i Ä‘á»™c quyá»n</p>
                    </div>
                  </label>

                  {formData.isExclusive && (
                    <div className="space-y-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          Há»£p Ä‘á»“ng mÃ´i giá»›i Ä‘á»™c quyá»n <span className="text-red-500">*</span>
                        </label>
                        {formData.brokerageContractFile ? (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200">
                            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-700 truncate">{formData.brokerageContractFile.name}</p>
                              <p className="text-[11px] text-zinc-400">ÄÃ£ chá»n</p>
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
                              <span className="text-sm text-zinc-500 font-medium">Táº£i lÃªn há»£p Ä‘á»“ng</span>
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
                      TÃ´i cam káº¿t thÃ´ng tin Ä‘Äƒng táº£i vÃ  hÃ¬nh áº£nh lÃ  hoÃ n toÃ n chÃ­nh xÃ¡c, Ä‘Ãºng vá»›i thá»±c táº¿ vÃ  chá»‹u trÃ¡ch nhiá»‡m vá»›i tin Ä‘Äƒng nÃ y.
                    </span>
                  </label>
                </div>
              </SectionCard>
              </fieldset>
            </form>
          </div>

          {/* Preview + Actions */}
          <div className="w-full xl:w-[420px] shrink-0 self-start sticky top-6 space-y-6">
            {/* Preview Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Xem trÆ°á»›c tin Ä‘Äƒng</h3>
              <PropertyPreview data={debouncedPreview} />
            </div>

            {/* Checklist Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Tiáº¿n Ä‘á»™ nháº­p liá»‡u</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.title && formData.type && formData.price && formData.area ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {formData.title && formData.type && formData.price && formData.area && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">ThÃ´ng tin cÆ¡ báº£n</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.description ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {formData.description && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">MÃ´ táº£ & Tiá»‡n Ã­ch</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.images.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {formData.images.length > 0 && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">HÃ¬nh áº£nh</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.commitment ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {formData.commitment && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">PhÃ¡p lÃ½</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isLocked}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                LÆ°u nhÃ¡p
              </button>
              <button
                type="submit"
                form="upload-form"
                disabled={isSubmitting || isLocked}
                className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting
                  ? (<><Loader2 className="w-5 h-5 animate-spin" /> Äang xá»­ lÃ½...</>)
                  : (editingId ? 'Cáº­p nháº­t tin ngay' : 'ÄÄƒng tin ngay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
