# 🌸 Pretty Puff Luxury Cosmetics — Standard cPanel PHP Hosting Deployment Guide

This guide provides step-by-step instructions for deploying the migrated **PHP 8.2+ & MySQL** version of **Pretty Puff** onto standard **cPanel Shared Hosting** without requiring Node.js, npm, PM2, or Phusion Passenger.

---

## 1. Hosting Requirements & PHP Version

| Requirement | Value / Specification | Notes |
| :--- | :--- | :--- |
| **Hosting Type** | Standard cPanel Shared Hosting or VPS | Runs in normal `public_html/`. No Node.js / Passenger needed! |
| **PHP Version** | **PHP 8.2** or **PHP 8.3** (Recommended) | Standard on all modern cPanel hosts via **Select PHP Version** or **MultiPHP Manager**. |
| **Web Server** | **Apache** or **LiteSpeed** | Standard on cPanel with `mod_rewrite` enabled. |
| **Database** | **MySQL 5.7+** or **MariaDB 10.3+** | Provided natively by cPanel. |
| **Required PHP Extensions** | `pdo`, `pdo_mysql`, `json`, `fileinfo`, `mbstring`, `openssl` | Enabled by default on 99% of cPanel PHP installations. |

---

## 2. Step-by-Step Deployment Walkthrough

### STEP 1: Set PHP Version to 8.2+ in cPanel
1. In cPanel, navigate to **Software -> MultiPHP Manager** (or **Select PHP Version**).
2. Find your domain (`prettypuff.store`).
3. Select **PHP 8.2** or **PHP 8.3** from the dropdown.
4. Click **Apply**.

---

### STEP 2: Create MySQL Database & User in cPanel
1. In cPanel, go to **Databases -> MySQL® Databases**.
2. **Create Database**:
   - Enter name (e.g. `prettypuff`). Full name becomes `youruser_prettypuff`.
   - Click **Create Database**.
3. **Create Database User**:
   - Scroll down to "MySQL Users -> Add New User".
   - Username: e.g. `ppadmin` (full user becomes `youruser_ppadmin`).
   - Password: Use the **Password Generator** to create a strong password.
   - **Save this password safely.**
   - Click **Create User**.
4. **Add User to Database**:
   - Under "Add User to Database", select your user (`youruser_ppadmin`) and database (`youruser_prettypuff`).
   - Click **Add**.
   - Check the box **ALL PRIVILEGES**.
   - Click **Make Changes**.

### STEP 3: Import Safe Database Schema (phpMyAdmin)
1. In cPanel, go to **Databases -> phpMyAdmin**.
2. Select your production database (`muhamma1_prettypuff`) in the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select **`safe_schema.sql`** (or `database_schema.sql`).
   > [!TIP]
   > `safe_schema.sql` uses `CREATE TABLE IF NOT EXISTS`, guaranteeing that **any existing production tables, columns, or records are 100% preserved and never overwritten or dropped**.
5. Click **Import** (or **Go**) at the bottom.
6. All 31 tables (`Product`, `Category`, `Order`, `BlogPost`, `Admin`, etc.) will be verified/created with indexes and foreign keys.

---

### STEP 4: Upload Application Files to `public_html`
1. On your computer, obtain `prettypuff-php-cpanel.zip` (built via `npm run build:php`).
2. In cPanel, open **File Manager**.
3. Navigate to **`public_html`** (or your domain's document root).
4. Click **Upload** in the top toolbar and upload `prettypuff-php-cpanel.zip`.
5. Once uploaded, right-click `prettypuff-php-cpanel.zip` and click **Extract**.
6. Extract directly into `/public_html/`.

---

### STEP 5: Configure Production Database Outside `public_html` (Recommended)

To achieve maximum security, store your database credentials **outside `public_html`** where no web browser, HTTP request, or crawler can reach it.

#### Method 1: Private Config Directory (Highest Security — Recommended)
1. In cPanel File Manager, go to your account home directory: `/home/muhamma1/`.
2. Create a folder named **`private-config`**: `/home/muhamma1/private-config/`.
3. Create a file inside it named **`database.php`**: `/home/muhamma1/private-config/database.php`.
4. Set the contents as follows (the deployment zip includes this file in `private-config/database.php`):
   ```php
   <?php
   return [
       'host'     => 'localhost',
       'port'     => 3306,
       'database' => 'muhamma1_prettypuff',
       'username' => 'muhamma1_prettypuff',
       'password' => '<YOUR_CPANEL_DATABASE_PASSWORD>',
       'charset'  => 'utf8mb4',
   ];
   ```
5. Set file permissions on `/home/muhamma1/private-config/database.php` to **`600`** (read/write by owner only).
6. Pretty Puff automatically detects and loads `/home/muhamma1/private-config/database.php` on every database connection.

#### Method 2: External `.env` File
Alternatively, create `/home/muhamma1/.env` (in your home directory, outside `public_html`):
```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=muhamma1_prettypuff
DB_USER=muhamma1_prettypuff
DB_PASSWORD=<YOUR_CPANEL_DATABASE_PASSWORD>

APP_URL=https://prettypuff.store
JWT_SECRET=prettypuff_super_secure_jwt_secret_key_2026_luxury_cosmetics
ADMIN_EMAIL=sameerliaqat81@gmail.com
```

> [!NOTE]
> Even if placed inside `public_html/`, `.env` and `config/` are strictly blocked by `.htaccess` rules (`Require all denied` and `RewriteRule ^config/.*$ - [F,L]`). However, placing credentials in `/home/muhamma1/private-config/database.php` outside the web root provides complete defense-in-depth isolation.

---



### STEP 6: Seed Default Catalog & Super Admin Account
To populate your fresh database with the 32 luxury cosmetics products, 10 categories, editorial articles, banners, settings, and the default Super Admin account:

#### Method 1: Via Browser (Easiest)
Visit:
`https://prettypuff.store/seed.php?key=prettypuff_seed_2026`

You will see:
```text
🌸 Starting Pretty Puff PHP Database Seeder...
🌱 Seeding Roles...
🌱 Seeding Permissions...
🌱 Seeding Super Admin Account...
🌱 Seeding Categories and Subcategories...
🌱 Seeding 32 Luxury Cosmetics Products...
🌱 Seeding Editorial Blog Articles...
🌱 Seeding Homepage Promotional Banners...
🌱 Seeding Store, Shipping & Payment Settings...
✅ Pretty Puff PHP Database Seeding Completed Successfully!
```

#### Method 2: Via cPanel Terminal (SSH)
```bash
cd ~/public_html
php seed.php
```

*(Note: The seeder is idempotent and safe. You can remove `seed.php` and `seed_data.json` after seeding for extra security).*

---

### STEP 7: Folder Permissions
Standard cPanel file permissions:
- Folders: **`755`**
- Files: **`644`**
- The `uploads/` folder and subfolders (`products/`, `blog/`, `banners/`, `general/`) must be writable by the web server (`755` is default on cPanel suPHP / PHP-FPM).

---

### STEP 8: SSL / HTTPS Configuration
1. In cPanel, go to **Security -> SSL/TLS Status**.
2. Select `prettypuff.store` and click **Run AutoSSL**.
3. Under **Domains**, toggle **Force HTTPS Redirect** to **ON**.

---

## 3. Testing Your Live PHP Website

Verify the following URLs:

| View / Function | Test URL | Expected Result |
| :--- | :--- | :--- |
| **API Health Check** | `https://prettypuff.store/api/health` | Returns JSON: `{"status":"ok","engine":"PHP 8.2..."}` |
| **Storefront Homepage** | `https://prettypuff.store/` | Loads homepage with luxury hero, products, categories, cart |
| **Shop Catalog** | `https://prettypuff.store/shop` | Loads product catalog with filters and sorting |
| **Product Detail** | `https://prettypuff.store/product/radiant-glow-serum` | Loads full product details, variants, images, review form |
| **Direct Browser Refresh** | Press F5 on `https://prettypuff.store/shop` | Reloads seamlessly via `.htaccess` SPA fallback without 404 |
| **Customer Checkout** | Add item to cart -> Open checkout modal | Order processed with atomic stock deduction |
| **Admin Portal** | `https://prettypuff.store/admin` | Loads admin login interface |
| **Admin Login** | Log in with configured `ADMIN_EMAIL` & `ADMIN_PASSWORD` | Logs in and opens KPI analytics dashboard |
| **Dynamic Sitemap** | `https://prettypuff.store/sitemap.xml` | Outputs valid XML with all products, categories, blog posts |
| **Robots.txt** | `https://prettypuff.store/robots.txt` | Returns robots text file pointing to sitemap |

---

## 4. Troubleshooting Common cPanel Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **500 Internal Server Error** | Wrong DB credentials in `.env` or syntax error | Check credentials in `.env` or `config/database.php`. View cPanel **Metrics -> Errors**. |
| **404 on API endpoints** | Apache `mod_rewrite` not processing `.htaccess` | Ensure `.htaccess` exists in `public_html`. Verify `RewriteEngine On` is active. |
| **Authorization header missing on Admin Login** | Apache FastCGI stripping `Authorization` header | Handled automatically by `.htaccess` line: `RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]`. |
| **Image Uploads Fail** | Missing write permissions on `uploads/` | Set `uploads/` and subfolders permissions to `755` in cPanel File Manager. |
| **404 on Direct Page Refresh** | `.htaccess` missing SPA fallback | Ensure the line `RewriteRule ^ index.html [L]` exists at the bottom of `.htaccess`. |
