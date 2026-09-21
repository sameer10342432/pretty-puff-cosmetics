import React from 'react';
import { Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  emptySubtitle?: string;
  onResetFilters?: () => void;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No beauty finds here yet.',
  emptySubtitle = 'Try adjusting your filters, selecting a different category, or exploring our best sellers.',
  onResetFilters,
  className = '',
}) => {
  if (products.length === 0) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl bg-white border border-[#F0E6DE] max-w-lg mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-2xl text-[#1E1E24] mb-2">{emptyMessage}</h3>
        <p className="text-sm text-[#7A7478] leading-relaxed mb-6 font-sans">
          {emptySubtitle}
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-6 py-2.5 bg-[#1E1E24] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#C24560] transition-colors"
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 ${className}`}
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
