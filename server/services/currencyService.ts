import { prisma } from '../prisma';

export interface ExchangeRateData {
  currency: string;
  rate: number;
  updatedAt: Date;
}

class CurrencyService {
  private memoryCache: Map<string, number> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Get all active exchange rates relative to 1 USD
   */
  async getRates(): Promise<Record<string, number>> {
    const now = Date.now();

    // Check memory cache
    if (this.memoryCache.size > 0 && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return Object.fromEntries(this.memoryCache);
    }

    // Load from Database
    const dbRates = await prisma.exchangeRate.findMany();
    if (dbRates.length > 0) {
      this.memoryCache.clear();
      for (const r of dbRates) {
        this.memoryCache.set(r.currency, r.rate);
      }
      this.lastFetchTime = now;
    }

    // If cache is empty or older than TTL, attempt background refresh
    if (this.memoryCache.size === 0 || now - this.lastFetchTime >= this.CACHE_TTL_MS) {
      this.refreshRatesFromApi().catch(() => {});
    }

    // Always guarantee USD and PKR
    if (!this.memoryCache.has('USD')) this.memoryCache.set('USD', 1.0);
    if (!this.memoryCache.has('PKR')) this.memoryCache.set('PKR', 280.0);

    return Object.fromEntries(this.memoryCache);
  }

  /**
   * Fetch live exchange rates from public reliable exchange API
   */
  async refreshRatesFromApi(): Promise<boolean> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) return false;
      const data = await res.json();

      if (data?.result === 'success' && data.rates) {
        const rates = data.rates as Record<string, number>;
        for (const [curr, rate] of Object.entries(rates)) {
          if (typeof rate === 'number' && rate > 0) {
            await prisma.exchangeRate.upsert({
              where: { currency: curr },
              update: { rate, source: 'OPEN_ER_API' },
              create: { currency: curr, rate, source: 'OPEN_ER_API' },
            });
            this.memoryCache.set(curr, rate);
          }
        }
        this.lastFetchTime = Date.now();
        console.log(`[CurrencyService] Refreshed ${Object.keys(rates).length} live exchange rates.`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[CurrencyService] Live rates fetch failed, keeping existing cached rates:', err.message);
      return false;
    }
  }

  /**
   * Convert USD base price to target currency
   */
  async convert(amountInUsd: number, targetCurrency: string): Promise<number> {
    if (targetCurrency === 'USD') return amountInUsd;
    const rates = await this.getRates();
    const rate = rates[targetCurrency.toUpperCase()] || 1.0;
    return Math.round(amountInUsd * rate * 100) / 100;
  }

  /**
   * Update or override a single rate manually from Admin Panel
   */
  async overrideRate(currency: string, newRate: number): Promise<void> {
    const curr = currency.toUpperCase().trim();
    await prisma.exchangeRate.upsert({
      where: { currency: curr },
      update: { rate: newRate, source: 'ADMIN_MANUAL' },
      create: { currency: curr, rate: newRate, source: 'ADMIN_MANUAL' },
    });
    this.memoryCache.set(curr, newRate);
  }
}

export const currencyService = new CurrencyService();

