export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  salePrice?: number;
  inStock: boolean;
  sku?: string;
}

export interface ProductColour {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  variants?: ProductVariant[];
  colours?: ProductColour[];
  sizes?: string[];
  ingredients?: string;
  howToUse?: string;
  benefits?: string[];
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  subcategories: SubCategory[];
}

export interface CartItem {
  id: string; // unique item id composed of product.id + variant/colour/size
  product: Product;
  quantity: number;
  selectedVariant?: string;
  selectedColour?: string;
  selectedSize?: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  productName?: string;
  shade?: string;
}

export interface FilterState {
  category: string | null;
  subcategory: string | null;
  priceRange: [number, number];
  brand: string | null;
  minRating: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  searchQuery: string;
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'best-selling'
  | 'highest-rated';

export type NavigationPage =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'wishlist'
  | 'about'
  | 'contact'
  | 'faq'
  | 'shipping'
  | 'returns'
  | 'privacy'
  | 'terms'
  | 'blog'
  | 'blog-post'
  | 'admin';

export * from './blog';
