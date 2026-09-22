import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config();

// Determine application root directory reliably (supports local dev and cPanel Passenger)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateDirs = [
  path.resolve(__dirname),
  path.resolve(__dirname, '..'),
  process.cwd(),
];
const appRootDir = candidateDirs.find(d => fs.existsSync(path.join(d, 'package.json'))) || process.cwd();

// Ensure upload directory and subfolders exist
const uploadDir = path.resolve(appRootDir, 'uploads');
['', 'products', 'blog', 'banners', 'general'].forEach(sub => {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// Hosting-provided PORT with safe fallback for local development
const rawPort = process.env.PORT || 3000;
const isNumericPort = !isNaN(Number(rawPort)) && !isNaN(parseFloat(String(rawPort)));
const listenTarget = isNumericPort ? Number(rawPort) : rawPort;

// Security & Parsing Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Serving (supporting both /uploads and /public/uploads)
app.use('/uploads', express.static(uploadDir));
app.use('/public/uploads', express.static(uploadDir));

// Public directory if exists
const publicDir = path.resolve(appRootDir, 'public');
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

// Serve Vite production build
const distPath = path.resolve(appRootDir, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  // Serve static assets from dist/
  app.use(express.static(distPath));

  // Single Page Application (SPA) wildcard fallback for browser navigation
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Exclude API routes, file uploads, and SEO files from HTML fallback
    if (
      req.path === '/api' ||
      req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/public/uploads/') ||
      req.path === '/sitemap.xml' ||
      req.path === '/robots.txt'
    ) {
      return next();
    }

    if (fs.existsSync(indexHtmlPath)) {
      res.sendFile(indexHtmlPath);
    } else {
      next();
    }
  });
} else {
  console.warn(`⚠️ Warning: Frontend dist/ directory not found at "${distPath}". Run "npm run build" to compile the Vite client.`);
  app.get('/', (_req: Request, res: Response) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Pretty Puff - Building Production Assets</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FCFAF8; color: #1E1E24; text-align: center; padding: 60px 20px; }
            .card { max-width: 540px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
            h1 { color: #C27A86; font-size: 24px; margin-bottom: 12px; }
            code { background: #f4f4f5; padding: 3px 8px; border-radius: 4px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🌸 Pretty Puff Backend is Active</h1>
            <p>The Node.js server is online, but the frontend assets (<code>dist/</code>) have not been compiled yet.</p>
            <p>Run <code>npm run build</code> in the cPanel Terminal to compile the store.</p>
            <p><a href="/api/health">Check API Health Endpoint</a></p>
          </div>
        </body>
      </html>
    `);
  });
}

// 404 handler for unmatched API routes (must return JSON, never HTML)
app.all(['/api', '/api/*'], (_req: Request, res: Response) => {
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
  if (typeof listenTarget === 'number') {
    app.listen(listenTarget, '0.0.0.0', () => {
      console.log(`🌸 Pretty Puff Server running on http://0.0.0.0:${listenTarget}`);
      console.log(`   Health check: http://localhost:${listenTarget}/api/health`);
      console.log(`   Admin Login:  sameerliaqat81@gmail.com`);
      console.log(`   Sitemap:      http://localhost:${listenTarget}/sitemap.xml`);
    });
  } else {
    // Passenger Unix domain socket path
    app.listen(listenTarget, () => {
      console.log(`🌸 Pretty Puff Server bound to socket: ${listenTarget}`);
    });
  }
}

export default app;
