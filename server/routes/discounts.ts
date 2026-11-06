import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';
import { DiscountService } from '../services/discountService';

const router = Router();

const discountSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'STOREWIDE', 'FREE_SHIPPING']),
  discountValue: z.number().min(0),
  appliesTo: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  categoryIds: z.array(z.string()).optional().nullable(),
  productIds: z.array(z.string()).optional().nullable(),
  couponCode: z.string().optional().nullable(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  preventStacking: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/discounts/active - Public storefront active promotions
router.get('/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await DiscountService.getActiveDiscounts();
    res.json({ success: true, data: discounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/discounts/validate - Validate cart discount
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart items required.' });
      return;
    }

    const result = await DiscountService.calculateCartDiscounts(items, couponCode);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/discounts - Admin list
router.get('/', requireAuth, requirePermission('settings.view'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: discounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/discounts - Admin create
router.post('/', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = discountSchema.parse(req.body);

    const created = await prisma.discount.create({
      data: {
        name: validated.name,
        description: validated.description,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        appliesTo: validated.appliesTo,
        categoryIds: validated.categoryIds ? JSON.stringify(validated.categoryIds) : null,
        productIds: validated.productIds ? JSON.stringify(validated.productIds) : null,
        couponCode: validated.couponCode ? validated.couponCode.trim().toUpperCase() : null,
        minOrderAmount: validated.minOrderAmount || 0,
        maxDiscountAmount: validated.maxDiscountAmount || null,
        preventStacking: validated.preventStacking !== false,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        isActive: validated.isActive !== false,
      },
    });

    res.status(201).json({ success: true, data: created, message: 'Discount promotion created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/discounts/:id - Admin update
router.put('/:id', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = discountSchema.partial().parse(req.body);

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.discountType && { discountType: validated.discountType }),
        ...(validated.discountValue !== undefined && { discountValue: validated.discountValue }),
        ...(validated.appliesTo && { appliesTo: validated.appliesTo }),
        ...(validated.categoryIds !== undefined && {
          categoryIds: validated.categoryIds ? JSON.stringify(validated.categoryIds) : null,
        }),
        ...(validated.productIds !== undefined && {
          productIds: validated.productIds ? JSON.stringify(validated.productIds) : null,
        }),
        ...(validated.couponCode !== undefined && {
          couponCode: validated.couponCode ? validated.couponCode.trim().toUpperCase() : null,
        }),
        ...(validated.minOrderAmount !== undefined && { minOrderAmount: validated.minOrderAmount }),
        ...(validated.maxDiscountAmount !== undefined && { maxDiscountAmount: validated.maxDiscountAmount }),
        ...(validated.preventStacking !== undefined && { preventStacking: validated.preventStacking }),
        ...(validated.startDate !== undefined && {
          startDate: validated.startDate ? new Date(validated.startDate) : null,
        }),
        ...(validated.endDate !== undefined && {
          endDate: validated.endDate ? new Date(validated.endDate) : null,
        }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    res.json({ success: true, data: updated, message: 'Discount updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/discounts/:id - Admin delete
router.delete('/:id', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.discount.delete({ where: { id } });
    res.json({ success: true, message: 'Discount deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
