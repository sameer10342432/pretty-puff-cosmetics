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
  ExternalLink,
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
  const [successMessage, setSuccessMessage] = useState('');
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');

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
    variants: [] as any[],
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
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
    setDescTab('edit');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      sku: product.sku || '',
      brand: product.brand || 'Pretty Puff',
      categoryId: product.categoryId || categories[0]?.id || '',
      subcategoryId: product.subcategoryId || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      price: product.price ?? 0,
      salePrice: product.salePrice ?? '',
      discount: product.discount ?? '',
      costPrice: product.costPrice ?? '',
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.thumbnail ? [product.thumbnail] : initialForm.images),
      thumbnail: product.thumbnail || product.images?.[0] || '',
      ingredients: product.ingredients || '',
      howToUse: product.howToUse || '',
      benefits: Array.isArray(product.benefits) && product.benefits.length > 0 ? product.benefits : initialForm.benefits,
      isFeatured: !!product.isFeatured,
      isBestSeller: !!product.isBestSeller,
      isNew: !!product.isNew,
      isActive: product.isActive !== false,
      seoTitle: product.seoTitle || product.name || '',
      metaDescription: product.metaDescription || product.shortDescription || '',
      focusKeyword: product.focusKeyword || '',
      variants: Array.isArray(product.variants) ? product.variants : [],
    });
    setFormError('');
    setDescTab('edit');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.products.duplicate(id);
      if (res.success) {
        setSuccessMessage('Product duplicated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
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
      setSuccessMessage(`Product "${name}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
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
          thumbnail: prev.thumbnail || res.url,
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
        categoryId: formData.categoryId || categories[0]?.id,
        subcategoryId: formData.subcategoryId && formData.subcategoryId.trim() !== '' ? formData.subcategoryId.trim() : null,
        price: parseFloat(formData.price as any) || 0,
        salePrice: formData.salePrice !== '' && formData.salePrice !== null && !isNaN(parseFloat(formData.salePrice)) ? parseFloat(formData.salePrice) : null,
        discount: formData.discount !== '' && formData.discount !== null && !isNaN(parseInt(formData.discount, 10)) ? parseInt(formData.discount, 10) : null,
        costPrice: formData.costPrice !== '' && formData.costPrice !== null && !isNaN(parseFloat(formData.costPrice)) ? parseFloat(formData.costPrice) : null,
        stock: parseInt(formData.stock as any, 10) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold as any, 10) || 5,
        isActive: Boolean(formData.isActive),
        isFeatured: Boolean(formData.isFeatured),
        isBestSeller: Boolean(formData.isBestSeller),
        isNew: Boolean(formData.isNew),
        images: formData.images || [],
        thumbnail: formData.thumbnail || formData.images?.[0] || '',
        variants: formData.variants || [],
      };

      if (!payload.slug || payload.slug.trim() === '') {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
        setSuccessMessage(`Product "${payload.name}" updated successfully!`);
      } else {
        await api.products.create(payload);
        setSuccessMessage(`Product "${payload.name}" created successfully!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 5000);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      categoryFilter === 'ALL' ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase() ||
      p.categorySlug?.toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                          src={p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=100&q=80'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-100"
                        />
                        <div className="max-w-xs truncate">
                          <div className="font-medium text-gray-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                            <span>{p.brand}</span>
                            {p.cjProductId && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded text-[9px] font-mono">
                                CJ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.sku}</td>
                    <td className="py-3 px-4 text-gray-600">{p.category || 'Cosmetics'}</td>
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
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.isActive ? 'Active & Published' : 'Draft'}
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
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl text-[#1E1E24]">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h3>
                  {editingProduct?.cjProductId && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-md uppercase tracking-wider">
                      CJdropshipping Imported
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Update product details, pricing, stock, imagery, and live publishing status.
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
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
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

                {/* Description with Edit / Preview Switch */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-gray-700">Full Description *</label>
                    <div className="flex items-center gap-1 bg-[#FAF7F5] border border-[#E0D5CE] rounded-lg p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDescTab('edit')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          descTab === 'edit'
                            ? 'bg-[#C24560] text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Edit HTML / Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescTab('preview')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          descTab === 'preview'
                            ? 'bg-[#C24560] text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {descTab === 'edit' ? (
                    <div>
                      <textarea
                        rows={7}
                        required
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#E0D5CE] rounded-xl text-xs font-mono focus:outline-none focus:border-[#C24560] leading-relaxed"
                        placeholder="Enter formatted product description or HTML markup..."
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        HTML tags & embedded images from CJdropshipping are preserved and formatted safely.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl max-h-64 overflow-y-auto text-xs text-gray-700 leading-relaxed space-y-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_p]:mb-2 [&_b]:font-semibold [&_strong]:font-semibold">
                      {formData.description ? (
                        <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                      ) : (
                        <span className="text-gray-400 italic">No description content to preview.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4 pt-4 border-t border-[#F0E6DE]">
                <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px]">
                  Pricing & Stock
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Regular Price (PKR) *</label>
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

              {/* Media Upload & Gallery */}
              <div className="space-y-4 pt-4 border-t border-[#F0E6DE]">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px]">
                    Product Imagery & Gallery ({formData.images.length})
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    Click any image to make it the Primary Thumbnail
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {formData.images.map((imgUrl: string, idx: number) => {
                    const isThumb = formData.thumbnail === imgUrl;
                    return (
                      <div
                        key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, thumbnail: imgUrl }))}
                        className={`relative group w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isThumb ? 'border-[#C24560] shadow-sm ring-2 ring-[#C24560]/20' : 'border-[#E0D5CE] hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isThumb && (
                          <div className="absolute top-1 left-1 bg-[#C24560] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Primary
                          </div>
                        )}
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImgs = formData.images.filter((_: any, i: number) => i !== idx);
                              setFormData(prev => ({
                                ...prev,
                                images: newImgs,
                                thumbnail: isThumb ? newImgs[0] || '' : prev.thumbnail,
                              }));
                            }}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[#E0D5CE] hover:border-[#C24560] rounded-xl cursor-pointer bg-gray-50/50 hover:bg-rose-50/20 transition-all text-gray-400 hover:text-[#C24560]">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-medium">+ Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Product Variants (if available) */}
              {formData.variants && formData.variants.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#F0E6DE]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C24560]" />
                      <span>Product Variants ({formData.variants.length})</span>
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Prices & stock levels for each variant
                    </span>
                  </div>

                  <div className="border border-[#E0D5CE] rounded-xl overflow-hidden bg-white">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="bg-[#FAF7F5] border-b border-[#E0D5CE] text-gray-500 uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-left">Variant</th>
                            <th className="py-2 px-3 text-left">SKU</th>
                            <th className="py-2 px-3 text-left">Price (PKR)</th>
                            <th className="py-2 px-3 text-left">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {formData.variants.map((v: any, vIdx: number) => (
                            <tr key={v.id || vIdx} className="hover:bg-gray-50/60">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  {v.image && (
                                    <img
                                      src={v.image}
                                      alt={v.name}
                                      className="w-7 h-7 rounded-md object-cover bg-gray-100 shrink-0"
                                    />
                                  )}
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={e => {
                                      const newV = [...formData.variants];
                                      newV[vIdx].name = e.target.value;
                                      setFormData(prev => ({ ...prev, variants: newV }));
                                    }}
                                    className="px-2 py-1 border border-gray-200 rounded-md text-xs w-full max-w-[200px]"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono text-[10px] text-gray-500">{v.sku}</td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={e => {
                                    const newV = [...formData.variants];
                                    newV[vIdx].price = Number(e.target.value);
                                    setFormData(prev => ({ ...prev, variants: newV }));
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-200 rounded-md text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={e => {
                                    const newV = [...formData.variants];
                                    newV[vIdx].stock = Number(e.target.value);
                                    setFormData(prev => ({ ...prev, variants: newV }));
                                  }}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded-md text-xs"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Status flags */}
              <div className="pt-4 border-t border-[#F0E6DE] flex flex-wrap gap-6 bg-[#FAF7F5] p-4 rounded-2xl">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560] w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Active & Published</span>
                    <span className="text-[10px] text-gray-500">
                      When checked, product is visible to customers on the website.
                    </span>
                  </div>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560] w-4 h-4"
                  />
                  <span className="font-medium text-gray-800">Featured Product</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={e => setFormData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560] w-4 h-4"
                  />
                  <span className="font-medium text-gray-800">Best Seller</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={e => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                    className="rounded text-[#C24560] focus:ring-[#C24560] w-4 h-4"
                  />
                  <span className="font-medium text-gray-800">New Arrival Badge</span>
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
                  className="px-6 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
