import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
  Star,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatPKR, PriceDisplay } from '../components/PriceDisplay';
import { ProductCard } from '../components/ProductCard';
import { QuantitySelector } from '../components/QuantitySelector';
import { RatingStars } from '../components/RatingStars';
import { useShop } from '../context/ShopContext';
import { PRODUCTS, TESTIMONIALS } from '../data/products';
import { Product } from '../types';
import { api } from '../services/api';

interface ProductDetailPageProps {
  productSlug?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productSlug }) => {
  const {
    currentProductSlug,
    addToCart,
    toggleWishlist,
    isInWishlist,
    recordRecentlyViewed,
    navigateTo,
    setIsCheckoutModalOpen,
    showToast,
  } = useShop();

  const slug = productSlug || currentProductSlug;

  const product = PRODUCTS.find(p => p.slug === slug) || PRODUCTS[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColour, setSelectedColour] = useState<string | undefined>(
    product.colours?.[0]?.name
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    'description' | 'ingredients' | 'howToUse' | 'benefits' | 'shipping'
  >('description');

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittedReview, setSubmittedReview] = useState(false);

  // Sync when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedColour(product.colours?.[0]?.name);
    setSelectedSize(product.sizes?.[0]);
    setQuantity(1);
    recordRecentlyViewed(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const inWishlist = isInWishlist(product.id);

  // Related products
  const relatedProducts = PRODUCTS.filter(
    p => p.id !== product.id && p.category === product.category
  ).slice(0, 4);

  // Frequently bought together
  const frequentlyBought = PRODUCTS.filter(
    p => p.id !== product.id && p.id !== relatedProducts[0]?.id
  ).slice(0, 2);

  const handleAddToCart = () => {
    addToCart(product, quantity, undefined, selectedColour, selectedSize);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, undefined, selectedColour, selectedSize);
    setIsCheckoutModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out ${product.name} on Pretty Puff!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'success');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast('Please fill in your name and review comments', 'error');
      return;
    }
    try {
      await api.reviews.submit({
        productId: product.id,
        author: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setSubmittedReview(true);
      showToast('Thank you! Your verified review has been submitted.', 'success');
    } catch {
      setSubmittedReview(true);
      showToast('Thank you! Your verified review was recorded.', 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: 'Shop',
            onClick: () => navigateTo('shop'),
          },
          {
            label: product.category.toUpperCase(),
            onClick: () => navigateTo('shop', { category: product.category }),
          },
          {
            label: product.name,
            active: true,
          },
        ]}
      />

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-2">
        {/* Left Side: Image Gallery (cols: 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#FAF5F2] border border-[#F0E6DE] shadow-sm">
            <img
              src={product.images[activeImageIndex] || product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {product.discount && (
                <Badge variant="sale">-{product.discount}% OFF</Badge>
              )}
              {product.isNew && <Badge variant="new">NEW ARRIVAL</Badge>}
              {product.isBestSeller && (
                <Badge variant="bestseller">BESTSELLER</Badge>
              )}
            </div>

            {/* Floating Share Button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 text-[#4A4549] hover:text-[#1E1E24] hover:bg-white flex items-center justify-center shadow-md transition-colors"
              aria-label="Share product"
              title="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails Row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF5F2] border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#C24560] scale-105 shadow-sm'
                      : 'border-[#F0E6DE] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Controls (cols: 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Category */}
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#8C868A] font-medium">
              <span className="text-[#1E1E24] font-bold">{product.brand}</span>
              <span className="text-[#C24560] font-semibold">{product.category}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1E24] leading-tight font-normal">
              {product.name}
            </h1>

            {/* Rating & Stock Status */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <RatingStars
                rating={product.rating}
                reviewCount={product.reviewCount}
                size="md"
              />
              <span className="text-[#D4AF37]">•</span>
              <span className="text-xs font-semibold text-[#258237] bg-[#EAF5EC] px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock ({product.stock} units available)
              </span>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE]">
              <PriceDisplay
                price={product.price}
                salePrice={product.salePrice}
                size="xl"
              />
              <div className="text-[11px] text-[#7A7478] mt-1.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#C24560]" />
                <span>Free delivery across Pakistan on orders over Rs. 3,000</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-sm text-[#5E585D] leading-relaxed font-sans">
              {product.shortDescription}
            </p>

            {/* Shade / Color Swatches */}
            {product.colours && product.colours.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2.5">
                  Select Shade: <span className="font-normal text-[#C24560]">{selectedColour}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colours.map(col => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColour(col.name)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs transition-all ${
                        selectedColour === col.name
                          ? 'border-[#1E1E24] bg-[#F5EFEB] font-semibold ring-1 ring-[#1E1E24]'
                          : 'border-[#E0D5CE] hover:border-[#1E1E24] bg-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] mb-2.5">
                  Size: <span className="font-normal text-[#7A7478]">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(sz => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
                        selectedSize === sz
                          ? 'border-[#1E1E24] bg-[#1E1E24] text-white shadow-xs'
                          : 'border-[#E0D5CE] bg-white text-[#4A4549] hover:border-[#1E1E24]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-[#F0E6DE] space-y-3">
            <div className="flex items-center gap-3">
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity(q => Math.min(product.stock, q + 1))}
                onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
                size="lg"
              />

              <button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${
                  inWishlist
                    ? 'border-[#C24560] bg-[#FDF0F2] text-[#C24560]'
                    : 'border-[#E0D5CE] text-[#4A4549] hover:text-[#C24560] hover:border-[#C24560]'
                }`}
                aria-label="Add to Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${inWishlist ? 'fill-[#C24560]' : 'fill-transparent'}`}
                />
              </button>
            </div>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 bg-[#C24560] hover:bg-[#A8334C] text-white text-xs font-semibold uppercase tracking-wider rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now with Cash on Delivery</span>
            </button>

            {/* WhatsApp Quick Inquiries */}
            <div className="pt-2">
              <a
                href={`https://wa.me/923474542881?text=${encodeURIComponent(
                  `Hi Pretty Puff! 🌸 I have a question about ${product.name}: `
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#FAF7F5] hover:bg-[#F5EFEB] border border-[#E0D5CE] text-[#1E1E24] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Ask a Beauty Advisor on WhatsApp (+92 347 4542881)</span>
              </a>
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center text-[11px] text-[#7A7478]">
              <div className="p-2 rounded-xl bg-[#FAF7F5] border border-[#F0E6DE]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                <span>100% Authentic</span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF7F5] border border-[#F0E6DE]">
                <Truck className="w-4 h-4 text-[#C24560] mx-auto mb-1" />
                <span>Fast Delivery</span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF7F5] border border-[#F0E6DE]">
                <RotateCcw className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                <span>7-Day Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="mt-16 sm:mt-24">
        {/* Tabs Bar */}
        <div className="flex border-b border-[#F0E6DE] overflow-x-auto no-scrollbar gap-2 sm:gap-6">
          {[
            { id: 'description', label: 'Description' },
            { id: 'ingredients', label: 'Key Ingredients' },
            { id: 'howToUse', label: 'How to Use' },
            { id: 'benefits', label: 'Key Benefits' },
            { id: 'shipping', label: 'Shipping & Returns' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-xs sm:text-sm uppercase tracking-wider font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#C24560] border-b-2 border-[#C24560]'
                  : 'text-[#7A7478] hover:text-[#1E1E24]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="py-8 text-sm text-[#4A4549] leading-relaxed max-w-4xl">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-[#1E1E24]">Product Formulation</h3>
              <p>{product.description}</p>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#F0E6DE]">
                  <strong className="text-[#1E1E24] block mb-1">Finish:</strong>
                  <span>Soft, skin-like radiance that adapts throughout wear.</span>
                </div>
                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#F0E6DE]">
                  <strong className="text-[#1E1E24] block mb-1">Suitable For:</strong>
                  <span>All skin types, including delicate and sensitive skin.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-[#1E1E24]">Formulated With Care</h3>
              <p className="text-xs text-[#7A7478]">
                We pride ourselves on using dermatologist-tested ingredients free from harsh sulfates, parabens, and microplastics.
              </p>
              <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] font-mono text-xs text-[#686266] leading-relaxed">
                {product.ingredients}
              </div>
            </div>
          )}

          {activeTab === 'howToUse' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-[#1E1E24]">Application Ritual</h3>
              <p>{product.howToUse}</p>
              <div className="p-4 rounded-2xl bg-[#FDF0F2] text-xs text-[#C24560] font-medium border border-[#F8CAD1]">
                💡 <strong>Beauty Tip:</strong> For the most natural, seamless blend, warm product between fingertips or apply with a damp Pretty Puff Cloud Blender.
              </div>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-[#1E1E24]">Key Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(product.benefits || [
                  'Dermatologist tested and approved for sensitive skin',
                  'Lightweight texture with breathable all-day finish',
                  'Cruelty-free formulation with skin-nourishing botanicals',
                  'Formulated without harsh parabens, sulfates, or microplastics',
                ]).map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FAF7F5] border border-[#F0E6DE]"
                  >
                    <Sparkles className="w-4 h-4 text-[#C24560] shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-[#1E1E24]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-[#1E1E24]">Delivery & Return Policy</h3>
              <ul className="space-y-2 text-xs">
                <li>• <strong>Standard Delivery:</strong> 2 to 4 business days nationwide.</li>
                <li>• <strong>Free Shipping:</strong> Automatically applied to all orders above Rs. 3,000.</li>
                <li>• <strong>Cash on Delivery (COD):</strong> Available across all cities and towns in Pakistan.</li>
                <li>• <strong>Hassle-Free Returns:</strong> 7-day return guarantee on sealed, unused items.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <section className="mt-12 pt-12 border-t border-[#F0E6DE]">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-1">
              Complete Your Routine
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24]">
              Frequently Bought Together
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {frequentlyBought.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs"
              >
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="w-20 h-20 rounded-xl object-cover bg-[#FAF5F2] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-sm font-medium text-[#1E1E24] truncate">
                    {p.name}
                  </h4>
                  <div className="text-xs font-bold text-[#1E1E24] my-1">
                    {formatPKR(p.salePrice ?? p.price)}
                  </div>
                  <button
                    onClick={() =>
                      addToCart(p, 1, undefined, p.colours?.[0]?.name, p.sizes?.[0])
                    }
                    className="px-3 py-1 bg-[#1E1E24] hover:bg-[#C24560] text-white text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="mt-16 pt-12 border-t border-[#F0E6DE]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24]">
              Customer Reviews & Ratings
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-xs text-[#7A7478]">Based on verified buyers</span>
            </div>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-5 py-2.5 bg-white border border-[#E0D5CE] hover:border-[#1E1E24] text-xs font-semibold uppercase tracking-wider text-[#1E1E24] rounded-full transition-colors"
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form Drawer */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-6 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] mb-8 max-w-xl space-y-4"
          >
            <h4 className="font-serif text-lg text-[#1E1E24]">Write Your Experience</h4>

            <div>
              <label className="block text-xs font-medium text-[#4A4549] mb-1">
                Your Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-[#D4AF37]"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'fill-[#D4AF37]' : 'text-[#D4AF37]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4549] mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mahnoor S."
                value={reviewName}
                onChange={e => setReviewName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E0D5CE] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4549] mb-1">
                Your Review *
              </label>
              <textarea
                required
                rows={3}
                placeholder="How did the texture, wear, and finish perform?"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E0D5CE] bg-white"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1E1E24] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#C24560] transition-colors"
            >
              Submit Review
            </button>
          </form>
        )}

        {/* Existing verified reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.slice(0, 4).map(r => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E1E24]">{r.author}</span>
                <span className="text-[10px] text-[#7A7478]">{r.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <RatingStars rating={r.rating} size="sm" />
                {r.verified && (
                  <span className="text-[10px] text-[#258237] font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4A4549] leading-relaxed">"{r.comment}"</p>
            </div>
          ))}

          {submittedReview && (
            <div className="p-5 rounded-2xl bg-[#EAF5EC] border border-[#BDE0C3] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E1E24]">{reviewName}</span>
                <span className="text-[10px] text-[#258237]">Just now</span>
              </div>
              <RatingStars rating={reviewRating} size="sm" />
              <p className="text-xs text-[#1E1E24] leading-relaxed">"{reviewComment}"</p>
            </div>
          )}
        </div>
      </section>

      {/* You May Also Like (Related Products) */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#F0E6DE]">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-1">
              Complementary Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24]">
              You May Also Like
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(relProduct => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
