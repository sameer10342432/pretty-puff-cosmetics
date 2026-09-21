import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Eye, X, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { formatPKR } from '../../components/PriceDisplay';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.customers.getAll(search);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Customer Directory & LTV</h2>
          <p className="text-xs text-gray-500">
            Track customer order histories, lifetime value, and delivery addresses.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C24560]"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">City</th>
                <th className="py-3 px-4 font-semibold">Orders</th>
                <th className="py-3 px-4 font-semibold">Lifetime Spent</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No customer accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">{c.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{c.city}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{c.orderCount} Orders</td>
                    <td className="py-3 px-4 font-bold text-[#C24560]">{formatPKR(c.totalSpent)}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(c.lastOrderDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 text-gray-500 hover:text-[#C24560] hover:bg-[#FDF0F2] rounded-lg transition-colors"
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F0E6DE] text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-serif text-xl text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-gray-500">{selectedCustomer.email}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAF7F5] border border-[#F0E6DE]">
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-mono font-bold text-gray-800">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Spent:</span>
                  <p className="font-bold text-[#C24560]">{formatPKR(selectedCustomer.totalSpent)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Last Known Address:</span>
                  <p className="text-gray-800">
                    {selectedCustomer.address}, {selectedCustomer.city}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Order History</h4>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {selectedCustomer.orders?.map((ord: any) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-gray-900">{ord.orderNumber}</span>
                        <span className="text-[10px] text-gray-400 ml-2">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{formatPKR(ord.total)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
