import React from 'react';
import { ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';

interface ArticleProductCardProps {
  product: Product;
}

export const ArticleProductCard: React.FC<ArticleProductCardProps> = ({ product }) => {
  const { addToCart, navigateTo } = useShop();

  return (
    <div
      id={`article-product-${product.id}`}
      className="my-6 overflow-hidden rounded-2xl border border-rose-100 bg-linear-to-r from-rose-50/40 via-white to-stone-50 p-4 sm:p-5 shadow-2xs"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 border border-stone-100 shadow-2xs">
            <img
              src={product.thumbnail || product.images[0]}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
              Featured in this routine
            </span>
            <h4
              onClick={() => navigateTo('product', { productSlug: product.slug })}
              className="mt-1 cursor-pointer font-serif text-base font-bold text-stone-900 transition-colors hover:text-rose-600"
            >
              {product.name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">
                Rs. {product.salePrice || product.price}
              </span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-xs text-stone-400 line-through">
                  Rs. {product.price}
                </span>
              )}
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[11px] font-medium text-stone-600">
                  {product.rating} ({product.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:shrink-0">
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to Bag
          </button>
          <button
            type="button"
            onClick={() => navigateTo('product', { productSlug: product.slug })}
            className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            View
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
