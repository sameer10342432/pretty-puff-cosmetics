import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC CUSTOMER ENDPOINTS
// ==========================================

// Get all products with filters & pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      onSale,
      search,
      sort,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
      isArchived: false,
    };

    if (category) {
      where.category = { slug: (category as string).toLowerCase() };
    }

    if (subcategory) {
      where.subcategory = { slug: (subcategory as string).toLowerCase() };
    }

    if (brand) {
      where.brand = { equals: brand as string };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating as string) };
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    if (onSale === 'true') {
      where.salePrice = { not: null };
    }

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { shortDescription: { contains: q } },
        { description: { contains: q } },
        { sku: { contains: q } },
        { brand: { contains: q } },
      ];
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    else if (sort === 'price-desc') orderBy = { price: 'desc' };
    else if (sort === 'best-selling') orderBy = [{ isBestSeller: 'desc' }, { rating: 'desc' }];
    else if (sort === 'highest-rated') orderBy = { rating: 'desc' };
    else if (sort === 'featured') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
          variants: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products JSON fields
    const formatted = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      colours: p.colours ? JSON.parse(p.colours) : [],
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      benefits: p.benefits ? JSON.parse(p.benefits) : [],
      category: p.category.name,
      categorySlug: p.category.slug,
      subcategory: p.subcategory?.name || '',
      subcategorySlug: p.subcategory?.slug || '',
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// Featured Products
router.get('/featured', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isFeatured: true },
      take: 8,
      include: {
        category: true,
        subcategory: true,
        variants: true,
      },
    });
    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        colours: p.colours ? JSON.parse(p.colours) : [],
        sizes: p.sizes ? JSON.parse(p.sizes) : [],
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
        category: p.category.name,
        categorySlug: p.category.slug,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured products.' });
  }
});

// Best Sellers
router.get('/bestsellers', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isBestSeller: true },
      take: 8,
      include: {
        category: true,
        subcategory: true,
        variants: true,
      },
    });
    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        colours: p.colours ? JSON.parse(p.colours) : [],
        sizes: p.sizes ? JSON.parse(p.sizes) : [],
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
        category: p.category.name,
        categorySlug: p.category.slug,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch best sellers.' });
  }
});

// New Arrivals
router.get('/new-arrivals', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isNew: true },
      take: 8,
      include: {
        category: true,
        subcategory: true,
        variants: true,
      },
    });
    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        colours: p.colours ? JSON.parse(p.colours) : [],
        sizes: p.sizes ? JSON.parse(p.sizes) : [],
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
        category: p.category.name,
        categorySlug: p.category.slug,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch new arrivals.' });
  }
});

// Get single product by slug
router.get('/slug/:slug', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug.toLowerCase() },
      include: {
        category: true,
        subcategory: true,
        variants: true,
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || !product.isActive || product.isArchived) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colours: product.colours ? JSON.parse(product.colours) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : [],
        benefits: product.benefits ? JSON.parse(product.benefits) : [],
        category: product.category.name,
        categorySlug: product.category.slug,
        subcategory: product.subcategory?.name || '',
        subcategorySlug: product.subcategory?.slug || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        subcategory: true,
        variants: true,
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colours: product.colours ? JSON.parse(product.colours) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : [],
        benefits: product.benefits ? JSON.parse(product.benefits) : [],
        category: product.category.name,
        categorySlug: product.category.slug,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
});

// ==========================================
// ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// Get All Products for Admin (Includes inactive, archived, stock metrics)
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
        subcategory: true,
        variants: true,
      },
    });

    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        colours: p.colours ? JSON.parse(p.colours) : [],
        sizes: p.sizes ? JSON.parse(p.sizes) : [],
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
        category: p.category.name,
        categorySlug: p.category.slug,
        subcategory: p.subcategory?.name || '',
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin products.' });
  }
});

// Create Product
const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().min(2),
  brand: z.string().default('Pretty Puff'),
  categoryId: z.string(),
  subcategoryId: z.string().optional().nullable(),
  shortDescription: z.string(),
  description: z.string(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  discount: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().default(5),
  images: z.array(z.string()).default([]),
  thumbnail: z.string(),
  colours: z.array(z.any()).optional(),
  sizes: z.array(z.string()).optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  focusKeyword: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string(),
        price: z.number().optional().nullable(),
        salePrice: z.number().optional().nullable(),
        stock: z.number().int().default(0),
        image: z.string().optional().nullable(),
        colourName: z.string().optional().nullable(),
        colourHex: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
      })
    )
    .optional(),
});

router.post('/admin/create', requireAuth, requirePermission('products.manage'), async (req, res): Promise<void> => {
  try {
    const validated = productSchema.parse(req.body);

    // Ensure unique slug and SKU
    const existingSlug = await prisma.product.findUnique({ where: { slug: validated.slug } });
    if (existingSlug) {
      res.status(400).json({ success: false, message: `A product with slug "${validated.slug}" already exists.` });
      return;
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existingSku) {
      res.status(400).json({ success: false, message: `A product with SKU "${validated.sku}" already exists.` });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase().trim(),
        sku: validated.sku.toUpperCase().trim(),
        brand: validated.brand,
        categoryId: validated.categoryId,
        subcategoryId: validated.subcategoryId || null,
        shortDescription: validated.shortDescription,
        description: validated.description,
        price: validated.price,
        salePrice: validated.salePrice || null,
        discount: validated.discount || null,
        costPrice: validated.costPrice || null,
        stock: validated.stock,
        lowStockThreshold: validated.lowStockThreshold,
        images: JSON.stringify(validated.images),
        thumbnail: validated.thumbnail || validated.images[0] || '',
        colours: validated.colours ? JSON.stringify(validated.colours) : null,
        sizes: validated.sizes ? JSON.stringify(validated.sizes) : null,
        ingredients: validated.ingredients || null,
        howToUse: validated.howToUse || null,
        benefits: validated.benefits ? JSON.stringify(validated.benefits) : null,
        isFeatured: validated.isFeatured,
        isBestSeller: validated.isBestSeller,
        isNew: validated.isNew,
        isActive: validated.isActive,
        seoTitle: validated.seoTitle || validated.name,
        metaDescription: validated.metaDescription || validated.shortDescription,
        focusKeyword: validated.focusKeyword || null,
        variants: validated.variants
          ? {
              create: validated.variants.map(v => ({
                name: v.name,
                sku: v.sku.toUpperCase().trim(),
                price: v.price || validated.price,
                salePrice: v.salePrice || null,
                stock: v.stock,
                image: v.image || null,
                colourName: v.colourName || null,
                colourHex: v.colourHex || null,
                size: v.size || null,
              })),
            }
          : undefined,
        inventory: {
          create: {
            currentStock: validated.stock,
            lowStockThreshold: validated.lowStockThreshold,
          },
        },
        transactions: {
          create: {
            changeType: 'STOCK_ADDED',
            quantityChanged: validated.stock,
            previousStock: 0,
            newStock: validated.stock,
            reason: 'Initial product creation stock receipt',
            createdBy: (req as any).admin?.name || 'ADMIN',
          },
        },
      },
      include: {
        variants: true,
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Product "${product.name}" created successfully.`,
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product.',
    });
  }
});

// Update Product
router.put('/admin/:id', requireAuth, requirePermission('products.manage'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Check SKU collision if changed
    if (body.sku && body.sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (skuConflict && skuConflict.id !== id) {
        res.status(400).json({ success: false, message: `SKU "${body.sku}" is already in use.` });
        return;
      }
    }

    // Check slug collision if changed
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.product.findUnique({ where: { slug: body.slug } });
      if (slugConflict && slugConflict.id !== id) {
        res.status(400).json({ success: false, message: `Slug "${body.slug}" is already in use.` });
        return;
      }
    }

    // Update product data
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        slug: body.slug ? body.slug.toLowerCase().trim() : existing.slug,
        sku: body.sku ? body.sku.toUpperCase().trim() : existing.sku,
        brand: body.brand ?? existing.brand,
        categoryId: body.categoryId ?? existing.categoryId,
        subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId : existing.subcategoryId,
        shortDescription: body.shortDescription ?? existing.shortDescription,
        description: body.description ?? existing.description,
        price: body.price !== undefined ? parseFloat(body.price) : existing.price,
        salePrice: body.salePrice !== undefined ? (body.salePrice ? parseFloat(body.salePrice) : null) : existing.salePrice,
        discount: body.discount !== undefined ? (body.discount ? parseInt(body.discount, 10) : null) : existing.discount,
        costPrice: body.costPrice !== undefined ? (body.costPrice ? parseFloat(body.costPrice) : null) : existing.costPrice,
        stock: body.stock !== undefined ? parseInt(body.stock, 10) : existing.stock,
        lowStockThreshold: body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold, 10) : existing.lowStockThreshold,
        images: body.images ? JSON.stringify(body.images) : existing.images,
        thumbnail: body.thumbnail ?? existing.thumbnail,
        colours: body.colours ? JSON.stringify(body.colours) : existing.colours,
        sizes: body.sizes ? JSON.stringify(body.sizes) : existing.sizes,
        ingredients: body.ingredients !== undefined ? body.ingredients : existing.ingredients,
        howToUse: body.howToUse !== undefined ? body.howToUse : existing.howToUse,
        benefits: body.benefits ? JSON.stringify(body.benefits) : existing.benefits,
        isFeatured: body.isFeatured !== undefined ? body.isFeatured : existing.isFeatured,
        isBestSeller: body.isBestSeller !== undefined ? body.isBestSeller : existing.isBestSeller,
        isNew: body.isNew !== undefined ? body.isNew : existing.isNew,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
        metaDescription: body.metaDescription !== undefined ? body.metaDescription : existing.metaDescription,
        focusKeyword: body.focusKeyword !== undefined ? body.focusKeyword : existing.focusKeyword,
      },
    });

    res.json({
      success: true,
      message: `Product "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update product.' });
  }
});

// Delete Product
router.delete('/admin/:id', requireAuth, requirePermission('products.manage'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Could not delete product. It may be linked to existing orders.' });
  }
});

// Duplicate Product
router.post('/admin/:id/duplicate', requireAuth, requirePermission('products.manage'), async (req, res): Promise<void> => {
  try {
    const original = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true },
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Original product not found.' });
      return;
    }

    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const duplicated = await prisma.product.create({
      data: {
        name: `${original.name} (Copy)`,
        slug: `${original.slug}-copy-${uniqueId}`,
        sku: `${original.sku}-CP${uniqueId}`,
        brand: original.brand,
        categoryId: original.categoryId,
        subcategoryId: original.subcategoryId,
        shortDescription: original.shortDescription,
        description: original.description,
        price: original.price,
        salePrice: original.salePrice,
        discount: original.discount,
        costPrice: original.costPrice,
        stock: original.stock,
        lowStockThreshold: original.lowStockThreshold,
        images: original.images,
        thumbnail: original.thumbnail,
        colours: original.colours,
        sizes: original.sizes,
        ingredients: original.ingredients,
        howToUse: original.howToUse,
        benefits: original.benefits,
        isFeatured: false,
        isBestSeller: false,
        isNew: true,
        isActive: false, // Default to inactive for review
        seoTitle: original.seoTitle,
        metaDescription: original.metaDescription,
        focusKeyword: original.focusKeyword,
      },
    });

    res.json({
      success: true,
      message: `Product duplicated successfully as "${duplicated.name}".`,
      data: duplicated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to duplicate product.' });
  }
});

export default router;
