import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';

export default function RescheduleWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  hoursUntil, 
  pointsPenalty,
  isWithin24Hours 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`p-6 ${isWithin24Hours ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isWithin24Hours ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                isWithin24Hours ? 'text-red-600' : 'text-amber-600'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Cảnh báo dời lịch hẹn
              </h3>
              <p className="text-sm text-gray-600">
                Lịch hẹn đã được môi giới xác nhận
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Time Info */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Thời gian còn lại đến lịch hẹn
              </p>
              <p className="text-lg font-bold text-gray-900">
                {hoursUntil} giờ
              </p>
            </div>
          </div>

          {/* Penalty Info */}
          <div className={`flex items-start gap-3 p-4 rounded-xl ${
            isWithin24Hours ? 'bg-red-50 border-2 border-red-200' : 'bg-amber-50 border-2 border-amber-200'
          }`}>
            <TrendingDown className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isWithin24Hours ? 'text-red-600' : 'text-amber-600'
            }`} />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Điểm uy tín sẽ bị trừ
              </p>
              <p className={`text-2xl font-bold ${
                isWithin24Hours ? 'text-red-600' : 'text-amber-600'
              }`}>
                {Math.abs(pointsPenalty)} điểm
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isWithin24Hours 
                  ? 'Dời lịch trong vòng 24h sẽ bị trừ nhiều điểm hơn'
                  : 'Dời lịch trước 24h sẽ bị trừ ít điểm hơn'
                }
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Lưu ý:</span> Sau khi dời lịch, môi giới cần xác nhận lại lịch hẹn mới. 
              Điểm uy tín sẽ bị trừ ngay khi bạn xác nhận dời lịch.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all ${
              isWithin24Hours 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            Xác nhận dời lịch
          </button>
        </div>
      </div>
    </div>
  );
}
