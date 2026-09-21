import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// Submit Review (Public)
const createReviewSchema = z.object({
  productId: z.string(),
  author: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5),
  orderId: z.string().optional().nullable(),
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = createReviewSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: validated.productId } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const review = await prisma.productReview.create({
      data: {
        productId: validated.productId,
        author: validated.author.trim(),
        rating: validated.rating,
        comment: validated.comment.trim(),
        orderId: validated.orderId || null,
        verified: !!validated.orderId,
        status: 'PENDING', // Awaiting admin approval
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been submitted for moderation.',
      data: review,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to submit review.' });
  }
});

// Admin: List all reviews
router.get('/admin', requireAuth, requirePermission('reviews.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = (status as string).toUpperCase();
    }

    const reviews = await prisma.productReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, thumbnail: true } },
      },
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// Admin: Moderate review status (APPROVE / REJECT)
router.patch('/admin/:id/status', requireAuth, requirePermission('reviews.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status.' });
      return;
    }

    const updated = await prisma.productReview.update({
      where: { id },
      data: { status },
      include: { product: true },
    });

    // Recalculate average product rating and review count if approved
    if (status === 'APPROVED' || status === 'REJECTED') {
      const approvedReviews = await prisma.productReview.findMany({
        where: { productId: updated.productId, status: 'APPROVED' },
      });

      const avgRating =
        approvedReviews.length > 0
          ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
          : 5.0;

      await prisma.product.update({
        where: { id: updated.productId },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: approvedReviews.length,
        },
      });
    }

    res.json({
      success: true,
      message: `Review marked as ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update review status.' });
  }
});

// Admin: Delete review
router.delete('/admin/:id', requireAuth, requirePermission('reviews.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.productReview.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
});

export default router;
