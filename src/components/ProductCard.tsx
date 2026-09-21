import React, { useState } from 'react';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const { navigateTo, addToCart, toggleWishlist, isInWishlist, openQuickView } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColour, setSelectedColour] = useState<string | undefined>(
    product.colours?.[0]?.name
  );

  const inWishlist = isInWishlist(product.id);
  const hasSecondaryImage = product.images.length > 1;
  const currentImage = isHovered && hasSecondaryImage ? product.images[1] : product.images[0];

  const handleCardClick = () => {
    navigateTo('product', { productSlug: product.slug });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, undefined, selectedColour, product.sizes?.[0]);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickView(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white rounded-2xl p-3 border border-[#F0E6DE]/80 hover:border-[#E8D1D5] transition-all duration-300 hover:shadow-md ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#FAF5F2] cursor-pointer">
        <img
          src={currentImage}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.discount && product.discount > 0 ? (
            <Badge variant="sale">-{product.discount}% OFF</Badge>
          ) : null}
          {product.isNew && <Badge variant="new">NEW</Badge>}
          {product.isBestSeller && !product.discount && (
            <Badge variant="bestseller">BESTSELLER</Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={handleWishlistClick}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            inWishlist
              ? 'bg-[#C24560] text-white'
              : 'bg-white/90 text-[#4A4549] hover:bg-white hover:text-[#C24560]'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-90 ${
              inWishlist ? 'fill-white' : 'fill-transparent'
            }`}
          />
        </button>

        {/* Quick View Button on Desktop Hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 hidden sm:flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleQuickViewClick}
            className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-xs text-[#1E1E24] text-xs font-semibold rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 pt-3">
        {/* Brand & Category */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#8C868A] font-medium mb-1">
          <span>{product.brand}</span>
          <span className="capitalize text-[#B3A8A4]">{product.subcategory.replace('-', ' ')}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-serif text-base lg:text-lg text-[#1E1E24] line-clamp-2 leading-snug group-hover:text-[#C24560] transition-colors mb-1.5 cursor-pointer">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mb-2">
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
        </div>

        {/* Color Shades Previews if available */}
        {product.colours && product.colours.length > 0 && (
          <div className="flex items-center gap-1 mb-2.5" onClick={e => e.stopPropagation()}>
            {product.colours.slice(0, 5).map((col, idx) => (
              <button
                key={idx}
                title={col.name}
                onClick={() => setSelectedColour(col.name)}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  selectedColour === col.name
                    ? 'scale-125 ring-1 ring-offset-1 ring-[#1E1E24]'
                    : 'border-black/15 hover:scale-110'
                }`}
                style={{ backgroundColor: col.hex }}
              />
            ))}
            {product.colours.length > 5 && (
              <span className="text-[10px] text-[#8C868A] pl-0.5 font-medium">
                +{product.colours.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Price & Add to Cart Button */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-[#F5EFEB]">
          <PriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            size="md"
            showDiscountPercent={false}
          />

          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleQuickAdd}
            className="w-8 h-8 rounded-full bg-[#1E1E24] hover:bg-[#C24560] text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xs"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
