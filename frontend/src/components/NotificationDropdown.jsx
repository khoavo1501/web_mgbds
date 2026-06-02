import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock, FileText, Check } from 'lucide-react';
import api from '../services/api';

// Example types: DOCUMENT_REJECTED, DOCUMENT_VERIFIED, PAYMENT_CONFIRMED, PROPERTY_APPROVED, PROPERTY_REJECTED, TRANSACTION_CANCELLED, APPOINTMENT_APPROVED
const getIconForType = (type) => {
  switch (type) {
    case 'DOCUMENT_VERIFIED':
    case 'PAYMENT_CONFIRMED':
    case 'PROPERTY_APPROVED':
    case 'property_approved':
    case 'APPOINTMENT_APPROVED':
    case 'appointment_confirmed':
    case 'appointment_completed':
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
      );
    case 'DOCUMENT_REJECTED':
    case 'PROPERTY_REJECTED':
    case 'property_rejected':
    case 'TRANSACTION_CANCELLED':
    case 'appointment_rejected':
    case 'appointment_cancelled':
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
      );
    case 'appointment_rescheduled':
      return (
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-indigo-600" />
        </div>
      );
    case 'appointment_created':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-slate-600" />
        </div>
      );
  }
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all`);
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
        className="relative p-2.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors"
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
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[1.5rem] premium-shadow border border-slate-100 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-slate-950 text-lg tracking-tight">Thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-gold-600 hover:text-gold-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gold-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Đã đọc tất cả
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600">Bạn chưa có thông báo nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.notificationId} 
                        className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer relative group ${!notif.isRead ? 'bg-emerald-50/30' : ''}`}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.notificationId);
                        }}
                      >
                        {/* Indicator Line cho thông báo chưa đọc */}
                        {!notif.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        )}
                        
                        <div className="mt-0.5">
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-sm tracking-tight ${!notif.isRead ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'}`}>
                            {notif.title}
                          </p>
                          <p className={`text-sm mt-1 line-clamp-2 ${!notif.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-100 bg-gray-50/50 text-center">
                <button 
                  className="text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors py-1.5 px-4 rounded-full hover:bg-slate-200" 
                  onClick={() => setIsOpen(false)}
                >
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
