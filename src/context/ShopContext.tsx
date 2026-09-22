import React, { createContext, useContext, useEffect, useState } from 'react';
import { blogService } from '../services/blogService';
import { CartItem, NavigationPage, Product } from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
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
  cartSubtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cartTotal: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
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

const FREE_SHIPPING_THRESHOLD = 3000;
const STANDARD_SHIPPING_FEE = 250;

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin')) return 'admin';
    }
    return 'home';
  });
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  const [currentProductSlug, setCurrentProductSlug] = useState<string | null>(null);
  const [currentBlogCategory, setCurrentBlogCategory] = useState<string | null>('all');
  const [currentBlogSlug, setCurrentBlogSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      // Strip GitHub Pages repository subpath if present
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
        // Check if category path (e.g., /makeup or /makeup/foundation)
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
    } catch {
      // In sandbox if pushState is restricted, navigation still functions via React state
    }
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

  // Cart Actions
  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedVariant?: string,
    selectedColour?: string,
    selectedSize?: string
  ) => {
    const itemId = `${product.id}-${selectedVariant || ''}-${selectedColour || ''}-${selectedSize || ''}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: itemId,
            product,
            quantity,
            selectedVariant,
            selectedColour,
            selectedSize,
          },
        ];
      }
    });

    showToast(`Added "${product.name}" to your beauty bag`, 'success');
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast('Item removed from cart', 'info');
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

  // Wishlist Actions
  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      showToast(`Removed "${product.name}" from your wishlist`, 'info');
    } else {
      setWishlist(prev => [...prev, product]);
      showToast(`Added "${product.name}" to your wishlist`, 'success');
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
    showToast('Removed from wishlist', 'info');
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const moveWishlistToCart = (product: Product) => {
    addToCart(
      product,
      1,
      undefined,
      product.colours?.[0]?.name,
      product.sizes?.[0]
    );
    setWishlist(prev => prev.filter(item => item.id !== product.id));
  };

  // Recently Viewed
  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 8);
    });
  };

  // Coupon code
  const applyCoupon = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted === 'PRETTY10') {
      setCouponCode('PRETTY10');
      setDiscountPercent(10);
      showToast('10% Beauty Club discount applied!', 'success');
      return true;
    } else if (formatted === 'GLOW15') {
      setCouponCode('GLOW15');
      setDiscountPercent(15);
      showToast('15% VIP Glow discount applied!', 'success');
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

  // Calculations
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const unitPrice = item.product.salePrice ?? item.product.price;
    return total + unitPrice * item.quantity;
  }, 0);

  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

  const shippingCost =
    cartSubtotal === 0 || cartSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;

  const cartTotal = cartSubtotal - discountAmount + shippingCost;

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - cartSubtotal
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
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
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
