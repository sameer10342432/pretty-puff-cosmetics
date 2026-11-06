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


// ==========================================
// PROFIT & PRICING REPORTING DASHBOARD (Part 13)
// ==========================================
router.get('/profit-report', requireAuth, requirePermission('dashboard.view'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, country, currency } = req.query;

    const where: any = {
      isArchived: false,
      orderStatus: { not: 'CANCELLED' },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (currency) {
      where.currency = currency as string;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                costPrice: true,
                landedCost: true,
                minimumPrice: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalLandedCost = 0;
    let totalShippingCost = 0;
    let totalPaymentFees = 0;
    let totalDiscounts = 0;

    const productProfitMap = new Map<string, {
      name: string;
      category: string;
      unitsSold: number;
      revenue: number;
      landedCost: number;
      profit: number;
      marginPercent: number;
    }>();

    for (const order of orders) {
      totalRevenue += order.total;
      totalDiscounts += order.discount || 0;
      totalShippingCost += (order as any).shippingCostActual || order.shippingFee || 0;
      totalPaymentFees += (order as any).paymentFee || 0;
      totalLandedCost += (order as any).totalLandedCost || 0;

      for (const item of order.items) {
        const pId = item.productId;
        const pName = item.productName;
        const catName = item.product?.category?.name || 'Cosmetics';
        const itemRev = item.price * item.quantity;
        const itemCost = (item as any).landedCost ? ((item as any).landedCost * item.quantity) : (itemRev * 0.5);
        const itemProfit = itemRev - itemCost;

        if (!productProfitMap.has(pId)) {
          productProfitMap.set(pId, {
            name: pName,
            category: catName,
            unitsSold: 0,
            revenue: 0,
            landedCost: 0,
            profit: 0,
            marginPercent: 0,
          });
        }

        const stat = productProfitMap.get(pId)!;
        stat.unitsSold += item.quantity;
        stat.revenue += itemRev;
        stat.landedCost += itemCost;
        stat.profit += itemProfit;
        stat.marginPercent = stat.revenue > 0 ? Math.round((stat.profit / stat.revenue) * 100) : 0;
      }
    }

    const netProfit = Math.round((totalRevenue - totalLandedCost - totalPaymentFees) * 100) / 100;
    const avgMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    const productList = Array.from(productProfitMap.values());
    const mostProfitable = [...productList].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const lowMargin = [...productList].filter(p => p.marginPercent < 15).sort((a, b) => a.marginPercent - b.marginPercent);

    // Products in catalog with low margins or below minimum
    const allCatalogProducts = await prisma.product.findMany({
      where: { isArchived: false, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        costPrice: true,
        landedCost: true,
        minimumPrice: true,
        cjMarketPrice: true,
      },
    });

    const catalogMarginIssues = allCatalogProducts
      .map(p => {
        const cost = p.landedCost || p.costPrice || 0;
        const minP = p.minimumPrice || cost * 1.2;
        const currentP = p.price;
        const isBelowMin = currentP < minP;
        const profit = currentP - cost;
        const margin = currentP > 0 ? Math.round((profit / currentP) * 100) : 0;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: currentP,
          cost,
          minimumPrice: minP,
          marginPercent: margin,
          isBelowMin,
        };
      })
      .filter(p => p.isBelowMin || p.marginPercent < 15);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalLandedCost: Math.round(totalLandedCost * 100) / 100,
          totalShippingCost: Math.round(totalShippingCost * 100) / 100,
          totalPaymentFees: Math.round(totalPaymentFees * 100) / 100,
          totalDiscounts: Math.round(totalDiscounts * 100) / 100,
          netProfit,
          avgMarginPercent,
          completedOrdersCount: orders.length,
        },
        mostProfitableProducts: mostProfitable,
        lowMarginProducts: lowMargin,
        catalogMarginIssues,
      },
    });
  } catch (error: any) {
    console.error('Profit report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
