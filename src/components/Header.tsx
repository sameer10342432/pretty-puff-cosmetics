import React, { useState, useEffect } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { useShop } from '../context/ShopContext';

export const Header: React.FC = () => {
  const {
    navigateTo,
    currentPage,
    currentCategory,
    cartCount,
    wishlist,
    setIsCartDrawerOpen,
    setIsSearchModalOpen,
    showToast,
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccountClick = () => {
    navigateTo('admin');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FCFAF8]/95 backdrop-blur-md shadow-xs border-b border-[#EBE0D7]'
            : 'bg-[#FCFAF8] border-b border-[#F0E6DE]'
        }`}
      >
        {/* Main Desktop & Mobile Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile: Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                id="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-[#1E1E24] hover:text-[#C24560] transition-colors focus:outline-hidden"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo / Brand Name */}
            <div className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start">
              <button
                onClick={() => navigateTo('home')}
                className="group flex flex-col items-center lg:items-start text-left focus:outline-hidden"
              >
                <span className="font-serif text-2xl sm:text-3xl tracking-wide text-[#1E1E24] font-normal group-hover:text-[#C24560] transition-colors flex items-center gap-1.5">
                  Pretty Puff
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C24560] inline-block -mt-3" />
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#8C868A] -mt-1 font-sans hidden sm:block">
                  Luxury Cosmetics
                </span>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-5 xl:space-x-7 text-xs uppercase tracking-wider font-semibold text-[#4A4549]">
              <button
                onClick={() => navigateTo('home')}
                className={`py-2 hover:text-[#C24560] transition-colors ${
                  currentPage === 'home' ? 'text-[#C24560] border-b-2 border-[#C24560]' : ''
                }`}
              >
                Home
              </button>

              <button
                onClick={() => navigateTo('shop')}
                className={`py-2 hover:text-[#C24560] transition-colors ${
                  currentPage === 'shop' && !currentCategory
                    ? 'text-[#C24560] border-b-2 border-[#C24560]'
                    : ''
                }`}
              >
                Shop All
              </button>

              {/* Category Links with Hover Flyouts */}
              {CATEGORIES.slice(0, 6).map(cat => {
                const isActive = currentPage === 'shop' && currentCategory === cat.slug;
                return (
                  <div
                    key={cat.id}
                    className="relative group"
                    onMouseEnter={() => setActiveDropdown(cat.id)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      onClick={() => navigateTo('shop', { category: cat.slug })}
                      className={`flex items-center gap-1 py-2 hover:text-[#C24560] transition-colors ${
                        isActive ? 'text-[#C24560] border-b-2 border-[#C24560]' : ''
                      }`}
                    >
                      <span>{cat.name}</span>
                      <ChevronDown className="w-3 h-3 text-[#A89E9A] group-hover:rotate-180 transition-transform duration-200" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === cat.id && (
                      <div className="absolute top-full left-0 mt-0 w-64 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-[#F0E6DE] py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="pb-2 mb-2 border-b border-[#F5EFEB] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#C24560] tracking-widest uppercase">
                            {cat.name} Subcategories
                          </span>
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              navigateTo('shop', { category: cat.slug });
                            }}
                            className="text-[10px] text-[#7A7478] hover:text-[#1E1E24]"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {cat.subcategories.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveDropdown(null);
                                navigateTo('shop', {
                                  category: cat.slug,
                                  subcategory: sub.slug,
                                });
                              }}
                              className="text-left py-1.5 px-2 rounded-md text-xs font-normal capitalize text-[#4A4549] hover:bg-[#FDF0F2] hover:text-[#C24560] transition-colors"
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* More Categories Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown('more')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 py-2 hover:text-[#C24560] transition-colors text-[#7A7478]">
                  <span>More</span>
                  <ChevronDown className="w-3 h-3 text-[#A89E9A] group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {activeDropdown === 'more' && (
                  <div className="absolute top-full right-0 mt-0 w-72 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-[#F0E6DE] p-4 z-50">
                    <div className="text-[10px] font-bold text-[#C24560] tracking-widest uppercase pb-2 mb-2 border-b border-[#F5EFEB]">
                      More Beauty Categories
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.slice(6).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setActiveDropdown(null);
                            navigateTo('shop', { category: cat.slug });
                          }}
                          className="text-left p-2 rounded-lg text-xs font-medium text-[#4A4549] hover:bg-[#FDF0F2] hover:text-[#C24560] transition-colors"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                id="header-nav-blog"
                onClick={() => navigateTo('blog')}
                className={`py-2 hover:text-[#C24560] transition-colors flex items-center gap-1 ${
                  currentPage === 'blog' || currentPage === 'blog-post'
                    ? 'text-[#C24560] border-b-2 border-[#C24560]'
                    : ''
                }`}
              >
                <span>Beauty Journal</span>
                <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-600 lowercase tracking-normal">
                  new
                </span>
              </button>
            </nav>

            {/* Right Action Icons: Search, Account, Wishlist, Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search */}
              <button
                id="header-search-btn"
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 text-[#4A4549] hover:text-[#C24560] transition-colors focus:outline-hidden"
                aria-label="Search products"
                title="Search products"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <button
                id="header-account-btn"
                onClick={handleAccountClick}
                className="hidden sm:block p-2 text-[#4A4549] hover:text-[#C24560] transition-colors focus:outline-hidden"
                aria-label="My Account"
                title="My Account"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <button
                id="header-wishlist-btn"
                onClick={() => navigateTo('wishlist')}
                className="relative p-2 text-[#4A4549] hover:text-[#C24560] transition-colors focus:outline-hidden"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C24560] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Shopping Bag / Cart */}
              <button
                id="header-cart-btn"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 text-[#1E1E24] hover:text-[#C24560] transition-colors focus:outline-hidden"
                aria-label={`Shopping bag with ${cartCount} items`}
                title="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#1E1E24] text-[#FAF7F5] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Category Sub-strip on Desktop for fast browsing */}
        <div className="hidden lg:block bg-[#FAF7F5] border-t border-[#F0E6DE]/60 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] text-[#6E686C]">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <span className="font-semibold text-[#C24560] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Explore:
              </span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigateTo('shop', { category: cat.slug })}
                  className="hover:text-[#1E1E24] transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigateTo('shop', { search: 'bestseller' })}
              className="text-[#C24560] font-semibold hover:underline shrink-0 ml-4"
            >
              Trending Right Now
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-[#FCFAF8] h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#F0E6DE] flex items-center justify-between bg-white">
              <div>
                <div className="font-serif text-xl text-[#1E1E24]">Pretty Puff</div>
                <div className="text-[10px] uppercase tracking-widest text-[#8C868A]">
                  Luxury Beauty
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[#7A7478] hover:text-[#1E1E24]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Quick Links */}
            <div className="p-4 border-b border-[#F0E6DE] bg-[#FAF7F5] flex items-center justify-around text-xs">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('shop');
                }}
                className="text-center font-medium text-[#1E1E24]"
              >
                Shop All
              </button>
              <span className="text-[#C7B2A2]">|</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('blog');
                }}
                className="text-center font-semibold text-[#C24560] flex items-center gap-1"
              >
                <span>Journal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C24560]" />
              </button>
              <span className="text-[#C7B2A2]">|</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('wishlist');
                }}
                className="text-center font-medium text-[#1E1E24]"
              >
                Wishlist ({wishlist.length})
              </button>
              <span className="text-[#C7B2A2]">|</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleAccountClick();
                }}
                className="text-center font-medium text-[#1E1E24]"
              >
                Account
              </button>
            </div>

            {/* Categories List with Accordion */}
            <div className="flex-1 py-3 px-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-[#8C868A] uppercase tracking-wider">
                Categories
              </div>

              {CATEGORIES.map(cat => {
                const isExpanded = mobileExpandedCategory === cat.id;
                return (
                  <div key={cat.id} className="rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F5EFEB] rounded-lg">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigateTo('shop', { category: cat.slug });
                        }}
                        className="text-sm font-medium text-[#1E1E24] text-left flex-1"
                      >
                        {cat.name}
                      </button>
                      <button
                        onClick={() =>
                          setMobileExpandedCategory(isExpanded ? null : cat.id)
                        }
                        className="p-1 text-[#7A7478]"
                        aria-label="Expand category"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#C24560]' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#FAF5F2] pl-6 pr-3 py-2 space-y-1.5 border-l-2 border-[#C24560] ml-3">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigateTo('shop', { category: cat.slug });
                          }}
                          className="block text-xs font-semibold text-[#C24560] py-1"
                        >
                          All {cat.name} →
                        </button>
                        {cat.subcategories.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigateTo('shop', {
                                category: cat.slug,
                                subcategory: sub.slug,
                              });
                            }}
                            className="block w-full text-left text-xs text-[#4A4549] hover:text-[#C24560] py-1"
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 border-t border-[#F0E6DE] mt-4 px-3 space-y-2 text-xs font-medium text-[#6E686C]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('blog');
                  }}
                  className="block w-full text-left py-1 text-[#C24560] font-semibold"
                >
                  Beauty Journal & Tips
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('about');
                  }}
                  className="block w-full text-left py-1 hover:text-[#1E1E24]"
                >
                  About Pretty Puff
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('contact');
                  }}
                  className="block w-full text-left py-1 hover:text-[#1E1E24]"
                >
                  Contact & Support
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('faq');
                  }}
                  className="block w-full text-left py-1 hover:text-[#1E1E24]"
                >
                  Frequently Asked Questions
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('shipping');
                  }}
                  className="block w-full text-left py-1 hover:text-[#1E1E24]"
                >
                  Shipping & Delivery
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('returns');
                  }}
                  className="block w-full text-left py-1 hover:text-[#1E1E24]"
                >
                  Returns & Refund Policy
                </button>
              </div>
            </div>

            {/* Mobile Drawer Footer: Direct WhatsApp link */}
            <div className="p-4 border-t border-[#F0E6DE] bg-white">
              <a
                href="https://wa.me/923474542881"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <span>WhatsApp Us: +92 347 4542881</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
