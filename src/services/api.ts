/**
 * Pretty Puff Universal API Client
 * Connects frontend customer pages and administrative suite to Express backend.
 */

const API_BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pretty_puff_admin_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network request failed', 0);
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; admin: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getProfile: () => request<{ success: boolean; admin: any }>('/auth/me'),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (data: any) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Products
  products: {
    getAll: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return request<{ success: boolean; data: any[]; pagination: any }>(`/products${query}`);
    },
    getBySlug: (slug: string) => request<{ success: boolean; data: any }>(`/products/slug/${slug}`),
    getById: (id: string) => request<{ success: boolean; data: any }>(`/products/${id}`),
    getFeatured: () => request<{ success: boolean; data: any[] }>('/products/featured'),
    getBestSellers: () => request<{ success: boolean; data: any[] }>('/products/bestsellers'),
    getNewArrivals: () => request<{ success: boolean; data: any[] }>('/products/new-arrivals'),
    getAdminAll: () => request<{ success: boolean; data: any[] }>('/products/admin/all'),
    create: (productData: any) =>
      request<{ success: boolean; message: string; data: any }>('/products/admin/create', {
        method: 'POST',
        body: JSON.stringify(productData),
      }),
    update: (id: string, productData: any) =>
      request<{ success: boolean; message: string; data: any }>(`/products/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/products/admin/${id}`, {
        method: 'DELETE',
      }),
    duplicate: (id: string) =>
      request<{ success: boolean; message: string; data: any }>(`/products/admin/${id}/duplicate`, {
        method: 'POST',
      }),
  },

  // Categories
  categories: {
    getAll: () => request<{ success: boolean; data: any[] }>('/categories'),
    getBySlug: (slug: string) => request<{ success: boolean; data: any }>(`/categories/${slug}`),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/categories/admin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; message: string; data: any }>(`/categories/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/categories/admin/${id}`, {
        method: 'DELETE',
      }),
    addSubcategory: (categoryId: string, data: { name: string; slug: string }) =>
      request<{ success: boolean; message: string; data: any }>(`/categories/admin/${categoryId}/subcategories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteSubcategory: (subcategoryId: string) =>
      request<{ success: boolean; message: string }>(`/categories/admin/subcategories/${subcategoryId}`, {
        method: 'DELETE',
      }),
  },

  // Inventory
  inventory: {
    getOverview: () => request<{ success: boolean; data: any[]; summary: any }>('/inventory'),
    adjustStock: (data: {
      productId: string;
      variantId?: string | null;
      changeType: string;
      quantity: number;
      reason: string;
    }) =>
      request<{ success: boolean; message: string; data: any }>('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTransactions: () => request<{ success: boolean; data: any[] }>('/inventory/transactions'),
  },

  // Orders
  orders: {
    create: (orderData: any) =>
      request<{ success: boolean; message: string; data: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    getByNumber: (orderNumber: string) => request<{ success: boolean; data: any }>(`/orders/${orderNumber}`),
    getAdminOrders: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return request<{ success: boolean; data: any[]; pagination: any }>(`/orders/admin/list${query}`);
    },
    updateStatus: (id: string, status: string, paymentStatus?: string) =>
      request<{ success: boolean; message: string }>(`/orders/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, paymentStatus }),
      }),
    updateDetails: (id: string, details: { trackingNumber?: string; internalNotes?: string }) =>
      request<{ success: boolean; message: string; data: any }>(`/orders/admin/${id}/details`, {
        method: 'PATCH',
        body: JSON.stringify(details),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/orders/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Coupons
  coupons: {
    validate: (data: { code: string; subtotal: number; email?: string }) =>
      request<{ success: boolean; message: string; data: any }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAdminAll: () => request<{ success: boolean; data: any[] }>('/coupons/admin'),
    create: (couponData: any) =>
      request<{ success: boolean; message: string; data: any }>('/coupons/admin', {
        method: 'POST',
        body: JSON.stringify(couponData),
      }),
    update: (id: string, couponData: any) =>
      request<{ success: boolean; message: string; data: any }>(`/coupons/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(couponData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/coupons/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Blog
  blog: {
    getPosts: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return request<{ success: boolean; data: any[]; pagination: any }>(`/blog${query}`);
    },
    getBySlug: (slug: string) => request<{ success: boolean; data: any }>(`/blog/slug/${slug}`),
    getFeatured: () => request<{ success: boolean; data: any }>('/blog/featured'),
    getCategories: () => request<{ success: boolean; data: any[] }>('/blog/categories'),
    getAdminAll: () => request<{ success: boolean; data: any[] }>('/blog/admin/all'),
    create: (postData: any) =>
      request<{ success: boolean; message: string; data: any }>('/blog/admin', {
        method: 'POST',
        body: JSON.stringify(postData),
      }),
    update: (id: string, postData: any) =>
      request<{ success: boolean; message: string; data: any }>(`/blog/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(postData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/blog/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reviews
  reviews: {
    submit: (data: { productId: string; author: string; rating: number; comment: string; orderId?: string }) =>
      request<{ success: boolean; message: string; data: any }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAdmin: (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<{ success: boolean; data: any[] }>(`/reviews/admin${q}`);
    },
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean; message: string; data: any }>(`/reviews/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/reviews/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Banners
  banners: {
    getActive: () => request<{ success: boolean; data: any[] }>('/banners'),
    getAdminAll: () => request<{ success: boolean; data: any[] }>('/banners/admin'),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/banners/admin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; message: string; data: any }>(`/banners/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/banners/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Contact
  contact: {
    submit: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
      request<{ success: boolean; message: string; data: any }>('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAdmin: (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<{ success: boolean; data: any[] }>(`/contact/admin${q}`);
    },
    updateStatus: (id: string, data: { status?: string; internalNotes?: string }) =>
      request<{ success: boolean; message: string; data: any }>(`/contact/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/contact/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Newsletter
  newsletter: {
    subscribe: (email: string) =>
      request<{ success: boolean; message: string }>('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    getSubscribers: (search?: string) => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ success: boolean; data: any[] }>(`/newsletter/admin${q}`);
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/newsletter/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // Settings
  settings: {
    get: () => request<{ success: boolean; data: { site: any; shipping: any; payment: any } }>('/settings'),
    updateSite: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/settings/admin/site', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateShipping: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/settings/admin/shipping', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updatePayment: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/settings/admin/payment', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Customers
  customers: {
    getAll: (search?: string) => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ success: boolean; data: any[]; summary: any }>(`/customers${q}`);
    },
  },

  // Users & Staff
  users: {
    getAll: () => request<{ success: boolean; data: any[] }>('/users'),
    getRoles: () => request<{ success: boolean; data: { roles: any[]; permissions: any[] } }>('/users/roles'),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; message: string; data: any }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // Analytics
  analytics: {
    getDashboard: () => request<{ success: boolean; data: any }>('/analytics/dashboard'),
  },

  // Image Upload
  upload: {
    single: async (file: File) => {
      const token = localStorage.getItem('pretty_puff_admin_token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Upload failed');
      }
      return data;
    },
  },
};
