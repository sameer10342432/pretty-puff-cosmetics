import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, MessageCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadMessages();
  }, [statusFilter]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.contact.getAdmin(statusFilter !== 'ALL' ? statusFilter : undefined);
      if (res.success) setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.contact.updateStatus(id, { status: newStatus });
      loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to update message status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await api.contact.delete(id);
      loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to delete message');
    }
  };

  const getWhatsAppReplyLink = (m: any) => {
    const text = encodeURIComponent(
      `Hello ${m.name}! 🌸 Thank you for reaching out to Pretty Puff regarding "${m.subject}". How can our beauty advisors assist you today?`
    );
    const cleanPhone = (m.phone || '').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Customer Support & Inquiries</h2>
          <p className="text-xs text-gray-500">
            Incoming contact form messages from customer advisory requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'NEW', 'READ', 'REPLIED', 'CLOSED'].map(status => (
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

      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden divide-y divide-gray-100 text-xs">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No messages found.</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                  <span className="text-gray-400 font-mono text-[10px]">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      m.status === 'NEW'
                        ? 'bg-amber-100 text-amber-800'
                        : m.status === 'REPLIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-gray-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {m.email}
                  </span>
                  {m.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {m.phone}
                    </span>
                  )}
                  <span className="font-medium text-gray-700">Subject: {m.subject}</span>
                </div>

                <p className="bg-[#FAF7F5] p-3 rounded-xl border border-[#F0E6DE] text-gray-800 leading-relaxed max-w-2xl mt-2">
                  {m.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {m.phone && (
                  <a
                    href={getWhatsAppReplyLink(m)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {m.status !== 'REPLIED' && (
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'REPLIED')}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Mark Replied
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
