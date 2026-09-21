import React from 'react';
import { Breadcrumb } from '../components/Breadcrumb';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Privacy Policy',
            active: true,
          },
        ]}
      />

      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          Data & Security
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Last updated: September 2026 • Pretty Puff Pakistan
        </p>
      </div>

      <div className="space-y-6 bg-white p-6 sm:p-10 rounded-3xl border border-[#F0E6DE] text-sm text-[#4A4549] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">1. Information We Collect</h2>
          <p>
            When you visit or place an order on Pretty Puff, we collect information necessary to fulfill your order and provide customer support:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>Customer Name</li>
            <li>Shipping Address & City</li>
            <li>Phone Number & WhatsApp contact</li>
            <li>Email address</li>
            <li>Order history and product preferences</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">2. How We Use Your Information</h2>
          <p>
            We use your personal details strictly to process, dispatch, and deliver your orders, communicate order updates via SMS/WhatsApp, and respond to your customer inquiries. We never sell, rent, or trade your personal data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">3. Data Security</h2>
          <p>
            We implement industry-standard administrative, physical, and electronic security safeguards to protect your personal details against unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">4. Contact Our Privacy Officer</h2>
          <p>
            For questions or requests concerning your data, please contact <strong>sameerliaqat81@gmail.com</strong> or call <strong>+92 347 4542881</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
