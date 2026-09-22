import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout, AdminTab } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';
import { AdminBannersPage } from './pages/AdminBannersPage';
import { AdminBlogPage } from './pages/AdminBlogPage';
import { AdminReviewsPage } from './pages/AdminReviewsPage';
import { AdminMessagesPage } from './pages/AdminMessagesPage';
import { AdminSubscribersPage } from './pages/AdminSubscribersPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Portal Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearSession = () => {
    localStorage.removeItem('pretty_puff_admin_token');
    localStorage.removeItem('pretty_puff_admin_user');
    window.location.href = '/admin';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141418] text-gray-200 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1C1C22] border border-[#3A3A48] rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#C24560]/20 text-[#C24560] flex items-center justify-center mx-auto border border-[#C24560]/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-white">Admin Portal Notice</h2>
              <p className="text-xs text-gray-400 mt-1">
                A view rendering error was safely intercepted to protect your administrative session.
              </p>
            </div>
            {this.state.error && (
              <div className="text-left bg-[#121216] border border-[#2E2E38] rounded-xl p-3 text-[11px] text-red-300 font-mono break-all max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Portal</span>
              </button>
              <button
                onClick={this.handleClearSession}
                className="flex-1 py-2.5 px-4 bg-[#282832] hover:bg-[#343442] text-gray-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Re-login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminContent: React.FC = () => {
  const { token, isLoading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  if (isLoading && !token) {
    return (
      <div className="min-h-screen bg-[#141418] flex items-center justify-center text-gray-400 text-xs font-sans">
        Loading Pretty Puff Admin Portal...
      </div>
    );
  }

  if (!token) {
    return <AdminLoginPage />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboardPage onNavigateTab={setCurrentTab} />;
      case 'products':
        return <AdminProductsPage />;
      case 'categories':
        return <AdminCategoriesPage />;
      case 'inventory':
        return <AdminInventoryPage />;
      case 'orders':
        return <AdminOrdersPage />;
      case 'customers':
        return <AdminCustomersPage />;
      case 'coupons':
        return <AdminCouponsPage />;
      case 'banners':
        return <AdminBannersPage />;
      case 'blog':
        return <AdminBlogPage />;
      case 'reviews':
        return <AdminReviewsPage />;
      case 'messages':
        return <AdminMessagesPage />;
      case 'subscribers':
        return <AdminSubscribersPage />;
      case 'settings':
        return <AdminSettingsPage />;
      case 'users':
        return <AdminUsersPage />;
      default:
        return <AdminDashboardPage onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <AdminLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderTabContent()}
    </AdminLayout>
  );
};

export const AdminApp: React.FC = () => {
  return (
    <AdminErrorBoundary>
      <AdminAuthProvider>
        <AdminContent />
      </AdminAuthProvider>
    </AdminErrorBoundary>
  );
};

export default AdminApp;
