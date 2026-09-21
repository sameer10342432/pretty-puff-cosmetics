import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  Image as ImageIcon,
  BookOpen,
  Star,
  MessageSquare,
  Mail,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'banners'
  | 'blog'
  | 'reviews'
  | 'messages'
  | 'subscribers'
  | 'settings'
  | 'users';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const { admin, logout, hasPermission, hasRole } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    superAdminOnly?: boolean;
    group?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    // Catalog Group
    { id: 'products', label: 'Products', icon: Package, permission: 'products.manage', group: 'Catalog' },
    { id: 'categories', label: 'Categories', icon: Layers, permission: 'categories.manage', group: 'Catalog' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, permission: 'inventory.manage', group: 'Catalog' },
    // Sales
    { id: 'orders', label: 'Orders', icon: ShoppingBag, permission: 'orders.manage', group: 'Sales & People' },
    { id: 'customers', label: 'Customers', icon: Users, permission: 'customers.manage', group: 'Sales & People' },
    // Marketing
    { id: 'coupons', label: 'Coupons', icon: Tag, permission: 'coupons.manage', group: 'Marketing & Content' },
    { id: 'banners', label: 'Banners', icon: ImageIcon, permission: 'banners.manage', group: 'Marketing & Content' },
    { id: 'blog', label: 'Beauty Journal', icon: BookOpen, permission: 'blog.manage', group: 'Marketing & Content' },
    // Feedback
    { id: 'reviews', label: 'Reviews', icon: Star, permission: 'reviews.manage', group: 'Customer Feedback' },
    { id: 'messages', label: 'Inquiries', icon: MessageSquare, permission: 'messages.manage', group: 'Customer Feedback' },
    { id: 'subscribers', label: 'Subscribers', icon: Mail, permission: 'settings.manage', group: 'Customer Feedback' },
    // Admin
    { id: 'settings', label: 'Store Settings', icon: Settings, permission: 'settings.manage', group: 'System' },
    { id: 'users', label: 'Staff & Roles', icon: ShieldCheck, superAdminOnly: true, group: 'System' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.superAdminOnly) return hasRole('SUPER_ADMIN');
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const currentItem = navItems.find(item => item.id === currentTab);

  return (
    <div className="min-h-screen bg-[#F7F4F1] flex text-[#1E1E24] font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#18181C] text-gray-200 border-r border-[#2C2C35] shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2C2C35] flex items-center justify-between">
          <div>
            <div className="font-serif text-xl text-white tracking-wide flex items-center gap-2">
              <span>Pretty Puff</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#C24560]/20 text-[#F8CAD1] border border-[#C24560]/40 font-sans font-semibold">
                Admin
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Cosmetics Management</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavItems.map((item, index) => {
            const isSelected = currentTab === item.id;
            const prevGroup = index > 0 ? filteredNavItems[index - 1].group : null;
            const isNewGroup = item.group && item.group !== prevGroup;

            return (
              <React.Fragment key={item.id}>
                {isNewGroup && (
                  <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#C24560] text-white shadow-md'
                      : 'text-gray-300 hover:bg-[#25252D] hover:text-white'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Current user & Logout */}
        <div className="p-4 border-t border-[#2C2C35] bg-[#141418]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#C24560] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-white truncate">{admin?.name || 'Administrator'}</div>
                <div className="text-[10px] text-gray-400 truncate">{admin?.role || 'Staff'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#25252D] rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#EBE0D7] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-[#1E1E24] rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-serif font-medium text-[#1E1E24]">
                {currentItem?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#C24560] font-medium px-3 py-1.5 rounded-lg border border-[#E0D5CE] hover:border-[#C24560] transition-colors"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {currentTab !== 'products' && (
              <button
                onClick={() => onSelectTab('products')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Product</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-[#18181C] text-gray-200 flex flex-col z-10">
              <div className="p-4 border-b border-[#2C2C35] flex items-center justify-between">
                <span className="font-serif text-lg text-white">Pretty Puff Admin</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1">
                {filteredNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      currentTab === item.id ? 'bg-[#C24560] text-white' : 'text-gray-300 hover:bg-[#25252D]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-[#2C2C35]">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:bg-[#25252D] rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
