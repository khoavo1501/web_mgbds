import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import CountdownTimer from '../common/CountdownTimer';
import transactionService from '../../services/transactionService';

/**
 * Card hiển thị giao dịch pending_deposit với countdown 24h
 */
const PendingDepositCard = ({ transaction, onDepositSubmitted }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitDeposit = async () => {
    if (!window.confirm('Xác nhận đặt cọc cho bất động sản này?')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await transactionService.submitDepositPayment(transaction.transactionId);
      alert('Đã nộp tiền cọc thành công! Vui lòng chờ admin xác nhận.');
      if (onDepositSubmitted) {
        onDepositSubmitted();
      }
      navigate('/customer/transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt cọc');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpired = () => {
    alert('Giao dịch đã hết hạn. Bạn cần đặt lịch xem nhà lại để mua BĐS này.');
    if (onDepositSubmitted) {
      onDepositSubmitted(); // Refresh list
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-orange-200">
      {/* Header với badge urgent */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Chờ đặt cọc</h3>
              <p className="text-sm opacity-90">Mã GD: {transaction.transactionCode}</p>
            </div>
          </div>
          <CountdownTimer 
            expiredAt={transaction.expiredAt} 
            onExpired={handleExpired}
            variant="compact"
          />
        </div>
      </div>

      {/* Property info */}
      <div className="p-6">
        <div className="flex gap-4 mb-4">
          {transaction.propertyImages && transaction.propertyImages.length > 0 ? (
            <img 
              src={transaction.propertyImages[0]} 
              alt={transaction.propertyTitle}
              className="w-32 h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {transaction.propertyTitle}
            </h4>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {transaction.propertyDistrict}, {transaction.propertyProvince}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Xem nhà: {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown timer (full) */}
        <div className="mb-4">
          <CountdownTimer 
            expiredAt={transaction.expiredAt} 
            onExpired={handleExpired}
            variant="default"
          />
        </div>

        {/* Price info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Giá bất động sản:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(transaction.totalPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tiền cọc (10%):</span>
            <span className="text-2xl font-bold text-orange-600">
              {formatPrice(transaction.depositAmount)}
            </span>
          </div>
        </div>

        {/* Warning message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bạn cần đặt cọc trong vòng 24 giờ để giữ quyền mua BĐS này</li>
                <li>Nếu không đặt cọc, giao dịch sẽ tự động hủy</li>
                <li>Sau khi hủy, bạn cần đặt lịch xem nhà lại để mua BĐS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmitDeposit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            {isSubmitting ? 'Đang xử lý...' : 'Đặt cọc ngay'}
          </button>
          
          <button
            onClick={() => navigate(`/customer/transactions/${transaction.transactionId}`)}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingDepositCard;
