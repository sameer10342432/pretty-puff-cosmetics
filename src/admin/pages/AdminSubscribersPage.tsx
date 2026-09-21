import React, { useState, useEffect } from 'react';
import { Mail, Download, Search, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const res = await api.newsletter.getSubscribers(search);
      if (res.success) setSubscribers(res.data);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/newsletter/admin/export', '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this subscriber?')) return;
    try {
      await api.newsletter.delete(id);
      loadSubscribers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove subscriber');
    }
  };

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Newsletter VIP Subscribers</h2>
          <p className="text-xs text-gray-500">
            Beauty club members enrolled for product drops and secret sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subscriber emails..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C24560]"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Subscriber Email</th>
                <th className="py-3 px-4 font-semibold">Subscribed Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Loading subscribers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#C24560]" />
                      <span>{s.email}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(s.subscribedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Remove Subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
