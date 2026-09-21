import React from 'react';
import { Breadcrumb } from '../components/Breadcrumb';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Terms & Conditions',
            active: true,
          },
        ]}
      />

      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          Legal Agreement
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Terms & Conditions
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Last updated: September 2026 • Pretty Puff Pakistan
        </p>
      </div>

      <div className="space-y-6 bg-white p-6 sm:p-10 rounded-3xl border border-[#F0E6DE] text-sm text-[#4A4549] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">1. Acceptance of Terms</h2>
          <p>
            By accessing and shopping on Pretty Puff, you agree to be bound by these terms and conditions. If you do not agree with any portion, please refrain from using the store.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">2. Accuracy of Cosmetic Information</h2>
          <p>
            We strive to display product colors, swatches, and descriptions as accurately as possible. However, individual screen calibrations, skin undertones, and lighting can slightly alter cosmetic appearance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">3. Order Acceptance and Pricing</h2>
          <p>
            All prices are listed in Pakistani Rupees (PKR) and include applicable product taxes. Pretty Puff reserves the right to cancel or refuse orders in cases of obvious pricing errors or stock unavailability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">4. Intellectual Property</h2>
          <p>
            All logos, brand names, product titles, imagery, and copywriting are the exclusive intellectual property of Pretty Puff. Unauthorized reproduction or commercial use is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl text-[#1E1E24]">5. Contact Us</h2>
          <p>
            For any legal notices or general questions, please reach out via email at <strong>sameerliaqat81@gmail.com</strong> or phone <strong>+92 347 4542881</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
