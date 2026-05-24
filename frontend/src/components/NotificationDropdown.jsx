import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock, FileText, Check } from 'lucide-react';

// Example types: DOCUMENT_REJECTED, DOCUMENT_VERIFIED, PAYMENT_CONFIRMED, PROPERTY_APPROVED, PROPERTY_REJECTED, TRANSACTION_CANCELLED, APPOINTMENT_APPROVED
const getIconForType = (type) => {
  switch (type) {
    case 'DOCUMENT_VERIFIED':
    case 'PAYMENT_CONFIRMED':
    case 'PROPERTY_APPROVED':
    case 'APPOINTMENT_APPROVED':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'DOCUMENT_REJECTED':
    case 'PROPERTY_REJECTED':
    case 'TRANSACTION_CANCELLED':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-blue-500" />;
  }
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // In a real app, you might want to poll or use WebSocket here
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8080/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Đánh dấu đã đọc
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Bell className="w-10 h-10 text-gray-300 mb-2" />
                    <p>Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.notificationId} 
                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.notificationId);
                        }}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t bg-gray-50 text-center">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800" onClick={() => setIsOpen(false)}>
                  Đóng
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
