import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';

export const ShippingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Shipping & Delivery Policy',
            active: true,
          },
        ]}
      />

      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          Store Information
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Last updated: September 2026 • Pretty Puff Pakistan
        </p>
      </div>

      <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-[#F0E6DE] text-sm text-[#4A4549] leading-relaxed">
        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#F0E6DE] text-center">
          <div className="p-4 rounded-2xl bg-[#FAF5F2]">
            <Truck className="w-5 h-5 text-[#C24560] mx-auto mb-1.5" />
            <div className="font-serif text-sm font-semibold text-[#1E1E24]">Free Shipping</div>
            <div className="text-xs text-[#7A7478]">Orders over Rs. 3,000</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF5F2]">
            <Clock className="w-5 h-5 text-[#D4AF37] mx-auto mb-1.5" />
            <div className="font-serif text-sm font-semibold text-[#1E1E24]">2-4 Business Days</div>
            <div className="text-xs text-[#7A7478]">Nationwide delivery</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF5F2]">
            <ShieldCheck className="w-5 h-5 text-[#258237] mx-auto mb-1.5" />
            <div className="font-serif text-sm font-semibold text-[#1E1E24]">Cash on Delivery</div>
            <div className="text-xs text-[#7A7478]">Available nationwide</div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">1. Order Processing Time</h2>
          <p>
            All Pretty Puff orders are processed within 24 hours of placement (excluding Sundays and national holidays). Once processed, orders are handed over to our trusted courier partners (Trax, TCS, Call Courier, and Leopard Courier).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">2. Shipping Rates & Estimates</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Orders below Rs. 3,000:</strong> Flat standard shipping rate of Rs. 200 anywhere in Pakistan.
            </li>
            <li>
              <strong>Orders Rs. 3,000 and above:</strong> 100% Free Shipping automatically applied at checkout.
            </li>
            <li>
              <strong>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad):</strong> 2 to 3 business days.
            </li>
            <li>
              <strong>Other Cities & Regional Towns:</strong> 3 to 5 business days.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">3. Order Tracking</h2>
          <p>
            Upon dispatch, a shipment tracking number will be sent to the phone number and email provided during checkout. You can check the real-time location and status of your parcel directly through the courier tracking portal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">4. Cash on Delivery (COD) Guidelines</h2>
          <p>
            Please have the exact cash ready when the rider arrives. If you are unavailable at your delivery address, the courier will make up to two re-delivery attempts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-[#1E1E24]">5. Contact Us Regarding Shipping</h2>
          <p>
            If your package is delayed or you need to redirect delivery, contact us immediately on WhatsApp at <strong>+92 347 4542881</strong> or email <strong>sameerliaqat81@gmail.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
