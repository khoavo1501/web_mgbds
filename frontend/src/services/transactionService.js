import api from './api';

const transactionService = {
  // Lấy danh sách giao dịch
  getMyTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },

  // Lấy chi tiết giao dịch
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Tạo giao dịch mới (broker/admin)
  createTransaction: async (data) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  // 🆕 Submit deposit payment cho giao dịch pending_deposit
  submitDepositPayment: async (transactionId) => {
    const response = await api.post(`/transactions/${transactionId}/submit-deposit`);
    return response.data;
  },

  // Xác nhận mua (customer)
  confirmPurchase: async (id) => {
    const response = await api.patch(`/transactions/${id}/confirm-purchase`);
    return response.data;
  },

  // Submit documents (customer)
  submitDocuments: async (id, data) => {
    const response = await api.post(`/transactions/${id}/documents`, data);
    return response.data;
  },

  // Submit payment (customer)
  submitPayment: async (id, receiptUrl) => {
    const response = await api.patch(`/transactions/${id}/payment-submitted`, null, {
      params: { receiptUrl }
    });
    return response.data;
  },

  // Sign commitment (customer)
  signCommitment: async (id) => {
    const response = await api.patch(`/transactions/${id}/commitment-signed`);
    return response.data;
  },

  // Request refund (customer)
  requestRefund: async (id) => {
    const response = await api.patch(`/transactions/${id}/refund-request`);
    return response.data;
  },

  // Confirm refund (customer)
  confirmRefund: async (id) => {
    const response = await api.patch(`/transactions/${id}/confirm-refund`);
    return response.data;
  },


  // Schedule deal (customer)
  scheduleDeal: async (id, scheduledAt) => {
    const response = await api.patch(`/transactions/${id}/schedule-deal`, {
      scheduledAt
    });
    return response.data;
  },

  // Broker confirm deal
  brokerConfirm: async (id) => {
    const response = await api.patch(`/transactions/${id}/broker-confirm`);
    return response.data;
  },

  // Broker reject deal
  brokerReject: async (id) => {
    const response = await api.patch(`/transactions/${id}/broker-reject`);
    return response.data;
  },

  // Update status (admin/broker)
  updateStatus: async (id, status) => {
    const response = await api.patch(`/transactions/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  // Verify document (admin)
  verifyDocument: async (transactionId, documentId) => {
    const response = await api.patch(`/transactions/${transactionId}/documents/${documentId}/verify`);
    return response.data;
  },

  // Reject document (admin)
  rejectDocument: async (transactionId, documentId, reason) => {
    const response = await api.patch(`/transactions/${transactionId}/documents/${documentId}/reject`, null, {
      params: { reason }
    });
    return response.data;
  }
};

export default transactionService;
