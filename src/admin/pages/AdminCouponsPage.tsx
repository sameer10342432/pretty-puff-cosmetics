import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { formatPKR } from '../../components/PriceDisplay';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const initialForm = {
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: '' as any,
    usageLimit: '' as any,
    isActive: true,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const res = await api.coupons.getAdminAll();
      if (res.success) setCoupons(res.data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || '',
      usageLimit: c.usageLimit || '',
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        discountValue: parseFloat(form.discountValue as any),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount as any) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount as any) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit as any, 10) : null,
      };

      if (editingCoupon) {
        await api.coupons.update(editingCoupon.id, payload);
      } else {
        await api.coupons.create(payload);
      }
      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.coupons.delete(id);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Promotional Coupon Codes</h2>
          <p className="text-xs text-gray-500">
            Create percentage or fixed PKR discounts with custom order thresholds and caps.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Promo Code</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Discount Type</th>
                <th className="py-3 px-4 font-semibold">Value</th>
                <th className="py-3 px-4 font-semibold">Min Order</th>
                <th className="py-3 px-4 font-semibold">Times Used</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No active coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#C24560]" />
                        <span>{c.code}</span>
                      </div>
                      {c.description && <div className="text-[10px] text-gray-400 mt-0.5">{c.description}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {c.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (PKR)'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#C24560]">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {c.minOrderAmount > 0 ? formatPKR(c.minOrderAmount) : 'No Minimum'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {c.usageCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'Uses'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-[#C24560] rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
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

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE] text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-lg text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. GLOW20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono uppercase focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. 20% off for Beauty VIPs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed PKR Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue}
                    onChange={e => setForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Min Order (PKR)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={e => setForm(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Max Cap (PKR)</label>
                  <input
                    type="number"
                    value={form.maxDiscountAmount}
                    onChange={e => setForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-[#C24560]"
                />
                <span>Active for Checkout</span>
              </label>

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
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
