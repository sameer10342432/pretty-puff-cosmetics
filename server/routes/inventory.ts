import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// Get Inventory Overview
router.get('/', requireAuth, requirePermission('inventory.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        name: true,
        sku: true,
        thumbnail: true,
        stock: true,
        lowStockThreshold: true,
        category: { select: { name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    const inventoryData = products.map(p => {
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (p.stock <= 0) status = 'out-of-stock';
      else if (p.stock <= p.lowStockThreshold) status = 'low-stock';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        thumbnail: p.thumbnail,
        category: p.category.name,
        currentStock: p.stock,
        reservedStock: 0, // reserved during active checkout
        availableStock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        status,
        variants: p.variants,
      };
    });

    const lowStockCount = inventoryData.filter(i => i.status === 'low-stock').length;
    const outOfStockCount = inventoryData.filter(i => i.status === 'out-of-stock').length;

    res.json({
      success: true,
      data: inventoryData,
      summary: {
        totalItems: inventoryData.length,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
});

// Adjust Product Stock
const adjustStockSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  changeType: z.enum([
    'STOCK_ADDED',
    'STOCK_REMOVED',
    'MANUAL_ADJUSTMENT',
    'ORDER_CANCELLATION',
    'ORDER_DEDUCTION',
  ]),
  quantity: z.number().int(), // can be positive or negative depending on changeType
  reason: z.string().min(2),
});

router.post('/adjust', requireAuth, requirePermission('inventory.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = adjustStockSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: { variants: true },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    let previousStock = product.stock;
    let newStock = previousStock;

    if (validated.changeType === 'STOCK_ADDED' || validated.changeType === 'ORDER_CANCELLATION') {
      newStock = previousStock + Math.abs(validated.quantity);
    } else if (validated.changeType === 'STOCK_REMOVED' || validated.changeType === 'ORDER_DEDUCTION') {
      newStock = Math.max(0, previousStock - Math.abs(validated.quantity));
    } else if (validated.changeType === 'MANUAL_ADJUSTMENT') {
      newStock = Math.max(0, validated.quantity);
    }

    const quantityChanged = newStock - previousStock;

    // Transaction to update stock and record audit log
    await prisma.$transaction([
      prisma.product.update({
        where: { id: validated.productId },
        data: { stock: newStock },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId: validated.productId,
          variantId: validated.variantId || null,
          changeType: validated.changeType,
          quantityChanged,
          previousStock,
          newStock,
          reason: validated.reason,
          createdBy: req.admin?.name || 'ADMIN',
        },
      }),
    ]);

    res.json({
      success: true,
      message: `Stock for "${product.name}" successfully updated from ${previousStock} to ${newStock}.`,
      data: {
        productId: product.id,
        previousStock,
        newStock,
        quantityChanged,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to adjust stock.' });
  }
});

// Get Audit Transactions Log
router.get('/transactions', requireAuth, requirePermission('inventory.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true, sku: true } },
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory transactions.' });
  }
});

export default router;
