import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';
import { cjService } from '../services/cjService';

const router = Router();

// ==========================================
// 1. SETTINGS & CONNECTION STATUS
// ==========================================

// Get CJ configuration and connection status
router.get('/settings', requireAuth, requirePermission('products.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await cjService.getSettings();
    const appUrl = (process.env.APP_URL || 'https://yourdomain.com').replace(/\/$/, '');
    const webhookProductUrl = `${appUrl}/api/cjdropshipping/webhook/product`;
    const webhookStockUrl = `${appUrl}/api/cjdropshipping/webhook/stock`;

    res.json({
      success: true,
      data: {
        apiKey: settings.apiKey ? `${settings.apiKey.slice(0, 8)}...${settings.apiKey.slice(-4)}` : '',
        hasApiKey: settings.hasApiKey,
        hasToken: settings.hasToken,
        isTokenExpired: settings.isTokenExpired,
        tokenExpiry: settings.accessTokenExpiry,
        openId: settings.openId,
        currencyRatePkr: settings.currencyRatePkr,
        pricingType: settings.pricingType,
        markupValue: settings.markupValue,
        estimatedShippingPkr: settings.estimatedShippingPkr,
        autoPublish: settings.autoPublish,
        autoSyncStock: settings.autoSyncStock,
        autoSyncPrice: settings.autoSyncPrice,
        webhookProductUrl,
        webhookStockUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch settings.' });
  }
});

// Update CJ configuration
const updateSettingsSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  currencyRatePkr: z.number().positive().optional(),
  pricingType: z.enum(['PERCENTAGE', 'FIXED', 'MARGIN']).optional(),
  markupValue: z.number().nonnegative().optional(),
  estimatedShippingPkr: z.number().nonnegative().optional(),
  autoPublish: z.boolean().optional(),
  autoSyncStock: z.boolean().optional(),
  autoSyncPrice: z.boolean().optional(),
});

router.put('/settings', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = updateSettingsSchema.parse(req.body);
    const updated = await cjService.updateSettings(validated);

    res.json({
      success: true,
      message: 'CJdropshipping settings saved successfully.',
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Invalid settings payload.' });
  }
});

// Live Connection Test
router.post('/test-connection', requireAuth, requirePermission('products.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await cjService.testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Connection test failed.' });
  }
});

// ==========================================
// 2. PRODUCT CATALOG DISCOVERY (BROWSE CJ)
// ==========================================

// Query / Search CJ Catalog
router.get('/products', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, size, keyWord, categoryId } = req.query;

    const result = await cjService.queryProducts({
      page: page ? parseInt(page as string, 10) : 1,
      size: size ? parseInt(size as string, 10) : 20,
      keyWord: (keyWord as string) || undefined,
      categoryId: (categoryId as string) || undefined,
    });

    res.json({
      success: true,
      data: result.list,
      pagination: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: Math.ceil(result.total / result.size),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to search CJ products.' });
  }
});

// Get Single Product Details & Mapped Pricing
router.get('/product/:pid', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pid } = req.params;
    const detail = await cjService.getProductDetail(pid);

    res.json({
      success: true,
      data: detail,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to load CJ product details.' });
  }
});

// ==========================================
// 3. PRODUCT IMPORT WORKFLOW
// ==========================================

const importProductSchema = z.object({
  pid: z.string().min(1),
  customPricePkr: z.number().positive().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

router.post('/import', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = importProductSchema.parse(req.body);

    const result = await cjService.importProduct(validated.pid, {
      customPricePkr: validated.customPricePkr,
      categoryId: validated.categoryId,
      subcategoryId: validated.subcategoryId,
      status: validated.status,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('CJ Import Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to import product.' });
  }
});

// Bulk Import
router.post('/import-bulk', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pids, status } = req.body;
    if (!Array.isArray(pids) || pids.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of Product IDs (pids).' });
      return;
    }

    const results = [];
    const errors = [];

    for (const pid of pids) {
      try {
        const itemRes = await cjService.importProduct(pid, { status });
        results.push(itemRes);
      } catch (err: any) {
        errors.push({ pid, error: err.message });
      }
    }

    res.json({
      success: true,
      importedCount: results.length,
      failedCount: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Bulk import failed.' });
  }
});

// ==========================================
// 4. IMPORTED PRODUCTS & SYNCHRONISATION
// ==========================================

// List all imported CJ products
router.get('/imported', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const where: any = {};
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { productName: { contains: search as string } },
        { cjSku: { contains: search as string } },
        { cjProductId: { contains: search as string } },
      ];
    }

    const [mappings, total] = await Promise.all([
      prisma.cjProductMapping.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.cjProductMapping.count({ where }),
    ]);

    // Attach current Pretty Puff stock if product exists
    const productIds = mappings.map(m => m.productId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true, isActive: true, slug: true, thumbnail: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const enriched = mappings.map(m => {
      const prod = m.productId ? productMap.get(m.productId) : null;
      return {
        ...m,
        currentStock: prod?.stock ?? 0,
        isActive: prod?.isActive ?? false,
        slug: prod?.slug ?? null,
        thumbnail: prod?.thumbnail ?? null,
      };
    });

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to list imported products.' });
  }
});

// Sync Single Product
router.post('/sync/:cjProductId', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cjProductId } = req.params;
    const result = await cjService.syncProduct(cjProductId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Sync failed.' });
  }
});

// Sync All Imported Products
router.post('/sync-all', requireAuth, requirePermission('products.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await cjService.syncAllImported();
    res.json({
      success: true,
      message: `Sync completed: ${result.synced} products updated, ${result.failed} failed.`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Full catalog sync failed.' });
  }
});

// Delete / Disconnect CJ Product Mapping
router.delete('/mapping/:id', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.cjProductMapping.delete({ where: { id } });
    res.json({ success: true, message: 'Mapping removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete mapping.' });
  }
});

// ==========================================
// 5. IMPORT HISTORY & LOGS
// ==========================================

router.get('/logs', requireAuth, requirePermission('products.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50' } = req.query;
    const logs = await prisma.cjImportLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10) || 50,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
});

// ==========================================
// 6. REAL-TIME WEBHOOK RECEIVERS
// ==========================================

// Webhook for Product Updates
router.post('/webhook/product', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.cjSetting.findUnique({ where: { id: 'default' } });
    const sign = req.headers['sign'] as string | undefined;

    // Verify HMAC-SHA256 signature if openId is configured
    if (settings?.openId && sign) {
      const rawBody = JSON.stringify(req.body);
      const isValid = cjService.verifyWebhookSignature(rawBody, sign, settings.openId);
      if (!isValid) {
        console.warn('CJ Webhook signature verification mismatch');
        res.status(401).json({ success: false, message: 'Invalid signature.' });
        return;
      }
    }

    const payload = req.body;
    const pid = payload.pid || payload.productId;

    if (pid) {
      const mapping = await prisma.cjProductMapping.findUnique({ where: { cjProductId: String(pid) } });
      if (mapping) {
        await cjService.syncProduct(String(pid));
      }
    }

    // Fast 200 response within 3s as required by CJ specifications
    res.status(200).json({ code: 200, result: true, message: 'Received' });
  } catch (err: any) {
    console.error('Error handling CJ product webhook:', err);
    res.status(200).json({ code: 200, result: true, message: 'Error processed' });
  }
});

// Webhook for Stock Updates
router.post('/webhook/stock', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.cjSetting.findUnique({ where: { id: 'default' } });
    const sign = req.headers['sign'] as string | undefined;

    if (settings?.openId && sign) {
      const rawBody = JSON.stringify(req.body);
      const isValid = cjService.verifyWebhookSignature(rawBody, sign, settings.openId);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid signature.' });
        return;
      }
    }

    const payload = req.body;
    const vid = payload.vid || payload.variantId;
    const quantity = payload.quantity !== undefined ? parseInt(payload.quantity, 10) : null;

    if (vid && quantity !== null) {
      const variant = await prisma.productVariant.findFirst({
        where: { cjVariantId: String(vid) },
      });
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: quantity },
        });
      }
    }

    res.status(200).json({ code: 200, result: true, message: 'Received' });
  } catch (err: any) {
    console.error('Error handling CJ stock webhook:', err);
    res.status(200).json({ code: 200, result: true, message: 'Error processed' });
  }
});

export default router;

