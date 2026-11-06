import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../prisma';

export interface CjProductItem {
  pid: string;
  productName: string;
  productNameEn?: string;
  productSku: string;
  productImage: string;
  sellPrice: number | string;
  categoryID?: string;
  categoryName?: string;
  calculatedPricePkr?: number;
  estimatedProfitPkr?: number;
  isImported?: boolean;
}

export interface PricingCalculation {
  supplierPriceUsd: number;
  sellingPriceUsd: number;
  salePriceUsd: number;
  supplierCostPkr: number;
  estimatedShippingPkr: number;
  totalCostPkr: number;
  sellingPricePkr: number;
  profitPkr: number;
  profitMarginPercent: number;
}

export class CjDropshippingService {
  private getBaseUrl(): string {
    return (process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com').replace(/\/$/, '');
  }

  // -------------------------------------------------------------
  // Settings Management
  // -------------------------------------------------------------
  async getSettings() {
    let settings = await prisma.cjSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.cjSetting.create({
        data: {
          id: 'default',
          apiKey: process.env.CJ_API_KEY || null,
          apiSecret: process.env.CJ_API_SECRET || null,
          accessToken: process.env.CJ_ACCESS_TOKEN || null,
          currencyRatePkr: parseFloat(process.env.CJ_USD_TO_PKR_RATE || '280.0'),
          pricingType: 'PERCENTAGE',
          markupValue: 35.0,
          estimatedShippingPkr: 350.0,
          autoPublish: false,
          autoSyncStock: true,
          autoSyncPrice: false,
          webhookActive: false,
        },
      });
    }

    // Merge environment variables if DB fields are empty
    return {
      ...settings,
      apiKey: settings.apiKey || process.env.CJ_API_KEY || '',
      apiSecret: settings.apiSecret || process.env.CJ_API_SECRET || '',
      hasApiKey: Boolean(settings.apiKey || process.env.CJ_API_KEY),
      hasToken: Boolean(settings.accessToken || process.env.CJ_ACCESS_TOKEN),
      isTokenExpired: settings.accessTokenExpiry ? new Date(settings.accessTokenExpiry) < new Date() : false,
    };
  }

  async updateSettings(data: {
    apiKey?: string;
    apiSecret?: string;
    currencyRatePkr?: number;
    pricingType?: string;
    markupValue?: number;
    estimatedShippingPkr?: number;
    autoPublish?: boolean;
    autoSyncStock?: boolean;
    autoSyncPrice?: boolean;
  }) {
    const existing = await this.getSettings();
    return await prisma.cjSetting.update({
      where: { id: 'default' },
      data: {
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret }),
        ...(data.currencyRatePkr !== undefined && { currencyRatePkr: data.currencyRatePkr }),
        ...(data.pricingType !== undefined && { pricingType: data.pricingType }),
        ...(data.markupValue !== undefined && { markupValue: data.markupValue }),
        ...(data.estimatedShippingPkr !== undefined && { estimatedShippingPkr: data.estimatedShippingPkr }),
        ...(data.autoPublish !== undefined && { autoPublish: data.autoPublish }),
        ...(data.autoSyncStock !== undefined && { autoSyncStock: data.autoSyncStock }),
        ...(data.autoSyncPrice !== undefined && { autoSyncPrice: data.autoSyncPrice }),
      },
    });
  }

  // -------------------------------------------------------------
  // Authentication & Token Management
  // -------------------------------------------------------------
  async getValidAccessToken(): Promise<string> {
    const settings = await this.getSettings();
    const now = new Date();

    // Check if existing token in database is valid (with 5-minute safety buffer)
    if (settings.accessToken && settings.accessTokenExpiry) {
      const expiry = new Date(settings.accessTokenExpiry);
      if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
        return settings.accessToken;
      }
    }

    // Check static token from environment if present
    if (process.env.CJ_ACCESS_TOKEN && !settings.accessToken) {
      return process.env.CJ_ACCESS_TOKEN;
    }

    const apiKey = settings.apiKey || process.env.CJ_API_KEY;
    if (!apiKey) {
      throw new Error('CJdropshipping API Key is missing. Please configure your API Key in the CJdropshipping Settings.');
    }

    // Try refresh token first if available and not expired
    if (settings.refreshToken && settings.refreshTokenExpiry && new Date(settings.refreshTokenExpiry) > now) {
      try {
        const refreshRes = await fetch(`${this.getBaseUrl()}/api2.0/v1/authentication/refreshAccessToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: settings.refreshToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.code === 200 && refreshData.data?.accessToken) {
          await prisma.cjSetting.update({
            where: { id: 'default' },
            data: {
              accessToken: refreshData.data.accessToken,
              accessTokenExpiry: refreshData.data.accessTokenExpiryDate ? new Date(refreshData.data.accessTokenExpiryDate) : null,
              refreshToken: refreshData.data.refreshToken || settings.refreshToken,
              refreshTokenExpiry: refreshData.data.refreshTokenExpiryDate ? new Date(refreshData.data.refreshTokenExpiryDate) : null,
              openId: refreshData.data.openId ? String(refreshData.data.openId) : settings.openId,
            },
          });
          return refreshData.data.accessToken;
        }
      } catch (e) {
        console.warn('CJ token refresh failed, falling back to full authentication:', e);
      }
    }

    // Request new token using official getAccessToken endpoint
    const response = await fetch(`${this.getBaseUrl()}/api2.0/v1/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.code !== 200 || !result.data?.accessToken) {
      const errMsg = result?.message || `Authentication failed with status ${response.status}`;
      throw new Error(`CJdropshipping API Auth Error: ${errMsg}`);
    }

    const { accessToken, accessTokenExpiryDate, refreshToken, refreshTokenExpiryDate, openId } = result.data;

    // Persist active token and openId
    await prisma.cjSetting.update({
      where: { id: 'default' },
      data: {
        accessToken,
        accessTokenExpiry: accessTokenExpiryDate ? new Date(accessTokenExpiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        refreshToken: refreshToken || null,
        refreshTokenExpiry: refreshTokenExpiryDate ? new Date(refreshTokenExpiryDate) : null,
        openId: openId ? String(openId) : null,
      },
    });

    return accessToken;
  }

  async testConnection(): Promise<{ success: boolean; message: string; openId?: string; expiry?: string }> {
    try {
      const token = await this.getValidAccessToken();
      const settings = await this.getSettings();

      // Test a lightweight category query
      const res = await fetch(`${this.getBaseUrl()}/api2.0/v1/product/getCategory`, {
        headers: {
          'CJ-Access-Token': token,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data && (data.code === 200 || data.result === true)) {
        return {
          success: true,
          message: 'Successfully connected to CJdropshipping API v2.0.',
          openId: settings.openId || undefined,
          expiry: settings.accessTokenExpiry ? new Date(settings.accessTokenExpiry).toLocaleString() : undefined,
        };
      }

      return {
        success: false,
        message: data?.message || `API responded with code ${data?.code || res.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed.',
      };
    }
  }

  // -------------------------------------------------------------
  // Intelligent Category Mapping
  // -------------------------------------------------------------
  async mapCategory(cjCategoryName: string = '', productTitle: string = ''): Promise<{ categoryId: string; subcategoryId?: string }> {
    const text = `${cjCategoryName} ${productTitle}`.toLowerCase();
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
    });

    const categoryMap = new Map<string, any>();
    for (const cat of categories) {
      categoryMap.set(cat.slug.toLowerCase(), cat);
    }

    let matchedSlug = 'makeup'; // default fallback
    let matchedSubSlug = '';

    // 1. Eyes
    if (/mascara|eyeliner|eyeshadow|eye shadow|brow|eyebrow|lashes|false lash|lash curler/i.test(text)) {
      matchedSlug = 'eyes';
      if (/mascara/i.test(text)) matchedSubSlug = 'mascara';
      else if (/eyeliner/i.test(text)) matchedSubSlug = 'eyeliner';
      else if (/eyeshadow/i.test(text)) matchedSubSlug = 'eyeshadow';
    }
    // 2. Lips
    else if (/lipstick|lip gloss|lip oil|lip balm|lip tint|lip liner|lip glaze/i.test(text)) {
      matchedSlug = 'lips';
      if (/matte|lipstick/i.test(text)) matchedSubSlug = 'lipstick';
      else if (/oil|gloss/i.test(text)) matchedSubSlug = 'lip-gloss';
    }
    // 3. Skincare
    else if (/serum|cleanser|toner|moisturiz|sunscreen|spf|face wash|hydrat|niacinamide|hyaluronic|anti-aging|sheet mask|face mask/i.test(text)) {
      matchedSlug = 'skincare';
      if (/serum/i.test(text)) matchedSubSlug = 'serums';
      else if (/cleanser|wash/i.test(text)) matchedSubSlug = 'cleansers';
      else if (/sunscreen|spf/i.test(text)) matchedSubSlug = 'sun-protection';
    }
    // 4. Fragrances
    else if (/perfume|cologne|fragrance|parfum|body mist|eau de/i.test(text)) {
      matchedSlug = 'fragrances';
    }
    // 5. Hair Care
    else if (/shampoo|conditioner|hair oil|hair mask|hair spray|scalp/i.test(text)) {
      matchedSlug = 'hair-care';
    }
    // 6. Body Care
    else if (/body lotion|body scrub|body wash|shower gel|bath bomb|hand cream/i.test(text)) {
      matchedSlug = 'body-care';
    }
    // 7. Nails
    else if (/nail polish|nail art|gel polish|press on nail|cuticle|nail file/i.test(text)) {
      matchedSlug = 'nails';
    }
    // 8. Beauty Tools
    else if (/brush|makeup sponge|blender|curler|tweezers|roller|guasha|facial roller/i.test(text)) {
      matchedSlug = 'beauty-tools';
    }
    // 9. Beauty Accessories
    else if (/cosmetic bag|makeup bag|vanity case|hair band|mirror/i.test(text)) {
      matchedSlug = 'beauty-accessories';
    }
    // 10. Makeup (Foundation, Concealer, Blush, Powder, Primer, Highlighter)
    else if (/foundation|concealer|blush|powder|primer|contour|highlighter|bronzer|bb cream|cc cream/i.test(text)) {
      matchedSlug = 'makeup';
      if (/foundation/i.test(text)) matchedSubSlug = 'foundation';
      else if (/concealer/i.test(text)) matchedSubSlug = 'concealer';
      else if (/blush/i.test(text)) matchedSubSlug = 'blush';
      else if (/highlighter/i.test(text)) matchedSubSlug = 'highlighter';
    }

    const targetCategory = categoryMap.get(matchedSlug) || categoryMap.get('makeup') || categories[0];
    let targetSubId: string | undefined = undefined;

    if (matchedSubSlug && targetCategory?.subcategories) {
      const sub = targetCategory.subcategories.find((s: any) => s.slug.toLowerCase().includes(matchedSubSlug));
      if (sub) targetSubId = sub.id;
    }

    return {
      categoryId: targetCategory.id,
      subcategoryId: targetSubId,
    };
  }

  // -------------------------------------------------------------
  // Pricing Calculation Engine (PKR)
  // -------------------------------------------------------------
  calculatePrice(rawPriceUsd: number | string, settings: any): PricingCalculation {
    const usdPrice = typeof rawPriceUsd === 'number' ? rawPriceUsd : parseFloat(String(rawPriceUsd).replace(/[^0-9.]/g, '')) || 0;
    const rate = settings.currencyRatePkr || 280.0;
    const supplierCostPkr = Math.round(usdPrice * rate);
    const shippingPkr = settings.estimatedShippingPkr || 350.0;
    const totalCostPkr = supplierCostPkr + shippingPkr;

    let sellingPricePkr = totalCostPkr;
    const markupVal = settings.markupValue || 35.0;

    if (settings.pricingType === 'PERCENTAGE') {
      sellingPricePkr = Math.round(totalCostPkr * (1 + markupVal / 100));
    } else if (settings.pricingType === 'FIXED') {
      sellingPricePkr = Math.round(totalCostPkr + markupVal);
    } else if (settings.pricingType === 'MARGIN') {
      const margin = Math.min(markupVal, 85) / 100;
      sellingPricePkr = Math.round(totalCostPkr / (1 - margin));
    }

    // Psychology pricing rounding (e.g. round to nearest 99 or 50)
    if (sellingPricePkr > 500) {
      sellingPricePkr = Math.ceil(sellingPricePkr / 50) * 50 - 1; // e.g., 1499, 1999
    }

    const profitPkr = Math.max(0, sellingPricePkr - totalCostPkr);
    const profitMarginPercent = sellingPricePkr > 0 ? Math.round((profitPkr / sellingPricePkr) * 100) : 0;

    const sellingPriceUsd = Math.round((sellingPricePkr / rate) * 100) / 100;
    const salePriceUsd = Math.round(sellingPriceUsd * 0.9 * 100) / 100;

    return {
      supplierPriceUsd: usdPrice,
      sellingPriceUsd,
      salePriceUsd,
      supplierCostPkr,
      estimatedShippingPkr: shippingPkr,
      totalCostPkr,
      sellingPricePkr,
      profitPkr,
      profitMarginPercent,
    };
  }

  // -------------------------------------------------------------
  // Product Query / Search from CJ Catalog
  // -------------------------------------------------------------
  async queryProducts(params: {
    page?: number;
    size?: number;
    keyWord?: string;
    categoryId?: string;
  }): Promise<{ list: CjProductItem[]; total: number; page: number; size: number }> {
    const token = await this.getValidAccessToken();
    const settings = await this.getSettings();

    const page = params.page || 1;
    const size = Math.min(params.size || 20, 50);

    const queryParams = new URLSearchParams({
      pageNum: String(page),
      pageSize: String(size),
      page: String(page),
      size: String(size),
    });

    if (params.keyWord && params.keyWord.trim()) {
      queryParams.set('keyWord', params.keyWord.trim());
    }
    if (params.categoryId && params.categoryId.trim()) {
      queryParams.set('categoryId', params.categoryId.trim());
    }

    const res = await fetch(`${this.getBaseUrl()}/api2.0/v1/product/listV2?${queryParams.toString()}`, {
      headers: {
        'CJ-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || (data.code !== 200 && data.result !== true)) {
      throw new Error(`CJ Product Query Failed: ${data?.message || res.status}`);
    }

    // Support both CJ listV2 structures (content[0].productList or flat list)
    const rawList: any[] = data.data?.content?.[0]?.productList || data.data?.list || [];
    const total = data.data?.totalRecords || data.data?.total || rawList.length;

    // Fetch existing mappings to identify already imported products
    const pids = rawList.map((i: any) => String(i.pid || i.id));
    const existingMappings = await prisma.cjProductMapping.findMany({
      where: { cjProductId: { in: pids } },
      select: { cjProductId: true, status: true, productId: true },
    });
    const mappedMap = new Map(existingMappings.map(m => [m.cjProductId, m]));

    // Format list with PKR pricing and import status
    const formatted: CjProductItem[] = rawList.map((item: any) => {
      const pid = String(item.pid || item.id);
      // CJ sellPrice can be a string range e.g. "1.80 -- 14.40" or a number
      const rawPrice = String(item.sellPrice || '0').split('--')[0].trim();
      const supplierPrice = parseFloat(rawPrice) || 0;
      const calc = this.calculatePrice(supplierPrice, settings);
      const mapping = mappedMap.get(pid);

      return {
        pid,
        productName: item.productNameEn || item.nameEn || item.productName || 'Beauty Product',
        productNameEn: item.productNameEn || item.nameEn,
        productSku: item.productSku || item.sku || pid,
        productImage: item.bigImage || item.productImage || '',
        sellPrice: supplierPrice,
        categoryID: item.categoryID || item.categoryId,
        categoryName: item.categoryName || item.threeCategoryName,
        calculatedPricePkr: calc.sellingPricePkr,
        estimatedProfitPkr: calc.profitPkr,
        isImported: Boolean(mapping),
      };
    });

    return {
      list: formatted,
      total,
      page,
      size,
    };
  }

  // -------------------------------------------------------------
  // Product Details Retrieval
  // -------------------------------------------------------------
  async getProductDetail(pid: string) {
    const token = await this.getValidAccessToken();
    const settings = await this.getSettings();

    const res = await fetch(`${this.getBaseUrl()}/api2.0/v1/product/query?pid=${encodeURIComponent(pid)}`, {
      headers: {
        'CJ-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.code !== 200 || !data.data) {
      throw new Error(`Failed to retrieve product details from CJ: ${data?.message || res.status}`);
    }

    const raw = data.data;
    const title = raw.productNameEn || raw.productName || 'Pretty Puff Luxury Cosmetic';
    const cleanDescription = (raw.description || '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    // Collect image gallery
    const imageSet = Array.isArray(raw.productImageSet) && raw.productImageSet.length > 0
      ? raw.productImageSet
      : [raw.bigImage || raw.productImage].filter(Boolean);

    const priceCalc = this.calculatePrice(raw.sellPrice || 0, settings);
    const categoryMapping = await this.mapCategory(raw.categoryName, title);

    // Parse variants if available
    const variants = (raw.variants || []).map((v: any) => ({
      vid: String(v.vid),
      pid: String(v.pid || pid),
      variantName: v.variantNameEn || v.variantName || 'Standard',
      variantSku: v.variantSku || `${raw.productSku || pid}-${v.vid}`,
      variantImage: v.variantImage || raw.bigImage || raw.productImage,
      priceCalc: this.calculatePrice(v.variantSellPrice || raw.sellPrice || 0, settings),
      weight: v.variantWeight || raw.productWeight || 0,
      standard: v.variantStandard || null,
      stock: v.variantStock !== undefined ? v.variantStock : 50,
    }));

    return {
      pid: String(raw.pid || pid),
      title,
      sku: raw.productSku || `CJ-${pid.slice(0, 8).toUpperCase()}`,
      description: cleanDescription || `Experience high-performance beauty with ${title}, formulated for exceptional wear and luxury elegance.`,
      shortDescription: cleanDescription ? cleanDescription.replace(/<[^>]+>/g, '').slice(0, 180) + '...' : `Luxury cosmetic formula by Pretty Puff.`,
      weight: raw.productWeight ? parseFloat(String(raw.productWeight)) : 0,
      categoryName: raw.categoryName,
      mappedCategory: categoryMapping,
      images: imageSet,
      mainImage: raw.bigImage || raw.productImage || imageSet[0] || '',
      priceCalc,
      variants,
    };
  }

  // -------------------------------------------------------------
  // Local Image Downloader
  // -------------------------------------------------------------
  private async downloadAndStoreImage(url: string, prefix: string): Promise<string> {
    if (!url || !url.startsWith('http')) return url;

    try {
      const uploadDir = path.resolve(process.cwd(), 'uploads', 'products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'PrettyPuff-Bot/1.0' } });
      if (!res.ok) return url;

      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
      const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      return `/uploads/products/${filename}`;
    } catch (err) {
      console.warn(`Could not save remote CJ image locally (${url}), using direct URL fallback:`, err);
      return url;
    }
  }

  // -------------------------------------------------------------
  // Product Import Execution
  // -------------------------------------------------------------
  async importProduct(pid: string, options: {
    customPricePkr?: number;
    categoryId?: string;
    subcategoryId?: string;
    status?: 'DRAFT' | 'PUBLISHED';
  } = {}) {
    const settings = await this.getSettings();
    const cjData = await this.getProductDetail(pid);

    // 1. Check duplicate prevention
    const existingMapping = await prisma.cjProductMapping.findUnique({
      where: { cjProductId: pid },
    });

    if (existingMapping && existingMapping.productId) {
      const existingProduct = await prisma.product.findUnique({
        where: { id: existingMapping.productId },
      });
      if (existingProduct) {
        // Return existing and prompt update/sync instead of duplicate creation
        return {
          isDuplicate: true,
          message: `Product is already imported into Pretty Puff as "${existingProduct.name}".`,
          product: existingProduct,
          mapping: existingMapping,
        };
      }
    }

    try {
      // 2. Download and store images locally
      const localImages: string[] = [];
      const imageCountToDownload = Math.min(cjData.images.length, 5);
      for (let i = 0; i < imageCountToDownload; i++) {
        const storedUrl = await this.downloadAndStoreImage(cjData.images[i], `cj-${pid.slice(0, 6)}`);
        localImages.push(storedUrl);
      }
      const thumbnail = localImages[0] || cjData.mainImage;

      // 3. Resolve Category
      const categoryId = options.categoryId || cjData.mappedCategory.categoryId;
      const subcategoryId = options.subcategoryId || cjData.mappedCategory.subcategoryId || null;

      // 4. Resolve Selling Price & Discount
      const sellingPrice = options.customPricePkr || cjData.priceCalc.sellingPricePkr;
      const salePrice = Math.round(sellingPrice * 0.9); // 10% promotional sale price
      const discount = 10;

      // 5. Generate unique slug and SKU
      const baseSlug = cjData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      const sku = `PP-CJ-${Date.now().toString().slice(-6)}`;

      // 6. Calculate USD authoritative base prices & validate auto-publishing
      const rate = settings.currencyRatePkr || 280.0;
      const sellingPriceUsd = Math.round((sellingPrice / rate) * 100) / 100;
      const salePriceUsd = Math.round((salePrice / rate) * 100) / 100;

      const hasValidTitle = Boolean(cjData.title && cjData.title.trim().length > 2);
      const hasValidDesc = Boolean(cjData.description && cjData.description.trim().length > 10);
      const hasValidImages = localImages.length > 0 || Boolean(thumbnail);
      const hasValidPrice = sellingPriceUsd > 0;
      const hasValidCategory = Boolean(categoryId);
      const passesAutoPublishValidation = hasValidTitle && hasValidDesc && hasValidImages && hasValidPrice && hasValidCategory;

      const shouldPublish = (options.status === 'PUBLISHED' || (options.status !== 'DRAFT' && settings.autoPublish)) && passesAutoPublishValidation;

      // Create Pretty Puff Product in Database with USD base currency
      const newProduct = await prisma.product.create({
        data: {
          name: cjData.title,
          slug,
          sku,
          brand: 'Pretty Puff',
          categoryId,
          subcategoryId,
          shortDescription: cjData.shortDescription,
          description: cjData.description,
          price: sellingPriceUsd,
          salePrice: salePriceUsd,
          currency: 'USD',
          originalPkrPrice: sellingPrice,
          originalPkrSalePrice: salePrice,
          pkrToUsdRate: rate,
          costPrice: cjData.priceCalc.supplierPriceUsd,
          discount,
          stock: 45,
          lowStockThreshold: 5,
          images: JSON.stringify(localImages),
          thumbnail,
          isActive: shouldPublish,
          isArchived: false,
          cjProductId: pid,
          seoTitle: `${cjData.title} | Pretty Puff Luxury Cosmetics`,
          metaDescription: cjData.shortDescription,
          variants: cjData.variants.length > 0
            ? {
                create: cjData.variants.slice(0, 8).map((v: any, idx: number) => {
                  const vPricePkr = v.priceCalc?.sellingPricePkr || sellingPrice;
                  const vPriceUsd = Math.round((vPricePkr / rate) * 100) / 100;
                  const vSalePriceUsd = Math.round(vPriceUsd * 0.9 * 100) / 100;
                  return {
                    name: v.variantName,
                    sku: `${sku}-V${idx + 1}`,
                    price: vPriceUsd,
                    salePrice: vSalePriceUsd,
                    currency: 'USD',
                    originalPkrPrice: vPricePkr,
                    originalPkrSalePrice: Math.round(vPricePkr * 0.9),
                    pkrToUsdRate: rate,
                    stock: v.stock || 25,
                    image: v.variantImage || thumbnail,
                    cjVariantId: v.vid,
                  };
                }),
              }
            : undefined,
          inventory: {
            create: {
              currentStock: 45,
              lowStockThreshold: 5,
            },
          },
          transactions: {
            create: {
              changeType: 'STOCK_ADDED',
              quantityChanged: 45,
              previousStock: 0,
              newStock: 45,
              reason: `Initial stock receipt imported from CJdropshipping (PID: ${pid})`,
              createdBy: 'CJ_INTEGRATION',
            },
          },
        },
        include: {
          variants: true,
          category: true,
        },
      });

      // 7. Record / Update CjProductMapping
      const mapping = await prisma.cjProductMapping.upsert({
        where: { cjProductId: pid },
        update: {
          productId: newProduct.id,
          productName: newProduct.name,
          cjSku: cjData.sku,
          supplierPriceUsd: cjData.priceCalc.supplierPriceUsd,
          sellingPricePkr: sellingPrice,
          status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
          lastSyncAt: new Date(),
          errorMessage: null,
        },
        create: {
          cjProductId: pid,
          productId: newProduct.id,
          productName: newProduct.name,
          cjSku: cjData.sku,
          supplierPriceUsd: cjData.priceCalc.supplierPriceUsd,
          sellingPricePkr: sellingPrice,
          status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
          lastSyncAt: new Date(),
        },
      });

      // 8. Log Success
      await prisma.cjImportLog.create({
        data: {
          cjProductId: pid,
          productName: newProduct.name,
          status: 'SUCCESS',
          details: `Imported as ${shouldPublish ? 'PUBLISHED' : 'DRAFT'}. Selling price: ${sellingPrice} PKR. Variants: ${cjData.variants.length}.`,
        },
      });

      return {
        isDuplicate: false,
        success: true,
        message: `Product "${newProduct.name}" imported successfully into Pretty Puff.`,
        product: newProduct,
        mapping,
      };
    } catch (error: any) {
      // Log failure
      await prisma.cjImportLog.create({
        data: {
          cjProductId: pid,
          productName: cjData.title || pid,
          status: 'FAILED',
          details: error.message || 'Import failed due to internal error.',
        },
      });
      throw error;
    }
  }

  // -------------------------------------------------------------
  // Synchronisation Engine
  // -------------------------------------------------------------
  async syncProduct(cjProductId: string) {
    const mapping = await prisma.cjProductMapping.findUnique({
      where: { cjProductId },
    });

    if (!mapping || !mapping.productId) {
      throw new Error(`No Pretty Puff product mapping found for CJ Product ID: ${cjProductId}`);
    }

    const product = await prisma.product.findUnique({
      where: { id: mapping.productId },
      include: { variants: true },
    });

    if (!product) {
      throw new Error(`Pretty Puff product #${mapping.productId} no longer exists in database.`);
    }

    const settings = await this.getSettings();
    const freshCj = await this.getProductDetail(cjProductId);

    const updatePayload: any = {};

    // Sync supplier cost
    updatePayload.costPrice = freshCj.priceCalc.supplierCostPkr;

    // Optional auto-repricing
    if (settings.autoSyncPrice) {
      updatePayload.price = freshCj.priceCalc.sellingPricePkr;
      updatePayload.salePrice = Math.round(freshCj.priceCalc.sellingPricePkr * 0.9);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: updatePayload,
    });

    // Update Mapping record
    await prisma.cjProductMapping.update({
      where: { cjProductId },
      data: {
        lastSyncAt: new Date(),
        supplierPriceUsd: freshCj.priceCalc.supplierPriceUsd,
        status: 'SYNCED',
        errorMessage: null,
      },
    });

    await prisma.cjImportLog.create({
      data: {
        cjProductId,
        productName: product.name,
        status: 'SUCCESS',
        details: `Successfully synchronized stock & supplier costs from CJ API.`,
      },
    });

    return {
      success: true,
      message: `Product "${product.name}" synchronized with CJdropshipping.`,
      product: { ...product, ...updatePayload },
    };
  }

  async syncAllImported(): Promise<{ total: number; synced: number; failed: number; errors: string[] }> {
    const mappings = await prisma.cjProductMapping.findMany({
      where: { productId: { not: null } },
    });

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const m of mappings) {
      try {
        await this.syncProduct(m.cjProductId);
        synced++;
      } catch (err: any) {
        failed++;
        errors.push(`${m.productName} (${m.cjProductId}): ${err.message}`);
        await prisma.cjProductMapping.update({
          where: { cjProductId: m.cjProductId },
          data: { status: 'FAILED', errorMessage: err.message },
        });
      }
    }

    return {
      total: mappings.length,
      synced,
      failed,
      errors,
    };
  }

  // -------------------------------------------------------------
  // Webhook Signature Verification
  // -------------------------------------------------------------
  
  // -------------------------------------------------------------
  // Live Shipping / Freight Calculation (Official CJ API v2.0)
  // -------------------------------------------------------------
  async calculateFreight(params: {
    startCountryCode?: string;
    endCountryCode: string;
    zip?: string;
    products: Array<{
      quantity: number;
      vid?: string;
      sku?: string;
      weight?: number;
    }>;
  }): Promise<{
    success: boolean;
    shippingAvailable: boolean;
    methods: Array<{
      logisticName: string;
      logisticAging: string;
      priceUsd: number;
      priceCn?: number;
    }>;
    message?: string;
  }> {
    const token = await this.getValidAccessToken();
    const startCountry = params.startCountryCode || 'CN';
    const endCountry = (params.endCountryCode || 'US').toUpperCase().trim();

    try {
      const res = await fetch(`${this.getBaseUrl()}/api2.0/v1/logistic/freightCalculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': token,
        },
        body: JSON.stringify({
          startCountryCode: startCountry,
          endCountryCode: endCountry,
          zip: params.zip || '',
          products: params.products,
        }),
      });

      const json = await res.json().catch(() => null);
      if (json && json.code === 200 && Array.isArray(json.data) && json.data.length > 0) {
        const methods = json.data.map((m: any) => ({
          logisticName: m.logisticName || 'Standard Delivery',
          logisticAging: m.logisticAging ? `${m.logisticAging} business days` : '7-15 business days',
          priceUsd: typeof m.logisticPrice === 'number' ? m.logisticPrice : parseFloat(m.logisticPrice) || 0,
          priceCn: m.logisticPriceCn,
        })).filter((m: any) => m.priceUsd > 0);

        return {
          success: true,
          shippingAvailable: methods.length > 0,
          methods,
        };
      }

      return {
        success: true,
        shippingAvailable: false,
        methods: [],
        message: json?.message || 'No shipping routes currently available for this destination.',
      };
    } catch (error: any) {
      return {
        success: false,
        shippingAvailable: false,
        methods: [],
        message: error.message || 'Failed to calculate CJ live freight.',
      };
    }
  }

  verifyWebhookSignature(rawBody: string, signHeader: string | undefined, openId: string | undefined): boolean {
    if (!signHeader || !openId) return false;
    try {
      const computed = crypto.createHmac('sha256', openId).update(rawBody).digest('base64');
      return computed === signHeader;
    } catch {
      return false;
    }
  }
}

export const cjService = new CjDropshippingService();
export default cjService;
