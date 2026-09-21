import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  MessageCircle,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatPKR } from '../../components/PriceDisplay';

const ORDER_STATUSES = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
];

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Order Details Modal
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const res = await api.orders.getAdminOrders(params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (order: any) => {
    setActiveOrder(order);
    setTrackingNumber(order.trackingNumber || '');
    setInternalNotes(order.internalNotes || '');
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeOrder) return;
    setUpdating(true);
    try {
      await api.orders.updateStatus(activeOrder.id, newStatus);
      setActiveOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!activeOrder) return;
    setUpdating(true);
    try {
      await api.orders.updateDetails(activeOrder.id, {
        trackingNumber,
        internalNotes,
      });
      alert('Order tracking and notes updated.');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order details');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (order: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete order #${order.orderNumber} (${order.fullName})? This will permanently remove the order and restore product stock.`
      )
    ) {
      return;
    }
    setDeletingId(order.id);
    try {
      const res = await api.orders.delete(order.id);
      if (res.success) {
        if (activeOrder?.id === order.id) {
          setActiveOrder(null);
        }
        await loadOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete order');
    } finally {
      setDeletingId(null);
    }
  };

  const getWhatsAppLink = (order: any) => {
    const text = encodeURIComponent(
      `Hello ${order.fullName}! 🌸 Pretty Puff here regarding your order #${order.orderNumber}. Your order status is now: *${order.orderStatus}*.\nTracking Number: ${order.trackingNumber || 'Processing dispatch'}.\nThank you for shopping luxury beauty with us!`
    );
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadOrders()}
              placeholder="Search by order #, customer, phone, or city..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F5] border border-[#E0D5CE] rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C24560]"
            />
          </div>

          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            Search Orders
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-gray-100 pt-3">
          {ORDER_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === status
                  ? 'bg-[#C24560] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">City</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{order.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{order.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.city}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{formatPKR(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : order.orderStatus === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : order.orderStatus === 'SHIPPED'
                            ? 'bg-purple-100 text-purple-800'
                            : order.orderStatus === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="p-1.5 text-gray-500 hover:text-[#C24560] hover:bg-[#FDF0F2] rounded-lg transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deletingId === order.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Order"
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

      {/* Order Detail Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F0E6DE] my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl text-gray-900">
                    Order #{activeOrder.orderNumber}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                    {activeOrder.orderStatus}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">
                  Placed on {new Date(activeOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F5] border border-[#F0E6DE]">
                <div>
                  <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-2">
                    Customer Information
                  </h4>
                  <div className="space-y-1 text-gray-800">
                    <p className="font-bold text-sm">{activeOrder.fullName}</p>
                    <p>{activeOrder.email}</p>
                    <p className="font-mono">{activeOrder.phone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-2">
                    Delivery Address
                  </h4>
                  <p className="text-gray-800 leading-relaxed">
                    {activeOrder.address}, {activeOrder.city}
                  </p>
                  {activeOrder.notes && (
                    <p className="mt-2 text-gray-500 italic">
                      Note: "{activeOrder.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Order Line Items</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Price</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeOrder.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-2.5">
                            <div className="font-semibold text-gray-900">{item.productName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {item.sku} {item.selectedColour ? `• ${item.selectedColour}` : ''}
                            </div>
                          </td>
                          <td className="p-2.5">{formatPKR(item.price)}</td>
                          <td className="p-2.5">{item.quantity}</td>
                          <td className="p-2.5 text-right font-semibold">{formatPKR(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200 max-w-xs ml-auto space-y-1.5 text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatPKR(activeOrder.subtotal)}</span>
                  </div>
                  {activeOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatPKR(activeOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Fee:</span>
                    <span>{formatPKR(activeOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span className="text-[#C24560]">{formatPKR(activeOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status Transition Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <h4 className="font-semibold text-gray-800">Update Order Status</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'PENDING',
                    'CONFIRMED',
                    'PROCESSING',
                    'SHIPPED',
                    'DELIVERED',
                    'CANCELLED',
                  ].map(status => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating || activeOrder.orderStatus === status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeOrder.orderStatus === status
                          ? 'bg-[#1E1E24] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-[#FDF0F2] hover:text-[#C24560]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracking & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Carrier Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. TCS-8928374 or Leopards-98172"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Internal Staff Notes
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Internal verification notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(activeOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Notify on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(activeOrder)}
                    disabled={deletingId === activeOrder.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Order</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleSaveDetails}
                    className="px-5 py-2 bg-[#C24560] text-white rounded-xl font-semibold hover:bg-[#A3354E]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
