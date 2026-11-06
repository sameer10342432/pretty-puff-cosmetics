import { prisma } from '../prisma';
import { PricingEngine } from './pricingEngine';

export interface ApplicableDiscount {
  id: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'STOREWIDE' | 'FREE_SHIPPING';
  discountValue: number;
  appliesTo: 'ALL' | 'CATEGORY' | 'PRODUCT';
  couponCode?: string | null;
  preventStacking: boolean;
}

export interface ProductDiscountResult {
  productId: string;
  originalPriceUsd: number;
  discountedPriceUsd: number;
  discountAmountUsd: number;
  discountPercentage: number;
  appliedDiscountName: string | null;
  isProfitProtected: boolean;
  minimumPriceUsd: number;
}

export class DiscountService {
  /**
   * Fetch all currently active discounts from database
   */
  public static async getActiveDiscounts(): Promise<any[]> {
    const now = new Date();
    return prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calculate effective selling price for a product applying active discounts with profit protection
   */
  public static calculateProductDiscount(
    product: {
      id: string;
      price: number;
      salePrice?: number | null;
      categoryId?: string | null;
      minimumPrice?: number | null;
      landedCost?: number | null;
    },
    activeDiscounts: any[]
  ): ProductDiscountResult {
    const regularPrice = product.price;
    const existingSale = product.salePrice && product.salePrice > 0 ? product.salePrice : null;
    const minPrice = product.minimumPrice || (product.landedCost ? PricingEngine.calculateMinimumPrice(product.landedCost) : regularPrice * 0.7);

    let bestPrice = existingSale || regularPrice;
    let appliedDiscountName: string | null = existingSale ? 'Promotional Sale' : null;
    let isProfitProtected = false;

    for (const discount of activeDiscounts) {
      // Check if discount applies to this product
      let applies = false;
      if (discount.appliesTo === 'ALL' || discount.discountType === 'STOREWIDE') {
        applies = true;
      } else if (discount.appliesTo === 'CATEGORY' && product.categoryId && discount.categoryIds) {
        try {
          const catIds: string[] = JSON.parse(discount.categoryIds);
          applies = catIds.includes(product.categoryId);
        } catch {
          applies = false;
        }
      } else if (discount.appliesTo === 'PRODUCT' && discount.productIds) {
        try {
          const prodIds: string[] = JSON.parse(discount.productIds);
          applies = prodIds.includes(product.id);
        } catch {
          applies = false;
        }
      }

      if (!applies) continue;

      // Calculate candidate price
      let candidatePrice = regularPrice;
      if (discount.discountType === 'PERCENTAGE' || discount.discountType === 'STOREWIDE') {
        candidatePrice = regularPrice * (1 - (discount.discountValue / 100));
      } else if (discount.discountType === 'FIXED_AMOUNT') {
        candidatePrice = Math.max(0, regularPrice - discount.discountValue);
      }

      // Round to 2 decimals
      candidatePrice = Math.round(candidatePrice * 100) / 100;

      // Enforce profit protection
      if (candidatePrice < minPrice) {
        candidatePrice = minPrice;
        isProfitProtected = true;
      }

      if (candidatePrice < bestPrice) {
        bestPrice = candidatePrice;
        appliedDiscountName = discount.name;
      }
    }

    const discountAmount = Math.max(0, Math.round((regularPrice - bestPrice) * 100) / 100);
    const discountPercentage = regularPrice > 0
      ? Math.round((discountAmount / regularPrice) * 100)
      : 0;

    return {
      productId: product.id,
      originalPriceUsd: regularPrice,
      discountedPriceUsd: bestPrice,
      discountAmountUsd: discountAmount,
      discountPercentage,
      appliedDiscountName,
      isProfitProtected,
      minimumPriceUsd: minPrice,
    };
  }

  /**
   * Validate and calculate cart totals with discounts and profit protection
   */
  public static async calculateCartDiscounts(
    cartItems: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
    }>,
    couponCode?: string | null
  ) {
    const productIds = cartItems.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    const activeDiscounts = await this.getActiveDiscounts();

    let subtotalUsd = 0;
    let totalDiscountUsd = 0;
    let totalLandedCostUsd = 0;
    const resolvedItems: any[] = [];

    for (const item of cartItems) {
      const dbProd = products.find((p: any) => p.id === item.productId);
      if (!dbProd) continue;

      const variant = item.variantId
        ? dbProd.variants.find((v: any) => v.id === item.variantId)
        : null;

      const basePrice = (variant?.price && variant.price > 0) ? variant.price : dbProd.price;
      const baseLanded = (variant?.landedCost && variant.landedCost > 0) ? variant.landedCost : (dbProd.landedCost || dbProd.costPrice || basePrice * 0.5);
      const minPrice = (variant?.minimumPrice && variant.minimumPrice > 0)
        ? variant.minimumPrice
        : (dbProd.minimumPrice || PricingEngine.calculateMinimumPrice(baseLanded));

      const discResult = this.calculateProductDiscount(
        {
          id: dbProd.id,
          price: basePrice,
          salePrice: variant?.salePrice || dbProd.salePrice,
          categoryId: dbProd.categoryId,
          minimumPrice: minPrice,
          landedCost: baseLanded,
        },
        activeDiscounts
      );

      const unitSellingPrice = discResult.discountedPriceUsd;
      const lineTotal = Math.round(unitSellingPrice * item.quantity * 100) / 100;
      const lineOriginalTotal = Math.round(basePrice * item.quantity * 100) / 100;
      const lineDiscount = Math.max(0, lineOriginalTotal - lineTotal);
      const lineLandedCost = Math.round(baseLanded * item.quantity * 100) / 100;

      subtotalUsd += lineOriginalTotal;
      totalDiscountUsd += lineDiscount;
      totalLandedCostUsd += lineLandedCost;

      resolvedItems.push({
        productId: dbProd.id,
        variantId: variant?.id || null,
        productName: dbProd.name,
        variantName: variant?.name || null,
        sku: variant?.sku || dbProd.sku,
        regularPriceUsd: basePrice,
        unitPriceUsd: unitSellingPrice,
        quantity: item.quantity,
        totalUsd: lineTotal,
        costPriceUsd: variant?.costPrice || dbProd.costPrice || 0,
        landedCostUsd: baseLanded,
        unitProfitUsd: Math.round((unitSellingPrice - baseLanded) * 100) / 100,
        minimumPriceUsd: minPrice,
      });
    }

    // Coupon calculation if provided
    let couponDiscountUsd = 0;
    let appliedCoupon: any = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (dbCoupon && dbCoupon.isActive) {
        const now = new Date();
        const validDates = (!dbCoupon.startDate || dbCoupon.startDate <= now) &&
                           (!dbCoupon.expiryDate || dbCoupon.expiryDate >= now);

        const currentTotal = subtotalUsd - totalDiscountUsd;
        const validMinOrder = !dbCoupon.minOrderAmount || currentTotal >= dbCoupon.minOrderAmount;

        if (validDates && validMinOrder) {
          if (dbCoupon.discountType === 'PERCENTAGE') {
            couponDiscountUsd = Math.round((currentTotal * (dbCoupon.discountValue / 100)) * 100) / 100;
          } else {
            couponDiscountUsd = Math.min(currentTotal, dbCoupon.discountValue);
          }

          if (dbCoupon.maxDiscountAmount && couponDiscountUsd > dbCoupon.maxDiscountAmount) {
            couponDiscountUsd = dbCoupon.maxDiscountAmount;
          }

          // Ensure coupon doesn't push the order below total minimum prices
          const totalMinPrice = resolvedItems.reduce((acc, i) => acc + (i.minimumPriceUsd * i.quantity), 0);
          const finalAfterCoupon = currentTotal - couponDiscountUsd;

          if (finalAfterCoupon < totalMinPrice) {
            couponDiscountUsd = Math.max(0, Math.round((currentTotal - totalMinPrice) * 100) / 100);
          }

          appliedCoupon = dbCoupon;
          totalDiscountUsd += couponDiscountUsd;
        }
      }
    }

    const finalPayableUsd = Math.max(0, Math.round((subtotalUsd - totalDiscountUsd) * 100) / 100);

    return {
      items: resolvedItems,
      subtotalUsd: Math.round(subtotalUsd * 100) / 100,
      totalDiscountUsd: Math.round(totalDiscountUsd * 100) / 100,
      couponDiscountUsd: Math.round(couponDiscountUsd * 100) / 100,
      appliedCoupon,
      totalLandedCostUsd: Math.round(totalLandedCostUsd * 100) / 100,
      finalPayableUsd,
    };
  }
}
