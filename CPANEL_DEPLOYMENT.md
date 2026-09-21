# 🌸 Pretty Puff Luxury Cosmetics — Complete cPanel Deployment Guide

This guide provides exhaustive, step-by-step instructions for deploying the Pretty Puff full-stack e-commerce store onto standard **cPanel Shared Hosting** using the **Setup Node.js App** feature.

---

## 1. Hosting Requirements & Prerequisites

| Requirement | Supported / Recommended | Notes |
| :--- | :--- | :--- |
| **Hosting Type** | cPanel Shared Hosting or Cloud/cPanel VPS | Must have **Setup Node.js App** (CloudLinux Passenger / Node.js Selector) enabled. |
| **Node.js Version** | **Node.js 18.x LTS** or **20.x LTS** | Supported out of the box. No experimental flags required. |
| **PHP Version** | **Not Required** | Pretty Puff is a 100% Node.js monolithic application. PHP is completely irrelevant. |
| **Database** | **MySQL 5.7+** or **MariaDB 10.3+** | Provided natively by all standard cPanel hosting providers. |
| **Disk Space** | ~250MB for app + dependencies | Clean deployment zip is only ~3MB (without node_modules). |
| **Memory** | 512MB+ recommended | Single process architecture runs comfortably within standard shared hosting limits. |

---

## 2. Step-by-Step Deployment Walkthrough

### STEP 1: Create the MySQL Database & User in cPanel

1. Log into your **cPanel Dashboard**.
2. Under the **Databases** section, click **MySQL® Databases**.
3. **Create New Database**:
   - In the "New Database" field, enter a name (e.g. `prettypuff`).
   - cPanel will automatically prefix this with your cPanel username (e.g. `yourcpaneluser_prettypuff`).
   - Click **Create Database**.
4. **Create New Database User**:
   - Scroll down to "MySQL Users -> Add New User".
   - Username: e.g. `ppadmin` (full user becomes `yourcpaneluser_ppadmin`).
   - Password: Use the **Password Generator** to create a strong, secure password.
   - **Save this password safely** for your `.env` configuration.
   - Click **Create User**.
5. **Associate User with Database**:
   - Under "Add User to Database", select your User (`yourcpaneluser_ppadmin`) and your Database (`yourcpaneluser_prettypuff`).
   - Click **Add**.
   - Check the box **ALL PRIVILEGES**.
   - Click **Make Changes**.

---

### STEP 2: Import Database Tables (Fast 1-Click Method)

Pretty Puff includes a pre-compiled `database_schema.sql` file that creates all 28 tables, indexes, and relationships in one click:

1. In cPanel, go to **phpMyAdmin** (under Databases).
2. Click on your newly created database (`yourcpaneluser_prettypuff`) in the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select `database_schema.sql` from your local computer (or extracted deployment folder).
5. Click **Import** (or **Go**) at the bottom.
6. All 28 tables (`Product`, `Category`, `Order`, `BlogPost`, `Admin`, etc.) will be created instantly!

---

### STEP 3: Upload and Extract Application Files

1. In cPanel, open **File Manager**.
2. Navigate to your user root (e.g. `/home/yourcpaneluser/`).
3. Click **+ Folder** and create a directory named `prettypuff` (or your preferred application folder).
4. Double-click to open `/home/yourcpaneluser/prettypuff/`.
5. Click **Upload** in the top toolbar.
6. Upload `dist/prettypuff-cpanel-deploy.zip`.
7. Once uploaded (progress bar turns green), return to File Manager.
8. Right-click `prettypuff-cpanel-deploy.zip` and click **Extract**.
9. Extract into `/home/yourcpaneluser/prettypuff/`.
10. Verify that the following files and folders are present:
    ```text
    /home/yourcpaneluser/prettypuff/
    ├── server.js               (cPanel Node.js Startup File)
    ├── seed.js                 (Production Database Seeder)
    ├── package.json
    ├── package-lock.json
    ├── database_schema.sql
    ├── dist/                   (Compiled frontend client)
    │   ├── index.html
    │   └── assets/
    ├── prisma/
    │   └── schema.prisma       (Configured for MySQL)
    ├── uploads/                (Local storage for products, blog, banners)
    │   ├── products/
    │   ├── blog/
    │   └── banners/
    └── .env.example
    ```

---

### STEP 4: Configure Node.js Application in cPanel

1. In cPanel, navigate to the **Software** section and click **Setup Node.js App** (or **Application Manager**).
2. Click **Create Application**.
3. Fill in the application details:
   - **Node.js version**: Select **18.x** or **20.x** (LTS).
   - **Application mode**: Select **Production**.
   - **Application root**: Enter `prettypuff` (this maps to `/home/yourcpaneluser/prettypuff`).
   - **Application URL**: Select your domain or subdomain (e.g. `prettypuff.pk` or `store.yourdomain.com`).
   - **Application startup file**: Enter `server.js` *(Crucial: must be `server.js`)*.
4. Click **Create** in the upper right corner.

---

### STEP 5: Add Environment Variables in cPanel

In the **Setup Node.js App** interface, scroll down to the **Environment variables** section and click **Add Variable** for each of the following:

| Variable Name | Recommended Value / Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | `production` |
| `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/DBNAME` | `mysql://youruser_ppadmin:SecretPass123@localhost:3306/youruser_prettypuff` |
| `APP_URL` | Your public domain with `https://` | `https://prettypuff.pk` |
| `AUTH_SECRET` | 64+ random characters for JWT security | `9c8b543f-50ae-490c-8886-d50433562b5d-secure-jwt-key` |
| `ADMIN_EMAIL` | Store owner administrative email | `sameerliaqat81@gmail.com` |
| `ADMIN_PASSWORD` | Strong password for admin login | `Admin@PrettyPuff2026` |
| `ADMIN_NAME` | Administrator full name | `Sameer Liaqat` |

*(Note: Alternatively, you can create a `.env` file directly inside `/home/yourcpaneluser/prettypuff/.env` using File Manager).*

---

### STEP 6: Install Production Dependencies

You have two simple options:

#### Option A: Via cPanel Button (Recommended)
1. Inside the **Setup Node.js App** interface for `prettypuff`, look for the button labeled **Run NPM Install**.
2. Click **Run NPM Install** and wait a moment.
3. cPanel will install all dependencies specified in `package.json`.

#### Option B: Via cPanel Terminal / SSH
1. Open **Terminal** in cPanel.
2. Enter the virtual environment indicated at the top of the Node.js App page (e.g. `source /home/yourcpaneluser/nodevenv/prettypuff/20/bin/activate && cd /home/yourcpaneluser/prettypuff`).
3. Run:
   ```bash
   npm install --production
   npx prisma generate
   ```

---

### STEP 7: Seed Demo Catalog & Admin (Optional)

If you want the database populated with the 32 luxury products, 10 categories, 15 beauty blog articles, banners, settings, and default admin account:

1. Open **Terminal** in cPanel.
2. Enter the virtual environment and run:
   ```bash
   node seed.js
   ```
3. You will see:
   ```text
   🌸 Starting Pretty Puff database seeding...
   🌱 Seeding Roles and Permissions...
   🌱 Seeding Super Admin Account...
   🌱 Seeding Categories and Subcategories...
   🌱 Seeding 32 Luxury Cosmetics Products...
   🌱 Seeding 15 Editorial Blog Articles...
   🌱 Seeding Homepage Promotional Banners...
   ✅ Pretty Puff database seeding completed successfully!
   ```

---

### STEP 8: Restart Application & Verify Live Store

1. In the **Setup Node.js App** page, click the **Restart** button.
2. Open your website in a browser:
   - **Storefront:** `https://yourdomain.com/`
   - **Health Check:** `https://yourdomain.com/api/health`
   - **Sitemap:** `https://yourdomain.com/sitemap.xml`
   - **Admin Suite:** `https://yourdomain.com/admin`
3. Log in to the Admin Dashboard using:
   - **Email:** `sameerliaqat81@gmail.com`
   - **Password:** `Admin@PrettyPuff2026` (or whatever you set in `ADMIN_PASSWORD`).

---

## 3. Upload Directories & File Permissions

The following directories must be writable by the Node.js process (standard cPanel permissions `755`):
- `/home/yourcpaneluser/prettypuff/uploads/`
- `/home/yourcpaneluser/prettypuff/uploads/products/`
- `/home/yourcpaneluser/prettypuff/uploads/blog/`
- `/home/yourcpaneluser/prettypuff/uploads/banners/`

Uploaded product and banner images are served directly at:
`https://yourdomain.com/uploads/products/image-name.webp`

---

## 4. SSL & HTTPS Configuration

1. In cPanel, navigate to **SSL/TLS Status**.
2. Select your domain and click **Run AutoSSL**.
3. Once the free Let's Encrypt / cPanel SSL certificate is installed, your site will securely serve over `https://`.
4. (Optional) In cPanel, under **Domains**, toggle **Force HTTPS Redirect** to ON.

---

## 5. Maintenance, Updates & Backup Workflow

### Future Code Updates
When you make changes to your codebase:
1. On your local machine, run:
   ```bash
   npm run build:deploy
   ```
2. In cPanel File Manager, upload `dist/prettypuff-cpanel-deploy.zip`.
3. Extract into your app directory (overwriting existing code files).
4. In cPanel Node.js App, click **Restart**.
*(Your uploaded product images in `uploads/` and your database data will remain completely safe and untouched!)*

### Routine Backups
- **Database Backup:** In cPanel, open **phpMyAdmin** -> Click database -> Click **Export** -> Click **Go**.
- **Images Backup:** In File Manager, right-click `/uploads/` and click **Compress** to download a backup of customer-uploaded media.

---

## 6. Troubleshooting Common cPanel Gotchas

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **503 Service Unavailable** | Node.js process did not start | Check `Startup File` is set to `server.js` (not `index.ts`). View errors in `stderr.log` in app directory. |
| **Database Connection Error** | Bad DB credentials or user privileges | Verify `DATABASE_URL` in environment variables. Ensure user was granted `ALL PRIVILEGES` in MySQL Databases. |
| **Uploads Fail (403 or 500)** | Missing `uploads/` directory | Create `/uploads/products`, `/uploads/blog`, `/uploads/banners` in File Manager with permission `755`. |
| **Port Conflict** | Hardcoded port | Pretty Puff automatically uses `process.env.PORT` provided by cPanel Passenger. Do not hardcode a port. |
