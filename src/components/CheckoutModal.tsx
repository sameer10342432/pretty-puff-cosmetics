import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  MessageCircle,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatPKR } from './PriceDisplay';
import { api } from '../services/api';

const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
  'Other City',
];

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartSubtotal,
    shippingCost,
    discountAmount,
    couponCode,
    cartTotal,
    clearCart,
    showToast,
  } = useShop();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Lahore',
    address: '',
    notes: '',
    paymentMethod: 'cod', // 'cod' | 'bank' | 'easypaisa'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<null | {
    orderId: string;
    date: string;
    total: number;
  }>(null);

  if (!isCheckoutModalOpen) return null;

  const handleClose = () => {
    setIsCheckoutModalOpen(false);
    if (orderPlaced) {
      setOrderPlaced(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      showToast('Please fill in your name, phone number, and delivery address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        fullName: formData.fullName,
        email: formData.email || `${formData.phone.replace(/[^0-9]/g, '')}@prettypuff.pk`,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        couponCode: couponCode || null,
        paymentMethod: formData.paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'COD',
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku || 'PP-SKU',
          price: item.product.salePrice ?? item.product.price,
          quantity: item.quantity,
          selectedColour: item.selectedColour || null,
          selectedSize: item.selectedSize || null,
        })),
      };

      const res = await api.orders.create(orderPayload);
      const createdOrder = res.data;
      const orderNumber = createdOrder?.orderNumber || `PP-${Math.floor(100000 + Math.random() * 900000)}`;

      setOrderPlaced({
        orderId: orderNumber,
        date: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        total: createdOrder?.total ?? cartTotal,
      });

      clearCart();
      showToast(`Order #${orderNumber} placed successfully!`, 'success');
    } catch (err: any) {
      console.error('Order placement failed:', err);
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp prefilled order text for instant confirmation
  const getWhatsAppOrderLink = () => {
    if (!orderPlaced) return 'https://wa.me/923474542881';

    const text = encodeURIComponent(
      `Hi Pretty Puff! 🌸 I just placed order *${orderPlaced.orderId}* on your website for *${formatPKR(
        orderPlaced.total
      )}*.\nName: ${formData.fullName}\nPhone: ${formData.phone}\nCity: ${formData.city}\nAddress: ${formData.address}\nPlease confirm my order dispatch!`
    );
    return `https://wa.me/923474542881?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-10">
        <div className="inline-block w-full max-w-2xl bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all relative z-10 border border-[#F0E6DE]">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#F0E6DE] flex items-center justify-between bg-[#FAF7F5]">
            <div>
              <div className="font-serif text-2xl text-[#1E1E24]">
                {orderPlaced ? 'Order Confirmed' : 'Checkout & Delivery'}
              </div>
              <div className="text-xs text-[#7A7478]">
                {orderPlaced
                  ? 'Thank you for shopping with Pretty Puff'
                  : 'Fast delivery across Pakistan with Cash on Delivery'}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-[#7A7478] hover:text-[#1E1E24] rounded-full hover:bg-[#F5EFEB] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
            {orderPlaced ? (
              /* Success State */
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#EAF5EC] text-[#258237] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="font-serif text-3xl text-[#1E1E24] mb-1">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-sm text-[#686266] max-w-md mx-auto">
                    Your order has been recorded. Our team will verify and dispatch your package
                    within 24 hours.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#F0E6DE] max-w-md mx-auto text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#EBE0D7]">
                    <span className="text-[#7A7478]">Order Number:</span>
                    <span className="font-mono font-bold text-[#1E1E24]">
                      {orderPlaced.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EBE0D7]">
                    <span className="text-[#7A7478]">Recipient:</span>
                    <span className="font-medium text-[#1E1E24]">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EBE0D7]">
                    <span className="text-[#7A7478]">Contact Number:</span>
                    <span className="font-medium text-[#1E1E24]">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EBE0D7]">
                    <span className="text-[#7A7478]">Delivery Location:</span>
                    <span className="font-medium text-[#1E1E24]">
                      {formData.city}, {formData.address}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 text-sm font-bold text-[#1E1E24]">
                    <span>Total (Payable on Delivery):</span>
                    <span className="text-[#C24560]">{formatPKR(orderPlaced.total)}</span>
                  </div>
                </div>

                {/* WhatsApp Instant Dispatch Confirmation */}
                <div className="pt-2 max-w-md mx-auto space-y-3">
                  <a
                    href={getWhatsAppOrderLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirm Order on WhatsApp (+92 347 4542881)</span>
                  </a>

                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 bg-[#F5EFEB] text-[#1E1E24] text-xs font-semibold rounded-xl hover:bg-[#EBE0D7] transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3 flex items-center gap-2">
                    <span>1. Shipping Details</span>
                    <Truck className="w-4 h-4 text-[#C24560]" />
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4549] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ayesha Khan"
                        value={formData.fullName}
                        onChange={e =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A4549] mb-1">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0347 4542881"
                        value={formData.phone}
                        onChange={e =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A4549] mb-1">
                        Email Address (for tracking receipt)
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A4549] mb-1">
                        City *
                      </label>
                      <select
                        value={formData.city}
                        onChange={e =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden bg-white"
                      >
                        {PAKISTAN_CITIES.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#4A4549] mb-1">
                        Complete Street Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="House / Apartment #, Street, Area, Landmark"
                        value={formData.address}
                        onChange={e =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3 flex items-center gap-2">
                    <span>2. Payment Method</span>
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  </h4>

                  <div className="space-y-2">
                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        formData.paymentMethod === 'cod'
                          ? 'border-[#C24560] bg-[#FDF0F2]'
                          : 'border-[#E0D5CE] hover:bg-[#FAF7F5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={() =>
                            setFormData({ ...formData, paymentMethod: 'cod' })
                          }
                          className="accent-[#C24560]"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#1E1E24]">
                            Cash on Delivery (COD)
                          </div>
                          <div className="text-[11px] text-[#7A7478]">
                            Pay with cash when the courier arrives at your doorstep
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#258237] bg-[#EAF5EC] px-2 py-0.5 rounded">
                        Most Popular
                      </span>
                    </label>

                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        formData.paymentMethod === 'bank'
                          ? 'border-[#C24560] bg-[#FDF0F2]'
                          : 'border-[#E0D5CE] hover:bg-[#FAF7F5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="bank"
                          checked={formData.paymentMethod === 'bank'}
                          onChange={() =>
                            setFormData({ ...formData, paymentMethod: 'bank' })
                          }
                          className="accent-[#C24560]"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#1E1E24]">
                            Online Bank Transfer / EasyPaisa / JazzCash
                          </div>
                          <div className="text-[11px] text-[#7A7478]">
                            Account details provided via WhatsApp after order submission
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#F0E6DE] space-y-2 text-xs">
                  <div className="flex justify-between text-[#686266]">
                    <span>Items Subtotal ({cart.length} unique)</span>
                    <span className="font-semibold text-[#1E1E24]">
                      {formatPKR(cartSubtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#C24560]">
                      <span>Promo Discount ({couponCode})</span>
                      <span>-{formatPKR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#686266]">
                    <span>Nationwide Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-[#258237] font-semibold">FREE</span>
                      ) : (
                        formatPKR(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-[#1E1E24] pt-2 border-t border-[#EBE0D7]">
                    <span>Total Amount</span>
                    <span className="text-[#C24560]">{formatPKR(cartTotal)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full py-3.5 px-6 bg-[#1E1E24] hover:bg-[#C24560] disabled:bg-[#A8A0A6] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <span>Placing Your Order...</span>
                  ) : (
                    <>
                      <span>Complete Order ({formatPKR(cartTotal)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
