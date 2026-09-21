import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const { navigateTo } = useShop();

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs text-[#7A7478] py-4 overflow-x-auto no-scrollbar whitespace-nowrap ${className}`}
    >
      <button
        onClick={() => navigateTo('home')}
        className="flex items-center gap-1 hover:text-[#1E1E24] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-[#C7B2A2] shrink-0" />
          {item.active || !item.onClick ? (
            <span className="text-[#1E1E24] font-medium truncate max-w-[200px] md:max-w-none">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-[#1E1E24] transition-colors truncate max-w-[150px] md:max-w-none"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
