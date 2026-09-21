import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { RichTextEditor } from '../components/RichTextEditor';
import { BlogContentSection } from '../../types/blog';

export const AdminBlogPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Post Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  const initialForm = {
    title: '',
    slug: '',
    excerpt: '',
    featuredImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    featuredImageAlt: '',
    categoryId: '',
    authorName: 'Pretty Puff Editorial Team',
    authorRole: 'Beauty & Skincare Specialist',
    readingTime: 5,
    isFeatured: false,
    isPopular: false,
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED',
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
    content: [
      {
        id: 'sec-1',
        heading: 'The Foundation of Everyday Radiance',
        level: 2 as const,
        paragraphs: [
          'Achieving a naturally luminous complexion requires understanding your skin barrier and curating cosmetic formulations that work harmoniously with your skin biology.',
        ],
      },
    ] as BlogContentSection[],
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.blog.getAdminAll(),
        api.blog.getCategories(),
      ]);
      if (pRes.success) setPosts(pRes.data);
      if (cRes.success) setCategories(cRes.data);
    } catch (err) {
      console.error('Failed to load blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setForm({
      ...initialForm,
      categoryId: categories[0]?.id || '',
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: any) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt || '',
      categoryId: post.categoryId || categories[0]?.id || '',
      authorName: post.authorName,
      authorRole: post.authorRole,
      readingTime: post.readingTime || 5,
      isFeatured: !!post.isFeatured,
      isPopular: !!post.isPopular,
      status: post.status || 'PUBLISHED',
      seoTitle: post.seoTitle || post.title,
      metaDescription: post.metaDescription || post.excerpt,
      focusKeyword: post.focusKeyword || '',
      content: post.sections?.length > 0 ? post.sections : initialForm.content,
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        slug: form.slug.toLowerCase().trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      if (editingPost) {
        await api.blog.update(editingPost.id, payload);
      } else {
        await api.blog.create(payload);
      }

      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save article');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete article "${title}"?`)) return;
    try {
      await api.blog.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete article');
    }
  };

  const filteredPosts = posts.filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Beauty Journal & CMS</h2>
          <p className="text-xs text-gray-500">
            Publish skincare guides, makeup tutorials, and cosmetic wellness articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C24560]"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Article</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Author</th>
                <th className="py-3 px-4 font-semibold">Read Time</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading articles...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No articles found.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.featuredImage}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                        />
                        <div className="max-w-md truncate">
                          <div className="font-semibold text-gray-900 truncate">{p.title}</div>
                          <div className="text-[10px] text-gray-400 font-mono">/blog/{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.categoryName || p.category?.name}</td>
                    <td className="py-3 px-4 text-gray-600">{p.authorName}</td>
                    <td className="py-3 px-4 text-gray-500">{p.readingTime} min read</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-[#C24560] rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Blog Post Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F0E6DE] my-8 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="font-serif text-2xl text-gray-900">
                  {editingPost ? 'Edit Beauty Journal Article' : 'Compose New Article'}
                </h3>
                <p className="text-gray-500">
                  Write and publish engaging beauty, cosmetics, and skincare insights.
                </p>
              </div>
              <button onClick={() => setIsEditorOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Article Headline *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        title: e.target.value,
                        slug: editingPost
                          ? prev.slug
                          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#C24560]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
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
                <label className="block font-medium text-gray-700 mb-1">Excerpt Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
                />
              </div>

              {/* Rich Content Builder */}
              <div>
                <RichTextEditor
                  sections={form.content}
                  onChange={content => setForm(prev => ({ ...prev, content }))}
                />
              </div>

              {/* Featured Image & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={form.featuredImage}
                    onChange={e => setForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={e => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Publication Status & Flags */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">Status:</span>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded text-[#C24560]"
                  />
                  <span>Hero Featured Article</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={e => setForm(prev => ({ ...prev, isPopular: e.target.checked }))}
                    className="rounded text-[#C24560]"
                  />
                  <span>Popular Read Badge</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C24560] text-white rounded-xl font-semibold hover:bg-[#A3354E]"
                >
                  Save & Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
