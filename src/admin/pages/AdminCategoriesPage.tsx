import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { api } from '../../services/api';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: '' });

  // Subcategory Modal
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [selectedParentCatId, setSelectedParentCatId] = useState<string>('');
  const [subForm, setSubForm] = useState({ name: '', slug: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.categories.getAll();
      if (res.success) {
        setCategories(res.data);
        // Expand first category by default
        if (res.data[0]) {
          setExpandedCats({ [res.data[0].id]: true });
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', image: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory.id, categoryForm);
      } else {
        await api.categories.create(categoryForm);
      }
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Associated products may prevent deletion.`)) return;
    try {
      await api.categories.delete(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleOpenAddSub = (categoryId: string) => {
    setSelectedParentCatId(categoryId);
    setSubForm({ name: '', slug: '' });
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.categories.addSubcategory(selectedParentCatId, subForm);
      setIsSubcategoryModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await api.categories.deleteSubcategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subcategory');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Cosmetics Taxonomy & Hierarchy</h2>
          <p className="text-xs text-gray-500">
            Manage top-level beauty departments and their specialized subcategories.
          </p>
        </div>
        <button
          onClick={handleOpenCreateCategory}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Main Category</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading categories hierarchy...</div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => {
            const isExpanded = expandedCats[cat.id];
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden transition-all"
              >
                <div className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                  <div
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center gap-3 cursor-pointer select-none flex-1"
                  >
                    <button className="p-1 text-gray-400 hover:text-gray-700">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Layers className="w-5 h-5 text-[#C24560]" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          /{cat.slug}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {cat.subcategories?.length || 0} Subcategories • {cat.productCount || 0} Products
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddSub(cat.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-[#C24560] hover:bg-[#FDF0F2] rounded-lg transition-colors border border-gray-200"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ Sub</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="px-6 py-3 bg-[#FAF7F5] border-t border-gray-100 divide-y divide-gray-100">
                    {cat.subcategories.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C24560]" />
                          <span className="font-medium text-gray-800">{sub.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">/{sub.slug}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSubcategory(sub.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-lg text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e =>
                    setCategoryForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingCategory
                        ? prev.slug
                        : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C24560] text-white rounded-lg font-semibold hover:bg-[#A3354E]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Create Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-lg text-gray-900">Add Subcategory</h3>
              <button onClick={() => setIsSubcategoryModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={subForm.name}
                  onChange={e =>
                    setSubForm({
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={subForm.slug}
                  onChange={e => setSubForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C24560] text-white rounded-lg font-semibold hover:bg-[#A3354E]"
                >
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
