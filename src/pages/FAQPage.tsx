import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  category: string;
  items: FAQItem[];
}

const FAQS: FAQSection[] = [
  {
    category: 'Orders & Payment',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept Cash on Delivery (COD) across Pakistan, Direct Online Bank Transfers, and mobile wallet transfers (EasyPaisa & JazzCash). For bank and wallet transfers, our account details are provided after order submission.',
      },
      {
        question: 'Can I modify or cancel my order after placing it?',
        answer:
          'Yes! Since we dispatch packages within 24 hours, please message us immediately on WhatsApp at +923474542881 with your Order ID if you wish to adjust your delivery address, add items, or cancel.',
      },
      {
        question: 'Do you offer discount promo codes?',
        answer:
          'Yes! New customers can use promo code "PRETTY10" at checkout for 10% off their first order. We also run seasonal flash promotions announced via our newsletter and WhatsApp broadcasts.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        question: 'How much is the delivery charge?',
        answer:
          'Standard nationwide shipping across Pakistan is Rs. 200. However, all orders with a subtotal of Rs. 3,000 or above qualify for 100% FREE delivery!',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Orders within major cities like Lahore, Karachi, and Islamabad typically arrive within 2–3 business days. Deliveries to other cities and regional towns usually take 3–5 business days.',
      },
      {
        question: 'How can I track my package?',
        answer:
          'Once your order is handed over to our courier partner (Trax/TCS/Leopard), you will receive a tracking link via SMS or WhatsApp to track your parcel in real-time.',
      },
    ],
  },
  {
    category: 'Products & Ingredients',
    items: [
      {
        question: 'Are Pretty Puff cosmetics authentic and skin-safe?',
        answer:
          'Absolutely 100%. All our formulas are dermatologically tested, cruelty-free, and formulated without harsh parabens, toxic sulfates, or hazardous fillers. We formulate with skin-loving botanicals suited for all skin tones.',
      },
      {
        question: 'How do I know which shade to pick?',
        answer:
          'Each product page features high-resolution shade swatches and undertone descriptions. You can also send a photo in natural lighting to our beauty advisors on WhatsApp (+923474542881) for free personalized shade matching!',
      },
      {
        question: 'Are your formulations suitable for sensitive or acne-prone skin?',
        answer:
          'Yes, our products are non-comedogenic and enriched with soothing actives like Niacinamide, Hyaluronic Acid, Centella, and Ceramides to nourish the delicate skin barrier.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'We offer a 7-Day return policy for any damaged, defective, or incorrect items received. Please retain original packaging and contact us on WhatsApp (+923474542881) within 7 days of delivery.',
      },
      {
        question: 'Can I return an opened cosmetic product?',
        answer:
          'Due to strict hygiene regulations for beauty and cosmetics, products that have been unsealed, opened, or used cannot be returned unless they arrived damaged or defective.',
      },
    ],
  },
  {
    category: 'Account & Support',
    items: [
      {
        question: 'Do I need an account to place an order?',
        answer:
          'No, guest checkout is fast and seamless! You only need to provide your recipient name, phone number, and delivery address to receive your order.',
      },
      {
        question: 'How can I reach customer support directly?',
        answer:
          'You can message our beauty team on WhatsApp at +92 347 4542881, email us at sameerliaqat81@gmail.com, or call us during business hours (Mon-Sat, 10 AM – 9 PM PKT).',
      },
    ],
  },
];

export const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'Orders & Payment-0': true,
    'Shipping & Delivery-0': true,
  });

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Frequently Asked Questions',
            active: true,
          },
        ]}
      />

      <div className="text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          Help & Guidance
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Find quick answers about orders, shade selection, deliveries, and payment methods.
        </p>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-10">
        {FAQS.map(section => (
          <div key={section.category} className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-[#1E1E24] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#C24560]" />
              <span>{section.category}</span>
            </h2>

            <div className="space-y-2.5">
              {section.items.map((item, idx) => {
                const key = `${section.category}-${idx}`;
                const isOpen = !!openItems[key];

                return (
                  <div
                    key={idx}
                    className="border border-[#F0E6DE] rounded-2xl bg-white overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-serif text-base text-[#1E1E24] hover:text-[#C24560] transition-colors"
                    >
                      <span className="font-medium">{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8C868A] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#C24560]' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-[#5E585D] leading-relaxed border-t border-[#FAF5F2] pt-3 font-sans">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Still need help CTA */}
      <div className="mt-14 p-8 rounded-3xl bg-[#FAF5F2] border border-[#F0E6DE] text-center space-y-3">
        <h3 className="font-serif text-2xl text-[#1E1E24]">Still have questions?</h3>
        <p className="text-xs text-[#7A7478] max-w-md mx-auto">
          Our customer support team is available on WhatsApp to answer any personalized questions.
        </p>
        <div className="pt-2">
          <a
            href="https://wa.me/923474542881"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+92 347 4542881)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
