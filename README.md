# Pretty Puff — Luxury Cosmetics & Beauty E-Commerce Platform

<div align="center">
  <img width="1200" alt="Pretty Puff Luxury Banner" src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80" style="border-radius: 12px;" />
  <br /><br />
  <p><strong>Pure Elegance, Everyday Glamour.</strong></p>
  <p>A full-stack, production-ready luxury cosmetics e-commerce platform built with React 19, Vite, Express, TypeScript, and Prisma ORM.</p>
</div>

---

## 🌟 Brand Information

- **Brand Name**: Pretty Puff
- **Business**: Online luxury cosmetics & beauty e-commerce store
- **Contact Email**: [sameerliaqat81@gmail.com](mailto:sameerliaqat81@gmail.com)
- **WhatsApp / Phone**: [+92 347 4542881](https://wa.me/923474542881)
- **Currency**: Pakistani Rupee (`PKR` / `Rs.`)
- **Default Shipping**: Free delivery on orders over Rs. 3,000 (Standard: Rs. 250)

---

## 🏗️ Architecture & Technology Stack

Pretty Puff is engineered as an enterprise-grade full-stack monorepo featuring a decoupled customer storefront, a secure administrative management console, and a TypeScript REST API backed by Prisma ORM.

```
┌─────────────────────────────────────────────────────────────┐
│                   PRETTY PUFF PLATFORM                      │
├──────────────────────────────┬──────────────────────────────┤
│      CUSTOMER STOREFRONT     │       ADMIN DASHBOARD        │
│    (React 19 + Tailwind v4)  │   (/admin - RBAC Protected)  │
├──────────────────────────────┴──────────────────────────────┤
│                      VITE DEV PROXY                         │
│       /api/*  ──>  http://localhost:5000/api/*              │
│       /uploads/*  ──>  http://localhost:5000/uploads/*      │
├─────────────────────────────────────────────────────────────┤
│                 NODE.JS / EXPRESS REST API                  │
│       • JWT Auth & RBAC Middleware                          │
│       • Zod & Custom Payload Validation                     │
│       • Multer Image Processing & Uploads                   │
│       • Atomic Stock Deduction & Restoration                │
├─────────────────────────────────────────────────────────────┤
│                      PRISMA ORM v6                          │
│   • 32 Relational Entities (Users, Roles, Products, etc.)    │
│   • Multi-Provider: SQLite (Local) / PostgreSQL (Production)│
└─────────────────────────────────────────────────────────────┘
```

### Technology Highlights

- **Storefront & Admin UI**:
  - React 19 (`react`, `react-dom`)
  - Vite 8 (`@vitejs/plugin-react`)
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Motion / Framer Motion (`motion`)
  - Lucide Icons (`lucide-react`)
- **Backend & API**:
  - Node.js & Express (`express`, `cors`)
  - TypeScript (`typescript`, `tsx`)
  - Prisma ORM (`@prisma/client`, `prisma`)
  - Authentication: JWT (`jsonwebtoken`) + BCrypt (`bcryptjs`)
  - File Uploads: Multer (`multer`)
- **Testing & Quality Assurance**:
  - Vitest 3 (`vitest`)
  - Supertest (`supertest`)
  - Full TypeScript strict type checking (`tsc --noEmit`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x` recommended (LTS)
- **npm**: `v10.x` or higher

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd "pretty-puff---luxury-cosmetics-&-beauty-store"

# Install dependencies (legacy peer deps handles React 19 tooling seamlessly)
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Create a `.env` file in the project root by copying the provided `.env.example`:

```bash
cp .env.example .env
```

Review and adjust variables as required:

| Variable | Description | Default (Local) |
| :--- | :--- | :--- |
| `PORT` | Backend Express server port | `5000` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` (SQLite) |
| `JWT_SECRET` | Secret key for signing admin authentication tokens | `prettypuff_super_secure_jwt_secret_key_2026_luxury_cosmetics` |
| `ADMIN_EMAIL` | Default Super Admin email address | `sameerliaqat81@gmail.com` |
| `ADMIN_PASSWORD` | Default Super Admin initial password | `Admin@PrettyPuff2026` |
| `STORE_EMAIL` | Customer support email | `sameerliaqat81@gmail.com` |
| `STORE_PHONE` | Customer support contact number | `+923474542881` |
| `WHATSAPP_URL` | WhatsApp direct contact link | `https://wa.me/923474542881` |
| `CURRENCY` | Store currency symbol | `PKR` |

### 4. Database Setup & Seeding

The repository supports zero-configuration local development via SQLite with complete relational parity to production PostgreSQL.

```bash
# Generate Prisma Client
npm run prisma:generate

# Push database schema to local SQLite database (dev.db)
npm run prisma:push

# Seed initial store data (Super Admin, roles, 10 categories, 32 products, 15 articles, etc.)
npm run seed
```

### 5. Launch Development Server

Run both the Vite frontend client (port 3000) and Express backend API (port 5000) concurrently:

```bash
npm run dev
```

- **Customer Storefront**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Backend API Health**: `http://localhost:5000/api/health`

Alternatively, you can run services independently:
```bash
# Run client only
npm run dev:client

# Run API server only with hot reloading
npm run dev:server
```

---

## 🔐 Administrative Access & RBAC

### Super Admin Default Credentials

- **URL**: `http://localhost:3000/admin` (or click **Admin Portal** in the storefront header/footer)
- **Email**: `sameerliaqat81@gmail.com`
- **Password**: `Admin@PrettyPuff2026`

> [!NOTE]
> For convenience during local development and demonstrations, the Admin Login view features a one-click **Fill Demo Credentials** button.

### Role-Based Access Control (RBAC) Matrix

| Role | Dashboard | Catalog & Products | Orders & Shipping | Customers | Marketing & Coupons | Blog CMS | Reviews | Settings & Staff |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Admin** | Full | Full | Full | Full | Full | Full | Full | View Only |
| **Editor** | View | Full | None | None | None | Full | View | None |
| **Order Manager**| View | View | Full | View | None | None | None | None |

---

## 📊 Administrative Capabilities

The `/admin` suite is fully responsive and contains dedicated interfaces for each business division:

1. **Executive Dashboard**:
   - Live revenue metrics (Total, Today, This Month)
   - Order volume tracking (Total, Pending, Completed, Cancelled)
   - Real-time low-stock inventory alerts
   - SVG interactive charts: Sales revenue over time & Category distribution breakdown
   - Quick action shortcuts (Add Product, Write Article, View Orders, Add Category)
2. **Product Catalog**:
   - Complete CRUD operations, product duplication with SKU differentiation, and one-click archive
   - Multi-variant management (Shades, Volumes, Finishes) with individual SKUs, pricing, and stock levels
   - SEO metadata controls (Meta title, description, focus keywords)
3. **Taxonomy & Categories**:
   - 10 core cosmetics categories with nested subcategories
   - Drag-and-drop / ordering index control, image banners, and slug customization
4. **Inventory Management**:
   - Live SKU-level stock counters (Current, Reserved, Available)
   - Manual stock adjustment modal with audit logging (`InventoryTransaction`)
   - Automated stock decrement on order submission and restoration on cancellation
5. **Order Fulfillment**:
   - Real-time status pipeline (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`)
   - Tracking number assignment and internal staff notes
   - Customer shipping address inspection and order item invoice preview
6. **Customer Directory**:
   - Customer registry with lifetime order counts and total spend (LTV) calculation
   - Direct WhatsApp / Phone customer reachout links
7. **Marketing & Coupons**:
   - Promotional discount engine supporting percentage (`%`) and fixed amount (`Rs.`) codes
   - Min order requirements, max discount caps, expiry scheduling, and usage limits
   - Server-side coupon verification (`POST /api/coupons/validate`)
8. **Promotional Banners**:
   - Homepage promotional carousels and announcement strip scheduling
   - Target link URLs, CTA labels, and priority positioning
9. **Beauty Journal CMS (Blog)**:
   - Full article management with structured rich-text sections (headings, paragraphs, blockquotes, lists)
   - Category tags, estimated reading times, author credentials, and OpenGraph/SEO parameters
10. **Product Reviews Moderation**:
    - Customer review moderation queue with approve, reject, and delete controls
    - Prevents unverified or inappropriate content from appearing on product detail pages
11. **Customer Messages**:
    - Contact form submissions inbox with reply logging and status flags (`NEW`, `READ`, `REPLIED`, `CLOSED`)
12. **Newsletter Subscribers**:
    - Subscriber list management with one-click CSV export for external email marketing campaigns
13. **Store Settings**:
    - General brand identity, contact channels, and currency configuration
    - Free delivery threshold and standard delivery fees
    - Cash on Delivery (COD) and payment gateway toggle switches
14. **Staff Users & Roles**:
    - Creation and management of staff accounts with dynamic RBAC assignment

---

## 📡 REST API Reference

All administrative endpoints require `Authorization: Bearer <token>`.

### Authentication
- `POST /api/auth/login` — Authenticate admin staff and receive JWT
- `GET /api/auth/me` — Retrieve active admin profile and permissions
- `POST /api/auth/forgot-password` — Initiate password recovery
- `POST /api/auth/reset-password` — Complete password reset

### Products & Taxonomy
- `GET /api/products` — Query products with category, price, search, and pagination filters
- `GET /api/products/slug/:slug` — Retrieve single product details by URL slug
- `POST /api/products/admin/create` — Create a new cosmetic product (Admin)
- `PUT /api/products/admin/:id` — Update existing product (Admin)
- `DELETE /api/products/admin/:id` — Soft-delete or archive product (Admin)
- `POST /api/products/admin/:id/duplicate` — Duplicate product with unique SKU and slug (Admin)
- `GET /api/categories` — List all categories and nested subcategories
- `POST /api/categories/admin` — Create category (Admin)
- `PUT /api/categories/admin/:id` — Update category (Admin)
- `DELETE /api/categories/admin/:id` — Delete category (Admin)

### Inventory
- `GET /api/inventory/admin` — Retrieve stock overview and low-stock warnings (Admin)
- `POST /api/inventory/admin/adjust` — Submit manual stock adjustments with audit logging (Admin)

### Orders & Checkout
- `POST /api/orders` — Customer checkout endpoint (atomically verifies & deducts stock)
- `GET /api/orders/number/:orderNumber` — Retrieve order summary by public order number
- `GET /api/orders/admin` — List all orders with filters for status and search (Admin)
- `PATCH /api/orders/admin/:id/status` — Update order status (restores stock if `CANCELLED`) (Admin)

### Promotions & Coupons
- `POST /api/coupons/validate` — Validate coupon code against cart subtotal
- `GET /api/coupons/admin` — List all promotional coupons (Admin)
- `POST /api/coupons/admin` — Create coupon (Admin)
- `DELETE /api/coupons/admin/:id` — Remove coupon (Admin)

### Beauty Journal (Blog)
- `GET /api/blog` — List published articles with category and search filters
- `GET /api/blog/slug/:slug` — Retrieve single published article
- `GET /api/blog/categories` — List blog categories
- `GET /api/blog/admin/all` — List all articles including drafts and scheduled posts (Admin)
- `POST /api/blog/admin` — Create new article with rich sections (Admin)
- `PUT /api/blog/admin/:id` — Update article (Admin)
- `DELETE /api/blog/admin/:id` — Delete article (Admin)

### Reviews & User Feedback
- `GET /api/reviews/product/:productId` — Retrieve approved reviews for a product
- `POST /api/reviews/product/:productId` — Submit customer review (defaults to `PENDING`)
- `GET /api/reviews/admin` — List all reviews across the platform (Admin)
- `PATCH /api/reviews/admin/:id/status` — Approve or reject review (Admin)
- `DELETE /api/reviews/admin/:id` — Permanently delete review (Admin)

### Media Uploads
- `POST /api/upload/image` — Upload single WebP, JPEG, or PNG image (Max 5MB)
- `POST /api/upload/images` — Upload multiple images (Max 10 files)

### Dashboard Analytics
- `GET /api/analytics/dashboard` — Comprehensive business intelligence metrics and chart data (Admin)

---

## 🧪 Testing & Validation

The codebase includes an end-to-end integration test suite verifying critical business logic:

```bash
# Run automated Vitest test suite
npm run test

# Run TypeScript compilation check
npm run lint

# Build production bundle
npm run build
```

The test suite validates:
1. Super Admin authentication and invalid credential rejection
2. RBAC token authorization on protected endpoints
3. Category listing and taxonomy traversal
4. Product creation, retrieval, updates, and SKU-differentiating duplication
5. Server-side coupon verification and minimum threshold enforcement
6. Customer checkout with atomic inventory stock deduction and audit logging
7. Order cancellation with complete stock restoration and audit logging
8. Beauty Journal article authoring and retrieval
9. Executive dashboard KPI and chart payload generation

---

## 🚢 Production Deployment

### 1. Switching from SQLite to PostgreSQL

To deploy to PostgreSQL (Neon, Supabase, Railway, AWS RDS, Docker, etc.):

1. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In your production `.env` or cloud provider environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@your-postgres-host:5432/pretty_puff?schema=public&sslmode=require"
   ```
3. Run the migration command:
   ```bash
   node ./node_modules/prisma/build/index.js db push
   node ./node_modules/tsx/dist/cli.mjs server/seed.ts
   ```

### 2. Building and Running for Production

```bash
# 1. Build optimized client bundle
npm run build

# 2. Start the Express API server (serves static assets and API routes)
node ./node_modules/tsx/dist/cli.mjs server/index.ts
```

In production, you can use **PM2** or **Docker** to manage the Node.js process:
```bash
pm2 start "node ./node_modules/tsx/dist/cli.mjs server/index.ts" --name "pretty-puff-api"
```

---

## 📄 License & Ownership

Copyright © 2026 Pretty Puff Cosmetics. Developed with pride by Sameer Liaqat.
All rights reserved.
