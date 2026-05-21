import { useEffect, useState, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import appointmentService from '../services/appointmentService';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getNotifications(0, 10);
      if (response.success) {
        setNotifications(response.data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await appointmentService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await appointmentService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await appointmentService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await appointmentService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.notificationId !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIconBg = (type, isRead) => {
    if (isRead) {
      return 'bg-gray-700'; // Dark gray for read notifications
    }
    
    switch (type) {
      case 'APPOINTMENT_CREATED':
      case 'APPOINTMENT_UPDATED':
        return 'bg-green-600';
      case 'APPOINTMENT_CONFIRMED':
        return 'bg-blue-700';
      case 'APPOINTMENT_REJECTED':
      case 'APPOINTMENT_CANCELLED':
        return 'bg-red-400';
      case 'APPOINTMENT_COMPLETED':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            fetchNotifications();
          }
        }}
        className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-[480px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-xl font-bold text-gray-900">Thông báo</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1.5 text-sm font-semibold text-green-600 transition hover:text-green-700"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-4 w-4" />
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-16 w-16 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-500">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`group relative border-b border-gray-100 bg-white px-6 py-4 transition hover:bg-gray-50 ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${getNotificationIconBg(notification.type, notification.isRead)}`}>
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-gray-500">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-start gap-1 opacity-0 transition group-hover:opacity-100">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.notificationId)}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-6 py-3 text-center">
              <button className="text-sm font-semibold text-gray-600 transition hover:text-gray-900">
                Xem tất cả hoạt động
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
