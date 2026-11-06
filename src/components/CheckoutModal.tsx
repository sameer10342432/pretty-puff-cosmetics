import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  MessageCircle,
  CreditCard,
  Building,
  Globe,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { COUNTRIES, CountryInfo } from '../data/countries';
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
    discountAmount,
    couponCode,
    clearCart,
    showToast,
    selectedCountry,
    setCountry,
    selectedCurrency,
    formatPrice,
    convertFromUsd,
    shippingMethods,
    selectedShippingMethod,
    setSelectedShippingMethod,
    isLoadingShipping,
    shippingError,
    fetchLiveShipping,
  } = useShop();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: selectedCountry.code === 'PK' ? 'Lahore' : '',
    province: '',
    postalCode: '',
    address: '',
    notes: '',
    paymentMethod: selectedCountry.code === 'PK' ? 'cod' : 'card', // 'cod' | 'card' | 'bank' | 'paypal'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<null | {
    orderNumber: string;
    date: string;
    total: string;
    carrier?: string;
  }>(null);

  // Sync phone dial code & payment method when country changes
  useEffect(() => {
    if (selectedCountry.code === 'PK') {
      setFormData(prev => ({
        ...prev,
        city: prev.city || 'Lahore',
        paymentMethod: 'cod',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        paymentMethod: prev.paymentMethod === 'cod' ? 'card' : prev.paymentMethod,
      }));
    }
  }, [selectedCountry.code]);

  if (!isCheckoutModalOpen) return null;

  const handleClose = () => {
    setIsCheckoutModalOpen(false);
    if (orderPlaced) {
      setOrderPlaced(null);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCountry(code);
    fetchLiveShipping(code).catch(() => {});
  };

  const currentShippingCostUsd = selectedShippingMethod ? selectedShippingMethod.priceUsd : 4.99;
  const grandTotalUsd = Math.max(0, cartSubtotal - discountAmount + currentShippingCostUsd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      showToast('Please fill in your name, phone number, and delivery address', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Your shopping bag is empty', 'error');
      return;
    }

    // If international destination and no shipping route is available
    if (selectedCountry.code !== 'PK' && shippingMethods.length === 0 && !selectedShippingMethod) {
      showToast('CJdropshipping does not have an active shipping route to this destination.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        fullName: formData.fullName,
        email: formData.email || `${formData.phone.replace(/[^0-9]/g, '')}@customer.prettypuff.store`,
        phone: `${selectedCountry.dialCode} ${formData.phone}`,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        city: formData.city || 'City',
        province: formData.province || null,
        postalCode: formData.postalCode || null,
        address: formData.address,
        notes: formData.notes,
        couponCode: couponCode || null,
        currency: selectedCurrency,
        exchangeRate: convertFromUsd(1),
        shippingMethod: selectedShippingMethod?.logisticName || 'Standard Global Delivery',
        shippingFee: currentShippingCostUsd,
        paymentMethod: formData.paymentMethod.toUpperCase(),
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

      if (res?.success) {
        setOrderPlaced({
          orderNumber: res.data?.orderNumber || `PP-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          total: formatPrice(grandTotalUsd),
          carrier: selectedShippingMethod?.logisticName,
        });

        clearCart();
        showToast('Your order has been confirmed successfully!', 'success');
      } else {
        throw new Error(res?.message || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Something went wrong. Please check your details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-8">
        <div className="inline-block w-full max-w-2xl bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all relative z-10 border border-[#F0E6DE]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 text-[#4A4549] hover:text-[#1E1E24] hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success State */}
          {orderPlaced ? (
            <div className="p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#C24560] font-semibold">
                  Payment & Delivery Confirmed
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1E24] font-medium mt-1">
                  Thank You for Your Order!
                </h3>
                <p className="text-xs text-[#7A7478] max-w-md mx-auto mt-2">
                  Your order has been safely placed. We are preparing your luxury cosmetics parcel for dispatch.
                </p>
              </div>

              {/* Order receipt box */}
              <div className="bg-[#FAF7F5] rounded-2xl p-5 border border-[#F0E6DE] max-w-md mx-auto text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#EBE0D7]">
                  <span className="text-[#8C868A]">Order Reference:</span>
                  <span className="font-mono font-bold text-[#1E1E24] text-sm">
                    {orderPlaced.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8C868A]">Destination Country:</span>
                  <span className="font-medium text-[#1E1E24]">
                    {selectedCountry.flag} {selectedCountry.name}
                  </span>
                </div>
                {orderPlaced.carrier && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#8C868A]">Shipping Carrier:</span>
                    <span className="font-medium text-[#1E1E24]">{orderPlaced.carrier}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[#8C868A]">Order Date:</span>
                  <span className="font-medium text-[#1E1E24]">{orderPlaced.date}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#EBE0D7] text-sm">
                  <span className="font-serif font-bold text-[#1E1E24]">Amount Paid / Due:</span>
                  <span className="font-bold text-[#C24560]">{orderPlaced.total}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/923474542881?text=${encodeURIComponent(
                    `Hi Pretty Puff! 🌸 I just placed international order #${orderPlaced.orderNumber}. Could you please confirm tracking details?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order Updates on WhatsApp</span>
                </a>
                <button
                  onClick={handleClose}
                  className="py-3 px-6 bg-[#1E1E24] hover:bg-[#C24560] text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-[#F0E6DE] bg-[#FAF7F5]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C24560]" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C868A]">
                    Secure International Checkout
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-[#1E1E24] font-medium mt-1">
                  Shipping & Payment Details
                </h3>
              </div>

              {/* Form Body (Scrollable) */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* 1. Country Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2 flex items-center justify-between">
                    <span>1. Destination Country</span>
                    <span className="text-[10px] font-normal text-[#8C868A]">
                      Worldwide Delivery Available
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.code}
                      onChange={handleCountryChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D5CE] text-xs font-medium text-[#1E1E24] bg-white focus:outline-hidden focus:border-[#C24560] appearance-none cursor-pointer"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Customer Information */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E24]">
                    2. Contact Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address (for tracking)"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <span className="px-3 py-2.5 bg-gray-100 border border-[#E0D5CE] rounded-xl text-xs font-mono text-gray-600 shrink-0">
                        {selectedCountry.dialCode}
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="Mobile Phone Number *"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Delivery Address */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E24]">
                    3. Delivery Address
                  </label>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Street Address, Apartment, Suite *"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      {selectedCountry.code === 'PK' ? (
                        <select
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] bg-white focus:outline-hidden focus:border-[#C24560]"
                        >
                          {PAKISTAN_CITIES.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="City *"
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                        />
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State / Province"
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Postal / ZIP Code"
                        value={formData.postalCode}
                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Live CJdropshipping Carrier Methods */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C24560]" />
                      <span>4. Official CJ Live Shipping Method</span>
                    </label>
                    {isLoadingShipping && (
                      <span className="text-[11px] text-[#C24560] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Quoting CJ carriers...</span>
                      </span>
                    )}
                  </div>

                  {shippingError && shippingMethods.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Notice:</strong> {shippingError}
                      </div>
                    </div>
                  ) : shippingMethods.length > 0 ? (
                    <div className="space-y-2">
                      {shippingMethods.slice(0, 4).map((method, idx) => {
                        const isSelected = selectedShippingMethod?.logisticName === method.logisticName;
                        return (
                          <label
                            key={idx}
                            onClick={() => setSelectedShippingMethod(method)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#C24560] bg-[#FDF0F2] ring-1 ring-[#C24560]'
                                : 'border-[#E0D5CE] hover:border-gray-400 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={isSelected}
                                onChange={() => setSelectedShippingMethod(method)}
                                className="accent-[#C24560]"
                              />
                              <div>
                                <div className="text-xs font-semibold text-[#1E1E24]">
                                  {method.logisticName}
                                </div>
                                <div className="text-[10px] text-[#7A7478]">
                                  Estimated transit: {method.logisticAging}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#1E1E24]">
                                {formatPrice(method.priceUsd)}
                              </span>
                              <span className="block text-[10px] text-gray-400 font-mono">
                                (${method.priceUsd.toFixed(2)} USD)
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600">
                      Standard Global Tracked Delivery ({formatPrice(4.99)})
                    </div>
                  )}
                </div>

                {/* 5. Payment Methods */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2">
                    5. Payment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* COD (Only eligible for Pakistan) */}
                    {selectedCountry.codEligible && (
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.paymentMethod === 'cod'
                            ? 'border-[#C24560] bg-[#FDF0F2]'
                            : 'border-[#E0D5CE] hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                          className="accent-[#C24560]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-[#1E1E24]">
                            Cash on Delivery (COD)
                          </div>
                          <div className="text-[10px] text-[#7A7478]">
                            Pay cash when your parcel arrives
                          </div>
                        </div>
                      </label>
                    )}

                    {/* International Credit/Debit Card */}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.paymentMethod === 'card'
                          ? 'border-[#C24560] bg-[#FDF0F2]'
                          : 'border-[#E0D5CE] hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'card'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                        className="accent-[#C24560]"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#1E1E24] flex items-center justify-between">
                          <span>Credit / Debit Card</span>
                          <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="text-[10px] text-[#7A7478]">
                          Visa, Mastercard, Amex
                        </div>
                      </div>
                    </label>

                    {/* Bank Wire / Transfer */}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.paymentMethod === 'bank'
                          ? 'border-[#C24560] bg-[#FDF0F2]'
                          : 'border-[#E0D5CE] hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'bank'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                        className="accent-[#C24560]"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#1E1E24] flex items-center justify-between">
                          <span>Bank Wire Transfer</span>
                          <Building className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="text-[10px] text-[#7A7478]">
                          Direct IBAN / Wire instructions
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Customs & Tax Notice */}
                <div className="p-3 bg-[#FCFAF8] rounded-xl border border-[#F0E6DE] text-[11px] text-[#7A7478] space-y-1">
                  <div className="font-semibold text-[#1E1E24] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Import Customs & VAT Transparency</span>
                  </div>
                  <p>
                    Prices display in {selectedCurrency}. International orders ship via official CJdropshipping fulfillment. Depending on your destination country's regulations, local customs duties or VAT may be evaluated upon import.
                  </p>
                </div>
              </div>

              {/* Order Summary Footer */}
              <div className="p-6 bg-[#FAF7F5] border-t border-[#F0E6DE] space-y-3">
                <div className="space-y-1 text-xs text-[#7A7478]">
                  <div className="flex justify-between">
                    <span>Products Subtotal ({cart.length} items):</span>
                    <span className="font-semibold text-[#1E1E24]">
                      {formatPrice(cartSubtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#C24560]">
                      <span>Discount ({couponCode}):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping to {selectedCountry.name}:</span>
                    <span className="font-semibold text-[#1E1E24]">
                      {formatPrice(currentShippingCostUsd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-[#1E1E24] pt-2 border-t border-[#E0D5CE]">
                    <span>Total Amount:</span>
                    <div className="text-right">
                      <span className="text-[#C24560]">{formatPrice(grandTotalUsd)}</span>
                      <span className="block text-[10px] font-mono text-gray-500 font-normal">
                        (Equivalent to ${grandTotalUsd.toFixed(2)} USD)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-[#1E1E24] hover:bg-[#C24560] disabled:bg-gray-400 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order ({formatPrice(grandTotalUsd)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
