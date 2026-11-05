import React from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { BackToTop } from './components/BackToTop';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { QuickViewModal } from './components/QuickViewModal';
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
          <div className="max-w-md w-full bg-white border border-[#F0E6DE] rounded-3xl p-8 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FDF0F2] text-[#C24560] flex items-center justify-center mx-auto text-xl font-bold">
              ✦
            </div>
            <h2 className="font-serif text-2xl text-[#1E1E24]">Experience Refreshed</h2>
            <p className="text-xs text-[#7A7478] leading-relaxed">
              We encountered a temporary viewing glitch. We have safely restored your bag and settings.
            </p>
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
  const { currentPage } = useShop();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'product':
        return <ProductDetailPage />;
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
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Sticky Header */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1">{renderCurrentPage()}</main>

      {/* Luxury Footer */}
      <Footer />

      {/* Global Interactive Overlays */}
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
