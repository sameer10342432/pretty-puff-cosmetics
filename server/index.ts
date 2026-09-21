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

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Serving
app.use('/uploads', express.static(uploadDir));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'Pretty Puff Luxury Cosmetics',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
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
  app.listen(PORT, () => {
    console.log(`🌸 Pretty Puff API Server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Admin Login:  sameerliaqat81@gmail.com`);
  });
}

export default app;
