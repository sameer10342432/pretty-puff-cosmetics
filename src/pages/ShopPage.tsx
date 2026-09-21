import React, { useState, useMemo, useEffect } from 'react';
import {
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { Product, SortOption } from '../types';
import { formatPKR } from '../components/PriceDisplay';

export const ShopPage: React.FC = () => {
  const {
    currentCategory,
    currentSubcategory,
    searchQuery,
    navigateTo,
  } = useShop();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    currentSubcategory || 'all'
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyOnSale, setOnlyOnSale] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Sync with context routing params
  useEffect(() => {
    setSelectedCategory(currentCategory || 'all');
    setSelectedSubcategory(currentSubcategory || 'all');
    setVisibleCount(12);
  }, [currentCategory, currentSubcategory, searchQuery]);

  // Current active category object
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    return CATEGORIES.find(c => c.slug === selectedCategory);
  }, [selectedCategory]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (q === 'new') {
        result = result.filter(p => p.isNew);
      } else if (q === 'bestseller') {
        result = result.filter(p => p.isBestSeller);
      } else {
        result = result.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.subcategory.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q)
        );
      }
    }

    // Category
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Subcategory
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      result = result.filter(p => p.subcategory === selectedSubcategory);
    }

    // In Stock
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // On Sale
    if (onlyOnSale) {
      result = result.filter(p => !!p.salePrice);
    }

    // Min Rating
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Price Ranges
    if (selectedPriceRange === 'under-1500') {
      result = result.filter(p => (p.salePrice ?? p.price) < 1500);
    } else if (selectedPriceRange === '1500-2500') {
      result = result.filter(p => {
        const pr = p.salePrice ?? p.price;
        return pr >= 1500 && pr <= 2500;
      });
    } else if (selectedPriceRange === '2500-4000') {
      result = result.filter(p => {
        const pr = p.salePrice ?? p.price;
        return pr > 2500 && pr <= 4000;
      });
    } else if (selectedPriceRange === 'over-4000') {
      result = result.filter(p => (p.salePrice ?? p.price) > 4000);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'highest-rated':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-selling':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    onlyInStock,
    onlyOnSale,
    minRating,
    selectedPriceRange,
    sortBy,
  ]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedPriceRange('all');
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setMinRating(0);
    setSortBy('featured');
    navigateTo('shop');
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all');
    navigateTo('shop', { category: slug === 'all' ? undefined : slug });
  };

  const handleSubcategoryChange = (subSlug: string) => {
    setSelectedSubcategory(subSlug);
    navigateTo('shop', {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      subcategory: subSlug === 'all' ? undefined : subSlug,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: 'Shop',
            onClick: () => handleCategoryChange('all'),
            active: !activeCategoryObj && !searchQuery,
          },
          ...(activeCategoryObj
            ? [
                {
                  label: activeCategoryObj.name,
                  onClick: () => handleCategoryChange(activeCategoryObj.slug),
                  active: selectedSubcategory === 'all' && !searchQuery,
                },
              ]
            : []),
          ...(selectedSubcategory !== 'all'
            ? [
                {
                  label: selectedSubcategory.replace('-', ' '),
                  active: true,
                },
              ]
            : []),
          ...(searchQuery
            ? [
                {
                  label: `Search: "${searchQuery}"`,
                  active: true,
                },
              ]
            : []),
        ]}
      />

      {/* Category / Shop Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#FAF5F2] border border-[#F0E6DE] mb-8 p-6 sm:p-10 lg:p-12">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
            {searchQuery
              ? 'Search Results'
              : activeCategoryObj
              ? 'Curated Category'
              : 'The Full Spectrum'}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1E24] leading-tight mb-3">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : activeCategoryObj
              ? activeCategoryObj.name
              : 'All Beauty & Cosmetics'}
          </h1>

          <p className="text-xs sm:text-sm text-[#686266] leading-relaxed font-sans">
            {searchQuery
              ? `Showing all verified cosmetic formulations matching your query.`
              : activeCategoryObj
              ? activeCategoryObj.description
              : 'Explore our complete array of clean, skin-loving makeup, targeted skincare treatments, and luxury scents.'}
          </p>
        </div>

        {/* Category subcategory pill chips */}
        {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
          <div className="relative z-10 mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#EBE0D7]">
            <button
              onClick={() => handleSubcategoryChange('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedSubcategory === 'all'
                  ? 'bg-[#1E1E24] text-white'
                  : 'bg-white text-[#4A4549] hover:bg-[#F5EFEB] border border-[#E0D5CE]'
              }`}
            >
              All {activeCategoryObj.name}
            </button>
            {activeCategoryObj.subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSubcategoryChange(sub.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  selectedSubcategory === sub.slug
                    ? 'bg-[#1E1E24] text-white'
                    : 'bg-white text-[#4A4549] hover:bg-[#FDF0F2] border border-[#E0D5CE]'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar: Items Count, Mobile Filter Button & Desktop Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#F0E6DE]">
        <div className="text-xs sm:text-sm text-[#7A7478]">
          Showing <strong className="text-[#1E1E24]">{displayedProducts.length}</strong> of{' '}
          <strong className="text-[#1E1E24]">{filteredProducts.length}</strong> products
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E0D5CE] bg-white text-xs font-semibold text-[#1E1E24]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A7478] hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-white rounded-xl border border-[#E0D5CE] text-xs font-medium text-[#1E1E24] focus:outline-hidden focus:border-[#C24560]"
            >
              <option value="featured">Featured Collection</option>
              <option value="best-selling">Best Selling</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="highest-rated">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Shop Body: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-[#F0E6DE]">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5EFEB]">
            <h3 className="font-serif text-lg text-[#1E1E24]">Filter By</h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#C24560] hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* Categories Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3">
              Categories
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-[#FDF0F2] text-[#C24560] font-semibold'
                    : 'text-[#4A4549] hover:bg-[#FAF7F5]'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-[#A8A0A6]">{PRODUCTS.length}</span>
              </button>

              {CATEGORIES.map(cat => {
                const count = PRODUCTS.filter(p => p.category === cat.slug).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-[#FDF0F2] text-[#C24560] font-semibold'
                        : 'text-[#4A4549] hover:bg-[#FAF7F5]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-[#A8A0A6]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-4 border-t border-[#F5EFEB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3">
              Price Range
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under-1500', label: 'Under Rs. 1,500' },
                { id: '1500-2500', label: 'Rs. 1,500 – Rs. 2,500' },
                { id: '2500-4000', label: 'Rs. 2,500 – Rs. 4,000' },
                { id: 'over-4000', label: 'Over Rs. 4,000' },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value={opt.id}
                    checked={selectedPriceRange === opt.id}
                    onChange={() => setSelectedPriceRange(opt.id)}
                    className="accent-[#C24560]"
                  />
                  <span className="text-[#4A4549]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggles: In Stock & Sale */}
          <div className="pt-4 border-t border-[#F5EFEB] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2">
              Availability & Deals
            </h4>
            <label className="flex items-center gap-2 text-xs text-[#4A4549] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={e => setOnlyInStock(e.target.checked)}
                className="accent-[#C24560] rounded"
              />
              <span>In Stock Only</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[#4A4549] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={e => setOnlyOnSale(e.target.checked)}
                className="accent-[#C24560] rounded"
              />
              <span>On Sale / Special Offers</span>
            </label>
          </div>

          {/* Customer Rating Filter */}
          <div className="pt-4 border-t border-[#F5EFEB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2">
              Customer Rating
            </h4>
            <div className="space-y-1 text-xs">
              {[4.8, 4.5, 4.0, 0].map(star => (
                <button
                  key={star}
                  onClick={() => setMinRating(star)}
                  className={`w-full text-left py-1 px-2 rounded-md transition-colors ${
                    minRating === star
                      ? 'bg-[#FDF0F2] text-[#C24560] font-semibold'
                      : 'text-[#4A4549] hover:bg-[#FAF7F5]'
                  }`}
                >
                  {star === 0 ? 'All Ratings' : `${star}★ & Above`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Product Grid Area */}
        <main className="lg:col-span-3">
          <ProductGrid
            products={displayedProducts}
            emptyMessage={
              searchQuery
                ? `No beauty finds matching "${searchQuery}"`
                : 'No beauty finds matching these filters'
            }
            emptySubtitle="Try adjusting your filters, selecting a different category, or resetting all options."
            onResetFilters={handleResetFilters}
          />

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-12 text-center">
              <button
                onClick={() => setVisibleCount(c => c + 8)}
                className="px-8 py-3.5 bg-white hover:bg-[#FAF5F2] border border-[#E0D5CE] text-xs font-semibold uppercase tracking-wider text-[#1E1E24] rounded-full transition-all shadow-xs"
              >
                Load More Products ({filteredProducts.length - displayedProducts.length} remaining)
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6DE]">
              <h3 className="font-serif text-xl text-[#1E1E24]">Filter & Sort</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 text-[#7A7478]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2">
                  Category
                </h4>
                <select
                  value={selectedCategory}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D5CE] text-xs"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2">
                  Price
                </h4>
                <select
                  value={selectedPriceRange}
                  onChange={e => setSelectedPriceRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D5CE] text-xs"
                >
                  <option value="all">All Prices</option>
                  <option value="under-1500">Under Rs. 1,500</option>
                  <option value="1500-2500">Rs. 1,500 – Rs. 2,500</option>
                  <option value="2500-4000">Rs. 2,500 – Rs. 4,000</option>
                  <option value="over-4000">Over Rs. 4,000</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={e => setOnlyInStock(e.target.checked)}
                    className="accent-[#C24560]"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={onlyOnSale}
                    onChange={e => setOnlyOnSale(e.target.checked)}
                    className="accent-[#C24560]"
                  />
                  <span>On Sale</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0E6DE] flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-[#FAF7F5] text-xs font-semibold text-[#1E1E24] rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#1E1E24] text-xs font-semibold text-white rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
