import { Router, Request, Response } from 'express';
import { currencyService } from '../services/currencyService';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

// Public: Get all active exchange rates
router.get('/rates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = await currencyService.getRates();
    res.json({
      success: true,
      base: 'USD',
      rates,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Refresh rates from live API
router.post('/refresh', requireAuth, requirePermission('settings.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await currencyService.refreshRatesFromApi();
    const rates = await currencyService.getRates();
    res.json({
      success,
      message: success ? 'Exchange rates updated from live API.' : 'Could not refresh rates; current cached rates maintained.',
      rates,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Manual rate override
router.put('/override', requireAuth, requirePermission('settings.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currency, rate } = req.body;
    if (!currency || typeof rate !== 'number' || rate <= 0) {
      res.status(400).json({ success: false, message: 'Invalid currency or rate.' });
      return;
    }
    await currencyService.overrideRate(currency, rate);
    res.json({
      success: true,
      message: `Exchange rate for ${currency.toUpperCase()} updated to ${rate}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
