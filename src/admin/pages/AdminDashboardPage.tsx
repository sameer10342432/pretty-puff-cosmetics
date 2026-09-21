import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  AlertTriangle,
  BookOpen,
  Plus,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatPKR } from '../../components/PriceDisplay';
import { SalesTrendChart, CategoryBreakdownChart } from '../components/AdminCharts';
import { AdminTab } from '../components/AdminLayout';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.analytics.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-2xl border border-gray-100" />
      </div>
    );
  }

  const m = data?.metrics || {
    totalSales: 0,
    todaySales: 0,
    thisMonthSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    publishedBlogs: 0,
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Store Performance Overview</h2>
          <p className="text-xs text-gray-500">Real-time sales, order fulfillment, and inventory indicators.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('products')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => onNavigateTab('blog')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>New Blog Post</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View All Orders</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE0D7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Revenue</span>
            <div className="text-2xl font-serif font-bold text-[#1E1E24] mt-1">
              {formatPKR(m.totalSales)}
            </div>
            <div className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Lifetime Net</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FDF0F2] text-[#C24560] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE0D7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Today's Revenue</span>
            <div className="text-2xl font-serif font-bold text-[#1E1E24] mt-1">
              {formatPKR(m.todaySales)}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Last 24 hours</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] text-[#D4AF37] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Month's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE0D7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">This Month</span>
            <div className="text-2xl font-serif font-bold text-[#1E1E24] mt-1">
              {formatPKR(m.thisMonthSales)}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Current Calendar Month</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EAF5EC] text-[#258237] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE0D7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Orders</span>
            <div className="text-2xl font-serif font-bold text-[#1E1E24] mt-1">
              {m.totalOrders}
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">
              {m.pendingOrders} Pending Fulfillment
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Status Row (Orders & Inventory health) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center">
          <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-gray-800">{m.pendingOrders}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center">
          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-gray-800">{m.completedOrders}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center">
          <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-gray-800">{m.cancelledOrders}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cancelled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center">
          <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-gray-800">{m.totalCustomers}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Customers</div>
        </div>

        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center cursor-pointer hover:border-[#C24560] transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-amber-600">{m.lowStockProducts}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Low Stock</div>
        </div>

        <div
          onClick={() => onNavigateTab('blog')}
          className="bg-white p-4 rounded-xl border border-[#EBE0D7] text-center cursor-pointer hover:border-[#C24560] transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#C24560] mx-auto mb-1" />
          <div className="text-lg font-serif font-bold text-gray-800">{m.publishedBlogs}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Published Articles</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Over Time Chart (col: 8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-serif text-base text-[#1E1E24]">Revenue Trend (Last 7 Days)</h3>
              <p className="text-xs text-gray-400">Daily customer checkout volume in PKR.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#FDF0F2] text-[#C24560] font-semibold">
              Live Feed
            </span>
          </div>
          <SalesTrendChart data={data?.charts?.salesOverTime || []} />
        </div>

        {/* Category Breakdown (col: 4) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-serif text-base text-[#1E1E24]">Catalog by Category</h3>
            <p className="text-xs text-gray-400">Active product inventory count per sector.</p>
          </div>
          <CategoryBreakdownChart data={data?.charts?.categoryDistribution || []} />
        </div>
      </div>

      {/* Tables Row: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Orders (col: 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-serif text-base text-[#1E1E24]">Recent Customer Orders</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#C24560] hover:underline font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">City</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentOrders?.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{ord.fullName}</td>
                    <td className="py-3 px-4 text-gray-500">{ord.city}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatPKR(ord.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ord.orderStatus === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : ord.orderStatus === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.orderStatus === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab('orders')}
                        className="p-1 text-gray-400 hover:text-[#C24560] rounded-md"
                        title="Inspect Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (col: 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-base text-[#1E1E24]">Low Stock Alert</h3>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-[#C24560] hover:underline font-medium"
            >
              Inventory
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {data?.lowStockAlerts?.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                All catalog items have healthy stock levels.
              </div>
            ) : (
              data?.lowStockAlerts?.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-gray-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{item.sku}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                        item.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.stock <= 0 ? '0 Left' : `${item.stock} Left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
