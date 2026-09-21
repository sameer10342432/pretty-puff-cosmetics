import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatPKR, PriceDisplay } from '../components/PriceDisplay';
import { ProductCard } from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';

export const WishlistPage: React.FC = () => {
  const {
    wishlist,
    removeFromWishlist,
    addToCart,
    navigateTo,
  } = useShop();

  const handleMoveToCart = (product: any) => {
    addToCart(
      product,
      1,
      undefined,
      product.colours?.[0]?.name,
      product.sizes?.[0]
    );
    removeFromWishlist(product.id);
  };

  const trendingBeauty = PRODUCTS.filter(
    p => !wishlist.some(w => w.id === p.id)
  ).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'My Wishlist',
            active: true,
          },
        ]}
      />

      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1E24] mb-2">
          My Saved Beauty Finds
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Keep track of your dream skincare formulas and desired shades ({wishlist.length} items saved).
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-[#F0E6DE] max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl text-[#1E1E24] mb-2">
            Your wishlist is currently empty
          </h2>
          <p className="text-sm text-[#7A7478] max-w-sm mx-auto mb-6">
            Tap the heart icon on any product to save it here for later.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="px-8 py-3 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-4 border border-[#F0E6DE] flex flex-col justify-between shadow-xs"
            >
              <div>
                <div
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF5F2] cursor-pointer mb-3"
                  onClick={() =>
                    navigateTo('product', { productSlug: product.slug })
                  }
                >
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-[#C24560] flex items-center justify-center hover:bg-white shadow-xs"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C24560] mb-1">
                  {product.category}
                </div>

                <h3
                  onClick={() =>
                    navigateTo('product', { productSlug: product.slug })
                  }
                  className="font-serif text-base text-[#1E1E24] hover:text-[#C24560] cursor-pointer line-clamp-1 mb-2"
                >
                  {product.name}
                </h3>

                <div className="mb-4">
                  <PriceDisplay
                    price={product.price}
                    salePrice={product.salePrice}
                    size="md"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F5EFEB] space-y-2">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="w-full py-2.5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trending beauty recommendations */}
      {trendingBeauty.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#F0E6DE]">
          <h2 className="font-serif text-2xl text-[#1E1E24] mb-6">
            Trending Beauty Picks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trendingBeauty.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
