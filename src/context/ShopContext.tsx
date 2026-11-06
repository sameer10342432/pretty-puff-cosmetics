import React, { createContext, useContext, useEffect, useState } from 'react';
import { blogService } from '../services/blogService';
import { CartItem, NavigationPage, Product } from '../types';
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY, getCountryByCode } from '../data/countries';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface ShippingMethodQuote {
  logisticName: string;
  logisticAging: string;
  priceUsd: number;
}

interface ShopContextType {
  // Navigation
  currentPage: NavigationPage;
  currentCategory: string | null;
  currentSubcategory: string | null;
  currentProductSlug: string | null;
  currentBlogCategory: string | null;
  currentBlogSlug: string | null;
  searchQuery: string;
  navigateTo: (
    page: NavigationPage,
    params?: {
      category?: string | null;
      subcategory?: string | null;
      productSlug?: string | null;
      blogCategory?: string | null;
      blogSlug?: string | null;
      search?: string;
    }
  ) => void;

  // Country & Multi-Currency Engine
  selectedCountry: CountryInfo;
  selectedCurrency: string;
  exchangeRates: Record<string, number>;
  isCountryModalOpen: boolean;
  setIsCountryModalOpen: (open: boolean) => void;
  setCountry: (countryCode: string) => void;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (amountInUsd: number | undefined | null, overrideCurrency?: string) => string;
  convertFromUsd: (amountInUsd: number, overrideCurrency?: string) => number;
  detectedCountry: CountryInfo | null;
  showCountryConfirm: boolean;
  dismissCountryConfirm: () => void;

  // Live Shipping / Freight Engine (CJdropshipping)
  shippingMethods: ShippingMethodQuote[];
  selectedShippingMethod: ShippingMethodQuote | null;
  setSelectedShippingMethod: (method: ShippingMethodQuote | null) => void;
  isLoadingShipping: boolean;
  shippingError: string | null;
  fetchLiveShipping: (destinationCountry?: string, zip?: string) => Promise<ShippingMethodQuote[]>;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariant?: string,
    selectedColour?: string,
    selectedSize?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number; // Base USD
  shippingCost: number; // Base USD
  discountAmount: number; // Base USD
  couponCode: string;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cartTotal: number; // Base USD
  freeShippingThreshold: number; // Base USD ($50)
  amountNeededForFreeShipping: number; // Base USD
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveWishlistToCart: (product: Product) => void;

  // Recently Viewed
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  recordRecentlyViewed: (product: Product) => void;

  // Modals
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Authoritative Base Thresholds in USD
const FREE_SHIPPING_THRESHOLD_USD = 50.0;
const STANDARD_SHIPPING_FEE_USD = 4.99;

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    if (typeof window !== 'undefined') {
      let path = window.location.pathname.toLowerCase();
      if (path.startsWith('/pretty-puff-cosmetics')) {
        path = path.slice('/pretty-puff-cosmetics'.length);
      }
      if (!path.startsWith('/')) path = '/' + path;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/product/')) return 'product';
      if (path === '/shop') return 'shop';
      if (path === '/cart') return 'cart';
      if (path === '/wishlist') return 'wishlist';
      if (path === '/about') return 'about';
      if (path === '/contact') return 'contact';
      if (path === '/faq') return 'faq';
      if (path === '/shipping') return 'shipping';
      if (path === '/returns') return 'returns';
      if (path === '/privacy') return 'privacy';
      if (path === '/terms') return 'terms';
      if (path.startsWith('/blog/')) return 'blog-post';
      if (path === '/blog') return 'blog';
    }
    return 'home';
  });
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  const [currentProductSlug, setCurrentProductSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      let path = window.location.pathname.toLowerCase();
      if (path.startsWith('/pretty-puff-cosmetics')) {
        path = path.slice('/pretty-puff-cosmetics'.length);
      }
      if (!path.startsWith('/')) path = '/' + path;
      if (path.startsWith('/product/')) {
        return path.replace('/product/', '').split('/')[0] || null;
      }
    }
    return null;
  });
  const [currentBlogCategory, setCurrentBlogCategory] = useState<string | null>('all');
  const [currentBlogSlug, setCurrentBlogSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Country & Currency State
  const [selectedCountry, setSelectedCountryState] = useState<CountryInfo>(() => {
    try {
      const savedCode = localStorage.getItem('pretty_puff_country');
      if (savedCode) return getCountryByCode(savedCode);
    } catch {}
    return DEFAULT_COUNTRY;
  });

  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(() => {
    try {
      const savedCurr = localStorage.getItem('pretty_puff_currency');
      if (savedCurr) return savedCurr.toUpperCase();
    } catch {}
    return selectedCountry?.currency || 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1.0,
    PKR: 280.0,
    GBP: 0.785,
    EUR: 0.922,
    AED: 3.673,
    SAR: 3.751,
    CAD: 1.365,
    AUD: 1.524,
  });

  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [showCountryConfirm, setShowCountryConfirm] = useState(false);

  // Live Shipping State
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodQuote[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethodQuote | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pretty_puff_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State (Persisted in localStorage)
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('pretty_puff_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recently Viewed (Persisted in localStorage)
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('pretty_puff_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Discount
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 1. Initial Load: Fetch Live Rates & Geolocation
  useEffect(() => {
    let isMounted = true;

    // Load Exchange Rates
    api.currency
      .getRates()
      .then(res => {
        if (isMounted && res.success && res.rates) {
          setExchangeRates(prev => ({ ...prev, ...res.rates }));
        }
      })
      .catch(() => {});

    // Detect Client Country if not manually chosen before
    const hasManualCountry = Boolean(localStorage.getItem('pretty_puff_country'));
    if (!hasManualCountry) {
      api.geo
        .detect()
        .then(res => {
          if (isMounted && res.success && res.country) {
            setDetectedCountry(res.country);
            if (res.detected && res.country.code !== selectedCountry.code) {
              setShowCountryConfirm(true);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Country & Currency Setters
  const setCountry = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    setSelectedCountryState(country);
    setSelectedCurrencyState(country.currency);
    try {
      localStorage.setItem('pretty_puff_country', country.code);
      localStorage.setItem('pretty_puff_currency', country.currency);
    } catch {}
    setShowCountryConfirm(false);
    // Reset shipping method for new country
    setSelectedShippingMethod(null);
  };

  const setCurrency = (currencyCode: string) => {
    const curr = currencyCode.toUpperCase().trim();
    setSelectedCurrencyState(curr);
    try {
      localStorage.setItem('pretty_puff_currency', curr);
    } catch {}
  };

  const dismissCountryConfirm = () => {
    setShowCountryConfirm(false);
  };

  const formatPrice = (amountInUsd: number | undefined | null, overrideCurrency?: string): string => {
    return formatCurrency(amountInUsd, overrideCurrency || selectedCurrency, exchangeRates);
  };

  const convertFromUsd = (amountInUsd: number, overrideCurrency?: string): number => {
    return convertCurrency(amountInUsd, overrideCurrency || selectedCurrency, exchangeRates);
  };

  // Live Shipping Freight Quote Fetcher
  const fetchLiveShipping = async (destinationCountry?: string, zip?: string): Promise<ShippingMethodQuote[]> => {
    const endCountry = destinationCountry || selectedCountry.code;
    if (cart.length === 0) {
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      return [];
    }

    setIsLoadingShipping(true);
    setShippingError(null);

    // Prepare products payload for CJ freight API
    const productsPayload = cart.map(item => ({
      quantity: item.quantity,
      vid: (item.product as any).cjProductId || undefined,
      sku: item.product.sku,
      weight: 0.1,
    }));

    try {
      const res = await api.cjdropshipping.calculateFreight({
        endCountryCode: endCountry,
        zip: zip || '',
        products: productsPayload,
      });

      if (res.success && res.shippingAvailable && Array.isArray(res.methods) && res.methods.length > 0) {
        setShippingMethods(res.methods);
        setSelectedShippingMethod(res.methods[0]);
        return res.methods;
      } else {
        setShippingMethods([]);
        setSelectedShippingMethod(null);
        setShippingError(res.message || `No direct shipping methods found for ${endCountry}.`);
        return [];
      }
    } catch (err: any) {
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      setShippingError(err.message || 'Could not fetch live shipping quotes.');
      return [];
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Re-fetch shipping when cart or country changes
  useEffect(() => {
    if (cart.length > 0) {
      fetchLiveShipping(selectedCountry.code).catch(() => {});
    } else {
      setShippingMethods([]);
      setSelectedShippingMethod(null);
    }
  }, [selectedCountry.code, cart.length]);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('pretty_puff_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Error saving cart to localStorage', e);
    }
  }, [cart]);

  // Save Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('pretty_puff_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Error saving wishlist to localStorage', e);
    }
  }, [wishlist]);

  // Save Recently Viewed to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('pretty_puff_recent', JSON.stringify(recentlyViewed));
    } catch (e) {
      console.warn('Error saving recently viewed to localStorage', e);
    }
  }, [recentlyViewed]);

  // URL Parsing on initial load & popstate
  useEffect(() => {
    const handleLocation = () => {
      let path = window.location.pathname.toLowerCase();
      if (path.startsWith('/pretty-puff-cosmetics')) {
        path = path.slice('/pretty-puff-cosmetics'.length);
      }
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      if (path === '/' || path === '') {
        setCurrentPage('home');
      } else if (path.startsWith('/admin')) {
        setCurrentPage('admin');
      } else if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '').split('/')[0];
        setCurrentPage('product');
        setCurrentProductSlug(slug);
      } else if (path === '/shop') {
        setCurrentPage('shop');
        setCurrentCategory(null);
        setCurrentSubcategory(null);
      } else if (path === '/cart') {
        setCurrentPage('cart');
      } else if (path === '/wishlist') {
        setCurrentPage('wishlist');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/contact') {
        setCurrentPage('contact');
      } else if (path === '/faq') {
        setCurrentPage('faq');
      } else if (path === '/shipping') {
        setCurrentPage('shipping');
      } else if (path === '/returns') {
        setCurrentPage('returns');
      } else if (path === '/privacy') {
        setCurrentPage('privacy');
      } else if (path === '/terms') {
        setCurrentPage('terms');
      } else if (path === '/blog') {
        setCurrentPage('blog');
        setCurrentBlogCategory('all');
        setCurrentBlogSlug(null);
      } else if (path.startsWith('/blog/')) {
        const sub = path.replace('/blog/', '').split('/')[0];
        const post = blogService.getPostBySlug(sub);
        if (post) {
          setCurrentPage('blog-post');
          setCurrentBlogSlug(sub);
        } else {
          setCurrentPage('blog');
          setCurrentBlogCategory(sub || 'all');
          setCurrentBlogSlug(null);
        }
      } else {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 1) {
          setCurrentPage('shop');
          setCurrentCategory(parts[0]);
          setCurrentSubcategory(null);
        } else if (parts.length === 2) {
          setCurrentPage('shop');
          setCurrentCategory(parts[0]);
          setCurrentSubcategory(parts[1]);
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const navigateTo = (
    page: NavigationPage,
    params?: {
      category?: string | null;
      subcategory?: string | null;
      productSlug?: string | null;
      blogCategory?: string | null;
      blogSlug?: string | null;
      search?: string;
    }
  ) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let url = '/';
    if (page === 'home') {
      url = '/';
      setCurrentCategory(null);
      setCurrentSubcategory(null);
    } else if (page === 'shop') {
      if (params?.subcategory && params?.category) {
        url = `/${params.category}/${params.subcategory}`;
        setCurrentCategory(params.category);
        setCurrentSubcategory(params.subcategory);
      } else if (params?.category) {
        url = `/${params.category}`;
        setCurrentCategory(params.category);
        setCurrentSubcategory(null);
      } else {
        url = '/shop';
        setCurrentCategory(params?.category || null);
        setCurrentSubcategory(null);
      }
      if (params?.search !== undefined) {
        setSearchQuery(params.search);
      }
    } else if (page === 'product' && params?.productSlug) {
      url = `/product/${params.productSlug}`;
      setCurrentProductSlug(params.productSlug);
    } else if (page === 'blog') {
      if (params?.blogCategory && params.blogCategory !== 'all') {
        url = `/blog/${params.blogCategory}`;
        setCurrentBlogCategory(params.blogCategory);
      } else {
        url = '/blog';
        setCurrentBlogCategory('all');
      }
      setCurrentBlogSlug(null);
    } else if (page === 'blog-post' && params?.blogSlug) {
      url = `/blog/${params.blogSlug}`;
      setCurrentBlogSlug(params.blogSlug);
    } else {
      url = `/${page}`;
    }

    const basePath = window.location.pathname.startsWith('/pretty-puff-cosmetics') ? '/pretty-puff-cosmetics' : '';
    try {
      window.history.pushState({}, '', `${basePath}${url}`);
    } catch {}
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cart Operations
  const addToCart = (
    product: Product,
    quantity = 1,
    selectedVariant?: string,
    selectedColour?: string,
    selectedSize?: string
  ) => {
    const cartItemId = `${product.id}-${selectedVariant || 'default'}-${selectedColour || 'default'}-${selectedSize || 'default'}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedVariant,
          selectedColour,
          selectedSize,
        },
      ];
    });

    showToast(`Added ${quantity} × ${product.name} to bag!`, 'success');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast('Item removed from bag', 'info');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Operations
  const toggleWishlist = (product: Product) => {
    if (!product || !product.id) return;
    setWishlist(prev => {
      const safePrev = Array.isArray(prev) ? prev.filter(item => item && item.id) : [];
      const exists = safePrev.some(item => item.id === product.id);
      if (exists) {
        showToast(`Removed from your wishlist`, 'info');
        return safePrev.filter(item => item.id !== product.id);
      } else {
        showToast(`Saved to your wishlist`, 'success');
        return [...safePrev, product];
      }
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => (Array.isArray(prev) ? prev.filter(item => item && item.id !== productId) : []));
    showToast('Removed from wishlist', 'info');
  };

  const isInWishlist = (productId: string) => {
    if (!productId || !Array.isArray(wishlist)) return false;
    return wishlist.some(item => item && item.id === productId);
  };

  const moveWishlistToCart = (product: Product) => {
    if (!product) return;
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  // Recently Viewed Operations
  const addRecentlyViewed = (product: Product) => {
    if (!product || !product.id) return;
    setRecentlyViewed(prev => {
      const safePrev = Array.isArray(prev) ? prev.filter(p => p && p.id) : [];
      const filtered = safePrev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });
  };

  // Coupon
  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'PRETTY10') {
      setCouponCode('PRETTY10');
      setDiscountPercent(10);
      showToast('10% discount applied!', 'success');
      return true;
    } else if (cleanCode === 'VIP20') {
      setCouponCode('VIP20');
      setDiscountPercent(20);
      showToast('20% VIP discount applied!', 'success');
      return true;
    } else {
      showToast('Invalid promo code. Try "PRETTY10"', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
    showToast('Promo code removed', 'info');
  };

  // Calculations in Authoritative Base USD
  const cartCount = Array.isArray(cart)
    ? cart.reduce((total, item) => total + (item?.quantity || 0), 0)
    : 0;

  const cartSubtotal = Array.isArray(cart)
    ? cart.reduce((total, item) => {
        if (!item || !item.product) return total;
        const unitPrice = item.product.salePrice ?? item.product.price ?? 0;
        return total + unitPrice * (item.quantity || 1);
      }, 0)
    : 0;

  const discountAmount = Math.round(((cartSubtotal * discountPercent) / 100) * 100) / 100;

  // Real Shipping: Use selected CJ carrier price if available, otherwise standard fee or 0
  const shippingCost =
    cartSubtotal === 0 || cartSubtotal >= FREE_SHIPPING_THRESHOLD_USD
      ? 0
      : selectedShippingMethod
      ? selectedShippingMethod.priceUsd
      : STANDARD_SHIPPING_FEE_USD;

  const cartTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_USD - cartSubtotal
  );

  return (
    <ShopContext.Provider
      value={{
        currentPage,
        currentCategory,
        currentSubcategory,
        currentProductSlug,
        currentBlogCategory,
        currentBlogSlug,
        searchQuery,
        navigateTo,

        selectedCountry,
        selectedCurrency,
        exchangeRates,
        isCountryModalOpen,
        setIsCountryModalOpen,
        setCountry,
        setCurrency,
        formatPrice,
        convertFromUsd,
        detectedCountry,
        showCountryConfirm,
        dismissCountryConfirm,

        shippingMethods,
        selectedShippingMethod,
        setSelectedShippingMethod,
        isLoadingShipping,
        shippingError,
        fetchLiveShipping,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        shippingCost,
        discountAmount,
        couponCode,
        applyCoupon,
        removeCoupon,
        cartTotal,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD_USD,
        amountNeededForFreeShipping,
        isCartDrawerOpen,
        setIsCartDrawerOpen,

        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        moveWishlistToCart,

        recentlyViewed,
        addRecentlyViewed,
        recordRecentlyViewed: addRecentlyViewed,

        quickViewProduct,
        openQuickView: setQuickViewProduct,
        closeQuickView: () => setQuickViewProduct(null),
        isSearchModalOpen,
        setIsSearchModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,

        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
