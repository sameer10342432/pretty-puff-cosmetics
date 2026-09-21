import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, Filter, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await api.reviews.getAdmin(statusFilter !== 'ALL' ? statusFilter : undefined);
      if (res.success) setReviews(res.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.reviews.updateStatus(id, newStatus);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently remove this review?')) return;
    try {
      await api.reviews.delete(id);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Customer Product Reviews Moderation</h2>
          <p className="text-xs text-gray-500">
            Verify authenticity, approve genuine testimonials, and moderate community ratings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-[#C24560] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100 text-xs">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No reviews found for this status.</div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <img
                    src={r.product?.thumbnail}
                    alt={r.product?.name}
                    className="w-12 h-12 rounded-xl object-cover bg-gray-50 shrink-0 border border-gray-100"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{r.author}</span>
                      {r.verified && (
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Verified Buyer
                        </span>
                      )}
                      <span className="text-gray-400 text-[10px]">
                        on {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="text-gray-400 text-[10px] ml-1">for {r.product?.name}</span>
                    </div>

                    <p className="text-gray-700 mt-1 leading-relaxed bg-[#FAF7F5] p-2.5 rounded-xl border border-[#F0E6DE] max-w-xl">
                      "{r.comment}"
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.status}
                  </span>

                  <div className="flex items-center gap-1.5 mt-2">
                    {r.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                    {r.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
