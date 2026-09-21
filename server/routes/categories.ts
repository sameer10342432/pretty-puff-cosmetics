import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC CUSTOMER ENDPOINTS
// ==========================================

// Get all active categories with subcategories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
        },
        _count: {
          select: { products: { where: { isActive: true, isArchived: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '',
        productCount: c._count.products,
        subcategories: c.subcategories.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        })),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// Get category by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug.toLowerCase() },
      include: {
        subcategories: { where: { isActive: true } },
        _count: {
          select: { products: { where: { isActive: true, isArchived: false } } },
        },
      },
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
        productCount: category._count.products,
        subcategories: category.subcategories,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category.' });
  }
});

// ==========================================
// ADMIN MANAGEMENT ENDPOINTS
// ==========================================

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Create Category
router.post('/admin', requireAuth, requirePermission('categories.manage'), async (req, res): Promise<void> => {
  try {
    const validated = categorySchema.parse(req.body);
    const existing = await prisma.category.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      res.status(400).json({ success: false, message: `Category with slug "${validated.slug}" already exists.` });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase().trim(),
        description: validated.description || null,
        image: validated.image || null,
        isActive: validated.isActive,
      },
      include: { subcategories: true },
    });

    res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create category.' });
  }
});

// Update Category
router.put('/admin/:id', requireAuth, requirePermission('categories.manage'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug ? body.slug.toLowerCase().trim() : undefined,
        description: body.description,
        image: body.image,
        isActive: body.isActive,
      },
      include: { subcategories: true },
    });

    res.json({ success: true, message: 'Category updated.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// Delete Category
router.delete('/admin/:id', requireAuth, requirePermission('categories.manage'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Cannot delete category with associated products.' });
  }
});

// Add Subcategory
router.post('/admin/:categoryId/subcategories', requireAuth, requirePermission('categories.manage'), async (req, res): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'Subcategory name and slug are required.' });
      return;
    }

    const sub = await prisma.subcategory.create({
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        categoryId,
      },
    });

    res.status(201).json({ success: true, message: 'Subcategory added.', data: sub });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to add subcategory.' });
  }
});

// Delete Subcategory
router.delete('/admin/subcategories/:id', requireAuth, requirePermission('categories.manage'), async (req, res): Promise<void> => {
  try {
    await prisma.subcategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subcategory deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subcategory.' });
  }
});

export default router;
