const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PKR_PER_USD = 280.0;

async function migrateToUsd() {
  console.log('🚀 Starting Phase 2: USD Base Currency Migration...');
  console.log(`📌 Using verified conversion rate: 1 USD = ${PKR_PER_USD} PKR`);

  const now = new Date();

  // 1. Fetch all products
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log(`📦 Found ${products.length} products to evaluate.`);

  for (const product of products) {
    // If not already migrated (currency is not USD or originalPkrPrice is null)
    if (!product.originalPkrPrice && product.price > 100) {
      const pkrPrice = product.price;
      const pkrSalePrice = product.salePrice;
      const pkrCostPrice = product.costPrice;

      const usdPrice = Math.round((pkrPrice / PKR_PER_USD) * 100) / 100;
      const usdSalePrice = pkrSalePrice ? Math.round((pkrSalePrice / PKR_PER_USD) * 100) / 100 : null;
      const usdCostPrice = pkrCostPrice ? Math.round((pkrCostPrice / PKR_PER_USD) * 100) / 100 : null;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: usdPrice,
          salePrice: usdSalePrice,
          costPrice: usdCostPrice,
          currency: 'USD',
          originalPkrPrice: pkrPrice,
          originalPkrSalePrice: pkrSalePrice,
          originalPkrCostPrice: pkrCostPrice,
          pkrToUsdRate: PKR_PER_USD,
          migratedAt: now
        }
      });

      console.log(`  ✓ Product [${product.name.slice(0, 35)}...]:`);
      console.log(`    Price: ${pkrPrice} PKR -> $${usdPrice} USD`);
      if (pkrSalePrice) console.log(`    Sale:  ${pkrSalePrice} PKR -> $${usdSalePrice} USD`);

      // Migrate variants
      for (const variant of product.variants) {
        if (!variant.originalPkrPrice && variant.price && variant.price > 50) {
          const varPkrPrice = variant.price;
          const varPkrSale = variant.salePrice;
          const varUsdPrice = Math.round((varPkrPrice / PKR_PER_USD) * 100) / 100;
          const varUsdSale = varPkrSale ? Math.round((varPkrSale / PKR_PER_USD) * 100) / 100 : null;

          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              price: varUsdPrice,
              salePrice: varUsdSale,
              currency: 'USD',
              originalPkrPrice: varPkrPrice,
              originalPkrSalePrice: varPkrSale
            }
          });
          console.log(`    ↳ Variant [${variant.name.slice(0, 25)}]: ${varPkrPrice} PKR -> $${varUsdPrice} USD`);
        }
      }
    } else {
      console.log(`  - Product [${product.name.slice(0, 35)}...] already stored in USD ($${product.price}).`);
    }
  }

  // 2. Protect historical orders: ensure currency is set to PKR and original amounts preserved
  const orders = await prisma.order.findMany();
  for (const order of orders) {
    if (!order.currency || order.currency === 'USD') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          currency: 'PKR',
          exchangeRate: PKR_PER_USD,
          baseCurrencyTotal: Math.round((order.total / PKR_PER_USD) * 100) / 100
        }
      });
      console.log(`  ✓ Preserved historical order [${order.orderNumber}]: ${order.total} PKR (Base USD: $${Math.round((order.total / PKR_PER_USD) * 100) / 100})`);
    }
  }

  // 3. Seed initial ExchangeRate table
  const defaultRates = [
    { currency: 'USD', rate: 1.0 },
    { currency: 'PKR', rate: 280.0 },
    { currency: 'GBP', rate: 0.785 },
    { currency: 'EUR', rate: 0.922 },
    { currency: 'AED', rate: 3.673 },
    { currency: 'SAR', rate: 3.751 },
    { currency: 'CAD', rate: 1.365 },
    { currency: 'AUD', rate: 1.524 },
    { currency: 'NZD', rate: 1.648 },
    { currency: 'CHF', rate: 0.892 },
    { currency: 'JPY', rate: 154.50 },
    { currency: 'CNY', rate: 7.235 },
    { currency: 'INR', rate: 83.45 },
    { currency: 'MYR', rate: 4.712 },
    { currency: 'SGD', rate: 1.348 },
    { currency: 'BDT', rate: 117.20 },
    { currency: 'QAR', rate: 3.640 },
    { currency: 'KWD', rate: 0.307 },
    { currency: 'OMR', rate: 0.385 },
    { currency: 'ZAR', rate: 18.35 },
    { currency: 'TRY', rate: 32.25 },
  ];

  for (const r of defaultRates) {
    await prisma.exchangeRate.upsert({
      where: { currency: r.currency },
      update: { rate: r.rate },
      create: { currency: r.currency, rate: r.rate, source: 'BASE_INITIAL' }
    });
  }
  console.log(`🌍 Seeded ${defaultRates.length} ISO 4217 exchange rates.`);

  console.log('✅ USD Base Currency Migration finished successfully.');
}

migrateToUsd()
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
