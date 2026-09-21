import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

// Public: Newsletter Subscribe
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        await prisma.newsletterSubscriber.update({
          where: { email: cleanEmail },
          data: { status: 'SUBSCRIBED', subscribedAt: new Date(), unsubscribedAt: null },
        });
        res.json({
          success: true,
          message: 'Welcome back to Pretty Puff Beauty Club! Your subscription has been reactivated.',
        });
        return;
      }
      res.json({
        success: true,
        message: 'You are already subscribed to the Pretty Puff Beauty Club!',
      });
      return;
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        status: 'SUBSCRIBED',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Welcome to Pretty Puff Beauty Club! Check your inbox for exclusive VIP perks.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Invalid email address.' });
  }
});

// Admin: List Subscribers
router.get('/admin', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.email = { contains: (search as string).toLowerCase().trim() };
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
    });

    res.json({ success: true, data: subscribers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers.' });
  }
});

// Admin: Export Subscribers CSV
router.get('/admin/export', requireAuth, requirePermission('settings.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'SUBSCRIBED' },
      orderBy: { subscribedAt: 'desc' },
    });

    let csvContent = 'Email,Status,SubscribedAt\n';
    for (const sub of subscribers) {
      csvContent += `"${sub.email}","${sub.status}","${sub.subscribedAt.toISOString()}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prettypuff-subscribers.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export subscribers.' });
  }
});

// Admin: Delete subscriber
router.delete('/admin/:id', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subscriber removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove subscriber.' });
  }
});

export default router;
