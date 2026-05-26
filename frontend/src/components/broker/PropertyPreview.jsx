import { MapPin, Square, Sparkles, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PropertyPreview({ data }) {
    // Luôn hiển thị số VNĐ đầy đủ, có dấu phân cách
    const formatPrice = (price) => {
        if (!price) return 'Đang cập nhật';
        const num = Number(price);
        if (!num) return 'Đang cập nhật';
        return new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';
    };

    const imageSrc = data.images && data.images.length > 0
        ? data.images[0].preview
        : null;

    const completionFields = ['title', 'type', 'price', 'area', 'address', 'ward', 'description'];
    const filled = completionFields.filter(f => data[f] && String(data[f]).trim() !== '').length;
    const percent = Math.round((filled / completionFields.length) * 100);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider pl-1">
                    Xem trước tin đăng
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${percent === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                    {percent}% hoàn thành
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-100 rounded-full mb-5 overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            <motion.div
                layout
                className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100 transition-all hover:shadow-2xl hover:shadow-blue-600/10"
            >
                {/* Cover Image — full width, không chèn giá vào ảnh */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-50 group overflow-hidden">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-medium text-zinc-400">Chưa có hình ảnh</span>
                        </div>
                    )}

                    {/* Badge loại BĐS + trạng thái — chỉ overlay badge, không có giá */}
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-700 text-[11px] font-bold rounded-lg uppercase tracking-wide shadow-sm">
                            {data.type || 'Chưa chọn'}
                        </span>
                        {data.status === 'Chờ duyệt' && (
                            <span className="px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Chờ duyệt
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Giá tiền — nằm dưới ảnh, hiển thị số VNĐ đầy đủ */}
                    <div className="text-lg font-extrabold text-blue-600 mb-2">
                        {formatPrice(data.price)}
                    </div>

                    <h4 className="text-base font-bold text-zinc-900 mb-2 line-clamp-2 leading-snug">
                        {data.title || 'Tiêu đề bất động sản chưa nhập...'}
                    </h4>

                    <div className="flex items-start gap-1.5 text-zinc-500 mb-3 text-sm">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                        <p className="line-clamp-2 text-[13px]">
                            {data.address ? `${data.address}${data.ward ? `, ${data.ward}` : ''}, Đà Nẵng` : (data.ward ? `${data.ward}, Đà Nẵng` : 'Chưa nhập địa chỉ')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 py-3 border-t border-zinc-100 text-zinc-600 text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Square className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[13px]">{data.area ? `${data.area} m²` : '--'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
