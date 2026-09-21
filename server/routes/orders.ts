import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC CUSTOMER CHECKOUT ENDPOINT
// ==========================================

const checkoutItemSchema = z.object({
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  productName: z.string(),
  variantName: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  selectedColour: z.string().optional().nullable(),
  selectedSize: z.string().optional().nullable(),
});

const createOrderSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().min(3),
  phone: z.string().min(6),
  city: z.string().min(2),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  address: z.string().min(3),
  notes: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable().transform(val => {
    if (!val) return 'COD';
    const v = val.toUpperCase().trim();
    if (v.includes('BANK') || v.includes('TRANSFER')) return 'BANK_TRANSFER';
    if (v.includes('EASYPAISA') || v.includes('JAZZCASH')) return 'EASYPAISA';
    return 'COD';
  }),
  items: z.array(checkoutItemSchema).min(1),
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = createOrderSchema.parse(req.body);

    // Fetch site & shipping settings
    const shippingSetting = await prisma.shippingSetting.findUnique({ where: { id: 'default' } });
    const freeThreshold = shippingSetting?.freeShippingThreshold ?? 3000;
    const standardFee = shippingSetting?.standardFee ?? 250;

    // Resolve products from DB (by ID, SKU, or Name) to prevent foreign key errors
    let subtotal = 0;
    const resolvedItems: Array<{
      dbProductId: string;
      variantId?: string | null;
      productName: string;
      variantName?: string | null;
      sku: string;
      price: number;
      quantity: number;
      selectedColour?: string | null;
      selectedSize?: string | null;
    }> = [];

    for (const item of validated.items) {
      let dbProduct = null;
      if (item.productId) {
        dbProduct = await prisma.product.findUnique({ where: { id: item.productId } });
      }
      if (!dbProduct && item.sku) {
        dbProduct = await prisma.product.findUnique({ where: { sku: item.sku } });
      }
      if (!dbProduct && item.productName) {
        dbProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { name: item.productName },
              { slug: item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') },
            ],
          },
        });
      }

      if (!dbProduct) {
        // Fallback to first active product in DB if catalog matching is loose
        dbProduct = await prisma.product.findFirst({ where: { isActive: true } });
      }

      if (!dbProduct) {
        res.status(400).json({ success: false, message: `Product "${item.productName}" not found.` });
        return;
      }

      // Check variant existence if variantId provided
      let validVariantId: string | null = null;
      if (item.variantId) {
        const v = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (v) validVariantId = v.id;
      }

      const activePrice = dbProduct.salePrice ?? dbProduct.price ?? item.price;
      subtotal += activePrice * item.quantity;

      resolvedItems.push({
        dbProductId: dbProduct.id,
        variantId: validVariantId,
        productName: dbProduct.name,
        variantName: item.variantName || null,
        sku: dbProduct.sku || item.sku || 'PP-SKU',
        price: activePrice,
        quantity: item.quantity,
        selectedColour: item.selectedColour || null,
        selectedSize: item.selectedSize || null,
      });
    }

    // Server-side coupon verification
    let discount = 0;
    let validCouponId: string | null = null;

    if (validated.couponCode) {
      const code = validated.couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({ where: { code } });

      if (coupon && coupon.isActive) {
        const now = new Date();
        const notExpired = (!coupon.startDate || coupon.startDate <= now) && (!coupon.expiryDate || coupon.expiryDate >= now);
        const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
        const withinLimit = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;

        if (notExpired && meetsMin && withinLimit) {
          validCouponId = coupon.id;
          if (coupon.discountType === 'PERCENTAGE') {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
              discount = coupon.maxDiscountAmount;
            }
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    // Calculate shipping fee
    const shippingFee = subtotal >= freeThreshold ? 0 : standardFee;
    const total = Math.max(0, subtotal - discount + shippingFee);

    // Generate unique order number: PP-XXXXXX
    const orderNumber = `PP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Atomic transaction: Create order, insert order items, decrement stock, log inventory transactions
    const createdOrder = await prisma.$transaction(async tx => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          fullName: validated.fullName,
          email: validated.email.toLowerCase().trim(),
          phone: validated.phone.trim(),
          city: validated.city.trim(),
          province: validated.province || null,
          postalCode: validated.postalCode || null,
          address: validated.address.trim(),
          notes: validated.notes || null,
          subtotal,
          discount,
          shippingFee,
          total,
          couponCode: validated.couponCode ? validated.couponCode.toUpperCase().trim() : null,
          paymentMethod: validated.paymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          items: {
            create: resolvedItems.map(i => ({
              productId: i.dbProductId,
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              sku: i.sku,
              price: i.price,
              quantity: i.quantity,
              total: i.price * i.quantity,
              selectedColour: i.selectedColour,
              selectedSize: i.selectedSize,
            })),
          },
        },
        include: { items: true },
      });

      // Deduct inventory stock for each product
      for (const item of resolvedItems) {
        const prod = await tx.product.findUnique({ where: { id: item.dbProductId } });
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await tx.product.update({
            where: { id: item.dbProductId },
            data: { stock: newStock },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.dbProductId,
              variantId: item.variantId,
              orderId: order.id,
              changeType: 'ORDER_DEDUCTION',
              quantityChanged: -item.quantity,
              previousStock: prod.stock,
              newStock,
              reason: `Deduction for customer order #${orderNumber}`,
              createdBy: 'SYSTEM_CHECKOUT',
            },
          });
        }
      }

      // Record coupon usage if applied
      if (validCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: validCouponId,
            orderId: order.id,
            customerEmail: validated.email.toLowerCase().trim(),
            discountAmount: discount,
          },
        });

        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return order;
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: createdOrder,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Could not process order. Please verify your details.',
    });
  }
});

// Get Order by Order Number (for Confirmation / Tracking)
router.get('/:orderNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber.toUpperCase() },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// ==========================================
// ADMIN ORDER MANAGEMENT ENDPOINTS
// ==========================================

// Get all orders with status filter, search, pagination
router.get('/admin/list', requireAuth, requirePermission('orders.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isArchived: false };

    if (status && status !== 'ALL') {
      where.orderStatus = (status as string).toUpperCase();
    }

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { fullName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// Update Order Status (with inventory restoration if cancelled)
router.patch('/admin/:id/status', requireAuth, requirePermission('orders.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const previousStatus = existingOrder.orderStatus;
    const newStatus = status ? (status as string).toUpperCase() : previousStatus;

    // Check if transitioning to CANCELLED or RETURNED from an active state -> restore inventory!
    const isNowCancelled = (newStatus === 'CANCELLED' || newStatus === 'RETURNED') && previousStatus !== 'CANCELLED' && previousStatus !== 'RETURNED';

    await prisma.$transaction(async tx => {
      await tx.order.update({
        where: { id },
        data: {
          orderStatus: newStatus,
          paymentStatus: paymentStatus ? (paymentStatus as string).toUpperCase() : existingOrder.paymentStatus,
        },
      });

      if (isNowCancelled) {
        for (const item of existingOrder.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const restoredStock = prod.stock + item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: restoredStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                variantId: item.variantId || null,
                orderId: existingOrder.id,
                changeType: 'ORDER_CANCELLATION',
                quantityChanged: item.quantity,
                previousStock: prod.stock,
                newStock: restoredStock,
                reason: `Restoration due to order #${existingOrder.orderNumber} ${newStatus.toLowerCase()}`,
                createdBy: req.admin?.name || 'ADMIN',
              },
            });
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Order #${existingOrder.orderNumber} status updated to ${newStatus}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update order status.' });
  }
});

// Update Tracking Number & Internal Notes
router.patch('/admin/:id/details', requireAuth, requirePermission('orders.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { trackingNumber, internalNotes } = req.body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        internalNotes: internalNotes !== undefined ? internalNotes : undefined,
      },
    });

    res.json({
      success: true,
      message: `Order #${updated.orderNumber} updated.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order details.' });
  }
});

// Delete Order (with inventory restoration if active)
router.delete('/admin/:id', requireAuth, requirePermission('orders.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // If order was active (not CANCELLED or RETURNED), restore inventory stock
    const isCancelled = existingOrder.orderStatus === 'CANCELLED' || existingOrder.orderStatus === 'RETURNED';

    await prisma.$transaction(async tx => {
      if (!isCancelled) {
        for (const item of existingOrder.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const restoredStock = prod.stock + item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: restoredStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                variantId: item.variantId || null,
                orderId: existingOrder.id,
                changeType: 'ORDER_CANCELLATION',
                quantityChanged: item.quantity,
                previousStock: prod.stock,
                newStock: restoredStock,
                reason: `Restoration due to order #${existingOrder.orderNumber} deleted`,
                createdBy: req.admin?.name || 'ADMIN',
              },
            });
          }
        }
      }

      // Delete cascade removes orderItems and couponUsages
      await tx.order.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: `Order #${existingOrder.orderNumber} deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete order.' });
  }
});

export default router;

