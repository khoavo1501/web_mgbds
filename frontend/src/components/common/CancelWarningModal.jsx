import { AlertTriangle, Clock, TrendingDown, XCircle } from 'lucide-react';

export default function CancelWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  hoursUntil, 
  pointsPenalty,
  isWithin24Hours,
  isConfirmed 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`p-6 ${isWithin24Hours ? 'bg-red-50' : 'bg-orange-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isWithin24Hours ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <XCircle className={`w-6 h-6 ${
                isWithin24Hours ? 'text-red-600' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Cảnh báo hủy lịch hẹn
              </h3>
              <p className="text-sm text-gray-600">
                {isConfirmed ? 'Lịch hẹn đã được môi giới xác nhận' : 'Lịch hẹn chưa được xác nhận'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Time Info */}
          {hoursUntil > 0 && (
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
          )}

          {/* Penalty Info - Only show if confirmed */}
          {isConfirmed && pointsPenalty && (
            <div className={`flex items-start gap-3 p-4 rounded-xl ${
              isWithin24Hours ? 'bg-red-50 border-2 border-red-200' : 'bg-orange-50 border-2 border-orange-200'
            }`}>
              <TrendingDown className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isWithin24Hours ? 'text-red-600' : 'text-orange-600'
              }`} />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Điểm uy tín sẽ bị trừ
                </p>
                <p className={`text-2xl font-bold ${
                  isWithin24Hours ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {Math.abs(pointsPenalty)} điểm
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {isWithin24Hours 
                    ? 'Hủy lịch trong vòng 24h sẽ bị trừ nhiều điểm hơn'
                    : 'Hủy lịch trước 24h sẽ bị trừ ít điểm hơn'
                  }
                </p>
              </div>
            </div>
          )}

          {/* No Penalty Info */}
          {!isConfirmed && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Không ảnh hưởng điểm uy tín
                  </p>
                  <p className="text-xs text-blue-700">
                    Lịch hẹn chưa được môi giới xác nhận nên bạn có thể hủy mà không bị trừ điểm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {isConfirmed && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Lưu ý:</span> Việc hủy lịch hẹn đã được xác nhận sẽ ảnh hưởng đến 
                điểm uy tín của bạn. Điểm uy tín thấp có thể hạn chế khả năng đặt lịch trong tương lai.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
          >
            Giữ lịch hẹn
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all ${
              isWithin24Hours && isConfirmed
                ? 'bg-red-600 hover:bg-red-700' 
                : isConfirmed
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
