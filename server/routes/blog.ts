import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC BLOG ENDPOINTS
// ==========================================

// Get all published blog posts
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = '1', limit = '12' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (category && category !== 'all') {
      where.category = { slug: (category as string).toLowerCase() };
    }

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { focusKeyword: { contains: q } },
        { content: { contains: q } },
      ];
    }

    const [posts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    const formatted = posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      featuredImageAlt: p.featuredImageAlt || p.title,
      category: p.category.name,
      categorySlug: p.category.slug,
      author: {
        name: p.authorName,
        role: p.authorRole,
        avatar: p.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        bio: 'Senior Beauty Editor & Skincare Chemist at Pretty Puff',
      },
      publishedAt: p.publishedAt.toISOString().split('T')[0],
      readingTime: p.readingTime,
      isFeatured: p.isFeatured,
      isPopular: p.isPopular,
      isPublished: p.status === 'PUBLISHED',
      sections: p.content ? JSON.parse(p.content) : [],
      relatedProductIds: p.relatedProductIds ? JSON.parse(p.relatedProductIds) : [],
      relatedArticleSlugs: p.relatedArticleSlugs ? JSON.parse(p.relatedArticleSlugs) : [],
      seoTitle: p.seoTitle || p.title,
      metaDescription: p.metaDescription || p.excerpt,
      focusKeyword: p.focusKeyword || '',
      secondaryKeywords: p.secondaryKeywords ? JSON.parse(p.secondaryKeywords) : [],
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts.' });
  }
});

// Get featured post
router.get('/featured', async (_req, res): Promise<void> => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { status: 'PUBLISHED', isFeatured: true },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (!post) {
      const fallback = await prisma.blogPost.findFirst({
        where: { status: 'PUBLISHED' },
        include: { category: true },
      });
      res.json({ success: true, data: fallback });
      return;
    }

    res.json({
      success: true,
      data: {
        ...post,
        sections: post.content ? JSON.parse(post.content) : [],
        category: post.category.name,
        categorySlug: post.category.slug,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured post.' });
  }
});

// Get post by slug
router.get('/slug/:slug', async (req, res): Promise<void> => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug.toLowerCase() },
      include: { category: true },
    });

    if (!post || post.status !== 'PUBLISHED') {
      res.status(404).json({ success: false, message: 'Article not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt || post.title,
        category: post.category.name,
        categorySlug: post.category.slug,
        author: {
          name: post.authorName,
          role: post.authorRole,
          avatar: post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          bio: 'Senior Beauty Editor & Skincare Chemist at Pretty Puff',
        },
        publishedAt: post.publishedAt.toISOString().split('T')[0],
        readingTime: post.readingTime,
        isFeatured: post.isFeatured,
        isPopular: post.isPopular,
        isPublished: post.status === 'PUBLISHED',
        sections: post.content ? JSON.parse(post.content) : [],
        relatedProductIds: post.relatedProductIds ? JSON.parse(post.relatedProductIds) : [],
        relatedArticleSlugs: post.relatedArticleSlugs ? JSON.parse(post.relatedArticleSlugs) : [],
        seoTitle: post.seoTitle || post.title,
        metaDescription: post.metaDescription || post.excerpt,
        focusKeyword: post.focusKeyword || '',
        secondaryKeywords: post.secondaryKeywords ? JSON.parse(post.secondaryKeywords) : [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch article details.' });
  }
});

// Get all blog categories
router.get('/categories', async (_req, res): Promise<void> => {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
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
        seoTitle: c.seoTitle || '',
        metaDescription: c.metaDescription || '',
        count: c._count.posts,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blog categories.' });
  }
});

// ==========================================
// ADMIN BLOG MANAGEMENT ENDPOINTS
// ==========================================

const blogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.any(), // Sections array or string
  featuredImage: z.string(),
  featuredImageAlt: z.string().optional(),
  categoryId: z.string(),
  authorName: z.string().default('Pretty Puff Beauty Team'),
  authorRole: z.string().default('Beauty & Skincare Specialist'),
  readingTime: z.number().int().default(5),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).default('PUBLISHED'),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  focusKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  relatedProductIds: z.array(z.string()).optional(),
  relatedArticleSlugs: z.array(z.string()).optional(),
});

// Admin list all blog posts
router.get('/admin/all', requireAuth, requirePermission('blog.manage'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    });

    res.json({
      success: true,
      data: posts.map(p => ({
        ...p,
        sections: p.content ? JSON.parse(p.content) : [],
        categoryName: p.category.name,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin blog posts.' });
  }
});

// Create Blog Post
router.post('/admin', requireAuth, requirePermission('blog.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = blogPostSchema.parse(req.body);

    const existing = await prisma.blogPost.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      res.status(400).json({ success: false, message: `An article with slug "${validated.slug}" already exists.` });
      return;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: validated.title,
        slug: validated.slug.toLowerCase().trim(),
        excerpt: validated.excerpt,
        content: typeof validated.content === 'string' ? validated.content : JSON.stringify(validated.content),
        featuredImage: validated.featuredImage,
        featuredImageAlt: validated.featuredImageAlt || validated.title,
        categoryId: validated.categoryId,
        authorName: validated.authorName,
        authorRole: validated.authorRole,
        readingTime: validated.readingTime,
        isFeatured: validated.isFeatured,
        isPopular: validated.isPopular,
        status: validated.status,
        seoTitle: validated.seoTitle || validated.title,
        metaDescription: validated.metaDescription || validated.excerpt,
        focusKeyword: validated.focusKeyword || null,
        secondaryKeywords: validated.secondaryKeywords ? JSON.stringify(validated.secondaryKeywords) : null,
        relatedProductIds: validated.relatedProductIds ? JSON.stringify(validated.relatedProductIds) : null,
        relatedArticleSlugs: validated.relatedArticleSlugs ? JSON.stringify(validated.relatedArticleSlugs) : null,
      },
    });

    res.status(201).json({ success: true, message: `Article "${post.title}" created.`, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create blog post.' });
  }
});

// Update Blog Post
router.put('/admin/:id', requireAuth, requirePermission('blog.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug ? body.slug.toLowerCase().trim() : undefined,
        excerpt: body.excerpt,
        content: body.content ? (typeof body.content === 'string' ? body.content : JSON.stringify(body.content)) : undefined,
        featuredImage: body.featuredImage,
        featuredImageAlt: body.featuredImageAlt,
        categoryId: body.categoryId,
        authorName: body.authorName,
        authorRole: body.authorRole,
        readingTime: body.readingTime !== undefined ? parseInt(body.readingTime, 10) : undefined,
        isFeatured: body.isFeatured !== undefined ? body.isFeatured : undefined,
        isPopular: body.isPopular !== undefined ? body.isPopular : undefined,
        status: body.status,
        seoTitle: body.seoTitle,
        metaDescription: body.metaDescription,
        focusKeyword: body.focusKeyword,
        secondaryKeywords: body.secondaryKeywords ? JSON.stringify(body.secondaryKeywords) : undefined,
        relatedProductIds: body.relatedProductIds ? JSON.stringify(body.relatedProductIds) : undefined,
        relatedArticleSlugs: body.relatedArticleSlugs ? JSON.stringify(body.relatedArticleSlugs) : undefined,
      },
    });

    res.json({ success: true, message: `Article "${updated.title}" updated.`, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update article.' });
  }
});

// Delete Blog Post
router.delete('/admin/:id', requireAuth, requirePermission('blog.manage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete article.' });
  }
});

export default router;
