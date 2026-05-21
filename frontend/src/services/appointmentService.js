import api from './api';

/**
 * Appointment Service - Tích hợp với backend APIs
 */

// ============================================================================
// CUSTOMER APIs
// ============================================================================

/**
 * Lấy danh sách lịch hẹn của customer
 */
export const getMyAppointments = async (page = 0, size = 10) => {
  const response = await api.get('/appointments', {
    params: { page, size, sortBy: 'scheduledAt', sortDirection: 'DESC' }
  });
  return response.data;
};

/**
 * Lấy danh sách lịch hẹn của 1 property (để check slot trống)
 */
export const getPropertyAppointments = async (propertyId) => {
  const response = await api.get(`/appointments/property/${propertyId}`);
  return response.data;
};

/**
 * Đặt lịch hẹn mới
 */
export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

/**
 * Cập nhật lịch hẹn (dời lịch, cập nhật ghi chú)
 */
export const updateAppointment = async (id, appointmentData) => {
  const response = await api.put(`/appointments/${id}`, appointmentData);
  return response.data;
};

/**
 * Hủy lịch hẹn
 */
export const cancelAppointment = async (id, reason) => {
  const response = await api.delete(`/appointments/${id}`, {
    params: { reason }
  });
  return response.data;
};

// ============================================================================
// BROKER APIs
// ============================================================================

/**
 * Lấy lịch hẹn của broker theo status
 */
export const getBrokerAppointmentsByStatus = async (status, page = 0, size = 10) => {
  const response = await api.get(`/appointments/broker/status/${status}`, {
    params: { page, size, sortBy: 'scheduledAt', sortDirection: 'ASC' }
  });
  return response.data;
};

/**
 * Lấy lịch hẹn của broker theo ngày
 */
export const getBrokerAppointmentsByDate = async (date) => {
  const response = await api.get('/appointments/broker/date', {
    params: { date }
  });
  return response.data;
};

/**
 * Xác nhận lịch hẹn
 */
export const confirmAppointment = async (id) => {
  const response = await api.put(`/appointments/${id}/confirm`);
  return response.data;
};

/**
 * Từ chối lịch hẹn
 */
export const rejectAppointment = async (id, reason) => {
  const response = await api.patch(`/appointments/${id}/reject`, null, {
    params: { reason }
  });
  return response.data;
};

/**
 * Đánh dấu hoàn tất lịch hẹn
 */
export const completeAppointment = async (id, note) => {
  const response = await api.patch(`/appointments/${id}/complete`, null, {
    params: { note }
  });
  return response.data;
};

// ============================================================================
// ADMIN APIs
// ============================================================================

/**
 * Admin xem tất cả lịch hẹn với filter
 */
export const getAllAppointmentsForAdmin = async (filters = {}, page = 0, size = 20) => {
  const response = await api.get('/appointments/admin/all', {
    params: { ...filters, page, size }
  });
  return response.data;
};

/**
 * Admin xem thống kê lịch hẹn
 */
export const getAppointmentStatistics = async () => {
  const response = await api.get('/appointments/admin/statistics');
  return response.data;
};

// ============================================================================
// NOTIFICATION APIs
// ============================================================================

/**
 * Lấy danh sách thông báo
 */
export const getNotifications = async (page = 0, size = 20) => {
  const response = await api.get('/notifications', {
    params: { page, size }
  });
  return response.data;
};

/**
 * Đếm thông báo chưa đọc
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Xóa thông báo
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

// Export default object để sử dụng như appointmentService.method()
const appointmentService = {
  // Customer
  getMyAppointments,
  getPropertyAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  
  // Broker
  getBrokerAppointmentsByStatus,
  getBrokerAppointmentsByDate,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  
  // Admin
  getAllAppointmentsForAdmin,
  getAppointmentStatistics,
  
  // Notifications
  getNotifications,
  getUnreadCount,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  deleteNotification,
};

export default appointmentService;
