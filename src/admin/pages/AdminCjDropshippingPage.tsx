import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sliders,
  DollarSign,
  Package,
  Clock,
  Key,
  ShieldCheck,
  Eye,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';

type CjViewTab = 'browse' | 'direct' | 'imported' | 'logs' | 'settings';

export const AdminCjDropshippingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CjViewTab>('browse');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Connection & Settings State
  const [settings, setSettings] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    openId?: string;
    expiry?: string;
  }>({ tested: false });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    apiSecret: '',
    currencyRatePkr: 280,
    pricingType: 'PERCENTAGE',
    markupValue: 35,
    estimatedShippingPkr: 350,
    targetMargin: 35,
    minMargin: 15,
    minProfitUsd: 2.0,
    defaultPackagingUsd: 0.50,
    defaultHandlingUsd: 0.50,
    paymentFeePercent: 2.9,
    defaultShippingDestination: 'US',
    autoPublish: false,
    autoSyncStock: true,
    autoSyncPrice: false,
  });

  // Browse State
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('cosmetics');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Selected Product Detail Modal & Live Pricing Preview
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [previewCountry, setPreviewCountry] = useState('US');
  const [pricingPreview, setPricingPreview] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // Direct PID Import State
  const [directPid, setDirectPid] = useState('');

  // Imported Products State
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [importedSearch, setImportedSearch] = useState('');
  const [importedPage, setImportedPage] = useState(1);
  const [importedTotal, setImportedTotal] = useState(0);

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);

  // Load Initial Settings & Connection
  useEffect(() => {
    loadSettings();
  }, []);


  const fetchPricingPreview = async (pid: string, country: string) => {
    setLoadingPreview(true);
    try {
      const res = await api.cjdropshipping.getPricingPreview(pid, country);
      if (res?.success && res.data) {
        setPricingPreview(res.data);
      }
    } catch (e) {
      console.warn('Failed to load pricing preview:', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Load Tab-specific data
  useEffect(() => {
    if (activeTab === 'browse') {
      loadCjProducts(currentPage, searchQuery);
    } else if (activeTab === 'imported') {
      loadImportedProducts(importedPage, importedSearch);
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, currentPage, importedPage]);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.cjdropshipping.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setSettingsForm({
          apiKey: '',
          apiSecret: '',
          currencyRatePkr: res.data.currencyRatePkr || 280,
          pricingType: res.data.pricingType || 'PERCENTAGE',
          markupValue: res.data.markupValue || 35,
          estimatedShippingPkr: res.data.estimatedShippingPkr || 350,
          targetMargin: res.data.targetMargin ?? 35,
          minMargin: res.data.minMargin ?? 15,
          minProfitUsd: res.data.minProfitUsd ?? 2.0,
          defaultPackagingUsd: res.data.defaultPackagingUsd ?? 0.50,
          defaultHandlingUsd: res.data.defaultHandlingUsd ?? 0.50,
          paymentFeePercent: res.data.paymentFeePercent ?? 2.9,
          defaultShippingDestination: res.data.defaultShippingDestination || 'US',
          autoPublish: !!res.data.autoPublish,
          autoSyncStock: res.data.autoSyncStock !== false,
          autoSyncPrice: !!res.data.autoSyncPrice,
        });
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load CJ settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setActionLoading(true);
      const res = await api.cjdropshipping.testConnection();
      setConnectionStatus({
        tested: true,
        success: res.success,
        message: res.message,
        openId: res.openId,
        expiry: res.expiry,
      });
      if (res.success) {
        showNotification(res.message, 'success');
        loadSettings();
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err.message || 'Connection test failed',
      });
      showNotification(err.message || 'Connection test failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload: any = {
        currencyRatePkr: Number(settingsForm.currencyRatePkr),
        pricingType: settingsForm.pricingType,
        markupValue: Number(settingsForm.markupValue),
        estimatedShippingPkr: Number(settingsForm.estimatedShippingPkr),
        autoPublish: settingsForm.autoPublish,
        autoSyncStock: settingsForm.autoSyncStock,
        autoSyncPrice: settingsForm.autoSyncPrice,
      };
      if (settingsForm.apiKey.trim()) {
        payload.apiKey = settingsForm.apiKey.trim();
      }
      if (settingsForm.apiSecret.trim()) {
        payload.apiSecret = settingsForm.apiSecret.trim();
      }

      const res = await api.cjdropshipping.updateSettings(payload);
      if (res.success) {
        showNotification('CJdropshipping settings updated successfully.', 'success');
        loadSettings();
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update settings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const loadCjProducts = async (page: number, query: string) => {
    try {
      setLoading(true);
      const res = await api.cjdropshipping.getProducts({
        page,
        size: 20,
        keyWord: query || undefined,
      });
      if (res.success) {
        setProducts(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalProducts(res.pagination?.total || 0);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to search CJ catalog. Please verify your API Key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCjProducts(1, searchQuery);
  };

  const handleOpenDetail = async (pid: string) => {
    try {
      setDetailLoading(true);
      const res = await api.cjdropshipping.getProduct(pid);
      if (res.success && res.data) {
        setSelectedProduct(res.data);
        setCustomPrice(res.data.priceCalc?.sellingPricePkr || '');
        setSelectedStatus(settings?.autoPublish ? 'PUBLISHED' : 'DRAFT');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch product details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleImport = async (pid: string, customPriceVal?: number, statusVal?: 'DRAFT' | 'PUBLISHED') => {
    try {
      setActionLoading(true);
      const res = await api.cjdropshipping.import({
        pid,
        customPriceUsd: customPriceVal || (customPrice ? Number(customPrice) : undefined),
        status: statusVal || selectedStatus,
      });

      if (res.success) {
        showNotification(res.message, res.isDuplicate ? 'info' : 'success');
        setSelectedProduct(null);
        // Refresh products list to show badge
        setProducts(prev =>
          prev.map(p => (p.pid === pid ? { ...p, isImported: true } : p))
        );
      }
    } catch (err: any) {
      showNotification(err.message || 'Import failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPid.trim()) return;

    try {
      setActionLoading(true);
      const res = await api.cjdropshipping.import({
        pid: directPid.trim(),
        status: settings?.autoPublish ? 'PUBLISHED' : 'DRAFT',
      });
      if (res.success) {
        showNotification(res.message, 'success');
        setDirectPid('');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to import product by ID', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const loadImportedProducts = async (page: number, search: string) => {
    try {
      setLoading(true);
      const res = await api.cjdropshipping.getImported({
        page,
        limit: 20,
        search: search || undefined,
      });
      if (res.success) {
        setImportedProducts(res.data || []);
        setImportedTotal(res.pagination?.total || 0);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load imported products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProduct = async (cjProductId: string) => {
    try {
      setActionLoading(true);
      const res = await api.cjdropshipping.sync(cjProductId);
      if (res.success) {
        showNotification(res.message, 'success');
        loadImportedProducts(importedPage, importedSearch);
      }
    } catch (err: any) {
      showNotification(err.message || 'Sync failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!window.confirm('Synchronize all imported CJ products with current supplier stock & pricing?')) return;
    try {
      setActionLoading(true);
      const res = await api.cjdropshipping.syncAll();
      if (res.success) {
        showNotification(res.message, 'success');
        loadImportedProducts(importedPage, importedSearch);
      }
    } catch (err: any) {
      showNotification(err.message || 'Full sync failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.cjdropshipping.getLogs(50);
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#C27A86]/20 text-[#C27A86]">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">
              CJdropshipping Integration
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Official CJ API v2.0 product catalog discovery, automatic category mapping & PKR profit calculation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestConnection}
            disabled={actionLoading}
            className="px-4 py-2 bg-[#2E2E38] hover:bg-[#3E3E4C] text-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-[#3E3E4C]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C27A86]" />
            <span>{actionLoading ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : message.type === 'error'
              ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
              : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {message.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connection Status Pill Banner */}
      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-[#1C1C22] p-4 rounded-xl border border-[#2E2E38] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">API Credentials</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {settings.hasApiKey ? 'Configured' : 'Missing API Key'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${settings.hasApiKey ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </div>

          <div className="bg-[#1C1C22] p-4 rounded-xl border border-[#2E2E38] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Access Token</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {settings.hasToken ? (settings.isTokenExpired ? 'Expired' : 'Active (v2.0)') : 'Not Generated'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${settings.hasToken && !settings.isTokenExpired ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>

          <div className="bg-[#1C1C22] p-4 rounded-xl border border-[#2E2E38] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Exchange Rate</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                1 USD = {settings.currencyRatePkr} PKR
              </p>
            </div>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>

          <div className="bg-[#1C1C22] p-4 rounded-xl border border-[#2E2E38] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Pricing Formula</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                +{settings.markupValue}% Markup
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#C27A86]" />
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#2E2E38] pb-3">
        {[
          { id: 'browse', label: 'Browse CJ Catalog', icon: Search },
          { id: 'direct', label: 'Import by Product ID', icon: Package },
          { id: 'imported', label: 'Imported Products', icon: CheckCircle2, badge: importedTotal },
          { id: 'logs', label: 'Import Logs & Sync History', icon: Clock },
          { id: 'settings', label: 'Connection & Pricing Rules', icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CjViewTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#C24560] text-white shadow-lg shadow-[#C24560]/20'
                  : 'bg-[#1C1C22] text-gray-400 hover:text-white border border-[#2E2E38]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 text-gray-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BROWSE CJ CATALOG */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Search Header */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search CJ catalog (e.g. lipstick, foundation, mascara, serum, perfume)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C22] border border-[#2E2E38] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C27A86]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Catalog</span>
            </button>
          </form>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C27A86]" />
              Querying CJdropshipping API v2.0 catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#1C1C22] p-12 text-center rounded-2xl border border-[#2E2E38]">
              <Package className="w-8 h-8 mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-300 font-medium">No CJ products found.</p>
              <p className="text-xs text-gray-500 mt-1">Try another search keyword or verify your API credentials in Settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(item => (
                <div
                  key={item.pid}
                  className="bg-[#1C1C22] border border-[#2E2E38] rounded-2xl overflow-hidden hover:border-[#3E3E4C] transition-all flex flex-col group"
                >
                  <div className="relative aspect-square bg-[#141418] overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                    )}

                    {item.isImported && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> Imported
                      </span>
                    )}

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-gray-200 font-mono">
                      PID: {item.pid.slice(0, 8)}...
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[11px] text-[#C27A86] font-medium truncate">
                        {item.categoryName || 'Beauty & Cosmetics'}
                      </p>
                      <h3 className="text-xs font-semibold text-white line-clamp-2 mt-0.5" title={item.productName}>
                        {item.productName}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                        SKU: {item.productSku}
                      </p>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-[#141418] p-2.5 rounded-xl border border-[#282832] space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Supplier:</span>
                        <span className="text-gray-300 font-medium">${item.sellPrice}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#C27A86] font-semibold">Store Price:</span>
                        <span className="text-white font-bold">{item.calculatedPricePkr?.toLocaleString()} PKR</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-0.5 border-t border-[#282832]">
                        <span className="text-emerald-400">Est. Profit:</span>
                        <span className="text-emerald-300 font-medium">+{item.estimatedProfitPkr?.toLocaleString()} PKR</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleOpenDetail(item.pid)}
                        className="flex-1 py-2 px-3 bg-[#282832] hover:bg-[#343442] text-gray-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleImport(item.pid)}
                        disabled={actionLoading}
                        className="py-2 px-3 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors shadow-md"
                        title="Quick Import into Pretty Puff"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Import</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-[#1C1C22] p-4 rounded-xl border border-[#2E2E38] text-xs">
              <span className="text-gray-400">
                Page {currentPage} of {totalPages} ({totalProducts.toLocaleString()} items)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-[#282832] disabled:opacity-40 text-gray-200 rounded-lg"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 bg-[#282832] disabled:opacity-40 text-gray-200 rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORT BY PRODUCT ID (PID) */}
      {activeTab === 'direct' && (
        <div className="max-w-xl mx-auto bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38] space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-base font-serif font-semibold text-white">Direct CJ Product Import</h2>
            <p className="text-xs text-gray-400">
              Paste any CJ Product ID (PID) from your CJdropshipping account or product link to import it directly into Pretty Puff.
            </p>
          </div>

          <form onSubmit={handleDirectImport} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                CJ Product ID (PID)
              </label>
              <input
                type="text"
                value={directPid}
                onChange={e => setDirectPid(e.target.value)}
                placeholder="e.g. 000B9312-456A-4D31-94BD-B083E2A198E8 or numeric PID"
                className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C27A86] font-mono"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-[#141418] border border-[#2E2E38] text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Automatic Pipeline:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                <li>Retrieves full English title, high-res images, and HTML descriptions.</li>
                <li>Maps product to closest Pretty Puff category automatically.</li>
                <li>Applies current USD-to-PKR exchange rate and markup rules.</li>
                <li>Downloads images to Pretty Puff local media storage.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !directPid.trim()}
              className="w-full py-2.5 bg-[#C24560] hover:bg-[#A3354E] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{actionLoading ? 'Importing Product...' : 'Fetch & Import to Pretty Puff'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: IMPORTED PRODUCTS */}
      {activeTab === 'imported' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={importedSearch}
                onChange={e => {
                  setImportedSearch(e.target.value);
                  setImportedPage(1);
                  loadImportedProducts(1, e.target.value);
                }}
                placeholder="Filter imported products..."
                className="w-full pl-9 pr-3 py-2 bg-[#1C1C22] border border-[#2E2E38] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C27A86]"
              />
            </div>

            <button
              onClick={handleSyncAll}
              disabled={actionLoading || importedProducts.length === 0}
              className="px-4 py-2 bg-[#282832] hover:bg-[#343442] text-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-[#3E3E4C]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Sync All Products</span>
            </button>
          </div>

          <div className="bg-[#1C1C22] border border-[#2E2E38] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141418] text-gray-400 border-b border-[#2E2E38]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">CJ PID & SKU</th>
                    <th className="py-3 px-4">Supplier Cost</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Synced</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E38] text-gray-300">
                  {importedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        No imported CJ products found. Browse the catalog to import your first product.
                      </td>
                    </tr>
                  ) : (
                    importedProducts.map(item => (
                      <tr key={item.id} className="hover:bg-[#23232B] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#141418] border border-[#2E2E38] overflow-hidden shrink-0">
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-600 m-2.5" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-semibold text-white truncate">{item.productName}</p>
                              {item.slug && (
                                <a
                                  href={`/product/${item.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-[#C27A86] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <span>View on storefront</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                          <div>{item.cjProductId?.slice(0, 10)}...</div>
                          <div className="text-[10px] text-gray-500">{item.cjSku}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-300">
                          ${item.supplierPriceUsd || 0}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {item.sellingPricePkr?.toLocaleString()} PKR
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.currentStock > 10 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {item.currentStock} in stock
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'PUBLISHED'
                              ? 'bg-emerald-950/80 text-emerald-300'
                              : item.status === 'SYNCED'
                              ? 'bg-blue-950/80 text-blue-300'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          {item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSyncProduct(item.cjProductId)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#282832] hover:bg-[#343442] text-gray-300 hover:text-white transition-colors"
                            title="Sync Stock & Price"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#1C1C22] border border-[#2E2E38] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#2E2E38] flex justify-between items-center">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Integration & Synchronisation Audit Trail
            </h3>
            <button
              onClick={loadLogs}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141418] text-gray-400 border-b border-[#2E2E38]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">CJ PID</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E38] text-gray-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No import log records available yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#23232B] transition-colors">
                      <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-white">{log.productName}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-400">{log.cjProductId}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-gray-400 max-w-md truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS & PRICING RULES */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* API Credentials */}
          <div className="bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#282832] pb-3">
              <Key className="w-4 h-4 text-[#C27A86]" />
              <h3 className="text-sm font-semibold text-white">CJdropshipping API v2.0 Credentials</h3>
            </div>
            <p className="text-xs text-gray-400">
              Obtain your API Key from your CJdropshipping account under <strong>My CJ &gt; Authorization &gt; API</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  API Key (Required)
                </label>
                <input
                  type="password"
                  value={settingsForm.apiKey}
                  onChange={e => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
                  placeholder={settings?.apiKey ? `Current: ${settings.apiKey}` : 'Enter CJ API Key'}
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C27A86] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  API Secret (Optional)
                </label>
                <input
                  type="password"
                  value={settingsForm.apiSecret}
                  onChange={e => setSettingsForm({ ...settingsForm, apiSecret: e.target.value })}
                  placeholder="Optional secret if provided"
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C27A86] font-mono"
                />
              </div>
            </div>

            {settings?.hasToken && (
              <div className="p-3 rounded-xl bg-[#141418] border border-[#282832] text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Token Status:</span>
                  <span className="text-emerald-400 font-semibold">Active & Cached</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Token Expiration:</span>
                  <span className="text-white font-mono">{settings.tokenExpiry ? new Date(settings.tokenExpiry).toLocaleString() : '180 days'}</span>
                </div>
                {settings.openId && (
                  <div className="flex justify-between text-gray-400">
                    <span>CJ Open ID:</span>
                    <span className="text-gray-300 font-mono">{settings.openId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Formula Configuration */}
          <div className="bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#282832] pb-3">
              <DollarSign className="w-4 h-4 text-[#C27A86]" />
              <h3 className="text-sm font-semibold text-white">Automated PKR Pricing Formula</h3>
            </div>
            <p className="text-xs text-gray-400">
              Calculate final Pretty Puff retail prices in PKR from CJ's wholesale USD price with automatic psychological rounding (.e.g. 1,999 PKR).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  USD to PKR Exchange Rate
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settingsForm.currencyRatePkr}
                  onChange={e => setSettingsForm({ ...settingsForm, currencyRatePkr: parseFloat(e.target.value) || 280 })}
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white focus:outline-none focus:border-[#C27A86]"
                  required
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Current market rate: ~280 PKR</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Pricing Markup Type
                </label>
                <select
                  value={settingsForm.pricingType}
                  onChange={e => setSettingsForm({ ...settingsForm, pricingType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white focus:outline-none focus:border-[#C27A86]"
                >
                  <option value="PERCENTAGE">Percentage Markup (%)</option>
                  <option value="FIXED">Fixed Profit in PKR</option>
                  <option value="MARGIN">Target Margin (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Markup Value ({settingsForm.pricingType === 'FIXED' ? 'PKR' : '%'})
                </label>
                <input
                  type="number"
                  value={settingsForm.markupValue}
                  onChange={e => setSettingsForm({ ...settingsForm, markupValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white focus:outline-none focus:border-[#C27A86]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Estimated Shipping Buffer (PKR)
                </label>
                <input
                  type="number"
                  value={settingsForm.estimatedShippingPkr}
                  onChange={e => setSettingsForm({ ...settingsForm, estimatedShippingPkr: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#141418] border border-[#2E2E38] rounded-xl text-xs text-white focus:outline-none focus:border-[#C27A86]"
                />
              </div>
            </div>

            {/* Formula Preview Box */}
            <div className="p-3.5 rounded-xl bg-[#141418] border border-[#282832] text-xs space-y-1">
              <span className="text-gray-400 font-semibold">Pricing Example ($5.00 Supplier Item):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Base Cost:</span>
                  <span className="text-white font-medium">5 × {settingsForm.currencyRatePkr} = {(5 * settingsForm.currencyRatePkr).toLocaleString()} PKR</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Shipping Buffer:</span>
                  <span className="text-white font-medium">+{settingsForm.estimatedShippingPkr} PKR</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Retail Price:</span>
                  <span className="text-[#C27A86] font-bold">
                    {Math.ceil(((5 * settingsForm.currencyRatePkr + settingsForm.estimatedShippingPkr) * (1 + settingsForm.markupValue / 100)) / 50) * 50 - 1} PKR
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Est. Net Profit:</span>
                  <span className="text-emerald-400 font-medium">
                    +{Math.round((Math.ceil(((5 * settingsForm.currencyRatePkr + settingsForm.estimatedShippingPkr) * (1 + settingsForm.markupValue / 100)) / 50) * 50 - 1) - (5 * settingsForm.currencyRatePkr + settingsForm.estimatedShippingPkr))} PKR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Publishing & Automation Rules */}
          <div className="bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38] space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-[#282832] pb-3">
              Automated Publishing & Stock Synchronisation
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoPublish}
                  onChange={e => setSettingsForm({ ...settingsForm, autoPublish: e.target.checked })}
                  className="rounded border-[#3E3E4C] text-[#C24560] focus:ring-[#C24560]"
                />
                <div>
                  <span className="text-white font-medium block">Auto-Publish Products</span>
                  <span className="text-gray-400 text-[11px]">Publish imported products to the Pretty Puff Shop automatically instead of saving as Drafts.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoSyncStock}
                  onChange={e => setSettingsForm({ ...settingsForm, autoSyncStock: e.target.checked })}
                  className="rounded border-[#3E3E4C] text-[#C24560] focus:ring-[#C24560]"
                />
                <div>
                  <span className="text-white font-medium block">Synchronize Stock Availability</span>
                  <span className="text-gray-400 text-[11px]">Automatically reflect CJ warehouse inventory changes on your website.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoSyncPrice}
                  onChange={e => setSettingsForm({ ...settingsForm, autoSyncPrice: e.target.checked })}
                  className="rounded border-[#3E3E4C] text-[#C24560] focus:ring-[#C24560]"
                />
                <div>
                  <span className="text-white font-medium block">Auto-Update Selling Prices on Supplier Changes</span>
                  <span className="text-gray-400 text-[11px]">When CJ supplier price changes, recalculate and update retail price automatically.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Webhook Configuration Details */}
          <div className="bg-[#1C1C22] p-6 rounded-2xl border border-[#2E2E38] space-y-3">
            <h3 className="text-sm font-semibold text-white">CJ Real-Time Webhook Endpoints</h3>
            <p className="text-xs text-gray-400">
              When CJ pushes product or inventory changes, your server verifies HMAC-SHA256 signatures and syncs records in real time.
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-gray-400 block text-[10px] font-sans">Product Updates Webhook:</span>
                <input
                  readOnly
                  value={settings?.webhookProductUrl || ''}
                  className="w-full px-3 py-1.5 bg-[#141418] border border-[#2E2E38] rounded-lg text-gray-300"
                />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-sans">Stock Updates Webhook:</span>
                <input
                  readOnly
                  value={settings?.webhookStockUrl || ''}
                  className="w-full px-3 py-1.5 bg-[#141418] border border-[#2E2E38] rounded-lg text-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-colors"
            >
              <span>{actionLoading ? 'Saving Settings...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* DETAIL PREVIEW & IMPORT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C1C22] border border-[#2E2E38] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded-lg bg-[#C27A86]/20 text-[#C27A86] text-[10px] font-semibold">
                  Category: {selectedProduct.categoryName || 'Beauty'}
                </span>
                <h2 className="text-base font-serif font-bold text-white mt-1">
                  {selectedProduct.title}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  CJ PID: {selectedProduct.pid} | SKU: {selectedProduct.sku}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#282832]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Gallery */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedProduct.images?.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl border border-[#2E2E38] bg-[#141418] shrink-0"
                />
              ))}
            </div>

            {/* Destination Selection & Live Shipping Quote */}
            <div className="bg-[#141418] p-4 rounded-xl border border-[#2E2E38] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282832] pb-3">
                <div>
                  <span className="text-xs font-semibold text-white block">Destination-Based Shipping & Landed Cost</span>
                  <span className="text-[11px] text-gray-400">Select destination to retrieve actual live CJ carrier freight quotation.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Ship to:</span>
                  <select
                    value={previewCountry}
                    onChange={e => {
                      const c = e.target.value;
                      setPreviewCountry(c);
                      if (selectedProduct) fetchPricingPreview(selectedProduct.pid, c);
                    }}
                    className="px-3 py-1.5 bg-[#1C1C22] border border-[#3E3E4C] rounded-lg text-xs text-white focus:outline-none focus:border-[#C27A86]"
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="AE">🇦🇪 United Arab Emirates</option>
                    <option value="PK">🇵🇰 Pakistan</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="SA">🇸🇦 Saudi Arabia</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                  </select>
                </div>
              </div>

              {/* Comprehensive Cost & Profit Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-[#282832] text-[11px]">
                      <th className="py-2 font-medium">Cost Component / Metric</th>
                      <th className="py-2 text-right font-medium">Amount (USD)</th>
                      <th className="py-2 text-right font-medium">PKR Equivalent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24242C] text-gray-300">
                    <tr>
                      <td className="py-1.5">CJ Supplier Base Cost</td>
                      <td className="py-1.5 text-right font-mono font-semibold text-white">
                        ${(pricingPreview?.preview?.landedCost?.supplierCostUsd ?? selectedProduct.priceCalc?.supplierPriceUsd ?? 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right text-[11px] text-gray-400 font-mono">
                        Rs. {Math.round((pricingPreview?.preview?.landedCost?.supplierCostUsd ?? selectedProduct.priceCalc?.supplierPriceUsd ?? 0) * 280).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 flex items-center gap-1.5">
                        <span>CJ Live Shipping ({previewCountry})</span>
                        {pricingPreview?.shippingQuotes?.[0] && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                            {pricingPreview.shippingQuotes[0].logisticName} ({pricingPreview.shippingQuotes[0].logisticAging})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right font-mono font-semibold text-white">
                        ${(pricingPreview?.selectedShippingCostUsd ?? selectedProduct.priceCalc?.shippingCostUsd ?? 1.25).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right text-[11px] text-gray-400 font-mono">
                        Rs. {Math.round((pricingPreview?.selectedShippingCostUsd ?? selectedProduct.priceCalc?.shippingCostUsd ?? 1.25) * 280).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-gray-400">Packaging & Handling Buffer</td>
                      <td className="py-1.5 text-right font-mono text-gray-400">
                        ${((pricingPreview?.preview?.landedCost?.packagingCostUsd ?? 0.5) + (pricingPreview?.preview?.landedCost?.handlingCostUsd ?? 0.5)).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right text-[11px] text-gray-500 font-mono">
                        Rs. {Math.round(((pricingPreview?.preview?.landedCost?.packagingCostUsd ?? 0.5) + (pricingPreview?.preview?.landedCost?.handlingCostUsd ?? 0.5)) * 280).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-[#1C1C22]/50 font-semibold text-white">
                      <td className="py-1.5">Total Landed Product Cost</td>
                      <td className="py-1.5 text-right font-mono text-[#C27A86]">
                        ${(pricingPreview?.preview?.landedCost?.totalLandedCostUsd ?? selectedProduct.priceCalc?.landedCostUsd ?? 7.10).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right text-[11px] text-[#C27A86] font-mono">
                        Rs. {Math.round((pricingPreview?.preview?.landedCost?.totalLandedCostUsd ?? selectedProduct.priceCalc?.landedCostUsd ?? 7.10) * 280).toLocaleString()}
                      </td>
                    </tr>
                    {selectedProduct.priceCalc?.cjMarketPriceUsd && (
                      <tr className="text-amber-300">
                        <td className="py-1.5">CJ Recommended Market Price (Reference)</td>
                        <td className="py-1.5 text-right font-mono font-semibold">
                          ${Number(selectedProduct.priceCalc.cjMarketPriceUsd).toFixed(2)}
                        </td>
                        <td className="py-1.5 text-right text-[11px] font-mono">
                          Rs. {Math.round(Number(selectedProduct.priceCalc.cjMarketPriceUsd) * 280).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#181820] text-emerald-300 font-bold border-t border-[#2E2E38]">
                      <td className="py-2">Pretty Puff Suggested Price</td>
                      <td className="py-2 text-right font-mono text-emerald-400 text-sm">
                        ${(pricingPreview?.preview?.suggestedRegularPriceUsd ?? selectedProduct.priceCalc?.sellingPriceUsd ?? 11.99).toFixed(2)}
                      </td>
                      <td className="py-2 text-right text-xs font-mono text-emerald-300">
                        Rs. {Math.round((pricingPreview?.preview?.suggestedRegularPriceUsd ?? selectedProduct.priceCalc?.sellingPriceUsd ?? 11.99) * 280).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="text-gray-400 text-[11px]">
                      <td className="py-1">Minimum Profitable Price (Protected)</td>
                      <td className="py-1 text-right font-mono font-medium text-white">
                        ${(pricingPreview?.preview?.minimumPriceUsd ?? selectedProduct.priceCalc?.minimumPriceUsd ?? 11.99).toFixed(2)}
                      </td>
                      <td className="py-1 text-right text-gray-500 font-mono">
                        Max Discount: ${(pricingPreview?.preview?.maxSafeDiscountUsd ?? selectedProduct.priceCalc?.maxSafeDiscountUsd ?? 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-emerald-400 text-[11px]">
                      <td className="py-1">Estimated Net Profit & Margin</td>
                      <td className="py-1 text-right font-mono font-semibold">
                        +${(pricingPreview?.preview?.estimatedProfit?.netProfitUsd ?? selectedProduct.priceCalc?.profitUsd ?? 4.24).toFixed(2)}
                      </td>
                      <td className="py-1 text-right font-mono font-bold">
                        {(pricingPreview?.preview?.estimatedProfit?.profitMarginPercent ?? selectedProduct.priceCalc?.profitMarginPercent ?? 35)}% margin
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Price & Status Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">
    Custom Selling Price (USD $)
    <span className="text-[10px] text-gray-400 font-normal ml-2">
      {customPrice ? `(≈ Rs. ${Math.round(Number(customPrice) * 280).toLocaleString()})` : ''}
    </span>
  </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-[#141418] border border-[#2E2E38] rounded-xl text-white focus:outline-none focus:border-[#C27A86]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Publication Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#141418] border border-[#2E2E38] rounded-xl text-white focus:outline-none focus:border-[#C27A86]"
                >
                  <option value="DRAFT">Save as Draft (Review First)</option>
                  <option value="PUBLISHED">Publish Directly to Storefront</option>
                </select>
              </div>
            </div>

            {/* Variants Preview */}
            {selectedProduct.variants?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Available Variants ({selectedProduct.variants.length}):
                </span>
                <div className="max-h-36 overflow-y-auto divide-y divide-[#282832] border border-[#2E2E38] rounded-xl bg-[#141418] text-[11px]">
                  {selectedProduct.variants.map((v: any) => (
                    <div key={v.vid} className="p-2.5 flex items-center justify-between text-gray-300">
                      <div className="flex items-center gap-2">
                        {v.variantImage && (
                          <img src={v.variantImage} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span>{v.variantName}</span>
                      </div>
                      <span className="font-semibold text-white">
                        {v.priceCalc?.sellingPricePkr?.toLocaleString()} PKR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[#282832]">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-[#282832] text-gray-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleImport(selectedProduct.pid, customPrice ? Number(customPrice) : undefined)}
                disabled={actionLoading}
                className="px-5 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>{actionLoading ? 'Importing...' : 'Confirm & Import to Pretty Puff'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCjDropshippingPage;

