import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Truck,
  Check,
  Tag,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatPKR, PriceDisplay } from '../components/PriceDisplay';
import { ProductCard } from '../components/ProductCard';
import { QuantitySelector } from '../components/QuantitySelector';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    shippingCost,
    discountAmount,
    couponCode,
    applyCoupon,
    removeCoupon,
    cartTotal,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    navigateTo,
    setIsCheckoutModalOpen,
  } = useShop();

  const [inputCoupon, setInputCoupon] = useState('');

  const progressPercent = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    if (applyCoupon(inputCoupon)) {
      setInputCoupon('');
    }
  };

  const recommendedProducts = PRODUCTS.filter(
    p => !cart.some(c => c.product.id === p.id)
  ).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: 'Your Shopping Bag',
            active: true,
          },
        ]}
      />

      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1E24] mb-2">
          Your Beauty Bag
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Review your chosen makeup, skincare, and fragrance selections before checking out.
        </p>
      </div>

      {/* Free Delivery Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5F2] border border-[#F0E6DE] mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium mb-2">
          <span className="flex items-center gap-2 text-[#1E1E24]">
            <Truck className="w-4 h-4 text-[#C24560]" />
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-[#258237] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Congratulations! You unlocked Free Nationwide
                Delivery.
              </span>
            ) : (
              <span>
                Add <strong className="text-[#C24560]">{formatPKR(amountNeededForFreeShipping)}</strong>{' '}
                more to your bag for <strong>Free Delivery</strong>!
              </span>
            )}
          </span>
          <span className="text-[11px] text-[#7A7478]">
            Free Shipping Threshold: {formatPKR(freeShippingThreshold)}
          </span>
        </div>
        <div className="w-full h-2 bg-[#E8DDD5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C24560] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {cart.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center rounded-3xl bg-white border border-[#F0E6DE] max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-3xl text-[#1E1E24] mb-2">
            Your shopping bag is empty
          </h2>
          <p className="text-sm text-[#7A7478] max-w-sm mx-auto mb-8 font-sans">
            Looks like you haven't added any luxury items yet. Explore our bestsellers and everyday essentials!
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="px-8 py-3.5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-md"
          >
            Explore Cosmetics
          </button>
        </div>
      ) : (
        /* Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Items List (cols: 8) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F0E6DE] p-6 sm:p-8 divide-y divide-[#F0E6DE]">
            {cart.map(item => (
              <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
                {/* Product Image */}
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#FAF5F2] border border-[#F0E6DE] shrink-0 cursor-pointer"
                  onClick={() =>
                    navigateTo('product', { productSlug: item.product.slug })
                  }
                >
                  <img
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#C24560] font-semibold">
                          {item.product.category}
                        </span>
                        <h3
                          onClick={() =>
                            navigateTo('product', { productSlug: item.product.slug })
                          }
                          className="font-serif text-lg text-[#1E1E24] hover:text-[#C24560] cursor-pointer transition-colors"
                        >
                          {item.product.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#9E959B] hover:text-[#C24560] p-1.5 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Variant / Shade notes */}
                    {(item.selectedColour || item.selectedSize) && (
                      <div className="flex flex-wrap gap-2 text-xs text-[#7A7478] mt-1">
                        {item.selectedColour && (
                          <span className="bg-[#FAF5F2] px-2.5 py-0.5 rounded-full border border-[#F0E6DE]">
                            Shade: <strong>{item.selectedColour}</strong>
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="bg-[#FAF5F2] px-2.5 py-0.5 rounded-full border border-[#F0E6DE]">
                            Size: <strong>{item.selectedSize}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity & Item Subtotal */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#F8F5F2] mt-4">
                    <div className="flex items-center gap-3">
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        onDecrease={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        size="md"
                      />
                      <span className="text-xs text-[#7A7478] hidden sm:inline">
                        @ {formatPKR(item.product.salePrice ?? item.product.price)} each
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-serif text-lg font-bold text-[#1E1E24]">
                        {formatPKR(
                          (item.product.salePrice ?? item.product.price) * item.quantity
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 flex items-center justify-between">
              <button
                onClick={() => navigateTo('shop')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E1E24] hover:text-[#C24560] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>

          {/* Order Summary (cols: 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-[#F0E6DE] p-6 sm:p-7 space-y-5">
              <h2 className="font-serif text-xl text-[#1E1E24]">Order Summary</h2>

              {/* Coupon Form */}
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#FDF0F2] px-3.5 py-2.5 rounded-xl text-xs border border-[#F8CAD1]">
                  <div className="flex items-center gap-2 text-[#C24560] font-semibold">
                    <Tag className="w-4 h-4" />
                    <span>Coupon "{couponCode}" (10% Off)</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[#7A7478] hover:text-[#C24560] text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={e => setInputCoupon(e.target.value)}
                    placeholder='Coupon code ("PRETTY10")'
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden uppercase font-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Breakdown */}
              <div className="space-y-3 text-xs text-[#5E585D] pt-2 border-t border-[#F5EFEB]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-[#1E1E24]">
                    {formatPKR(cartSubtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C24560]">
                    <span>Discount</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-[#258237] font-semibold uppercase">
                        FREE
                      </span>
                    ) : (
                      formatPKR(shippingCost)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-serif font-bold text-[#1E1E24] pt-3 border-t border-[#F0E6DE]">
                  <span>Total Due</span>
                  <span className="text-[#C24560]">{formatPKR(cartTotal)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full py-3.5 px-6 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-[11px] text-[#7A7478] space-y-2 border-t border-[#F5EFEB]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Secure Cash on Delivery & Direct Bank options</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C24560]" />
                  <span>Fast 2-4 business day delivery nationwide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products Slider/Grid */}
      {recommendedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#F0E6DE]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C24560] mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Curated For Your Routine</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24] mb-8">
            You Might Also Adore
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recommendedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
