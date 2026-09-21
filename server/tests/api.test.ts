import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../prisma';

describe('Pretty Puff Cosmetics Full-Stack API Test Suite', () => {
  let adminToken: string;
  let testProductId: string;
  let testCategoryId: string;
  let testOrderNumber: string;
  let testOrderId: string;
  let initialStock = 25;

  beforeAll(async () => {
    // 1. Authenticate as Super Admin using demo seed credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sameerliaqat81@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@PrettyPuff2026',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    adminToken = loginRes.body.token;

    // Fetch existing category for test product creation
    const cat = await prisma.category.findFirst();
    if (cat) testCategoryId = cat.id;
  });

  // -------------------------------------------------------------
  // 1. Authentication & Security Tests
  // -------------------------------------------------------------
  describe('Authentication & RBAC Security', () => {
    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sameerliaqat81@gmail.com',
          password: 'IncorrectPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access to protected admin route without token', async () => {
      const res = await request(app).get('/api/analytics/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should grant access to admin profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin.email).toBe('sameerliaqat81@gmail.com');
      expect(res.body.admin.role).toBe('SUPER_ADMIN');
    });
  });

  // -------------------------------------------------------------
  // 2. Categories API Tests
  // -------------------------------------------------------------
  describe('Categories & Taxonomy', () => {
    it('should fetch public categories with subcategories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should fetch single category by slug', async () => {
      const res = await request(app).get('/api/categories/makeup');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('makeup');
    });
  });

  // -------------------------------------------------------------
  // 3. Product Catalog & CRUD Tests
  // -------------------------------------------------------------
  describe('Product Management CRUD', () => {
    it('should fetch public products list with filters', async () => {
      const res = await request(app).get('/api/products?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should create a new cosmetic product as admin', async () => {
      const uniqueSku = `TEST-${Date.now()}`;
      const uniqueSlug = `test-radiant-glow-${Date.now()}`;

      const res = await request(app)
        .post('/api/products/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Radiant Glow Serum',
          slug: uniqueSlug,
          sku: uniqueSku,
          brand: 'Pretty Puff',
          categoryId: testCategoryId,
          shortDescription: 'High potency vitamin C radiance booster',
          description: 'Luxurious hydrating facial elixir designed for sensitive skin.',
          price: 3200,
          salePrice: 2800,
          stock: initialStock,
          lowStockThreshold: 5,
          thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
          images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348'],
          isFeatured: true,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      testProductId = res.body.data.id;
    });

    it('should retrieve created product details by slug', async () => {
      const prod = await prisma.product.findUnique({ where: { id: testProductId } });
      const res = await request(app).get(`/api/products/slug/${prod?.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProductId);
    });

    it('should update product pricing as admin', async () => {
      const res = await request(app)
        .put(`/api/products/admin/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 3400,
          salePrice: 2950,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(3400);
    });

    it('should duplicate product with unique slug and SKU', async () => {
      const res = await request(app)
        .post(`/api/products/admin/${testProductId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toContain('(Copy)');

      // Clean up duplicated product
      await prisma.product.delete({ where: { id: res.body.data.id } });
    });
  });

  // -------------------------------------------------------------
  // 4. Coupon Validation Engine
  // -------------------------------------------------------------
  describe('Promotional Coupon Engine', () => {
    it('should validate active percentage coupon and return correct discount', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'PRETTY10',
          subtotal: 5000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(500); // 10% of 5000
    });

    it('should reject coupon if minimum order amount is not met', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'SAVE500', // min order 4000
          subtotal: 2000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Minimum order amount');
    });
  });

  // -------------------------------------------------------------
  // 5. Checkout, Inventory Stock Deduction & Order Cancellation
  // -------------------------------------------------------------
  describe('Order Processing & Inventory Stock Movement', () => {
    const orderQuantity = 3;

    it('should process customer order and atomically deduct inventory stock', async () => {
      const productBefore = await prisma.product.findUnique({ where: { id: testProductId } });
      const currentStockBefore = productBefore?.stock ?? initialStock;

      const orderRes = await request(app)
        .post('/api/orders')
        .send({
          fullName: 'Sana Malik',
          email: 'sana.malik@example.pk',
          phone: '+923009988776',
          city: 'Lahore',
          address: 'House 55, Block J, Model Town',
          couponCode: 'PRETTY10',
          paymentMethod: 'COD',
          items: [
            {
              productId: testProductId,
              productName: 'Test Radiant Glow Serum',
              sku: productBefore?.sku || 'SKU-TEST',
              price: 2950, // sale price
              quantity: orderQuantity,
            },
          ],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.success).toBe(true);
      expect(orderRes.body.data.orderNumber).toBeDefined();

      testOrderId = orderRes.body.data.id;
      testOrderNumber = orderRes.body.data.orderNumber;

      // Verify inventory stock was deducted by exactly orderQuantity
      const productAfter = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productAfter?.stock).toBe(currentStockBefore - orderQuantity);

      // Verify audit transaction log was created
      const tx = await prisma.inventoryTransaction.findFirst({
        where: { orderId: testOrderId, changeType: 'ORDER_DEDUCTION' },
      });
      expect(tx).toBeDefined();
      expect(tx?.quantityChanged).toBe(-orderQuantity);
    });

    it('should restore inventory stock when order is cancelled', async () => {
      const productBeforeCancel = await prisma.product.findUnique({ where: { id: testProductId } });
      const stockBeforeCancel = productBeforeCancel?.stock ?? 0;

      const cancelRes = await request(app)
        .patch(`/api/orders/admin/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);

      // Verify stock was fully restored
      const productAfterCancel = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productAfterCancel?.stock).toBe(stockBeforeCancel + orderQuantity);

      // Verify restoration audit transaction log
      const restorationTx = await prisma.inventoryTransaction.findFirst({
        where: { orderId: testOrderId, changeType: 'ORDER_CANCELLATION' },
      });
      expect(restorationTx).toBeDefined();
      expect(restorationTx?.quantityChanged).toBe(orderQuantity);
    });
  });

  // -------------------------------------------------------------
  // 6. Blog CMS & Articles
  // -------------------------------------------------------------
  describe('Beauty Journal CMS', () => {
    it('should fetch published blog articles', async () => {
      const res = await request(app).get('/api/blog');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should create a new blog article as admin', async () => {
      const blogCat = await prisma.blogCategory.findFirst();
      const uniqueSlug = `test-article-${Date.now()}`;

      const res = await request(app)
        .post('/api/blog/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'The Art of Glass Skin Routine',
          slug: uniqueSlug,
          excerpt: 'Mastering the 7-step hydration routine for radiant skin.',
          content: [
            {
              id: 's1',
              heading: 'Hydration Layering',
              level: 2,
              paragraphs: ['Layer lightweight essences before richer moisturizers.'],
            },
          ],
          featuredImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
          categoryId: blogCat?.id,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(uniqueSlug);

      // Clean up test article
      await prisma.blogPost.delete({ where: { id: res.body.data.id } });
    });
  });

  // -------------------------------------------------------------
  // 7. Dashboard Analytics
  // -------------------------------------------------------------
  describe('Admin Dashboard Analytics', () => {
    it('should return complete KPI metrics and chart series for admin dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalSales).toBeGreaterThanOrEqual(0);
      expect(res.body.data.charts.salesOverTime).toBeDefined();
      expect(res.body.data.charts.categoryDistribution).toBeDefined();
    });
  });
});
