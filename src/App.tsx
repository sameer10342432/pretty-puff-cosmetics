import React from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { BackToTop } from './components/BackToTop';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { QuickViewModal } from './components/QuickViewModal';
import { CountrySelectorModal } from './components/CountrySelectorModal';
import { SearchModal } from './components/SearchModal';
import { ToastContainer } from './components/ToastContainer';
import { ShopProvider, useShop } from './context/ShopContext';
import { AboutPage } from './pages/AboutPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { BlogMainPage } from './pages/BlogMainPage';
import { CartPage } from './pages/CartPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { HomePage } from './pages/HomePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { ShippingPage } from './pages/ShippingPage';
import { ShopPage } from './pages/ShopPage';
import { TermsPage } from './pages/TermsPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminApp } from './admin/AdminApp';


interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class StoreErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pretty Puff Customer Store Error Boundary intercepted:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-xl w-full bg-white border border-[#F0E6DE] rounded-3xl p-8 shadow-sm space-y-4 text-left">
            <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto text-xl font-bold">
              ✦
            </div>
            <h2 className="font-serif text-2xl text-[#1E1E24] text-center">Experience Refreshed</h2>
            <p className="text-xs text-[#7A7478] leading-relaxed text-center">
              We encountered a temporary viewing glitch. We have safely restored your bag and settings.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-mono overflow-auto max-h-48">
                <div className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</div>
                <div className="whitespace-pre text-[10px] text-red-600">{this.state.error.stack}</div>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold tracking-wider uppercase rounded-full transition-colors"
            >
              Return to Pretty Puff Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const {
    currentPage,
    currentProductSlug,
    showCountryConfirm,
    detectedCountry,
    setCountry,
    dismissCountryConfirm,
    selectedCountry,
    isCountryModalOpen,
    setIsCountryModalOpen,
  } = useShop();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'product':
        return (
          <ProductDetailPage
            key={currentProductSlug || 'active-product'}
            productSlug={currentProductSlug || undefined}
          />
        );
      case 'cart':
        return <CartPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FAQPage />;
      case 'shipping':
        return <ShippingPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'terms':
        return <TermsPage />;
      case 'blog':
        return <BlogMainPage />;
      case 'blog-post':
        return <BlogDetailPage />;
      case 'admin':
        return <AdminApp />;
      default:
        return <HomePage />;
    }
  };

  if (currentPage === 'admin') {
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF8] text-[#1E1E24] font-sans antialiased selection:bg-[#F8CAD1] selection:text-[#1E1E24]">
      
      {/* Geolocation Country Suggestion Bar */}
      {showCountryConfirm && detectedCountry && (
        <div className="bg-[#1E1E24] text-white text-xs px-4 py-2.5 flex items-center justify-between border-b border-white/10 z-50">
          <div className="flex items-center gap-2 max-w-xl mx-auto flex-1 text-center sm:text-left justify-center sm:justify-start">
            <span>{detectedCountry.flag}</span>
            <span>It looks like you're shopping from <strong>{detectedCountry.name}</strong>. Would you like to view products and live shipping in <strong>{detectedCountry.currency}</strong>?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCountry(detectedCountry.code)}
              className="py-1 px-3 bg-[#C24560] hover:bg-[#A3354E] text-white font-semibold rounded-lg text-[11px] transition-colors"
            >
              Update to {detectedCountry.code}
            </button>
            <button
              onClick={dismissCountryConfirm}
              className="py-1 px-2.5 text-gray-400 hover:text-white text-[11px] transition-colors"
            >
              Keep {selectedCountry.code}
            </button>
          </div>
        </div>
      )}
  
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Sticky Header */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1">{renderCurrentPage()}</main>

      {/* Luxury Footer */}
      <Footer />

      {/* Global Interactive Overlays */}
      <CountrySelectorModal isOpen={isCountryModalOpen} onClose={() => setIsCountryModalOpen(false)} />
      <CartDrawer />
      <SearchModal />
      <QuickViewModal />
      <CheckoutModal />
      <FloatingWhatsApp />
      <BackToTop />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <StoreErrorBoundary>
        <AppContent />
      </StoreErrorBoundary>
    </ShopProvider>
  );
}
