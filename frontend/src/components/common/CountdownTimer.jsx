import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Component đếm ngược thời gian
 * @param {Date|string} expiredAt - Thời điểm hết hạn
 * @param {function} onExpired - Callback khi hết hạn
 * @param {string} variant - 'default' | 'compact' | 'badge'
 */
const CountdownTimer = ({ expiredAt, onExpired, variant = 'default' }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiredAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiredAt);
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (onExpired) onExpired();
        return null;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, total: difference };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiredAt, onExpired]);

  if (!expiredAt) return null;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-medium">
        <AlertCircle className="w-5 h-5" />
        <span>Đã hết hạn</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  // Determine urgency level
  const isUrgent = timeLeft.total < 3 * 60 * 60 * 1000; // < 3 hours
  const isCritical = timeLeft.total < 1 * 60 * 60 * 1000; // < 1 hour

  const colorClass = isCritical 
    ? 'text-red-600 bg-red-50 border-red-200' 
    : isUrgent 
    ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-blue-600 bg-blue-50 border-blue-200';

  // Compact variant (for cards)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium ${colorClass}`}>
        <Clock className="w-4 h-4" />
        <span>
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  // Badge variant (minimal)
  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Clock className="w-3 h-3" />
        {timeLeft.hours}:{String(timeLeft.minutes).padStart(2, '0')}
      </span>
    );
  }

  // Default variant (full display)
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${colorClass}`}>
      <Clock className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">
          {isCritical ? '⚠️ Sắp hết hạn!' : isUrgent ? '⏰ Còn ít thời gian' : '⏱️ Thời gian còn lại'}
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-xs font-normal">giờ</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-xs font-normal">phút</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-xs font-normal">giây</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
