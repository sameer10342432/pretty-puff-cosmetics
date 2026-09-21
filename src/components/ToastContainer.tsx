import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/98 text-[#1E1E24] shadow-xl border border-[#F0E6DE] text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && (
              <CheckCircle className="w-4 h-4 text-[#258237] shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-[#C24560] shrink-0" />
            )}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#3A6073] shrink-0" />}
            <span className="line-clamp-2">{toast.message}</span>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-[#8C868A] hover:text-[#1E1E24] shrink-0"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
