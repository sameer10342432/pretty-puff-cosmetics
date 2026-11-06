import { Router, Request, Response } from 'express';
import { COUNTRIES, DEFAULT_COUNTRY, getCountryByCode } from '../data/countries';
import { prisma } from '../prisma';

const router = Router();

// Country detection endpoint
router.get('/detect', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check Cloudflare / CDN headers
    const headerCountry = (
      req.headers['cf-ipcountry'] ||
      req.headers['x-country-code'] ||
      req.headers['x-vercel-ip-country']
    ) as string | undefined;

    if (headerCountry && headerCountry.length === 2) {
      const country = getCountryByCode(headerCountry);
      res.json({
        success: true,
        detected: true,
        country,
        source: 'CDN_HEADER',
      });
      return;
    }

    // 2. Client IP check
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // Check if localhost/private IP
    const isLocal = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');

    if (isLocal) {
      // Default to US or PK for development
      res.json({
        success: true,
        detected: false,
        country: DEFAULT_COUNTRY,
        source: 'LOCAL_DEFAULT',
      });
      return;
    }

    // 3. Fast external IP geolocation with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData?.country_code) {
          const country = getCountryByCode(geoData.country_code);
          res.json({
            success: true,
            detected: true,
            country,
            source: 'IPAPI',
          });
          return;
        }
      }
    } catch {
      // Ignore external failure and fallback
    }

    res.json({
      success: true,
      detected: false,
      country: DEFAULT_COUNTRY,
      source: 'DEFAULT_FALLBACK',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Geo detection failed' });
  }
});

// Get all countries & settings
router.get('/countries', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbSettings = await prisma.countrySetting.findMany();
    const settingsMap = new Map(dbSettings.map(s => [s.code, s]));

    const merged = COUNTRIES.map(c => {
      const s = settingsMap.get(c.code);
      return {
        ...c,
        isEnabled: s ? s.isEnabled : true,
        isShippingEnabled: s ? s.isShippingEnabled : c.shippingEligible,
        isPaymentEnabled: s ? s.isPaymentEnabled : true,
        taxRatePercent: s ? s.taxRatePercent : 0,
      };
    });

    res.json({ success: true, data: merged });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

