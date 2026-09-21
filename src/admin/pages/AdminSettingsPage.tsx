import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, Truck, CreditCard, Sparkles, Check } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [siteForm, setSiteForm] = useState({
    storeName: 'Pretty Puff',
    email: 'sameerliaqat81@gmail.com',
    phone: '+923474542881',
    whatsapp: 'https://wa.me/923474542881',
    address: 'Gulberg III, Lahore, Pakistan',
    currency: 'PKR',
    seoTitle: 'Pretty Puff | Luxury Cosmetics & Beauty Store',
    seoDescription: 'Discover authentic cosmetics, luxury skincare, haircare, and makeup essentials in Pakistan.',
  });

  const [shippingForm, setShippingForm] = useState({
    standardFee: 250,
    freeShippingThreshold: 3000,
    estimatedDeliveryDays: '2-4 Business Days',
  });

  const [paymentForm, setPaymentForm] = useState({
    codEnabled: true,
    bankTransferEnabled: true,
    easyPaisaEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.settings.get();
      if (res.success && res.data) {
        if (res.data.site) setSiteForm(prev => ({ ...prev, ...res.data.site }));
        if (res.data.shipping) setShippingForm(prev => ({ ...prev, ...res.data.shipping }));
        if (res.data.payment) setPaymentForm(prev => ({ ...prev, ...res.data.payment }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await Promise.all([
        api.settings.updateSite(siteForm),
        api.settings.updateShipping({
          standardFee: Number(shippingForm.standardFee),
          freeShippingThreshold: Number(shippingForm.freeShippingThreshold),
          estimatedDeliveryDays: shippingForm.estimatedDeliveryDays,
        }),
        api.settings.updatePayment(paymentForm),
      ]);

      setSuccessMsg('Store settings successfully updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-gray-400">Loading store settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Store & Platform Configuration</h2>
          <p className="text-xs text-gray-500">
            Brand identity, contact details, shipping delivery rules, and payment gateways.
          </p>
        </div>

        {successMsg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">
            <Check className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
        {/* Brand Information */}
        <div className="bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
          <h3 className="font-serif text-base text-[#1E1E24] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C24560]" />
            <span>Store Identity & Contact</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={siteForm.storeName}
                onChange={e => setSiteForm(prev => ({ ...prev, storeName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={siteForm.email}
                onChange={e => setSiteForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">WhatsApp Hotline</label>
              <input
                type="text"
                required
                value={siteForm.phone}
                onChange={e => setSiteForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Store Currency</label>
              <input
                type="text"
                required
                value={siteForm.currency}
                onChange={e => setSiteForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold uppercase focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Headquarters Address</label>
              <input
                type="text"
                value={siteForm.address}
                onChange={e => setSiteForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
          <h3 className="font-serif text-base text-[#1E1E24] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            <span>Shipping & Delivery Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Standard Delivery Fee (PKR)</label>
              <input
                type="number"
                required
                value={shippingForm.standardFee}
                onChange={e => setShippingForm(prev => ({ ...prev, standardFee: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Free Delivery Threshold (PKR)</label>
              <input
                type="number"
                required
                value={shippingForm.freeShippingThreshold}
                onChange={e => setShippingForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Estimated Transit Time</label>
              <input
                type="text"
                required
                value={shippingForm.estimatedDeliveryDays}
                onChange={e => setShippingForm(prev => ({ ...prev, estimatedDeliveryDays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#C24560]"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
          <h3 className="font-serif text-base text-[#1E1E24] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payment Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="p-3 rounded-xl border border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={paymentForm.codEnabled}
                onChange={e => setPaymentForm(prev => ({ ...prev, codEnabled: e.target.checked }))}
                className="rounded text-[#C24560]"
              />
              <div>
                <div className="font-semibold text-gray-900">Cash on Delivery (COD)</div>
                <div className="text-[10px] text-gray-400">Available across all Pakistan cities</div>
              </div>
            </label>

            <label className="p-3 rounded-xl border border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={paymentForm.bankTransferEnabled}
                onChange={e => setPaymentForm(prev => ({ ...prev, bankTransferEnabled: e.target.checked }))}
                className="rounded text-[#C24560]"
              />
              <div>
                <div className="font-semibold text-gray-900">Direct Bank Transfer</div>
                <div className="text-[10px] text-gray-400">Online banking / IBFT</div>
              </div>
            </label>

            <label className="p-3 rounded-xl border border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={paymentForm.easyPaisaEnabled}
                onChange={e => setPaymentForm(prev => ({ ...prev, easyPaisaEnabled: e.target.checked }))}
                className="rounded text-[#C24560]"
              />
              <div>
                <div className="font-semibold text-gray-900">EasyPaisa / JazzCash</div>
                <div className="text-[10px] text-gray-400">Mobile wallet transfers</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C24560] hover:bg-[#A3354E] text-white rounded-xl font-semibold shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
