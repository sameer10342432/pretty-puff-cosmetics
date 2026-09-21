import React from 'react';
import { Sparkles, Heart, ShieldCheck, Award, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useShop } from '../context/ShopContext';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useShop();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'About Pretty Puff',
            active: true,
          },
        ]}
      />

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#FAF5F2] border border-[#F0E6DE] p-8 sm:p-14 lg:p-20 text-center mb-16">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] inline-block">
            Our Story & Heritage
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1E1E24] leading-tight font-normal">
            Beauty That Celebrates <br className="hidden sm:inline" />
            <span className="italic font-light text-[#C24560]">Your Natural Radiance.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#686266] leading-relaxed font-sans font-light max-w-2xl mx-auto">
            Pretty Puff was founded on a simple yet transformative vision: to bring accessible luxury, clean dermatologist-tested formulations, and radiant aesthetics to beauty lovers across Pakistan.
          </p>
        </div>
      </div>

      {/* Brand Story Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        <div className="space-y-5 text-[#4A4549] text-sm leading-relaxed">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            The Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1E24]">
            Crafting Everyday Elegance
          </h2>
          <p>
            We believe that makeup and skincare should never feel like a mask. True beauty is effortless, breathable, and deeply comforting. Too often, luxury cosmetics are either out of reach or formulated with harsh chemicals that strain the skin barrier in humid climates.
          </p>
          <p>
            Pretty Puff changes that narrative. From weightless velvet pigments to moisture-locking hyaluronic mists and artisanal scents, every product is formulated to pamper your skin and withstand everyday wear.
          </p>
          <p className="italic text-[#1E1E24] font-serif border-l-2 border-[#C24560] pl-4 py-1">
            "We formulate with intention, curate with care, and deliver with pride."
          </p>
        </div>

        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80"
            alt="Pretty Puff Beauty Formulation"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
            What Drives Us
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1E24]">
            Our Core Pillars
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
              High Quality Formulations
            </h3>
            <p className="text-xs text-[#7A7478] leading-relaxed">
              Dermatologically checked, clean ingredients free from toxic fillers, parabens, and micro-plastics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F2] text-[#D4AF37] flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
              Accessible Luxury
            </h3>
            <p className="text-xs text-[#7A7478] leading-relaxed">
              Prestige packaging and high-performing textures at transparent, friendly price points.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
              Modern Aesthetic
            </h3>
            <p className="text-xs text-[#7A7478] leading-relaxed">
              Designed with soft, feminine elegance that sparks joy every time you reach for your beauty vanity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F2] text-[#258237] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#1E1E24] mb-2 font-medium">
              Customer-Centric Care
            </h3>
            <p className="text-xs text-[#7A7478] leading-relaxed">
              Always reachable on WhatsApp, transparent order dispatching, and rapid customer service.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-10 sm:p-14 rounded-3xl bg-[#1E1E24] text-white text-center">
        <h2 className="font-serif text-3xl sm:text-4xl mb-4 font-normal">
          Ready to experience Pretty Puff?
        </h2>
        <p className="text-xs sm:text-sm text-[#C7B2A2] max-w-lg mx-auto mb-8 font-light">
          Join thousands of happy beauty lovers who have made our clean formulations their daily companion.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-8 py-3.5 bg-[#C24560] hover:bg-[#A8334C] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors inline-flex items-center gap-2 shadow-lg"
        >
          <span>Explore Our Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
