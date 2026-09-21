import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC COUPON VALIDATION ENDPOINT
// ==========================================

const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
  email: z.string().email().optional(),
});

router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, subtotal, email } = validateCouponSchema.parse(req.body);
    const formattedCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: formattedCode },
      include: {
        usages: email ? { where: { customerEmail: email.toLowerCase().trim() } } : false,
      },
    });

    if (!coupon || !coupon.isActive) {
      res.status(404).json({
        success: false,
        message: 'Invalid or inactive promotional code.',
      });
      return;
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      res.status(400).json({ success: false, message: 'This promo code is not active yet.' });
      return;
    }

    if (coupon.expiryDate && coupon.expiryDate < now) {
      res.status(400).json({ success: false, message: 'This promo code has expired.' });
      return;
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of Rs. ${coupon.minOrderAmount.toLocaleString()} required for this coupon.`,
      });
      return;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      res.status(400).json({
        success: false,
        message: 'This promo code has reached its maximum total usage limit.',
      });
      return;
    }

    if (email && coupon.perCustomerLimit && (coupon as any).usages?.length >= coupon.perCustomerLimit) {
      res.status(400).json({
        success: false,
        message: 'You have already used this coupon the maximum allowed times.',
      });
      return;
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        description: coupon.description,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Validation failed.' });
  }
});

// ==========================================
// ADMIN COUPON CRUD ENDPOINTS
// ==========================================

const couponFormSchema = z.object({
  code: z.string().min(2),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perCustomerLimit: z.number().int().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Get all coupons for admin
router.get('/admin', requireAuth, requirePermission('coupons.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { usages: true } },
      },
    });

    res.json({
      success: true,
      data: coupons.map(c => ({
        ...c,
        totalUses: c._count.usages,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

// Create Coupon
router.post('/admin', requireAuth, requirePermission('coupons.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = couponFormSchema.parse(req.body);
    const code = validated.code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ success: false, message: `Coupon code "${code}" already exists.` });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: validated.description || null,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        minOrderAmount: validated.minOrderAmount || 0,
        maxDiscountAmount: validated.maxDiscountAmount || null,
        usageLimit: validated.usageLimit || null,
        perCustomerLimit: validated.perCustomerLimit || 1,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        isActive: validated.isActive,
      },
    });

    res.status(201).json({ success: true, message: `Coupon "${coupon.code}" created.`, data: coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create coupon.' });
  }
});

// Update Coupon
router.put('/admin/:id', requireAuth, requirePermission('coupons.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code ? body.code.toUpperCase().trim() : undefined,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue !== undefined ? parseFloat(body.discountValue) : undefined,
        minOrderAmount: body.minOrderAmount !== undefined ? parseFloat(body.minOrderAmount) : undefined,
        maxDiscountAmount: body.maxDiscountAmount !== undefined ? (body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null) : undefined,
        usageLimit: body.usageLimit !== undefined ? (body.usageLimit ? parseInt(body.usageLimit, 10) : null) : undefined,
        perCustomerLimit: body.perCustomerLimit !== undefined ? (body.perCustomerLimit ? parseInt(body.perCustomerLimit, 10) : null) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });

    res.json({ success: true, message: 'Coupon updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update coupon.' });
  }
});

// Delete Coupon
router.delete('/admin/:id', requireAuth, requirePermission('coupons.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
});

export default router;
