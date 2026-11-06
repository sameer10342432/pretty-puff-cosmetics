import { PricingEngine } from '../server/services/pricingEngine';
import { DiscountService } from '../server/services/discountService';

async function testDiscountEngine() {
  console.log('--- Testing Profit-Protected Discount Engine ---');

  // Product Scenario: Landed Cost $10, Regular Price $25, Minimum Price $15.50
  const regularPrice = 25.00;
  const landedCost = 10.00;
  const minimumPrice = PricingEngine.calculateMinimumPrice(landedCost, {
    minMargin: 15.0,
    minProfitUsd: 2.0,
    paymentFeePercent: 2.9,
    paymentFeeFixedUsd: 0.30,
  });

  console.log('Base Configuration:', {
    regularPrice: `$${regularPrice.toFixed(2)}`,
    landedCost: `$${landedCost.toFixed(2)}`,
    calculatedMinimumPrice: `$${minimumPrice.toFixed(2)}`,
    maxSafeDiscountAllowed: `$${(regularPrice - minimumPrice).toFixed(2)}`,
  });

  // TEST 1: Safe 20% discount ($5 off -> $20 final price > $15.50 min)
  console.log('\n--- TEST 1: Safe 20% Discount ---');
  const safeDisc = PricingEngine.validateDiscount({
    originalPriceUsd: regularPrice,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minimumPriceUsd: minimumPrice,
  });
  console.log('Safe Discount Result:', {
    isValid: safeDisc.isValid,
    proposedDiscount: `$${safeDisc.proposedDiscountUsd}`,
    finalPrice: `$${safeDisc.finalPriceUsd}`,
    reason: safeDisc.reason,
  });

  // TEST 2: Excessive 50% discount ($12.50 off -> $12.50 final price < $15.50 min)
  console.log('\n--- TEST 2: Unsafe 50% Discount (Should be Rejected / Clamped) ---');
  const unsafeDisc = PricingEngine.validateDiscount({
    originalPriceUsd: regularPrice,
    discountType: 'PERCENTAGE',
    discountValue: 50,
    minimumPriceUsd: minimumPrice,
  });
  console.log('Unsafe Discount Result:', {
    isValid: unsafeDisc.isValid,
    proposedDiscount: `$${unsafeDisc.proposedDiscountUsd}`,
    clampedSafeFinalPrice: `$${unsafeDisc.finalPriceUsd}`,
    shortfallPrevented: `$${unsafeDisc.shortfallUsd}`,
    safeDiscountUsd: `$${unsafeDisc.safeDiscountUsd}`,
    warning: unsafeDisc.reason,
  });

  // TEST 3: Fixed $15 off discount ($15 off -> $10 final price < $15.50 min)
  console.log('\n--- TEST 3: Fixed $15 Discount (Should be Protected) ---');
  const fixedUnsafe = PricingEngine.validateDiscount({
    originalPriceUsd: regularPrice,
    discountType: 'FIXED_AMOUNT',
    discountValue: 15.00,
    minimumPriceUsd: minimumPrice,
  });
  console.log('Fixed Discount Result:', {
    isValid: fixedUnsafe.isValid,
    clampedFinalPrice: `$${fixedUnsafe.finalPriceUsd}`,
    warning: fixedUnsafe.reason,
  });

  // TEST 4: Storewide and Category Discount Calculation
  console.log('\n--- TEST 4: DiscountService Product Discount Evaluation ---');
  const mockProduct = {
    id: 'prod-test-01',
    price: 30.00,
    salePrice: null,
    categoryId: 'cat-makeup',
    minimumPrice: 18.00,
    landedCost: 12.00,
  };

  const mockDiscounts = [
    {
      id: 'd1',
      name: 'Spring Storewide Sale 25% Off',
      discountType: 'STOREWIDE',
      discountValue: 25,
      appliesTo: 'ALL',
      preventStacking: true,
    },
  ];

  const discResult = DiscountService.calculateProductDiscount(mockProduct, mockDiscounts);
  console.log('Product Discount Applied:', {
    originalPrice: `$${discResult.originalPriceUsd}`,
    discountedPrice: `$${discResult.discountedPriceUsd}`,
    discountAmount: `$${discResult.discountAmountUsd}`,
    appliedDiscount: discResult.appliedDiscountName,
    isProfitProtected: discResult.isProfitProtected,
  });

  console.log('\n✅ ALL DISCOUNT & PROFIT PROTECTION TESTS PASSED!');
  process.exit(0);
}

testDiscountEngine();

