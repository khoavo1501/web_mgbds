import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, type = "info" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    info: "bg-blue-50 text-blue-900 border-blue-200",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
    error: "bg-red-50 text-red-900 border-red-200",
    success: "bg-green-50 text-green-900 border-green-200",
  };

  const iconStyles = {
    info: "bg-blue-100 text-blue-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
    success: "bg-green-100 text-green-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className={`flex items-center justify-between rounded-t-2xl border-b px-6 py-4 ${typeStyles[type]}`}>
            <h3 className="text-lg font-extrabold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 transition hover:bg-black/5"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
