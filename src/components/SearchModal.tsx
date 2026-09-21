import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { formatPKR } from './PriceDisplay';

const POPULAR_SEARCHES = [
  'Foundation',
  'Vitamin C',
  'Rose Blush',
  'Lip Gloss',
  'Sunscreen',
  'Beauty Blender',
  'Perfume',
  'Hair Serum',
];

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, navigateTo } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const trimmed = searchTerm.trim().toLowerCase();
  const filteredProducts = trimmed
    ? PRODUCTS.filter(
        p =>
          p.name.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed) ||
          p.subcategory.toLowerCase().includes(trimmed) ||
          p.brand.toLowerCase().includes(trimmed) ||
          p.shortDescription.toLowerCase().includes(trimmed)
      ).slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearchModalOpen(false);
    navigateTo('shop', { search: searchTerm.trim() });
  };

  const handleSelectPopular = (tag: string) => {
    setIsSearchModalOpen(false);
    navigateTo('shop', { search: tag });
  };

  const handleSelectProduct = (slug: string) => {
    setIsSearchModalOpen(false);
    navigateTo('product', { productSlug: slug });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSearchModalOpen(false)}
      />

      <div className="min-h-screen px-4 text-center flex items-start justify-center pt-16 sm:pt-24 pb-12">
        <div className="inline-block w-full max-w-2xl bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all relative z-10 border border-[#F0E6DE]">
          {/* Search Header Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-4 sm:p-6 border-b border-[#F0E6DE] flex items-center gap-3 bg-[#FCFAF8]"
          >
            <Search className="w-6 h-6 text-[#C24560] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by product, category, shade or ingredient..."
              className="flex-1 bg-transparent text-base sm:text-lg text-[#1E1E24] placeholder-[#A8A0A6] focus:outline-hidden font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-[#8C868A] hover:text-[#1E1E24]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Body Content */}
          <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto">
            {/* Live Search Results if typing */}
            {searchTerm.trim() ? (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#8C868A] mb-4">
                  <span>Found {filteredProducts.length} Quick Results</span>
                  <button
                    onClick={handleSearchSubmit}
                    className="text-[#C24560] hover:underline flex items-center gap-1"
                  >
                    <span>View all matching products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-[#7A7478]">
                    <p className="text-base font-serif text-[#1E1E24] mb-1">
                      No beauty finds matching "{searchTerm}"
                    </p>
                    <p className="text-xs">
                      Try searching with broader terms like "blush", "serum", or "matte".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF5F2] cursor-pointer transition-colors border border-transparent hover:border-[#F0E6DE]"
                      >
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-14 h-14 rounded-lg object-cover bg-[#F5EFEB] shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-[#C24560] font-semibold">
                            {product.category}
                          </span>
                          <h4 className="text-xs font-medium text-[#1E1E24] truncate">
                            {product.name}
                          </h4>
                          <span className="text-xs font-bold text-[#1E1E24]">
                            {formatPKR(product.salePrice ?? product.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Popular suggestions when empty */
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleSelectPopular(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF5F2] hover:bg-[#FDF0F2] text-[#4A4549] hover:text-[#C24560] border border-[#F0E6DE] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3">
                    Browse Popular Categories
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.slice(0, 4).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setIsSearchModalOpen(false);
                          navigateTo('shop', { category: cat.slug });
                        }}
                        className="p-3 text-center rounded-xl bg-[#FAF7F5] hover:bg-[#FDF0F2] text-xs font-medium text-[#1E1E24] hover:text-[#C24560] border border-[#F0E6DE] transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
