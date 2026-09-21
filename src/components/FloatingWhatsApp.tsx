import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 select-none">
      {/* Tooltip Card */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 py-2 px-3 bg-white text-[#1E1E24] rounded-2xl shadow-xl border border-[#F0E6DE] text-xs animate-in fade-in slide-in-from-right-2">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span className="font-medium">Chat with Pretty Puff</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="p-1 text-[#8C868A] hover:text-[#1E1E24]"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        id="floating-whatsapp-btn"
        href="https://wa.me/923474542881"
        target="_blank"
        rel="noopener noreferrer"
        className="w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative group"
        aria-label="Chat with Pretty Puff on WhatsApp (+923474542881)"
        title="Chat with Pretty Puff (+92 347 4542881)"
      >
        <MessageCircle className="w-7 h-7 fill-white/20 text-white" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
      </a>
    </div>
  );
};
