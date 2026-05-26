import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import PendingDepositCard from '../../components/transaction/PendingDepositCard';
import transactionService from '../../services/transactionService';

const MyTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getMyTransactions();
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_deposit: { 
        label: 'Chờ đặt cọc', 
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: AlertCircle 
      },
      payment_submitted: { 
        label: 'Đã nộp cọc', 
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Clock 
      },
      deposit_confirmed: { 
        label: 'Đã xác nhận cọc', 
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle 
      },
      completed: { 
        label: 'Hoàn thành', 
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle 
      },
      cancelled: { 
        label: 'Đã hủy', 
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: XCircle 
      },
      refunded: { 
        label: 'Đã hoàn cọc', 
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: CheckCircle 
      }
    };

    const config = statusConfig[status] || { 
      label: status, 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: Clock 
    };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Separate pending_deposit transactions
  const pendingDepositTransactions = transactions.filter(t => t.status === 'pending_deposit');
  const otherTransactions = transactions.filter(t => t.status !== 'pending_deposit');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Giao dịch của tôi</h1>
        <p className="text-gray-600">Quản lý các giao dịch mua bán bất động sản</p>
      </div>

      {/* Pending Deposit Section (Priority) */}
      {pendingDepositTransactions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              ⚠️ Cần đặt cọc ngay ({pendingDepositTransactions.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingDepositTransactions.map(transaction => (
              <PendingDepositCard 
                key={transaction.transactionId}
                transaction={transaction}
                onDepositSubmitted={fetchTransactions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Transactions */}
      {otherTransactions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Giao dịch khác ({otherTransactions.length})
          </h2>
          <div className="space-y-4">
            {otherTransactions.map(transaction => (
              <div 
                key={transaction.transactionId}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/customer/transactions/${transaction.transactionId}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Mã GD: {transaction.transactionCode}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {transaction.propertyTitle}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {transaction.propertyDistrict}, {transaction.propertyProvince}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(transaction.status)}
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Tổng giá trị</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(transaction.totalPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tiền cọc</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatPrice(transaction.depositAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có giao dịch nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bạn chưa có giao dịch mua bán bất động sản nào
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Khám phá bất động sản
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTransactions;
