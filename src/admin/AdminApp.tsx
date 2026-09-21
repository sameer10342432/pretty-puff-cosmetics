import React, { useState } from 'react';
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
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
};

export default AdminApp;
