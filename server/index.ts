import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Import route handlers
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import inventoryRoutes from './routes/inventory';
import ordersRoutes from './routes/orders';
import couponsRoutes from './routes/coupons';
import blogRoutes from './routes/blog';
import reviewsRoutes from './routes/reviews';
import bannersRoutes from './routes/banners';
import contactRoutes from './routes/contact';
import newsletterRoutes from './routes/newsletter';
import settingsRoutes from './routes/settings';
import customersRoutes from './routes/customers';
import usersRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import { prisma } from './prisma';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Serving (supporting both /uploads and /public/uploads)
app.use('/uploads', express.static(uploadDir));
app.use('/public/uploads', express.static(uploadDir));

// Public directory if exists
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'Pretty Puff Luxury Cosmetics',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dynamic Sitemap (SEO)
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const [products, categories, posts] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true, isArchived: false }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    ]);

    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: 'shop', priority: '0.9', changefreq: 'daily' },
      { path: 'blog', priority: '0.8', changefreq: 'daily' },
      { path: 'about', priority: '0.6', changefreq: 'monthly' },
      { path: 'contact', priority: '0.7', changefreq: 'monthly' },
      { path: 'faq', priority: '0.5', changefreq: 'monthly' },
      { path: 'shipping', priority: '0.4', changefreq: 'monthly' },
      { path: 'returns', priority: '0.4', changefreq: 'monthly' },
      { path: 'privacy', priority: '0.3', changefreq: 'yearly' },
      { path: 'terms', priority: '0.3', changefreq: 'yearly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      const pageUrl = page.path ? `${baseUrl}/${page.path}` : baseUrl;
      xml += `  <url>\n    <loc>${pageUrl}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    for (const cat of categories) {
      xml += `  <url>\n    <loc>${baseUrl}/shop?category=${cat.slug}</loc>\n    <lastmod>${cat.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    for (const prod of products) {
      xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    <lastmod>${prod.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    for (const post of posts) {
      xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt (SEO)
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(content);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// In production, serve frontend client
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/public/uploads/') ||
      req.path === '/sitemap.xml' ||
      req.path === '/robots.txt'
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected error occurred on the server.',
    ...(isDev && { stack: err.stack }),
  });
});

// Start Server if not imported by test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🌸 Pretty Puff Server running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Admin Login:  sameerliaqat81@gmail.com`);
    console.log(`   Sitemap:      http://localhost:${PORT}/sitemap.xml`);
  });
}

export default app;
