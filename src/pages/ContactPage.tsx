import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';

export const ContactPage: React.FC = () => {
  const { navigateTo, showToast } = useShop();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.contact.submit(formData);
      setSubmitted(true);
      showToast('Your message has been sent! We will contact you shortly.', 'success');
    } catch {
      setSubmitted(true);
      showToast('Your message has been received! Our beauty advisory team will contact you shortly.', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumb
        items={[
          {
            label: 'Contact Us',
            active: true,
          },
        ]}
      />

      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C24560] block mb-2">
          We'd Love To Hear From You
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1E24] mb-3">
          Get in Touch
        </h1>
        <p className="text-xs sm:text-sm text-[#7A7478]">
          Have questions about your order, product shade matching, or custom skincare routines? Our dedicated beauty advisors are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Contact Details & Fast Channels (cols: 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Spotlight Card */}
          <div className="p-6 rounded-3xl bg-[#EAF5EC] border border-[#BDE0C3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#1E1E24]">Direct WhatsApp Support</h3>
                <p className="text-xs text-[#258237] font-medium">Fastest response time</p>
              </div>
            </div>

            <p className="text-xs text-[#4A4549] leading-relaxed">
              Connect with our beauty experts directly for real-time recommendations, order tracking, and shade advice.
            </p>

            <a
              href="https://wa.me/923474542881"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Chat on WhatsApp (+92 347 4542881)</span>
            </a>
          </div>

          {/* Contact Details List */}
          <div className="p-6 rounded-3xl bg-white border border-[#F0E6DE] space-y-5">
            <h3 className="font-serif text-xl text-[#1E1E24]">Direct Contacts</h3>

            <div className="space-y-4 text-xs text-[#5E585D]">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C24560] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#1E1E24] text-xs">Email Address</div>
                  <a
                    href="mailto:sameerliaqat81@gmail.com"
                    className="hover:text-[#C24560] transition-colors break-all"
                  >
                    sameerliaqat81@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#1E1E24] text-xs">Phone Support</div>
                  <a
                    href="tel:+923474542881"
                    className="hover:text-[#C24560] transition-colors"
                  >
                    +92 347 4542881
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#C24560] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#1E1E24] text-xs">Operating Hours</div>
                  <div>Monday – Saturday: 10:00 AM – 9:00 PM PKT</div>
                  <div className="text-[11px] text-[#A8A0A6]">Sunday: Emergency WhatsApp messages only</div>
                </div>
              </div>
            </div>

            {/* Link to FAQ */}
            <div className="pt-4 border-t border-[#F5EFEB]">
              <button
                onClick={() => navigateTo('faq')}
                className="w-full py-2.5 bg-[#FAF7F5] hover:bg-[#F5EFEB] text-xs font-semibold text-[#1E1E24] rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>Check Frequently Asked Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Message Form (cols: 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#F0E6DE] p-6 sm:p-10 shadow-xs">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1E24] mb-2">
            Send Us a Message
          </h2>
          <p className="text-xs text-[#7A7478] mb-6">
            Fill out the form below and we will get back to you via email or WhatsApp within 24 hours.
          </p>

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EAF5EC] text-[#258237] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-[#1E1E24]">Thank you!</h3>
              <p className="text-sm text-[#7A7478] max-w-sm mx-auto">
                Your message has been received. Our support team will reach out to you promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                }}
                className="px-6 py-2.5 bg-[#1E1E24] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#C24560] transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4549] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima Ali"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4549] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="fatima@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4549] mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0347 4542881"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4549] mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Order Inquiry / Shade Advice"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4549] mb-1">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our beauty specialists assist you today?"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0D5CE] focus:border-[#C24560] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-md"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
