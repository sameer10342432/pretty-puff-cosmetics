import React, { useState } from 'react';
import { Search, Flame, Tag, ShoppingBag, Mail, ArrowRight, Check } from 'lucide-react';
import { BlogPost, BlogCategory } from '../../types/blog';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';

interface BlogSidebarProps {
  categories: BlogCategory[];
  popularPosts: BlogPost[];
  spotlightProduct?: Product;
  activeCategorySlug?: string;
  onSearch?: (query: string) => void;
}

export const BlogSidebar: React.FC<BlogSidebarProps> = ({
  categories,
  popularPosts,
  spotlightProduct,
  activeCategorySlug,
  onSearch,
}) => {
  const { navigateTo, addToCart, showToast } = useShop();
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(sidebarSearch);
    } else {
      navigateTo('blog', { search: sidebarSearch });
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubscribed(true);
    showToast('Thank you for subscribing to the Pretty Puff Beauty Journal!', 'success');
  };

  return (
    <aside id="blog-sidebar" className="space-y-8">
      {/* 1. Search Widget */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
        <h4 className="flex items-center gap-2 font-serif text-base font-bold text-stone-900">
          <Search className="h-4 w-4 text-rose-600" />
          Search Articles
        </h4>
        <form onSubmit={handleSearchSubmit} className="mt-3 flex gap-2">
          <input
            id="sidebar-search-input"
            type="text"
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            placeholder="Search beauty topics..."
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:bg-white focus:outline-hidden"
          />
          <button
            id="sidebar-search-submit-btn"
            type="submit"
            aria-label="Submit search"
            className="flex items-center justify-center rounded-lg bg-stone-900 px-3 py-2 text-white hover:bg-rose-600 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* 2. Popular Reads */}
      {popularPosts.length > 0 && (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
          <h4 className="flex items-center gap-2 font-serif text-base font-bold text-stone-900">
            <Flame className="h-4 w-4 text-rose-600" />
            Trending Stories
          </h4>
          <div className="mt-4 space-y-3.5 divide-y divide-stone-100">
            {popularPosts.map(post => (
              <div
                key={post.id}
                onClick={() => navigateTo('blog-post', { blogSlug: post.slug })}
                className="group flex cursor-pointer gap-3 pt-3 first:pt-0"
              >
                <img
                  src={post.featuredImage}
                  alt={post.featuredImageAlt}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-semibold tracking-wider text-rose-600 uppercase">
                    {post.category}
                  </span>
                  <h5 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-stone-900 group-hover:text-rose-600 transition-colors">
                    {post.title}
                  </h5>
                  <span className="mt-1 text-[10px] text-stone-400">
                    {post.readingTime} min read
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Categories Navigation */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
        <h4 className="flex items-center gap-2 font-serif text-base font-bold text-stone-900">
          <Tag className="h-4 w-4 text-rose-600" />
          Browse Categories
        </h4>
        <ul className="mt-3 space-y-1 text-xs">
          {categories.map(cat => {
            const isActive = activeCategorySlug?.toLowerCase() === cat.slug.toLowerCase();
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => navigateTo('blog', { blogCategory: cat.slug })}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors ${
                    isActive
                      ? 'bg-rose-50 font-semibold text-rose-700'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <span>{cat.name}</span>
                  {typeof cat.count === 'number' && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                      {cat.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 4. Featured Product Spotlight */}
      {spotlightProduct && (
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-linear-to-b from-rose-50/50 to-white p-5 text-center shadow-2xs">
          <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
            Editor&apos;s Pick
          </span>
          <div className="relative mx-auto mt-3 h-36 w-36 overflow-hidden rounded-xl bg-white p-2 shadow-xs">
            <img
              src={spotlightProduct.thumbnail || spotlightProduct.images[0]}
              alt={spotlightProduct.name}
              className="h-full w-full object-contain"
            />
          </div>
          <h5 className="mt-3 font-serif text-sm font-bold text-stone-900">
            {spotlightProduct.name}
          </h5>
          <p className="mt-1 text-xs font-semibold text-rose-600">
            Rs. {spotlightProduct.salePrice || spotlightProduct.price}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              id={`sidebar-add-to-cart-${spotlightProduct.id}`}
              type="button"
              onClick={() => addToCart(spotlightProduct)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-stone-900 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-600"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
            <button
              id={`sidebar-view-product-${spotlightProduct.id}`}
              type="button"
              onClick={() => navigateTo('product', { productSlug: spotlightProduct.slug })}
              className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-2"
            >
              View Product Details
            </button>
          </div>
        </div>
      )}

      {/* 5. Newsletter Signup Box */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 shadow-2xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Mail className="h-5 w-5" />
        </div>
        <h4 className="mt-3 font-serif text-base font-bold text-stone-900">
          Get Beauty Tips in Your Inbox
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          Subscribe for weekly skincare advice, makeup tutorials, and exclusive Pretty Puff offers.
        </p>

        {isSubscribed ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
            <Check className="h-4 w-4 shrink-0" />
            <span>You&apos;re subscribed to Pretty Puff Journal!</span>
          </div>
        ) : (
          <form onSubmit={handleNewsletterSubmit} className="mt-3 space-y-2">
            <input
              id="sidebar-newsletter-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-hidden"
            />
            <button
              id="sidebar-newsletter-submit-btn"
              type="submit"
              className="w-full rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </aside>
  );
};
