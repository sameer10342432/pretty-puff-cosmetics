import { cjService } from '../server/services/cjService';
import { PricingEngine } from '../server/services/pricingEngine';

async function testPricingPreview() {
  console.log('--- Testing Live Destination Freight & Pricing Preview ---');
  const pid = '2411011136491625500';
  const detail = await cjService.getProductDetail(pid);
  const vid = detail.variants[0]?.vid;

  const destinations = ['US', 'GB', 'AE', 'PK'];

  for (const country of destinations) {
    console.log(`\nDestination: ${country}`);
    try {
      const freight = await cjService.calculateFreight({
        endCountryCode: country,
        products: vid ? [{ quantity: 1, vid }] : [],
      });

      console.log(`Live shipping options count: ${freight.methods?.length || 0}`);
      if (freight.methods && freight.methods.length > 0) {
        const cheapest = [...freight.methods].sort((a, b) => a.priceUsd - b.priceUsd)[0];
        console.log(`Cheapest Carrier: ${cheapest.logisticName} - $${cheapest.priceUsd} (${cheapest.logisticAging})`);

        const preview = PricingEngine.calculatePriceSuggestion({
          supplierCostUsd: detail.priceCalc.supplierPriceUsd,
          shippingCostUsd: cheapest.priceUsd,
          packagingCostUsd: 0.50,
          handlingCostUsd: 0.50,
          cjMarketPriceUsd: detail.priceCalc.cjMarketPriceUsd,
          settings: {
            targetMargin: 35.0,
            minMargin: 15.0,
            minProfitUsd: 2.0,
            paymentFeePercent: 2.9,
            paymentFeeFixedUsd: 0.30,
          },
        });

        console.log('Landed Cost Breakdown:', {
          supplierCost: `$${preview.landedCost.supplierCostUsd}`,
          shippingCost: `$${preview.landedCost.shippingCostUsd}`,
          packagingCost: `$${preview.landedCost.packagingCostUsd}`,
          handlingCost: `$${preview.landedCost.handlingCostUsd}`,
          totalLandedCost: `$${preview.landedCost.totalLandedCostUsd}`,
        });
        console.log('Profit & Pricing Breakdown:', {
          minimumPrice: `$${preview.minimumPriceUsd}`,
          suggestedRegularPrice: `$${preview.suggestedRegularPriceUsd}`,
          suggestedSalePrice: `$${preview.suggestedSalePriceUsd}`,
          maxSafeDiscount: `$${preview.maxSafeDiscountUsd} (${preview.maxSafeDiscountPercent}%)`,
          netProfit: `$${preview.estimatedProfit.netProfitUsd}`,
          profitMargin: `${preview.estimatedProfit.profitMarginPercent}%`,
        });
      } else {
        console.log(`Shipping currently unavailable for ${country}`);
      }
    } catch (e: any) {
      console.log(`Error retrieving shipping for ${country}:`, e.message);
    }
  }

  process.exit(0);
}

testPricingPreview();
