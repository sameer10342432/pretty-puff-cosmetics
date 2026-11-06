import { cjService } from '../server/services/cjService';

async function run() {
  console.log('--- STEP 1: Search CJ catalog for lipstick ---');
  const searchRes = await cjService.queryProducts({ keyWord: 'lipstick', size: 5 });
  console.log(`Found ${searchRes.total} products.`);
  const candidate = searchRes.list[0];
  console.log('Candidate:', {
    pid: candidate?.pid,
    name: candidate?.productName,
    price: candidate?.sellPrice,
  });

  const targetPid = candidate?.pid;
  if (!targetPid) {
    console.log('No product found');
    return;
  }

  console.log(`\n--- STEP 2: Query CJ product detail for PID ${targetPid} ---`);
  const detail = await cjService.getProductDetail(targetPid);
  console.log('Title:', detail.title);
  console.log('Supplier Price USD:', detail.priceCalc.supplierPriceUsd);
  console.log('CJ Market / Suggested Price USD:', detail.priceCalc.cjMarketPriceUsd);
  console.log('Minimum Profitable Price USD:', detail.priceCalc.minimumPriceUsd);
  console.log('Suggested Regular Price USD:', detail.priceCalc.sellingPriceUsd);
  console.log('Suggested Sale Price USD:', detail.priceCalc.salePriceUsd);
  console.log('Max Safe Discount USD:', detail.priceCalc.maxSafeDiscountUsd);
  console.log('Estimated Net Profit USD:', detail.priceCalc.profitUsd);
  console.log('Profit Margin %:', detail.priceCalc.profitMarginPercent);
  console.log('CJ Market Price Safe to use:', detail.priceCalc.cjMarketPriceEvaluation?.isSafeToUse);

  console.log(`\n--- STEP 3: Import PID ${targetPid} into database ---`);
  const importRes = await cjService.importProduct(targetPid, {
    status: 'PUBLISHED',
  });

  console.log('Import Result:');
  console.log('isDuplicate:', importRes.isDuplicate);
  console.log('Product ID:', importRes.product?.id);
  console.log('Product Name:', importRes.product?.name);
  console.log('Base Price USD:', importRes.product?.price);
  console.log('Sale Price USD:', importRes.product?.salePrice);
  console.log('Cost Price USD:', importRes.product?.costPrice);
  console.log('Landed Cost USD:', (importRes.product as any)?.landedCost);
  console.log('Minimum Price USD:', (importRes.product as any)?.minimumPrice);
  console.log('CJ Market Price USD:', (importRes.product as any)?.cjMarketPrice);
  console.log('isActive (Auto-Published):', importRes.product?.isActive);
  console.log('Variants saved count:', (importRes.product as any)?.variants?.length);

  console.log('\n--- STEP 4: Verify variant fields in DB ---');
  if ((importRes.product as any)?.variants?.[0]) {
    const v = (importRes.product as any).variants[0] as any;
    console.log('Sample variant in DB:', {
      name: v.name,
      price: v.price,
      costPrice: v.costPrice,
      landedCost: v.landedCost,
      minimumPrice: v.minimumPrice,
      cjMarketPrice: v.cjMarketPrice,
    });
  }

  console.log('\n✅ IMPORT TEST COMPLETED WITH ZERO PRISMA ERRORS!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
