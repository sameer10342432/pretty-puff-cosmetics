import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { QuantitySelector } from './QuantitySelector';
import { RatingStars } from './RatingStars';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    closeQuickView,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo,
  } = useShop();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColour, setSelectedColour] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (quickViewProduct) {
      setActiveImageIndex(0);
      setSelectedColour(quickViewProduct.colours?.[0]?.name);
      setSelectedSize(quickViewProduct.sizes?.[0]);
      setQuantity(1);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const inWishlist = isInWishlist(quickViewProduct.id);

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity, undefined, selectedColour, selectedSize);
    closeQuickView();
  };

  const handleFullDetails = () => {
    closeQuickView();
    navigateTo('product', { productSlug: quickViewProduct.slug });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeQuickView}
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-10">
        <div className="inline-block w-full max-w-4xl bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all relative z-10 border border-[#F0E6DE]">
          {/* Close button */}
          <button
            onClick={closeQuickView}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 text-[#4A4549] hover:text-[#1E1E24] hover:bg-white flex items-center justify-center shadow-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Image Gallery */}
            <div className="p-6 bg-[#FAF5F2] flex flex-col justify-between">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xs">
                <img
                  src={quickViewProduct.images[activeImageIndex] || quickViewProduct.thumbnail}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover object-center"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {quickViewProduct.discount && (
                    <Badge variant="sale">-{quickViewProduct.discount}% OFF</Badge>
                  )}
                  {quickViewProduct.isNew && <Badge variant="new">NEW</Badge>}
                </div>
              </div>

              {/* Thumbnails */}
              {quickViewProduct.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {quickViewProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-white transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#C24560] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Controls */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8C868A] font-medium mb-1.5">
                  <span>{quickViewProduct.brand}</span>
                  <span className="capitalize text-[#C24560] font-semibold">
                    {quickViewProduct.category}
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24] leading-snug mb-3">
                  {quickViewProduct.name}
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <RatingStars
                    rating={quickViewProduct.rating}
                    reviewCount={quickViewProduct.reviewCount}
                    size="sm"
                  />
                  <span className="text-xs text-[#258237] font-semibold bg-[#EAF5EC] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> In Stock ({quickViewProduct.stock} available)
                  </span>
                </div>

                <div className="mb-4">
                  <PriceDisplay
                    price={quickViewProduct.price}
                    salePrice={quickViewProduct.salePrice}
                    size="xl"
                  />
                </div>

                <p className="text-xs sm:text-sm text-[#686266] leading-relaxed mb-6 font-sans">
                  {quickViewProduct.shortDescription}
                </p>

                {/* Shades Selector */}
                {quickViewProduct.colours && quickViewProduct.colours.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-2">
                      Shade: <span className="font-normal text-[#C24560]">{selectedColour}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickViewProduct.colours.map(col => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setSelectedColour(col.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                            selectedColour === col.name
                              ? 'border-[#1E1E24] bg-[#F5EFEB] font-medium'
                              : 'border-[#E0D5CE] hover:border-[#1E1E24]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes Selector */}
                {quickViewProduct.sizes && quickViewProduct.sizes.length > 1 && (
                  <div className="mb-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-2">
                      Size: <span className="font-normal text-[#7A7478]">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickViewProduct.sizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                            selectedSize === sz
                              ? 'border-[#1E1E24] bg-[#1E1E24] text-white font-medium'
                              : 'border-[#E0D5CE] text-[#4A4549] hover:border-[#1E1E24]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity, Add to Cart & Wishlist */}
              <div className="pt-4 border-t border-[#F0E6DE] space-y-4">
                <div className="flex items-center gap-3">
                  <QuantitySelector
                    quantity={quantity}
                    onIncrease={() => setQuantity(q => Math.min(quickViewProduct.stock, q + 1))}
                    onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
                    size="md"
                  />

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(quickViewProduct)}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${
                      inWishlist
                        ? 'border-[#C24560] bg-[#FDF0F2] text-[#C24560]'
                        : 'border-[#E0D5CE] text-[#4A4549] hover:text-[#C24560] hover:border-[#C24560]'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 ${inWishlist ? 'fill-[#C24560]' : 'fill-transparent'}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#7A7478]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Guaranteed 100% Authentic Product</span>
                  </div>

                  <button
                    onClick={handleFullDetails}
                    className="font-medium text-[#C24560] hover:underline flex items-center gap-1"
                  >
                    <span>Full Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
