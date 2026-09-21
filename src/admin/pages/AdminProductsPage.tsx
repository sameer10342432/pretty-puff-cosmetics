import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatPKR } from '../../components/PriceDisplay';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const initialForm = {
    name: '',
    slug: '',
    sku: '',
    brand: 'Pretty Puff',
    categoryId: '',
    subcategoryId: '',
    shortDescription: '',
    description: '',
    price: 0,
    salePrice: '' as any,
    discount: '' as any,
    costPrice: '' as any,
    stock: 20,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80'],
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    ingredients: '',
    howToUse: '',
    benefits: ['Hydrating formula', 'Long-lasting wear', 'Dermatologist tested'],
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    isActive: true,
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.products.getAdminAll(),
        api.categories.getAll(),
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      ...initialForm,
      categoryId: categories[0]?.id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brand: product.brand || 'Pretty Puff',
      categoryId: product.categoryId || categories[0]?.id || '',
      subcategoryId: product.subcategoryId || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      price: product.price,
      salePrice: product.salePrice ?? '',
      discount: product.discount ?? '',
      costPrice: product.costPrice ?? '',
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 5,
      images: product.images?.length > 0 ? product.images : initialForm.images,
      thumbnail: product.thumbnail || product.images?.[0] || '',
      ingredients: product.ingredients || '',
      howToUse: product.howToUse || '',
      benefits: product.benefits?.length > 0 ? product.benefits : initialForm.benefits,
      isFeatured: !!product.isFeatured,
      isBestSeller: !!product.isBestSeller,
      isNew: !!product.isNew,
      isActive: product.isActive !== false,
      seoTitle: product.seoTitle || product.name,
      metaDescription: product.metaDescription || product.shortDescription,
      focusKeyword: product.focusKeyword || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.products.duplicate(id);
      if (res.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Duplicate failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const res = await api.upload.single(file);
      if (res.success && res.url) {
        setFormData(prev => ({
          ...prev,
          thumbnail: res.url,
          images: [res.url, ...prev.images],
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload: any = {
        ...formData,
        price: parseFloat(formData.price as any),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        discount: formData.discount ? parseInt(formData.discount, 10) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        stock: parseInt(formData.stock as any, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold as any, 10),
      };

      if (!payload.slug) {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      categoryFilter === 'ALL' ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase() ||
      p.categorySlug?.toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-[#1E1E24] focus:outline-none focus:border-[#C24560]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#C24560]"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading cosmetics catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnail || p.images?.[0]}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                        />
                        <div className="max-w-xs truncate">
                          <div className="font-medium text-gray-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.sku}</td>
                    <td className="py-3 px-4 text-gray-600">{p.category}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {p.salePrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#C24560]">{formatPKR(p.salePrice)}</span>
                          <span className="line-through text-gray-400 text-[10px]">
                            {formatPKR(p.price)}
                          </span>
                        </div>
                      ) : (
                        formatPKR(p.price)
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.stock <= 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock <= (p.lowStockThreshold || 5)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {p.stock <= 0 ? 'Out of Stock' : `${p.stock} in stock`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-[#C24560] hover:bg-[#FDF0F2] rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F0E6DE] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F0E6DE] pb-4 mb-6">
              <div>
                <h3 className="font-serif text-2xl text-[#1E1E24]">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-xs text-gray-500">
                  Fill in cosmetics details, pricing, shades, and search engine metadata.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#C24560]" />
                  <span>General Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => {
                        const name = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          name,
                          slug: editingProduct ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        }));
                      }}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Slug (URL) *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs font-mono focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560] bg-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Short Description *</label>
                  <input
                    type="text"
                    required
                    value={formData.shortDescription}
                    onChange={e => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Full Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                  />
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4 pt-4 border-t border-[#F0E6DE]">
                <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px]">
                  Pricing & Stock
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Sale Price (PKR)</label>
                    <input
                      type="number"
                      value={formData.salePrice}
                      onChange={e => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Current Stock *</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={e => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={e => setFormData(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs focus:outline-none focus:border-[#C24560]"
                    />
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4 pt-4 border-t border-[#F0E6DE]">
                <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px]">
                  Product Imagery
                </h4>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    className="w-16 h-16 rounded-xl object-cover border border-[#E0D5CE] bg-gray-50"
                  />
                  <div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#E0D5CE] hover:border-[#C24560] rounded-xl text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#C24560]" />
                      <span>Upload Primary Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPEG, WebP up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Status flags */}
              <div className="pt-4 border-t border-[#F0E6DE] flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560]"
                  />
                  <span>Active & Published</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560]"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={e => setFormData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560]"
                  />
                  <span>Best Seller</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={e => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560]"
                  />
                  <span>New Arrival Badge</span>
                </label>
              </div>

              <div className="pt-6 border-t border-[#F0E6DE] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
