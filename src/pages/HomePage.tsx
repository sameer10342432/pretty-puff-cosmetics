import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Heart,
  Instagram,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { blogService } from '../services/blogService';
import { CategoryCard } from '../components/CategoryCard';
import { PriceDisplay } from '../components/PriceDisplay';
import { ProductCard } from '../components/ProductCard';
import { ProductGrid } from '../components/ProductGrid';
import { RatingStars } from '../components/RatingStars';
import { SectionHeading } from '../components/SectionHeading';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS, TESTIMONIALS } from '../data/products';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const { navigateTo, showToast } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const newArrivals = PRODUCTS.filter(p => p.isNew).slice(0, 8);
  const bestSellers = PRODUCTS.filter(p => p.isBestSeller).slice(0, 8);
  const featuredEssentials = PRODUCTS.filter(p => p.isFeatured).slice(0, 4);
  const journalArticles = blogService.getAllPosts().slice(0, 3);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    try {
      await api.newsletter.subscribe(newsletterEmail);
      setSubscribed(true);
      showToast('Welcome to the Pretty Puff Beauty Club! Check your inbox for 10% off.', 'success');
    } catch {
      setSubscribed(true);
      showToast('Welcome to the Pretty Puff Beauty Club! Check your inbox for 10% off.', 'success');
    }
  };

  const instagramShots = [
    {
      img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Morning Glow Routine',
    },
    {
      img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Velvet Matte Shades',
    },
    {
      img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Barrier Repair Essential',
    },
    {
      img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Cloud Blender Magic',
    },
    {
      img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Chérie Eau De Parfum',
    },
    {
      img: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80',
      handle: '@prettypuff.official',
      tag: 'Complexion Perfection',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* C. Hero Section */}
      <section className="relative overflow-hidden bg-[#FBF7F4] border-b border-[#F0E6DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDF0F2] border border-[#F8CAD1] text-xs font-semibold uppercase tracking-widest text-[#C24560]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Luxury Beauty Essentials • Pakistan</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#1E1E24] leading-[1.08] tracking-tight">
                Beauty That Feels <br className="hidden sm:inline" />
                <span className="italic font-light text-[#C24560]">Like You.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#5E585D] max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-light">
                Discover makeup, skincare, haircare and beauty essentials curated for your everyday
                glow. Lightweight formulas crafted with skin-loving ingredients.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  id="hero-shop-now-btn"
                  onClick={() => navigateTo('shop')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 active:scale-95"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="hero-explore-btn"
                  onClick={() => navigateTo('shop', { category: 'skincare' })}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#FDF0F2] text-[#1E1E24] hover:text-[#C24560] border border-[#E0D5CE] text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Explore Skincare</span>
                </button>
              </div>

              {/* Trust Badges under Hero */}
              <div className="pt-6 border-t border-[#EBE0D7]/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#7A7478]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>100% Authentic Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C24560]" />
                  <span>Free Shipping Over Rs. 3,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span>4.9 / 5 Customer Rating</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual (Editorial Cosmetics Composition) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#FDF0F2] to-[#F5ECE5] rounded-3xl -z-10 blur-xl opacity-70" />

                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85"
                    alt="Pretty Puff Luxury Beauty Collection"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />

                  {/* Floating Highlight Card */}
                  <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-[#C24560] uppercase tracking-wider">
                        New Arrival
                      </div>
                      <div className="font-serif text-sm text-[#1E1E24] font-medium">
                        Rose Petal Cream Blush
                      </div>
                      <div className="text-xs font-semibold text-[#1E1E24]">Rs. 1,399</div>
                    </div>
                    <button
                      onClick={() =>
                        navigateTo('product', {
                          productSlug: 'pretty-puff-rose-petal-cream-blush',
                        })
                      }
                      className="px-3.5 py-1.5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-[11px] font-semibold rounded-full transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Curated Collections"
          title="Shop by Category"
          subtitle="Explore our comprehensive beauty spectrum, formulated to elevate every step of your self-care ritual."
          action={{
            label: 'View All Categories',
            onClick: () => navigateTo('shop'),
          }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {CATEGORIES.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* E. New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Fresh In The Studio"
          title="New Arrivals"
          subtitle="The latest innovations in clean pigments, skin-barrier nourishment, and radiant finishes."
          action={{
            label: 'Shop All New Arrivals',
            onClick: () => navigateTo('shop', { search: 'new' }),
          }}
        />

        <ProductGrid products={newArrivals} />
      </section>

      {/* G. Beauty Essentials - Interactive Feature Section */}
      <section className="bg-[#FAF5F2] border-y border-[#F0E6DE] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Everyday Radiance"
            title="Everyday Beauty Essentials"
            subtitle="Thoughtfully formulated staples designed to blend effortlessly into your daily life."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-[#F0E6DE] shadow-xs text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center font-serif text-2xl font-semibold mb-4">
                01
              </div>
              <h3 className="font-serif text-xl text-[#1E1E24] mb-2">Hydrate & Protect</h3>
              <p className="text-xs text-[#686266] leading-relaxed mb-4">
                Start with our Dew Barrier SPF 50+ and 15% Vitamin C Serum to protect and illuminate your natural barrier.
              </p>
              <button
                onClick={() => navigateTo('shop', { category: 'skincare' })}
                className="text-xs font-semibold text-[#C24560] hover:underline mt-auto"
              >
                Explore Skincare →
              </button>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-[#F0E6DE] shadow-xs text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center font-serif text-2xl font-semibold mb-4">
                02
              </div>
              <h3 className="font-serif text-xl text-[#1E1E24] mb-2">Perfect Your Complexion</h3>
              <p className="text-xs text-[#686266] leading-relaxed mb-4">
                Achieve weightless, non-oxidizing 24h coverage with Velvet Matte Foundation and Cloud Blur Powder.
              </p>
              <button
                onClick={() => navigateTo('shop', { category: 'makeup' })}
                className="text-xs font-semibold text-[#C24560] hover:underline mt-auto"
              >
                Explore Complexion →
              </button>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-[#F0E6DE] shadow-xs text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center font-serif text-2xl font-semibold mb-4">
                03
              </div>
              <h3 className="font-serif text-xl text-[#1E1E24] mb-2">Add Soft Color & Sheen</h3>
              <p className="text-xs text-[#686266] leading-relaxed mb-4">
                Bring cheeks and lips to life with melting Rose Petal Cream Blush and non-sticky Glass Glaze Lip Oil.
              </p>
              <button
                onClick={() => navigateTo('shop', { category: 'lips' })}
                className="text-xs font-semibold text-[#C24560] hover:underline mt-auto"
              >
                Explore Lips & Cheeks →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* F. Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Customer Favorites"
          title="Best Sellers"
          subtitle="Our most loved, highest-rated beauty staples that customers reorder time and time again."
          action={{
            label: 'Shop All Best Sellers',
            onClick: () => navigateTo('shop', { search: 'bestseller' }),
          }}
        />

        <ProductGrid products={bestSellers} />
      </section>

      {/* H. Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#2D282C] text-white shadow-xl">
          {/* Background image with blend */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80"
              alt="Pretty Puff Luxury Banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 lg:py-24 max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#F8CAD1] mb-3">
              Special Presentation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-white mb-4">
              Your Beauty Routine, Upgraded.
            </h2>
            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed mb-8">
              Experience dermatologist-tested textures, skin-firming botanicals, and couture pigments
              tailored to flatter your unique radiance.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigateTo('shop')}
                className="px-8 py-3.5 bg-[#C24560] hover:bg-[#A8334C] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-md"
              >
                Shop Collection
              </button>
              <button
                onClick={() => navigateTo('about')}
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors backdrop-blur-xs"
              >
                Our Philosophy
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* I. Featured Collection: Pretty Puff Essentials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Handpicked Luxury"
          title="Pretty Puff Essentials"
          subtitle="The foundational cornerstones of every flawless beauty kit."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {featuredEssentials.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* J. Why Shop With Pretty Puff? */}
      <section className="bg-white border-y border-[#F0E6DE] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="The Pretty Puff Promise"
            title="Why Shop With Pretty Puff?"
            subtitle="We believe in uncompromising quality, sincere craftsmanship, and transparent service."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
                Authentic Beauty Products
              </h3>
              <p className="text-xs text-[#7A7478] leading-relaxed">
                100% genuine formulations sourced directly from ethical, cruelty-free laboratories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#D4AF37] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
                Secure Shopping
              </h3>
              <p className="text-xs text-[#7A7478] leading-relaxed">
                Hassle-free Cash on Delivery and encrypted online transfers for your complete security.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
                Fast Delivery
              </h3>
              <p className="text-xs text-[#7A7478] leading-relaxed">
                Dispatched within 24 hours. Rapid 2–4 business days delivery across all cities in Pakistan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFAF8] border border-[#F0E6DE] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#25D366] flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
                Customer Support
              </h3>
              <p className="text-xs text-[#7A7478] leading-relaxed">
                Dedicated WhatsApp beauty advisors (+923474542881) ready to assist your beauty journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* K. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Real Love"
          title="Customer Reviews"
          subtitle="Read genuine stories from customers who have made Pretty Puff their daily beauty sanctuary."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map(t => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#4A4549] italic leading-relaxed mb-4">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5EFEB]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#1E1E24]">{t.author}</div>
                  <span className="text-[10px] text-[#258237] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                {t.productName && (
                  <div className="text-[11px] text-[#8C868A] truncate mt-0.5">
                    {t.productName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* L. Instagram / Social Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#C24560] mb-2">
            <Instagram className="w-4 h-4" />
            <span>@prettypuff.official</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1E24]">Follow the Pretty</h2>
          <p className="text-sm text-[#7A7478] mt-2">
            Beauty inspiration, tips, tutorials and new arrivals shared daily with our community.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {instagramShots.map((shot, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#FAF5F2] cursor-pointer"
            >
              <img
                src={shot.img}
                alt={shot.tag}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-white text-center">
                <Instagram className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-medium leading-tight">{shot.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* From the Beauty Journal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tag="Pretty Puff Editorial"
          title="From the Beauty Journal"
          subtitle="Expert tips, dermatologist-reviewed routines, and trend forecasts to inspire your daily beauty ritual."
          action={{
            label: 'Read All Stories',
            onClick: () => navigateTo('blog'),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {journalArticles.map(article => (
            <article
              key={article.id}
              onClick={() => navigateTo('blog-post', { blogSlug: article.slug })}
              className="group cursor-pointer rounded-2xl border border-[#F0E6DE] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                <img
                  src={article.featuredImage}
                  alt={article.featuredImageAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-[#C24560] tracking-wider uppercase shadow-xs">
                  {article.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8C868A] mb-2">
                    <span>{article.readingTime} min read</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#1E1E24] group-hover:text-[#C24560] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#686266] line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-xs font-semibold text-[#C24560]">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* M. Newsletter */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FDF0F2] border border-[#F8CAD1] text-center relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-white text-[#C24560] flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-5 h-5" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1E24]">
              Join the Pretty Puff Beauty Club
            </h2>

            <p className="text-xs sm:text-sm text-[#686266] leading-relaxed">
              Get beauty tips, new arrivals and exclusive offers straight to your inbox. Enjoy{' '}
              <strong className="text-[#C24560]">10% off</strong> your first order with code{' '}
              <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-[#1E1E24]">
                PRETTY10
              </code>
              .
            </p>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-white text-[#258237] text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you for subscribing! Check your email for your welcome discount.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-full text-xs bg-white text-[#1E1E24] placeholder-[#A8A0A6] border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-xs"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
