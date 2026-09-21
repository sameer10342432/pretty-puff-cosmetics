import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  message: z.string().min(5),
});

// Public: Submit contact inquiry
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = contactSchema.parse(req.body);

    const message = await prisma.contactMessage.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        phone: validated.phone?.trim() || null,
        subject: validated.subject?.trim() || 'General Inquiry',
        message: validated.message.trim(),
        status: 'NEW',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received! Our beauty advisory team will contact you shortly.',
      data: message,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to send message.' });
  }
});

// Admin: List all contact inquiries
router.get('/admin', requireAuth, requirePermission('messages.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = (status as string).toUpperCase();
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// Admin: Update inquiry status (NEW -> READ -> REPLIED -> CLOSED)
router.patch('/admin/:id/status', requireAuth, requirePermission('messages.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: status ? (status as string).toUpperCase() : undefined,
        internalNotes: internalNotes !== undefined ? internalNotes : undefined,
      },
    });

    res.json({ success: true, message: 'Status updated.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update message.' });
  }
});

// Admin: Delete inquiry
router.delete('/admin/:id', requireAuth, requirePermission('messages.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

export default router;
