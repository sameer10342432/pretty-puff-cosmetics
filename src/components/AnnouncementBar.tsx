import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Sparkles } from 'lucide-react';

const ANNOUNCEMENTS = [
  'Free Delivery across Pakistan on Orders Over Rs. 3,000 ✨',
  'Shop Pretty. Feel Beautiful. | 100% Authentic Luxury Cosmetics',
  'Use code "PRETTY10" for 10% Off your first order!',
];

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      aria-label="Store Announcements"
      className="bg-[#1E1E24] text-[#FAF7F5] text-[11px] md:text-xs py-2 px-4 relative z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Quick support */}
        <div className="hidden lg:flex items-center gap-4 text-[#C7B2A2]">
          <a
            href="https://wa.me/923474542881"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp: +92 347 4542881</span>
          </a>
        </div>

        {/* Center: Dynamic Announcement */}
        <div className="flex-1 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
          <span className="transition-opacity duration-500 line-clamp-1">
            {ANNOUNCEMENTS[index]}
          </span>
          <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
        </div>

        {/* Right: Region & Currency */}
        <div className="hidden sm:flex items-center gap-3 text-[#C7B2A2]">
          <span>Pakistan (PKR)</span>
          <span>•</span>
          <a
            href="tel:+923474542881"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>Call Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
