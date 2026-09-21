import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className = '' }) => {
  const { navigateTo } = useShop();

  const handleClick = () => {
    navigateTo('shop', { category: category.slug });
  };

  return (
    <div
      id={`category-card-${category.id}`}
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl bg-[#F5ECE5] aspect-[4/5] cursor-pointer shadow-xs border border-[#EBE0D7]/60 hover:shadow-lg transition-all duration-500 ${className}`}
    >
      {/* Background Image */}
      <img
        src={category.image}
        alt={category.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
      />

      {/* Gentle gradient overlay for high contrast text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/85 transition-colors duration-300" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end text-white z-10">
        <span className="text-[11px] uppercase tracking-widest text-[#F8CAD1] font-medium mb-1">
          {category.subcategories.length} Subcategories
        </span>
        <h3 className="font-serif text-2xl lg:text-3xl text-white font-medium leading-tight mb-2">
          {category.name}
        </h3>
        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed mb-4 font-sans font-light">
          {category.description}
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white group-hover:text-[#F8CAD1] transition-colors">
          <span>Shop Now</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
        </div>
      </div>
    </div>
  );
};
