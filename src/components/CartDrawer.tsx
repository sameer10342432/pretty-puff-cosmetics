import React, { useState } from 'react';
import {
  X,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Truck,
  Tag,
  Check,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { formatPKR, PriceDisplay } from './PriceDisplay';
import { QuantitySelector } from './QuantitySelector';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
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
    addToCart,
  } = useShop();

  const [inputCoupon, setInputCoupon] = useState('');

  if (!isCartDrawerOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );

  const recommendedProducts = PRODUCTS.filter(
    p => !cart.some(item => item.product.id === p.id)
  ).slice(0, 3);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const success = applyCoupon(inputCoupon);
    if (success) {
      setInputCoupon('');
    }
  };

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF8] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#F0E6DE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C24560]" />
              <h2 className="font-serif text-xl sm:text-2xl text-[#1E1E24]">
                Your Beauty Bag
              </h2>
              <span className="text-xs text-[#7A7478] font-sans">
                ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-[#7A7478] hover:text-[#1E1E24] rounded-full hover:bg-[#F5EFEB] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#FAF5F2] px-5 py-3 border-b border-[#F0E6DE]">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-1.5 text-[#1E1E24]">
                <Truck className="w-4 h-4 text-[#C24560]" />
                {amountNeededForFreeShipping === 0 ? (
                  <span className="text-[#258237] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> You unlocked Free Delivery across Pakistan!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#C24560]">{formatPKR(amountNeededForFreeShipping)}</strong> for Free Delivery
                  </span>
                )}
              </span>
              <span className="text-[11px] text-[#7A7478]">
                Goal: {formatPKR(freeShippingThreshold)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E8DDD5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C24560] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-[#F0E6DE]">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl text-[#1E1E24] mb-2">
                  Your bag is empty
                </h3>
                <p className="text-sm text-[#7A7478] max-w-xs mx-auto mb-6">
                  Discover our curated skincare, makeup and luxury scents to begin your beauty routine.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigateTo('shop');
                  }}
                  className="px-6 py-2.5 bg-[#1E1E24] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#C24560] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F5EFEB] shrink-0 border border-[#F0E6DE]">
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-serif font-medium text-[#1E1E24] line-clamp-1 hover:text-[#C24560] cursor-pointer">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#9E959B] hover:text-[#C24560] p-1 transition-colors shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variant / Shade */}
                        {(item.selectedColour || item.selectedVariant || item.selectedSize) && (
                          <div className="text-[11px] text-[#7A7478] mt-0.5 space-x-2">
                            {item.selectedColour && <span>Shade: {item.selectedColour}</span>}
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          </div>
                        )}
                      </div>

                      {/* Price & Quantity Row */}
                      <div className="flex items-center justify-between pt-2">
                        <QuantitySelector
                          quantity={item.quantity}
                          onIncrease={() => updateCartQuantity(item.id, item.quantity + 1)}
                          onDecrease={() => updateCartQuantity(item.id, item.quantity - 1)}
                          size="sm"
                        />
                        <div className="text-right">
                          <PriceDisplay
                            price={
                              (item.product.salePrice ?? item.product.price) * item.quantity
                            }
                            size="sm"
                            showDiscountPercent={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations Section inside Drawer */}
            {recommendedProducts.length > 0 && cart.length > 0 && (
              <div className="pt-5 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#C24560]" />
                  <span>You May Also Like</span>
                </div>
                <div className="space-y-2.5">
                  {recommendedProducts.map(rec => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F0E6DE]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rec.thumbnail}
                          alt={rec.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#F5EFEB] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#1E1E24] truncate">
                            {rec.name}
                          </div>
                          <div className="text-[11px] text-[#7A7478]">
                            {formatPKR(rec.salePrice ?? rec.price)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          addToCart(
                            rec,
                            1,
                            undefined,
                            rec.colours?.[0]?.name,
                            rec.sizes?.[0]
                          )
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#FDF0F2] text-[#C24560] rounded-md hover:bg-[#C24560] hover:text-white transition-colors shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Order Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#F0E6DE] space-y-3">
              {/* Promo Code Input */}
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#FDF0F2] px-3 py-2 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-[#C24560] font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon "{couponCode}" Applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[#7A7478] hover:text-[#C24560] text-[11px] underline"
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
                    placeholder='Promo code (try "PRETTY10")'
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E0D5CE] focus:outline-hidden focus:border-[#C24560] uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#F5EFEB] hover:bg-[#EBE0D7] text-xs font-semibold rounded-lg text-[#1E1E24] transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#6E686C] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1E1E24]">{formatPKR(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C24560]">
                    <span>Discount</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-[#258237] font-semibold uppercase text-[10px]">
                        FREE
                      </span>
                    ) : (
                      formatPKR(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-[#1E1E24] pt-2 border-t border-[#F0E6DE]">
                  <span>Estimated Total</span>
                  <span>{formatPKR(cartTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigateTo('cart');
                  }}
                  className="w-full py-2 bg-transparent text-[#7A7478] hover:text-[#1E1E24] text-xs font-medium text-center underline transition-colors"
                >
                  View Full Cart Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
