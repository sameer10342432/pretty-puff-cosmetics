import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { Category, Product } from '../types';
import { api } from './api';

/**
 * Product Service Layer
 * Dynamically queries the backend Express / PostgreSQL database
 * with instant fallback to static catalog data for offline and build-time resilience.
 */
class ProductService {
  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await api.products.getAll();
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback to static products
    }
    return PRODUCTS.filter(p => p.isActive);
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await api.products.getById(id);
      if (res.success && res.data) return res.data;
    } catch {}
    const product = PRODUCTS.find(p => p.id === id && p.isActive);
    return product || null;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await api.products.getBySlug(slug);
      if (res.success && res.data) return res.data;
    } catch {}
    const product = PRODUCTS.find(p => p.slug.toLowerCase() === slug.toLowerCase() && p.isActive);
    return product || null;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const res = await api.products.getFeatured();
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return PRODUCTS.filter(p => p.isActive && p.isFeatured);
  }

  async getBestSellers(): Promise<Product[]> {
    try {
      const res = await api.products.getBestSellers();
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return PRODUCTS.filter(p => p.isActive && p.isBestSeller);
  }

  async getNewArrivals(): Promise<Product[]> {
    try {
      const res = await api.products.getNewArrivals();
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return PRODUCTS.filter(p => p.isActive && p.isNew);
  }

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      const res = await api.products.getAll({ category: categorySlug });
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return PRODUCTS.filter(
      p => p.isActive && p.category.toLowerCase() === categorySlug.toLowerCase()
    );
  }

  async getProductsBySubcategory(categorySlug: string, subcategorySlug: string): Promise<Product[]> {
    try {
      const res = await api.products.getAll({ category: categorySlug, subcategory: subcategorySlug });
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return PRODUCTS.filter(
      p =>
        p.isActive &&
        p.category.toLowerCase() === categorySlug.toLowerCase() &&
        p.subcategory.toLowerCase() === subcategorySlug.toLowerCase()
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    try {
      const res = await api.products.getAll({ search: q });
      if (res.success && res.data) return res.data;
    } catch {}
    return PRODUCTS.filter(
      p =>
        p.isActive &&
        (p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q))
    );
  }

  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const current = PRODUCTS.find(p => p.id === productId);
    if (!current) return PRODUCTS.slice(0, limit);

    const related = PRODUCTS.filter(
      p => p.isActive && p.id !== productId && p.category === current.category
    );

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    const others = PRODUCTS.filter(
      p => p.isActive && p.id !== productId && !related.includes(p)
    );
    return [...related, ...others].slice(0, limit);
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await api.categories.getAll();
      if (res.success && res.data && res.data.length > 0) return res.data;
    } catch {}
    return CATEGORIES;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const res = await api.categories.getBySlug(slug);
      if (res.success && res.data) return res.data;
    } catch {}
    const category = CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    return category || null;
  }
}

export const productService = new ProductService();
