import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  History,
  CheckCircle2,
  X,
  Search,
  Plus,
  Minus,
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [changeType, setChangeType] = useState<string>('STOCK_ADDED');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier shipment receipt');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invRes, txRes] = await Promise.all([
        api.inventory.getOverview(),
        api.inventory.getTransactions(),
      ]);
      if (invRes.success) setItems(invRes.data);
      if (txRes.success) setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (item: any) => {
    setSelectedProduct(item);
    setChangeType('STOCK_ADDED');
    setQuantity(10);
    setReason('Supplier shipment receipt');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);

    try {
      await api.inventory.adjustStock({
        productId: selectedProduct.id,
        changeType,
        quantity: Number(quantity),
        reason,
      });
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter(
    i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#1E1E24] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Current Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-[#1E1E24] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Audit Transaction History
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name or SKU..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C24560]"
            />
          </div>
        )}
      </div>

      {activeTab === 'overview' ? (
        <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">SKU</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Current Stock</th>
                  <th className="py-3 px-4 font-semibold">Reserved</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover bg-gray-50 shrink-0"
                        />
                        <span className="font-medium text-gray-900 truncate max-w-xs">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{item.sku}</td>
                    <td className="py-3 px-4 text-gray-600">{item.category}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 text-sm">{item.currentStock}</td>
                    <td className="py-3 px-4 text-gray-400">{item.reservedStock}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'out-of-stock'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'low-stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.status === 'out-of-stock'
                          ? 'Out of Stock'
                          : item.status === 'low-stock'
                          ? 'Low Stock Alert'
                          : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F5] hover:bg-[#FDF0F2] text-[#1E1E24] hover:text-[#C24560] border border-[#EBE0D7] rounded-lg font-medium transition-colors"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Transactions Log */
        <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Change</th>
                  <th className="py-3 px-4 font-semibold">Previous → New</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{tx.product?.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {tx.changeType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={tx.quantityChanged >= 0 ? 'text-green-600' : 'text-red-600'}
                        >
                          {tx.quantityChanged >= 0 ? `+${tx.quantityChanged}` : tx.quantityChanged}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {tx.previousStock} → {tx.newStock}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{tx.reason}</td>
                      <td className="py-3 px-4 text-gray-500">{tx.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="font-serif text-lg text-gray-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-gray-500">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                <span className="text-gray-600">Current Stock:</span>
                <span className="text-base font-bold text-gray-900 font-mono">
                  {selectedProduct.currentStock} Units
                </span>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <select
                  value={changeType}
                  onChange={e => setChangeType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560] bg-white"
                >
                  <option value="STOCK_ADDED">Stock Added (Shipment / Restock)</option>
                  <option value="STOCK_REMOVED">Stock Removed (Damage / Expiry / Loss)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Stock Override (Inventory Count)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. New supplier batch received from Karachi distributor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#C24560] text-white rounded-lg font-semibold hover:bg-[#A3354E]"
                >
                  {submitting ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
