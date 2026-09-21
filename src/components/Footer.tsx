import React from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useShop();

  return (
    <footer className="bg-[#18181C] text-[#E5DFDA] pt-16 pb-12 border-t border-[#2D2A2E]">
      {/* Top Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-[#2B282C]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2A272B] text-[#D4AF37] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Authentic Beauty</h4>
              <p className="text-xs text-[#9E959B] mt-1">Directly formulated and verified luxury cosmetics.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2A272B] text-[#E07A8A] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Fast Nationwide Delivery</h4>
              <p className="text-xs text-[#9E959B] mt-1">Free delivery across Pakistan on orders over Rs. 3,000.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2A272B] text-[#D4AF37] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">7-Day Hassle-Free Returns</h4>
              <p className="text-xs text-[#9E959B] mt-1">Seamless returns and exchanges for your peace of mind.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2A272B] text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Instant WhatsApp Support</h4>
              <p className="text-xs text-[#9E959B] mt-1">Dedicated beauty advisors ready to help 7 days a week.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-3xl text-white font-normal">Pretty Puff</span>
              <span className="w-2 h-2 rounded-full bg-[#E07A8A]" />
            </div>
            <p className="text-sm text-[#A8A0A6] leading-relaxed max-w-sm">
              Your destination for makeup, skincare, haircare and beauty essentials. Curated to celebrate your natural elegance with everyday luxury formulations.
            </p>
            
            <div className="pt-2">
              <a
                href="https://wa.me/923474542881"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-xs font-semibold rounded-full hover:bg-[#1EBE5D] transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat With Us on WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-[#272428] text-[#C7B2A2] hover:text-white hover:bg-[#C24560] flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-[#272428] text-[#C7B2A2] hover:text-white hover:bg-[#1877F2] flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter / X"
                className="w-8 h-8 rounded-full bg-[#272428] text-[#C7B2A2] hover:text-white hover:bg-black flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-[#A8A0A6]">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop')} className="hover:text-white transition-colors">
                  Shop All Beauty
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('blog')} className="hover:text-white text-[#E07A8A] font-medium transition-colors">
                  Beauty Journal & Blog
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('faq')} className="hover:text-white transition-colors">
                  FAQs & Help
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('wishlist')} className="hover:text-white transition-colors">
                  My Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Customer Care</h4>
            <ul className="space-y-2 text-sm text-[#A8A0A6]">
              <li>
                <button onClick={() => navigateTo('shipping')} className="hover:text-white transition-colors">
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('returns')} className="hover:text-white transition-colors">
                  Returns & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('faq')} className="hover:text-white transition-colors">
                  Order Tracking
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Contact</h4>
            <div className="space-y-3 text-sm text-[#A8A0A6]">
              <a
                href="mailto:sameerliaqat81@gmail.com"
                className="flex items-start gap-2.5 hover:text-white transition-colors group"
              >
                <Mail className="w-4 h-4 text-[#E07A8A] mt-0.5 shrink-0" />
                <span className="break-all group-hover:underline">sameerliaqat81@gmail.com</span>
              </a>

              <a
                href="tel:+923474542881"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>+92 347 4542881</span>
              </a>

              <a
                href="https://wa.me/923474542881"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>WhatsApp: +92 347 4542881</span>
              </a>

              <div className="pt-2 text-xs text-[#8C848A]">
                Operating Hours: Mon - Sat (10:00 AM - 9:00 PM PKT)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#252226] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8C848A]">
        <div className="flex items-center gap-4">
          <span>© 2026 Pretty Puff. All rights reserved.</span>
          <button
            onClick={() => navigateTo('admin')}
            className="text-[#E07A8A] hover:underline text-[11px]"
          >
            Admin Portal
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-1 rounded bg-[#242125] text-[#C7B2A2] font-medium border border-[#38333B]">
            Cash on Delivery (COD)
          </span>
          <span className="px-2 py-1 rounded bg-[#242125] text-[#C7B2A2] font-medium border border-[#38333B]">
            Bank Transfer
          </span>
          <span className="px-2 py-1 rounded bg-[#242125] text-[#C7B2A2] font-medium border border-[#38333B]">
            EasyPaisa / JazzCash
          </span>
        </div>
      </div>
    </footer>
  );
};
