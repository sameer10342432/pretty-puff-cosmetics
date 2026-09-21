import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// Admin: Get all customers
router.get('/', requireAuth, requirePermission('customers.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        total: true,
        orderStatus: true,
        createdAt: true,
      },
    });

    // Aggregate unique customer metrics by email
    const customerMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      city: string;
      address: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: Date;
      orders: any[];
    }>();

    for (const ord of orders) {
      const email = ord.email.toLowerCase().trim();
      const existing = customerMap.get(email);
      if (existing) {
        existing.orderCount += 1;
        if (ord.orderStatus !== 'CANCELLED') {
          existing.totalSpent += ord.total;
        }
        existing.orders.push(ord);
      } else {
        customerMap.set(email, {
          name: ord.fullName,
          email,
          phone: ord.phone,
          city: ord.city,
          address: ord.address,
          orderCount: 1,
          totalSpent: ord.orderStatus !== 'CANCELLED' ? ord.total : 0,
          lastOrderDate: ord.createdAt,
          orders: [ord],
        });
      }
    }

    let customers = Array.from(customerMap.values());

    if (search) {
      const q = (search as string).toLowerCase().trim();
      customers = customers.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: customers,
      summary: {
        totalCustomers: customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
});

export default router;
