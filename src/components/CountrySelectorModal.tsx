import React, { useState, useMemo } from 'react';
import { X, Search, Globe, Check, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { COUNTRIES, POPULAR_COUNTRIES, CountryInfo, searchCountries } from '../data/countries';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({ isOpen, onClose }) => {
  const { selectedCountry, setCountry, setCurrency, showToast } = useShop();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return searchCountries(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectCountry = (country: CountryInfo) => {
    setCountry(country.code);
    setCurrency(country.currency);
    showToast(`Region updated to ${country.name} (${country.currency})`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-10">
        <div className="inline-block w-full max-w-2xl bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all relative z-10 border border-[#F0E6DE]">
          {/* Header */}
          <div className="p-6 border-b border-[#F0E6DE] flex items-center justify-between bg-[#FAF7F5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FDF0F2] text-[#C24560] flex items-center justify-center border border-[#F8CAD1]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1E1E24]">
                  Select Delivery Destination
                </h3>
                <p className="text-xs text-[#7A7478]">
                  Pricing & live shipping options adapt automatically to your country.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white text-[#4A4549] hover:text-[#1E1E24] hover:bg-gray-100 flex items-center justify-center transition-colors shadow-xs"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-[#F0E6DE] bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C868A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by country name, currency (USD, GBP, PKR...) or dial code..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F5] border border-[#E8DDD5] rounded-xl text-xs text-[#1E1E24] placeholder:text-[#9C949A] focus:outline-hidden focus:border-[#C24560] focus:ring-1 focus:ring-[#C24560] transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Popular Destinations */}
          {!searchQuery && (
            <div className="px-6 py-3 bg-[#FCFAF8] border-b border-[#F0E6DE]">
              <span className="text-[11px] font-semibold text-[#8C868A] uppercase tracking-wider block mb-2">
                Popular Destinations
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COUNTRIES.map(c => {
                  const isSelected = selectedCountry?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => handleSelectCountry(c)}
                      className={`py-1.5 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#1E1E24] text-white shadow-xs'
                          : 'bg-white border border-[#E8DDD5] text-[#4A4549] hover:border-[#C24560]'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="text-[10px] opacity-75">({c.currency})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Countries List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F5EFEB] p-2">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A7478]">
                No countries found matching "{searchQuery}".
              </div>
            ) : (
              filtered.map(country => {
                const isSelected = selectedCountry?.code === country.code;
                return (
                  <button
                    key={country.code}
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-[#FDF0F2] text-[#C24560] font-semibold'
                        : 'hover:bg-[#FAF7F5] text-[#1E1E24]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{country.flag}</span>
                      <div>
                        <div className="text-xs font-medium flex items-center gap-1.5">
                          <span>{country.name}</span>
                          {country.codEligible && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded border border-emerald-200">
                              COD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8C868A] flex items-center gap-2">
                          <span>Currency: {country.currency} ({country.symbol.trim()})</span>
                          <span>•</span>
                          <span>{country.dialCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#8C868A]">
                        {country.currency}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#C24560] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-4 border-t border-[#F0E6DE] bg-[#FAF7F5] text-[11px] text-[#8C868A] flex items-center justify-between">
            <span>Authoritative Base: USD ($) • Converted in Real-Time</span>
            <span className="text-[10px] bg-white px-2 py-1 rounded border border-[#E0D5CE]">
              Official CJ Live Shipping
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
