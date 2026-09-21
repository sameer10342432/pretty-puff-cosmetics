import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// Public: Get active banners
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { position: 'asc' },
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

// Admin: Get all banners
router.get('/admin', requireAuth, requirePermission('banners.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { position: 'asc' },
    });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin banners.' });
  }
});

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional().nullable(),
  image: z.string().min(5),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  position: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// Admin: Create banner
router.post('/admin', requireAuth, requirePermission('banners.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = bannerSchema.parse(req.body);
    const banner = await prisma.banner.create({
      data: {
        title: validated.title,
        subtitle: validated.subtitle || null,
        image: validated.image,
        ctaText: validated.ctaText || null,
        ctaUrl: validated.ctaUrl || null,
        position: validated.position,
        isActive: validated.isActive,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    });

    res.status(201).json({ success: true, message: 'Banner created.', data: banner });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create banner.' });
  }
});

// Admin: Update banner
router.put('/admin/:id', requireAuth, requirePermission('banners.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        image: body.image,
        ctaText: body.ctaText,
        ctaUrl: body.ctaUrl,
        position: body.position !== undefined ? parseInt(body.position, 10) : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    res.json({ success: true, message: 'Banner updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update banner.' });
  }
});

// Admin: Delete banner
router.delete('/admin/:id', requireAuth, requirePermission('banners.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner.' });
  }
});

export default router;
