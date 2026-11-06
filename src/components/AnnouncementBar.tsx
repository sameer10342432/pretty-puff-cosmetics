import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Sparkles, Globe } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AnnouncementBar: React.FC = () => {
  const { selectedCountry, selectedCurrency, setIsCountryModalOpen, formatPrice } = useShop();
  const [index, setIndex] = useState(0);

  const announcements = [
    `Worldwide Tracked Delivery | Free on Orders Over ${formatPrice(50)} ✨`,
    'Shop Pretty. Feel Beautiful. | 100% Authentic Luxury Cosmetics',
    'Official CJdropshipping Live Global Fulfillment',
    'Use code "PRETTY10" for 10% Off your first order!',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  return (
    <aside
      aria-label="Store Announcements"
      className="bg-[#1E1E24] text-[#FAF7F5] text-[11px] md:text-xs py-2 px-4 relative z-40 border-b border-white/5"
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
            {announcements[index]}
          </span>
          <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
        </div>

        {/* Right: Region & Currency Selector */}
        <div className="flex items-center gap-3 text-[#C7B2A2]">
          <button
            onClick={() => setIsCountryModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-0.5 px-2 rounded-md hover:bg-white/10"
            title="Change country and currency"
          >
            <span className="text-sm">{selectedCountry?.flag || '🇺🇸'}</span>
            <span className="font-semibold text-white">{selectedCountry?.name || 'United States'}</span>
            <span className="text-gray-400 font-mono text-[10px]">({selectedCurrency})</span>
            <Globe className="w-3 h-3 ml-0.5 text-gray-400" />
          </button>
          <span className="hidden sm:inline">•</span>
          <a
            href="tel:+923474542881"
            className="hidden sm:flex items-center gap-1 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
