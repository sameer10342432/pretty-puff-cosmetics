# 🌸 Pretty Puff Luxury Cosmetics — Production cPanel Deployment Guide

This guide is designed for **non-developers**. Follow these exact steps to deploy the Pretty Puff PHP/MySQL website onto standard cPanel hosting for **`https://prettypuff.store`**.

No Node.js, npm, PM2, or command-line compilation is required on the server.

---

## 📋 12-Step Deployment Walkthrough

### STEP 1: Open cPanel
* Log into your hosting account cPanel dashboard (e.g. `https://prettypuff.store:2083` or your host login).

### STEP 2: Open File Manager
* Under the **Files** section in cPanel, click **File Manager**.

### STEP 3: Open `public_html/`
* In the left directory tree or main panel, double-click on **`public_html`** (your website's document root).
* Ensure you are inside `/public_html/`.

### STEP 4: Upload `Pretty-Puff-Production.zip`
* In the top toolbar, click **Upload**.
* Click **Select File** and choose **`Pretty-Puff-Production.zip`** from your computer.
* Wait for the progress bar to reach 100% (turns green).

### STEP 5: Extract the ZIP
* Go back to File Manager in `public_html/`.
* Right-click on **`Pretty-Puff-Production.zip`** and select **Extract**.
* Choose the destination as `/public_html/` and click **Extract File(s)**.
* Once extraction completes, click **Close**. You can now safely delete `Pretty-Puff-Production.zip` to save disk space.

### STEP 6: Verify `public_html/index.php` Exists
* Verify that the files were extracted directly into `public_html/`, not inside a subfolder.
* Check that **`public_html/index.php`** and **`public_html/.htaccess`** exist directly inside `public_html/`.

### STEP 7: Configure Database Credentials
Pretty Puff supports two ultra-secure options. **Option A is recommended**:

#### Option A: Outside `public_html` (Highest Security — Recommended)
1. In File Manager, navigate one level up to your account home directory: `/home/muhamma1/`.
2. Check if the folder **`private-config`** exists. If not, click **+ Folder** and create `private-config`.
3. Move or create **`database.php`** inside `/home/muhamma1/private-config/database.php` with:
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
4. Right-click `/home/muhamma1/private-config/database.php`, click **Change Permissions**, and set to **`600`** (read/write by owner only).

#### Option B: Inside `public_html`
* The application automatically includes `config/database.local.php` (strictly blocked from web browsers by `.htaccess`). You can verify your credentials match in `config/database.local.php`.

> [!IMPORTANT]
> **Existing Production Data Notice**: If your database `muhamma1_prettypuff` already contains tables and data, **do not re-import the schema**. Your existing data will be preserved automatically.
> If the database is completely empty, you can import `database/safe_schema.sql` via **cPanel -> phpMyAdmin -> Import**.

### STEP 8: Set the Required PHP Version
1. In cPanel, navigate to **Software -> MultiPHP Manager** (or **Select PHP Version**).
2. Find `prettypuff.store` in the domain list.
3. Select **PHP 8.2** or **PHP 8.3** from the dropdown menu.
4. Click **Apply**.

### STEP 9: Enable Required PHP Extensions
Under **Software -> Select PHP Version -> Extensions**, ensure the following extensions are checked/enabled:
* `pdo`
* `pdo_mysql`
* `json`
* `mbstring`
* `fileinfo`
* `openssl`
* `curl`

*(These are enabled by default on 99% of cPanel hosting providers).*

### STEP 10: Open Website
* Open your browser and navigate to:
  **`https://prettypuff.store`**
* Verify that the luxury storefront loads with banners, featured products, categories, and shopping cart.

### STEP 11: Test Sitemap & Robots
* Open: **`https://prettypuff.store/sitemap.xml`**  
  *Verify that valid XML displays containing storefront URLs, products, and categories.*
* Open: **`https://prettypuff.store/robots.txt`**  
  *Verify that the crawlers file displays referencing `sitemap.xml`.*

### STEP 12: Test Admin Panel
1. Open: **`https://prettypuff.store/admin`**
2. Log in using your Super Admin credentials:
   * **Email**: `sameerliaqat81@gmail.com`
   * **Password**: `o3!753NA~OQ@` *(or your existing password)*
3. Verify access to:
   * **Dashboard**: Analytics, sales statistics, order summaries.
   * **Products**: Product list, create new product, edit, inventory.
   * **Categories**: Category hierarchy.
   * **Orders**: Customer order fulfillment.
   * **Coupons**: Discount code management.
   * **Blog**: Editorial articles.
   * **Uploads**: Media library.
   * **Settings**: Store info, shipping fees, payment toggles.

---

## 🛠️ Troubleshooting Guide

### 1. 500 Internal Server Error
* **Cause A**: PHP version is older than 8.2.  
  *Solution*: Go to cPanel -> MultiPHP Manager and select PHP 8.2 or 8.3.
* **Cause B**: Syntax error in `.htaccess`.  
  *Solution*: Ensure the included `.htaccess` file was uploaded cleanly and mod_rewrite is enabled.
* **Cause C**: Check error log.  
  *Solution*: In File Manager, check `/public_html/error_log` for the exact line number.

### 2. 404 Not Found on Subpages (/shop, /admin, /product/...)
* **Cause**: `.htaccess` was not extracted or hidden files are not visible.  
  *Solution*: In cPanel File Manager, click **Settings** (top right) -> check **Show Hidden Files (dotfiles)** -> click **Save**. Ensure `.htaccess` exists in `public_html/`.

### 3. Database Connection Error
* **Symptoms**: Message *"Database connection could not be established"*.
* **Solution**:
  1. Confirm your database user `muhamma1_prettypuff` is assigned to `muhamma1_prettypuff` with **ALL PRIVILEGES** in **cPanel -> MySQL® Databases**.
  2. Verify the password inside `/home/muhamma1/private-config/database.php` matches the password created in cPanel.
  3. Ensure `DB_HOST` is set to `localhost`.

### 4. Permission Error (Forbidden / 403)
* **Cause**: File permissions too open or too restrictive.
* **Solution**:
  * All folders should have permissions **`755`** (`rwxr-xr-x`).
  * All PHP, HTML, CSS, JS files should have permissions **`644`** (`rw-r--r--`).
  * Private config (`/home/muhamma1/private-config/database.php`) should have permissions **`600`**.

### 5. Blank White Page
* **Cause**: A fatal PHP error with `display_errors` turned off.
* **Solution**: Inspect `/public_html/error_log` to view the error. Ensure `pdo_mysql` extension is enabled in cPanel.

### 6. Uploads Not Working / Cannot Save Images
* **Symptoms**: Error when uploading images in admin panel.
* **Solution**:
  1. In File Manager, ensure `public_html/uploads/` exists with folders `products/`, `blog/`, `banners/`, `general/`.
  2. Set permissions on `public_html/uploads/` and its subfolders to **`755`**.

### 7. CSS / JS Assets Not Loading (Broken Styling)
* **Cause**: Missing `assets/` directory or incorrect base URL.
* **Solution**:
  1. Ensure `public_html/assets/` exists and contains the compiled `.css` and `.js` files.
  2. Verify that your site is accessed via `https://prettypuff.store`.

### 8. Admin Login Fails / Token Expired
* **Cause**: `Authorization` header stripped by Apache FastCGI/PHP-FPM.
* **Solution**: Ensure `.htaccess` contains:
  ```apache
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
  ```
  *(This rule is already pre-configured in the included `.htaccess` file).*
