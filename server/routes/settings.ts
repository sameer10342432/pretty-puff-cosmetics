import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// Public: Get all store configuration
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [site, shipping, payment] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { id: 'default' } }),
      prisma.shippingSetting.findUnique({ where: { id: 'default' } }),
      prisma.paymentSetting.findUnique({ where: { id: 'default' } }),
    ]);

    res.json({
      success: true,
      data: {
        site: site || {
          storeName: 'Pretty Puff',
          email: 'sameerliaqat81@gmail.com',
          phone: '+923474542881',
          whatsapp: 'https://wa.me/923474542881',
          address: 'Gulberg III, Lahore, Pakistan',
          currency: 'PKR',
        },
        shipping: shipping || {
          standardFee: 250,
          freeShippingThreshold: 3000,
          estimatedDeliveryDays: '2-4 Business Days',
        },
        payment: payment || {
          codEnabled: true,
          bankTransferEnabled: true,
          easyPaisaEnabled: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

// Admin: Update site information
router.put('/admin/site', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updated = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        storeName: body.storeName,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        address: body.address,
        currency: body.currency,
        taxPercentage: body.taxPercentage !== undefined ? parseFloat(body.taxPercentage) : undefined,
        socialInstagram: body.socialInstagram,
        socialFacebook: body.socialFacebook,
        socialTiktok: body.socialTiktok,
        socialYoutube: body.socialYoutube,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
      },
      create: {
        id: 'default',
        storeName: body.storeName || 'Pretty Puff',
        email: body.email || 'sameerliaqat81@gmail.com',
        phone: body.phone || '+923474542881',
        whatsapp: body.whatsapp || 'https://wa.me/923474542881',
        address: body.address || 'Gulberg III, Lahore, Pakistan',
        currency: body.currency || 'PKR',
      },
    });

    res.json({ success: true, message: 'Store settings updated successfully.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update store settings.' });
  }
});

// Admin: Update shipping settings
router.put('/admin/shipping', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updated = await prisma.shippingSetting.upsert({
      where: { id: 'default' },
      update: {
        standardFee: body.standardFee !== undefined ? parseFloat(body.standardFee) : undefined,
        freeShippingThreshold: body.freeShippingThreshold !== undefined ? parseFloat(body.freeShippingThreshold) : undefined,
        estimatedDeliveryDays: body.estimatedDeliveryDays,
      },
      create: {
        id: 'default',
        standardFee: body.standardFee !== undefined ? parseFloat(body.standardFee) : 250,
        freeShippingThreshold: body.freeShippingThreshold !== undefined ? parseFloat(body.freeShippingThreshold) : 3000,
        estimatedDeliveryDays: body.estimatedDeliveryDays || '2-4 Business Days',
      },
    });

    res.json({ success: true, message: 'Shipping settings updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update shipping settings.' });
  }
});

// Admin: Update payment settings
router.put('/admin/payment', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updated = await prisma.paymentSetting.upsert({
      where: { id: 'default' },
      update: {
        codEnabled: body.codEnabled !== undefined ? Boolean(body.codEnabled) : undefined,
        bankTransferEnabled: body.bankTransferEnabled !== undefined ? Boolean(body.bankTransferEnabled) : undefined,
        easyPaisaEnabled: body.easyPaisaEnabled !== undefined ? Boolean(body.easyPaisaEnabled) : undefined,
        jazzCashEnabled: body.jazzCashEnabled !== undefined ? Boolean(body.jazzCashEnabled) : undefined,
        instructions: body.instructions,
      },
      create: {
        id: 'default',
        codEnabled: body.codEnabled !== undefined ? Boolean(body.codEnabled) : true,
        bankTransferEnabled: body.bankTransferEnabled !== undefined ? Boolean(body.bankTransferEnabled) : true,
        easyPaisaEnabled: body.easyPaisaEnabled !== undefined ? Boolean(body.easyPaisaEnabled) : true,
      },
    });

    res.json({ success: true, message: 'Payment settings updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update payment settings.' });
  }
});

export default router;
