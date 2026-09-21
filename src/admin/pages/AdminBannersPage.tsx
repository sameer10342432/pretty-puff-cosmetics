import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Edit2, Trash2, X, Eye, Upload } from 'lucide-react';
import { api } from '../../services/api';

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  const initialForm = {
    title: '',
    subtitle: '',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Shop Collection',
    ctaUrl: '/shop',
    position: 0,
    isActive: true,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const res = await api.banners.getAdminAll();
      if (res.success) setBanners(res.data);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBanner(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      ctaText: b.ctaText || 'Shop Collection',
      ctaUrl: b.ctaUrl || '/shop',
      position: b.position || 0,
      isActive: b.isActive,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const res = await api.upload.single(e.target.files[0]);
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, image: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await api.banners.update(editingBanner.id, form);
      } else {
        await api.banners.create(form);
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete banner "${title}"?`)) return;
    try {
      await api.banners.delete(id);
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Homepage Promotional Banners</h2>
          <p className="text-xs text-gray-500">
            Configure featured banners, seasonal hero sliders, and campaign call-to-actions.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-gray-400">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-gray-400">No banners found.</div>
        ) : (
          banners.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#F8CAD1]">
                    Position #{b.position}
                  </span>
                  <h3 className="font-serif text-lg font-bold">{b.title}</h3>
                  {b.subtitle && <p className="text-xs text-gray-200 line-clamp-1">{b.subtitle}</p>}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between border-t border-gray-100 text-xs">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.isActive ? 'Active on Store' : 'Draft / Hidden'}
                  </span>
                  <span className="text-gray-400 text-[10px] ml-2 font-mono">Link: {b.ctaUrl}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-gray-400 hover:text-[#C24560] rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE] text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-lg text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create Banner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={e => setForm(prev => ({ ...prev, ctaText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Target URL</label>
                  <input
                    type="text"
                    value={form.ctaUrl}
                    onChange={e => setForm(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Banner Image</label>
                <div className="flex items-center gap-3">
                  <img src={form.image} alt="Preview" className="w-16 h-12 object-cover rounded-lg border" />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-[#C24560]"
                  />
                  <span>Active & Visible</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Position:</span>
                  <input
                    type="number"
                    value={form.position}
                    onChange={e => setForm(prev => ({ ...prev, position: Number(e.target.value) }))}
                    className="w-16 px-2 py-1 border rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C24560] text-white rounded-lg font-semibold hover:bg-[#A3354E]"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
