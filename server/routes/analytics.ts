import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

router.get('/dashboard', requireAuth, requirePermission('dashboard.view'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      allOrders,
      todayOrders,
      monthOrders,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      publishedBlogs,
      recentOrders,
    ] = await Promise.all([
      // Total orders
      prisma.order.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          total: true,
          orderStatus: true,
          createdAt: true,
        },
      }),
      // Today orders
      prisma.order.findMany({
        where: {
          isArchived: false,
          createdAt: { gte: startOfToday },
          orderStatus: { not: 'CANCELLED' },
        },
        select: { total: true },
      }),
      // This month orders
      prisma.order.findMany({
        where: {
          isArchived: false,
          createdAt: { gte: startOfMonth },
          orderStatus: { not: 'CANCELLED' },
        },
        select: { total: true },
      }),
      // Total products
      prisma.product.count({ where: { isArchived: false } }),
      // Low stock count
      prisma.product.count({
        where: {
          isArchived: false,
          stock: { gt: 0, lte: 5 },
        },
      }),
      // Out of stock count
      prisma.product.count({
        where: {
          isArchived: false,
          stock: { lte: 0 },
        },
      }),
      // Published blogs
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      // Recent orders table
      prisma.order.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { items: true },
      }),
    ]);

    // Financial calculations
    const totalSales = allOrders
      .filter(o => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const thisMonthSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // Order counts by status
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'PENDING').length;
    const completedOrders = allOrders.filter(o => o.orderStatus === 'DELIVERED').length;
    const cancelledOrders = allOrders.filter(o => o.orderStatus === 'CANCELLED').length;

    // Unique customers count
    const uniqueCustomerEmails = new Set(allOrders.map(o => (o as any).email)).size || allOrders.length;

    // Time-series chart: Last 7 days sales & orders
    const salesOverTime: { date: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayOrders = allOrders.filter(
        o => o.createdAt >= dayStart && o.createdAt <= dayEnd && o.orderStatus !== 'CANCELLED'
      );

      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      salesOverTime.push({
        date: dayStr,
        sales: daySales,
        orders: dayOrders.length,
      });
    }

    // Top products by orders or rating
    const topProducts = await prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      orderBy: [{ isBestSeller: 'desc' }, { rating: 'desc' }],
      take: 5,
      select: {
        id: true,
        name: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        stock: true,
        rating: true,
        category: { select: { name: true } },
      },
    });

    // Category distribution
    const categoriesWithCount = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
      take: 6,
    });

    const categoryDistribution = categoriesWithCount.map(c => ({
      category: c.name,
      count: c._count.products,
    }));

    // Low stock alert items
    const lowStockAlerts = await prisma.product.findMany({
      where: {
        isArchived: false,
        stock: { lte: 5 },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        thumbnail: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalSales,
          todaySales,
          thisMonthSales,
          totalOrders: allOrders.length,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          totalCustomers: uniqueCustomerEmails,
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          publishedBlogs,
        },
        charts: {
          salesOverTime,
          categoryDistribution,
        },
        topProducts,
        recentOrders,
        lowStockAlerts,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics.' });
  }
});

export default router;
