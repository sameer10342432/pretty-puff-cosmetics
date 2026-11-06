/**
 * Pretty Puff Central Pricing & Profit Protection Engine
 * 
 * Authoritative USD pricing, landed cost calculation,
 * profit protection, CJ market price analysis, and discount limits.
 */

export interface CostBreakdownInput {
  supplierCostUsd: number;
  shippingCostUsd?: number;
  packagingCostUsd?: number;
  handlingCostUsd?: number;
  otherCostsUsd?: number;
  shippingIncludedInPrice?: boolean;
}

export interface LandedCostBreakdown {
  supplierCostUsd: number;
  shippingCostUsd: number;
  packagingCostUsd: number;
  handlingCostUsd: number;
  otherCostsUsd: number;
  totalLandedCostUsd: number;
}

export interface PricingSettings {
  targetMargin?: number;          // Default target margin % (e.g., 35%)
  minMargin?: number;             // Minimum acceptable margin % (e.g., 15%)
  minProfitUsd?: number;          // Minimum fixed profit in USD (e.g., $2.00)
  markupPercent?: number;         // Markup % over landed cost (e.g., 50%)
  defaultPackagingUsd?: number;   // Packaging USD (e.g., $0.50)
  defaultHandlingUsd?: number;    // Handling USD (e.g., $0.50)
  paymentFeePercent?: number;     // e.g. 2.9%
  paymentFeeFixedUsd?: number;    // e.g. $0.30
  currencyRatePkr?: number;       // e.g. 280.0
}

export interface ProfitBreakdown {
  sellingPriceUsd: number;
  landedCostUsd: number;
  grossProfitUsd: number;
  paymentFeeUsd: number;
  netProfitUsd: number;
  profitMarginPercent: number;
  isProfitable: boolean;
  meetsMinMargin: boolean;
}

export interface PriceSuggestionResult {
  landedCost: LandedCostBreakdown;
  cjMarketPriceUsd: number | null;
  minimumPriceUsd: number;
  suggestedRegularPriceUsd: number;
  suggestedSalePriceUsd: number;
  suggestedDiscountPercent: number;
  maxSafeDiscountUsd: number;
  maxSafeDiscountPercent: number;
  estimatedProfit: ProfitBreakdown;
  cjMarketPriceEvaluation: {
    available: boolean;
    price: number | null;
    isSafeToUse: boolean;
    estimatedProfitIfUsed: ProfitBreakdown | null;
    warning: string | null;
  };
}

export interface DiscountValidationResult {
  isValid: boolean;
  originalPriceUsd: number;
  proposedDiscountUsd: number;
  finalPriceUsd: number;
  minimumPriceUsd: number;
  safeDiscountUsd: number;
  shortfallUsd: number;
  reason: string | null;
}

export class PricingEngine {
  private static round2(val: number): number {
    return Math.round(val * 100) / 100;
  }

  /**
   * Calculate total landed cost for a product
   */
  public static calculateLandedCost(
    input: CostBreakdownInput,
    settings?: Partial<PricingSettings>
  ): LandedCostBreakdown {
    const supplierCost = Math.max(0, input.supplierCostUsd || 0);
    const shippingCost = input.shippingIncludedInPrice !== false
      ? Math.max(0, input.shippingCostUsd || 0)
      : 0;
    const packagingCost = input.packagingCostUsd !== undefined
      ? input.packagingCostUsd
      : (settings?.defaultPackagingUsd ?? 0.50);
    const handlingCost = input.handlingCostUsd !== undefined
      ? input.handlingCostUsd
      : (settings?.defaultHandlingUsd ?? 0.50);
    const otherCosts = Math.max(0, input.otherCostsUsd || 0);

    const totalLandedCost = this.round2(
      supplierCost + shippingCost + packagingCost + handlingCost + otherCosts
    );

    return {
      supplierCostUsd: this.round2(supplierCost),
      shippingCostUsd: this.round2(shippingCost),
      packagingCostUsd: this.round2(packagingCost),
      handlingCostUsd: this.round2(handlingCost),
      otherCostsUsd: this.round2(otherCosts),
      totalLandedCostUsd: totalLandedCost,
    };
  }

  /**
   * Calculate net profit and profit margin for a given selling price and landed cost
   */
  public static calculateProfit(
    sellingPriceUsd: number,
    landedCostUsd: number,
    settings?: Partial<PricingSettings>
  ): ProfitBreakdown {
    const price = Math.max(0, sellingPriceUsd);
    const cost = Math.max(0, landedCostUsd);
    const feePct = (settings?.paymentFeePercent ?? 2.9) / 100;
    const feeFixed = settings?.paymentFeeFixedUsd ?? 0.30;
    const minMargin = settings?.minMargin ?? 15.0;

    const grossProfit = this.round2(price - cost);
    const paymentFee = price > 0 ? this.round2(price * feePct + feeFixed) : 0;
    const netProfit = this.round2(grossProfit - paymentFee);
    const profitMargin = price > 0 ? this.round2((netProfit / price) * 100) : 0;

    return {
      sellingPriceUsd: price,
      landedCostUsd: cost,
      grossProfitUsd: grossProfit,
      paymentFeeUsd: paymentFee,
      netProfitUsd: netProfit,
      profitMarginPercent: profitMargin,
      isProfitable: netProfit > 0,
      meetsMinMargin: profitMargin >= minMargin,
    };
  }

  /**
   * Calculate the absolute minimum selling price in USD that covers all expenses
   * and satisfies the minimum acceptable profit requirement.
   */
  public static calculateMinimumPrice(
    landedCostUsd: number,
    settings?: Partial<PricingSettings>
  ): number {
    const cost = Math.max(0, landedCostUsd);
    const minProfitUsd = settings?.minProfitUsd ?? 2.0;
    const minMarginPct = (settings?.minMargin ?? 15.0) / 100;
    const feePct = (settings?.paymentFeePercent ?? 2.9) / 100;
    const feeFixed = settings?.paymentFeeFixedUsd ?? 0.30;

    // Formula: price * (1 - feePct - minMarginPct) = cost + minProfitUsd + feeFixed
    const denominator = 1 - feePct - minMarginPct;
    if (denominator <= 0.1) {
      return this.round2((cost + minProfitUsd + feeFixed) * 1.5);
    }

    const calculatedMin = (cost + minProfitUsd + feeFixed) / denominator;
    // Apply .99 psychological rounding upwards to ensure profit buffer
    const roundedMin = Math.ceil(calculatedMin) - 0.01;
    return this.round2(Math.max(calculatedMin, roundedMin > 0 ? roundedMin : calculatedMin));
  }

  /**
   * Calculate complete suggested pricing, CJ market price analysis, and safe discount limits
   */
  public static calculatePriceSuggestion(params: {
    supplierCostUsd: number;
    shippingCostUsd?: number;
    packagingCostUsd?: number;
    handlingCostUsd?: number;
    cjMarketPriceUsd?: number | null;
    settings?: Partial<PricingSettings>;
    shippingIncludedInPrice?: boolean;
  }): PriceSuggestionResult {
    const settings = params.settings || {};
    const landed = this.calculateLandedCost({
      supplierCostUsd: params.supplierCostUsd,
      shippingCostUsd: params.shippingCostUsd,
      packagingCostUsd: params.packagingCostUsd,
      handlingCostUsd: params.handlingCostUsd,
      shippingIncludedInPrice: params.shippingIncludedInPrice,
    }, settings);

    const minimumPrice = this.calculateMinimumPrice(landed.totalLandedCostUsd, settings);

    const targetMarginPct = (settings.targetMargin ?? 35.0) / 100;
    const feePct = (settings.paymentFeePercent ?? 2.9) / 100;
    const feeFixed = settings.paymentFeeFixedUsd ?? 0.30;

    // Cost-plus target margin price
    const denom = 1 - feePct - targetMarginPct;
    const baseTargetPrice = denom > 0.1
      ? (landed.totalLandedCostUsd + feeFixed) / denom
      : landed.totalLandedCostUsd * 1.5;

    // Standard Pretty Puff psychological rounding (e.g., $14.99, $24.99)
    const roundedTargetPrice = this.round2(Math.ceil(baseTargetPrice) - 0.01);
    let suggestedRegularPrice = Math.max(minimumPrice, roundedTargetPrice);

    // Analyze CJ recommended market price if provided by CJ API
    let cjEvaluation: PriceSuggestionResult['cjMarketPriceEvaluation'] = {
      available: false,
      price: null,
      isSafeToUse: false,
      estimatedProfitIfUsed: null,
      warning: null,
    };

    if (params.cjMarketPriceUsd && params.cjMarketPriceUsd > 0) {
      const cjPrice = this.round2(params.cjMarketPriceUsd);
      const cjProfit = this.calculateProfit(cjPrice, landed.totalLandedCostUsd, settings);
      const isSafe = cjPrice >= minimumPrice && cjProfit.meetsMinMargin;

      let warning: string | null = null;
      if (!isSafe) {
        warning = `CJ recommended market price ($${cjPrice.toFixed(2)}) is below Pretty Puff's minimum profitable price ($${minimumPrice.toFixed(2)}). Using it would result in only $${cjProfit.netProfitUsd.toFixed(2)} net profit (${cjProfit.profitMarginPercent}% margin).`;
      }

      cjEvaluation = {
        available: true,
        price: cjPrice,
        isSafeToUse: isSafe,
        estimatedProfitIfUsed: cjProfit,
        warning,
      };

      // If CJ market price is healthy and safe, align our regular price to stay competitive
      if (isSafe && cjPrice > suggestedRegularPrice * 0.8 && cjPrice < suggestedRegularPrice * 1.8) {
        suggestedRegularPrice = Math.max(minimumPrice, cjPrice);
      }
    }

    // Suggested promotional sale price (10% off regular, protected by minimum price)
    const proposedSale = this.round2(suggestedRegularPrice * 0.90);
    const suggestedSalePrice = Math.max(minimumPrice, proposedSale);
    const suggestedDiscountPercent = suggestedRegularPrice > suggestedSalePrice
      ? Math.round(((suggestedRegularPrice - suggestedSalePrice) / suggestedRegularPrice) * 100)
      : 0;

    const maxSafeDiscountUsd = this.round2(Math.max(0, suggestedRegularPrice - minimumPrice));
    const maxSafeDiscountPercent = suggestedRegularPrice > 0
      ? Math.max(0, Math.floor((maxSafeDiscountUsd / suggestedRegularPrice) * 100))
      : 0;

    const estimatedProfit = this.calculateProfit(suggestedRegularPrice, landed.totalLandedCostUsd, settings);

    return {
      landedCost: landed,
      cjMarketPriceUsd: params.cjMarketPriceUsd || null,
      minimumPriceUsd: minimumPrice,
      suggestedRegularPriceUsd: suggestedRegularPrice,
      suggestedSalePriceUsd: suggestedSalePrice,
      suggestedDiscountPercent,
      maxSafeDiscountUsd,
      maxSafeDiscountPercent,
      estimatedProfit,
      cjMarketPriceEvaluation: cjEvaluation,
    };
  }

  /**
   * Validate a proposed discount against the product's minimum profitable price
   */
  public static validateDiscount(params: {
    originalPriceUsd: number;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minimumPriceUsd: number;
  }): DiscountValidationResult {
    const origPrice = Math.max(0, params.originalPriceUsd);
    const minPrice = Math.max(0, params.minimumPriceUsd);

    let discountUsd = 0;
    if (params.discountType === 'PERCENTAGE') {
      discountUsd = this.round2(origPrice * (Math.min(100, Math.max(0, params.discountValue)) / 100));
    } else {
      discountUsd = this.round2(Math.max(0, params.discountValue));
    }

    const proposedFinalPrice = this.round2(origPrice - discountUsd);
    const safeDiscountUsd = this.round2(Math.max(0, origPrice - minPrice));

    if (proposedFinalPrice < minPrice) {
      const shortfall = this.round2(minPrice - proposedFinalPrice);
      return {
        isValid: false,
        originalPriceUsd: origPrice,
        proposedDiscountUsd: discountUsd,
        finalPriceUsd: minPrice, // Clamped to safe minimum
        minimumPriceUsd: minPrice,
        safeDiscountUsd,
        shortfallUsd: shortfall,
        reason: `Discount would reduce price to $${proposedFinalPrice.toFixed(2)}, which is below the minimum profitable price of $${minPrice.toFixed(2)} (loss of $${shortfall.toFixed(2)}). Safe maximum discount is $${safeDiscountUsd.toFixed(2)}.`,
      };
    }

    return {
      isValid: true,
      originalPriceUsd: origPrice,
      proposedDiscountUsd: discountUsd,
      finalPriceUsd: proposedFinalPrice,
      minimumPriceUsd: minPrice,
      safeDiscountUsd,
      shortfallUsd: 0,
      reason: null,
    };
  }
}

