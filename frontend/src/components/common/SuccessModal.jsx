import { CheckCircle, Bell, User, Clock } from 'lucide-react';

export default function SuccessModal({ isOpen, onClose, title, message, details }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title || 'Thành công!'}</h3>
              <p className="text-emerald-50 text-sm">Thao tác đã được thực hiện</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main message */}
          {message && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-700 font-medium">{message}</p>
            </div>
          )}

          {/* Details */}
          {details && details.length > 0 && (
            <div className="space-y-3">
              {details.map((detail, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  {detail.icon === 'bell' && <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                  {detail.icon === 'user' && <User className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />}
                  {detail.icon === 'clock' && <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    {detail.label && (
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        {detail.label}
                      </p>
                    )}
                    <p className="text-sm text-slate-700">{detail.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-500/30"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
