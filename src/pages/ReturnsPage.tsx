import React from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2, MessageCircle } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';

export const ReturnsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Returns & Refund Policy',
            active: true,
          },
        ]}
      />

      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          Customer Protection
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Returns & Refund Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Last updated: September 2026 • Pretty Puff Pakistan
        </p>
      </div>

      <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-[#F0E6DE] text-sm text-[#4A4549] leading-relaxed">
        <div className="p-4 rounded-2xl bg-[#FDF0F2] border border-[#F8CAD1] flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-[#C24560] mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong className="text-[#1E1E24] block mb-0.5">7-Day Return Guarantee:</strong>
            We want you to love your Pretty Puff products. If an item arrives damaged, defective, or incorrect, we will replace or refund it promptly.
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">1. Eligibility for Returns</h2>
          <p>
            To be eligible for a return or exchange:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>The item must be reported within 7 days of delivery.</li>
            <li>The product must be unused, unswatched, and in the same pristine condition you received it.</li>
            <li>It must remain in its original branded protective box with safety seals intact.</li>
            <li>You must present proof of purchase or order confirmation ID.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">2. Hygiene & Cosmetic Restrictions</h2>
          <p>
            Due to international health and hygiene protocols regarding cosmetic and skincare formulations, we cannot accept returns on products that have had their protective seals broken, pumps pressed, or cosmetics tested on the skin, unless the item arrived damaged or defective.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">3. Damaged or Incorrect Products</h2>
          <p>
            In the rare event that your product arrived damaged in transit or you received an incorrect shade or item:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
            <li>Take a quick photo or video of the defective item and its packaging.</li>
            <li>Send it to our WhatsApp team at <strong>+92 347 4542881</strong>.</li>
            <li>We will dispatch a free replacement or issue a full refund within 48 hours.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">4. Refund Processing</h2>
          <p>
            Once your return is inspected and approved, your refund will be processed via Bank Transfer, EasyPaisa, or JazzCash within 3 to 5 business days.
          </p>
        </section>

        <div className="pt-4 border-t border-[#F0E6DE]">
          <a
            href="https://wa.me/923474542881"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white text-xs font-semibold rounded-full hover:bg-[#1EBE5D] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Initiate Return via WhatsApp (+92 347 4542881)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
