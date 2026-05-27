import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200/50 bg-emerald-50/95';
      case 'error':
        return 'border-rose-200/50 bg-rose-50/95';
      case 'info':
      default:
        return 'border-blue-200/50 bg-blue-50/95';
    }
  };

  return (
    <ToastContext.Provider value={{ 
        showToast, 
        success: (m) => showToast(m, 'success'), 
        error: (m) => showToast(m, 'error'), 
        info: (m) => showToast(m, 'info') 
    }}>
      {children}
      <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-4 w-96 p-5 rounded-[1.5rem] border backdrop-blur-2xl shadow-2xl shadow-black/5 ${getStyles(toast.type)}`}
            >
              <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-[10px] uppercase font-black tracking-widest mb-1 ${
                  toast.type === 'success' ? 'text-emerald-700' :
                  toast.type === 'error' ? 'text-rose-700' : 'text-blue-700'
                }`}>
                  {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Có lỗi xảy ra' : 'Thông báo'}
                </h4>
                <p className="text-sm font-bold text-slate-900 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-900 transition-colors p-1.5 -m-1.5 rounded-xl hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
