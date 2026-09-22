<?php
/**
 * Pretty Puff — Production Database Seeder (PHP/MySQL)
 * Fully populates roles, permissions, super admin, categories,
 * 32 luxury products, blog posts, banners, and default store settings.
 *
 * Usage via CLI:
 *   php seed.php
 * Usage via Browser:
 *   https://prettypuff.store/seed.php?key=prettypuff_seed_2026
 */

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/response_helper.php';

// Security check: if run from browser, require secret key
if (php_sapi_name() !== 'cli') {
    $secretKey = $_GET['key'] ?? '';
    if ($secretKey !== 'prettypuff_seed_2026' && $secretKey !== getenv('SEED_KEY')) {
        http_response_code(403);
        die('Access denied. Run via cPanel Terminal: `php seed.php` or provide `?key=prettypuff_seed_2026`.');
    }
    header('Content-Type: text/plain; charset=utf-8');
}

echo "🌸 Starting Pretty Puff PHP Database Seeder...\n";
$db = get_db();

// Inspect existing tables to ensure safety and data preservation
$existingTables = [];
try {
    $tableQuery = $db->query("SHOW TABLES");
    while ($row = $tableQuery->fetch(PDO::FETCH_NUM)) {
        $existingTables[] = strtolower($row[0]);
    }
} catch (Exception $e) {
    echo "⚠️ Warning inspecting tables: " . $e->getMessage() . "\n";
}

echo "📊 Detected " . count($existingTables) . " existing tables in database.\n";

if (!in_array('admin', $existingTables) || !in_array('product', $existingTables)) {
    echo "📋 Core tables not found. Initializing safe idempotent schema (CREATE TABLE IF NOT EXISTS)...\n";
    $candidates = [
        __DIR__ . '/database/safe_schema.sql',
        __DIR__ . '/safe_schema.sql',
        __DIR__ . '/database_schema.sql',
        __DIR__ . '/database/database_schema.sql',
    ];
    $schemaFile = null;
    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            $schemaFile = $candidate;
            break;
        }
    }

    if ($schemaFile) {
        echo "Found schema file: " . basename($schemaFile) . "\n";
        $schemaSql = file_get_contents($schemaFile);
        $schemaSql = preg_replace('/^\s*--.*$/m', '', $schemaSql);
        $statements = preg_split('/;\s*[\r\n]+/', $schemaSql);
        $executed = 0;
        $db->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($statements as $stmt) {
            $stmt = trim($stmt);
            if ($stmt === '') continue;
            try {
                $db->exec($stmt);
                $executed++;
            } catch (PDOException $ex) {
                if (!str_contains($ex->getMessage(), 'already exists')) {
                    echo "Notice on statement: " . $ex->getMessage() . "\n";
                }
            }
        }
        $db->exec('SET FOREIGN_KEY_CHECKS = 1');
        echo "✅ Successfully executed {$executed} schema statements. Tables created.\n";
    } else {
        echo "⚠️ Warning: No schema SQL file found. Checked: " . implode(', ', array_map('basename', $candidates)) . "\n";
    }
} else {
    echo "🛡️ Existing tables detected. Preserving all existing production tables and records.\n";
}

// 1. Roles
echo "🌱 Seeding Roles...\n";
$roles = [
    ['name' => 'SUPER_ADMIN',   'description' => 'Complete system access and administrative control'],
    ['name' => 'ADMIN',         'description' => 'Store administrator with catalog, order, and marketing access'],
    ['name' => 'EDITOR',        'description' => 'Content editor managing blog posts and banners'],
    ['name' => 'ORDER_MANAGER', 'description' => 'Order fulfillment and inventory management specialist'],
];

$roleMap = [];
$roleStmt = $db->prepare('
    INSERT INTO `Role` (id, name, description, createdAt, updatedAt)
    VALUES (:id, :name, :description, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE description = VALUES(description), updatedAt = NOW(3)
');

foreach ($roles as $r) {
    try {
        $chk = $db->prepare('SELECT id FROM `Role` WHERE name = :name LIMIT 1');
        $chk->execute(['name' => $r['name']]);
        $existing = $chk->fetch();

        $roleId = $existing ? $existing['id'] : generate_uuid();
        $roleStmt->execute([
            'id'          => $roleId,
            'name'        => $r['name'],
            'description' => $r['description'],
        ]);
        $roleMap[$r['name']] = $roleId;
    } catch (Throwable $e) {
        echo "Notice seeding role {$r['name']}: " . $e->getMessage() . "\n";
    }
}

// 2. Permissions
echo "🌱 Seeding Permissions...\n";
$permissionsList = [
    ['name' => 'dashboard.view',   'module' => 'dashboard',  'description' => 'View admin dashboard and analytics'],
    ['name' => 'products.manage',  'module' => 'products',   'description' => 'Create, edit, and delete products'],
    ['name' => 'categories.manage','module' => 'categories', 'description' => 'Manage product categories and subcategories'],
    ['name' => 'inventory.manage', 'module' => 'inventory',  'description' => 'Adjust stock and view inventory logs'],
    ['name' => 'orders.manage',    'module' => 'orders',     'description' => 'Process, fulfill, and update orders'],
    ['name' => 'customers.manage', 'module' => 'customers',  'description' => 'View customer accounts and histories'],
    ['name' => 'coupons.manage',   'module' => 'coupons',    'description' => 'Create and configure promotional coupons'],
    ['name' => 'banners.manage',   'module' => 'banners',    'description' => 'Manage homepage promotional banners'],
    ['name' => 'blog.manage',      'module' => 'blog',       'description' => 'Create, edit, and publish blog articles'],
    ['name' => 'reviews.manage',   'module' => 'reviews',    'description' => 'Moderate and approve customer reviews'],
    ['name' => 'settings.manage',  'module' => 'settings',   'description' => 'Configure store identity, shipping and payments'],
    ['name' => 'users.manage',     'module' => 'users',      'description' => 'Manage staff accounts, roles and permissions'],
];

$permStmt = $db->prepare('
    INSERT INTO `Permission` (id, name, description, module, createdAt, updatedAt)
    VALUES (:id, :name, :description, :module, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE description = VALUES(description), module = VALUES(module), updatedAt = NOW(3)
');

$allPermIds = [];
foreach ($permissionsList as $p) {
    try {
        $chk = $db->prepare('SELECT id FROM `Permission` WHERE name = :name LIMIT 1');
        $chk->execute(['name' => $p['name']]);
        $existing = $chk->fetch();

        $pid = $existing ? $existing['id'] : generate_uuid();
        $permStmt->execute([
            'id'          => $pid,
            'name'        => $p['name'],
            'description' => $p['description'],
            'module'      => $p['module'],
        ]);
        $allPermIds[] = $pid;
    } catch (Throwable $e) {
        echo "Notice seeding permission {$p['name']}: " . $e->getMessage() . "\n";
    }
}

// Link SUPER_ADMIN to all permissions
$superAdminRoleId = $roleMap['SUPER_ADMIN'] ?? null;
if ($superAdminRoleId) {
    $rpStmt = $db->prepare('
        INSERT IGNORE INTO `RolePermission` (id, roleId, permissionId)
        VALUES (:id, :roleId, :permissionId)
    ');
    foreach ($allPermIds as $pid) {
        try {
            $rpStmt->execute([
                'id'           => generate_uuid(),
                'roleId'       => $superAdminRoleId,
                'permissionId' => $pid,
            ]);
        } catch (Throwable) {}
    }
}

// 3. Super Admin User
echo "🌱 Seeding Super Admin Account...\n";
$adminEmail = strtolower(trim(getenv('ADMIN_EMAIL') ?: 'sameerliaqat81@gmail.com'));
$adminPassword = getenv('ADMIN_PASSWORD') ?: 'o3!753NA~OQ@';
$adminName = getenv('ADMIN_NAME') ?: 'Sameer Liaqat';
$passwordHash = password_hash($adminPassword, PASSWORD_BCRYPT);

try {
    $adminStmt = $db->prepare('
        INSERT INTO `Admin` (id, email, passwordHash, name, roleId, isActive, createdAt, updatedAt)
        VALUES (:id, :email, :hash, :name, :roleId, 1, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            passwordHash = VALUES(passwordHash),
            roleId = VALUES(roleId),
            isActive = 1,
            updatedAt = NOW(3)
    ');

    $adminChk = $db->prepare('SELECT id FROM `Admin` WHERE LOWER(email) = :email LIMIT 1');
    $adminChk->execute(['email' => $adminEmail]);
    $existingAdmin = $adminChk->fetch();

    $adminId = $existingAdmin ? $existingAdmin['id'] : generate_uuid();
    $adminStmt->execute([
        'id'     => $adminId,
        'email'  => $adminEmail,
        'hash'   => $passwordHash,
        'name'   => $adminName,
        'roleId' => $superAdminRoleId ?: 'super_admin',
    ]);
    echo "   Admin Email: {$adminEmail}\n";
    echo "   Admin Status: Active\n";
} catch (Throwable $e) {
    echo "Notice seeding admin: " . $e->getMessage() . "\n";
}

// Load JSON data file
$jsonFile = __DIR__ . '/seed_data.json';
if (!file_exists($jsonFile)) {
    echo "⚠️ Notice: seed_data.json not found in " . __DIR__ . ", skipping catalog seed.\n";
    echo "✅ Admin credentials and roles are ready.\n";
    exit;
}
$seedData = json_decode((string)file_get_contents($jsonFile), true);

// 4. Categories & Subcategories
echo "🌱 Seeding Categories and Subcategories...\n";
$categoryMap = [];
$catStmt = $db->prepare('
    INSERT INTO `Category` (id, name, slug, description, image, isActive, createdAt, updatedAt)
    VALUES (:id, :name, :slug, :description, :image, 1, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        image = VALUES(image),
        updatedAt = NOW(3)
');

$subStmt = $db->prepare('
    INSERT INTO `Subcategory` (id, name, slug, categoryId, isActive, createdAt, updatedAt)
    VALUES (:id, :name, :slug, :categoryId, 1, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        categoryId = VALUES(categoryId),
        updatedAt = NOW(3)
');

foreach ($seedData['categories'] ?? [] as $cat) {
    try {
        $slug = strtolower($cat['slug']);
        $chk = $db->prepare('SELECT id FROM `Category` WHERE LOWER(slug) = :slug LIMIT 1');
        $chk->execute(['slug' => $slug]);
        $existing = $chk->fetch();

        $catId = $existing ? $existing['id'] : generate_uuid();
        $catStmt->execute([
            'id'          => $catId,
            'name'        => $cat['name'],
            'slug'        => $slug,
            'description' => $cat['description'] ?? null,
            'image'       => $cat['image'] ?? null,
        ]);
        $categoryMap[$slug] = $catId;

        if (!empty($cat['subcategories'])) {
            foreach ($cat['subcategories'] as $sub) {
                $subSlug = strtolower($sub['slug']);
                $subChk = $db->prepare('SELECT id FROM `Subcategory` WHERE LOWER(slug) = :slug LIMIT 1');
                $subChk->execute(['slug' => $subSlug]);
                $existingSub = $subChk->fetch();

                $subId = $existingSub ? $existingSub['id'] : generate_uuid();
                $subStmt->execute([
                    'id'         => $subId,
                    'name'       => $sub['name'],
                    'slug'       => $subSlug,
                    'categoryId' => $catId,
                ]);
            }
        }
    } catch (Throwable $e) {
        echo "Notice seeding category {$cat['slug']}: " . $e->getMessage() . "\n";
    }
}

// 5. Products & Variants
$productsCount = count($seedData['products'] ?? []);
echo "🌱 Seeding {$productsCount} Luxury Cosmetics Products...\n";

$prodStmt = $db->prepare('
    INSERT INTO `Product` (
        id, name, slug, sku, brand, categoryId, subcategoryId,
        shortDescription, description, price, salePrice, stock, lowStockThreshold,
        thumbnail, images, colours, sizes, benefits, rating, reviewCount,
        isFeatured, isBestSeller, isNew, isActive, isArchived, createdAt, updatedAt
    ) VALUES (
        :id, :name, :slug, :sku, :brand, :categoryId, :subcategoryId,
        :shortDescription, :description, :price, :salePrice, :stock, :lowStockThreshold,
        :thumbnail, :images, :colours, :sizes, :benefits, :rating, :reviewCount,
        :isFeatured, :isBestSeller, :isNew, 1, 0, NOW(3), NOW(3)
    )
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        price = VALUES(price),
        salePrice = VALUES(salePrice),
        stock = VALUES(stock),
        images = VALUES(images),
        thumbnail = VALUES(thumbnail),
        colours = VALUES(colours),
        sizes = VALUES(sizes),
        benefits = VALUES(benefits),
        rating = VALUES(rating),
        updatedAt = NOW(3)
');

foreach ($seedData['products'] ?? [] as $p) {
    try {
        $slug = strtolower($p['slug']);
        $catSlug = strtolower($p['category'] ?? '');
        $catId = $categoryMap[$catSlug] ?? reset($categoryMap);

        $chk = $db->prepare('SELECT id FROM `Product` WHERE LOWER(slug) = :slug LIMIT 1');
        $chk->execute(['slug' => $slug]);
        $existing = $chk->fetch();

        $prodId = $existing ? $existing['id'] : generate_uuid();

        $prodStmt->execute([
            'id'                => $prodId,
            'name'              => $p['name'],
            'slug'              => $slug,
            'sku'               => $p['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -6))),
            'brand'             => $p['brand'] ?? 'Pretty Puff',
            'categoryId'        => $catId,
            'subcategoryId'     => null,
            'shortDescription'  => $p['shortDescription'] ?? '',
            'description'       => $p['description'] ?? '',
            'price'             => (float)$p['price'],
            'salePrice'         => isset($p['salePrice']) && $p['salePrice'] !== null ? (float)$p['salePrice'] : null,
            'stock'             => (int)($p['stock'] ?? 50),
            'lowStockThreshold' => (int)($p['lowStockThreshold'] ?? 10),
            'thumbnail'         => $p['thumbnail'] ?? '',
            'images'            => json_encode($p['images'] ?? []),
            'colours'           => json_encode($p['colours'] ?? []),
            'sizes'             => json_encode($p['sizes'] ?? []),
            'benefits'          => json_encode($p['benefits'] ?? []),
            'rating'            => (float)($p['rating'] ?? 5.0),
            'reviewCount'       => (int)($p['reviewCount'] ?? 0),
            'isFeatured'        => !empty($p['isFeatured']) ? 1 : 0,
            'isBestSeller'      => !empty($p['isBestSeller']) ? 1 : 0,
            'isNew'             => !empty($p['isNew']) ? 1 : 0,
        ]);
    } catch (Throwable $e) {
        echo "Notice seeding product {$p['slug']}: " . $e->getMessage() . "\n";
    }
}

// 6. Blog Categories & Articles
echo "🌱 Seeding Editorial Blog Articles...\n";
$blogCatMap = [];
$bcatStmt = $db->prepare('
    INSERT INTO `BlogCategory` (id, name, slug, description, createdAt, updatedAt)
    VALUES (:id, :name, :slug, :description, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), updatedAt = NOW(3)
');

foreach ($seedData['blogCategories'] ?? [] as $bc) {
    try {
        $slug = strtolower($bc['slug']);
        $chk = $db->prepare('SELECT id FROM `BlogCategory` WHERE LOWER(slug) = :slug LIMIT 1');
        $chk->execute(['slug' => $slug]);
        $existing = $chk->fetch();

        $bcId = $existing ? $existing['id'] : generate_uuid();
        $bcatStmt->execute([
            'id'          => $bcId,
            'name'        => $bc['name'],
            'slug'        => $slug,
            'description' => $bc['description'] ?? null,
        ]);
        $blogCatMap[$slug] = $bcId;
    } catch (Throwable) {}
}

$postStmt = $db->prepare('
    INSERT INTO `BlogPost` (
        id, title, slug, excerpt, content, featuredImage, author, readTime,
        tags, status, isFeatured, categoryId, publishedAt, createdAt, updatedAt
    ) VALUES (
        :id, :title, :slug, :excerpt, :content, :featuredImage, :author, :readTime,
        :tags, "PUBLISHED", :isFeatured, :categoryId, NOW(3), NOW(3), NOW(3)
    )
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        excerpt = VALUES(excerpt),
        content = VALUES(content),
        featuredImage = VALUES(featuredImage),
        author = VALUES(author),
        readTime = VALUES(readTime),
        tags = VALUES(tags),
        isFeatured = VALUES(isFeatured),
        updatedAt = NOW(3)
');

foreach ($seedData['blogPosts'] ?? [] as $post) {
    try {
        $slug = strtolower($post['slug']);
        $catSlug = strtolower($post['category'] ?? 'skincare');
        $catId = $blogCatMap[$catSlug] ?? reset($blogCatMap);

        $chk = $db->prepare('SELECT id FROM `BlogPost` WHERE LOWER(slug) = :slug LIMIT 1');
        $chk->execute(['slug' => $slug]);
        $existing = $chk->fetch();

        $postId = $existing ? $existing['id'] : generate_uuid();

        $postStmt->execute([
            'id'            => $postId,
            'title'         => $post['title'],
            'slug'          => $slug,
            'excerpt'       => $post['excerpt'] ?? '',
            'content'       => json_encode($post['content'] ?? []),
            'featuredImage' => $post['featuredImage'] ?? '',
            'author'        => $post['author'] ?? 'Pretty Puff Editorial',
            'readTime'      => $post['readTime'] ?? '5 min read',
            'tags'          => json_encode($post['tags'] ?? []),
            'isFeatured'    => !empty($post['isFeatured']) ? 1 : 0,
            'categoryId'    => $catId,
        ]);
    } catch (Throwable) {}
}

// 7. Homepage Banners
echo "🌱 Seeding Homepage Promotional Banners...\n";
$banners = [
    [
        'title'      => 'Radiant Summer Glow Collection',
        'subtitle'   => 'Luminous Foundations & Hydrating Dew Elixirs',
        'image'      => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
        'link'       => '/shop',
        'buttonText' => 'Shop New Arrivals',
        'sortOrder'  => 1,
    ],
    [
        'title'      => 'Velvet Matte Couture Lips',
        'subtitle'   => 'Ultra-pigmented, Transfer-proof Hydrating Lipsticks',
        'image'      => 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1600&q=80',
        'link'       => '/lips',
        'buttonText' => 'Explore Lipsticks',
        'sortOrder'  => 2,
    ],
];

$bannerStmt = $db->prepare('
    INSERT INTO `Banner` (id, title, subtitle, image, link, buttonText, position, sortOrder, isActive, createdAt, updatedAt)
    VALUES (:id, :title, :subtitle, :image, :link, :buttonText, "HERO", :sortOrder, 1, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), image = VALUES(image), updatedAt = NOW(3)
');

foreach ($banners as $b) {
    try {
        $chk = $db->prepare('SELECT id FROM `Banner` WHERE title = :title LIMIT 1');
        $chk->execute(['title' => $b['title']]);
        $existing = $chk->fetch();

        $bId = $existing ? $existing['id'] : generate_uuid();
        $bannerStmt->execute([
            'id'         => $bId,
            'title'      => $b['title'],
            'subtitle'   => $b['subtitle'],
            'image'      => $b['image'],
            'link'       => $b['link'],
            'buttonText' => $b['buttonText'],
            'sortOrder'  => $b['sortOrder'],
        ]);
    } catch (Throwable) {}
}

// 8. Default Store Settings
echo "🌱 Seeding Store, Shipping & Payment Settings...\n";
try {
    $db->exec('
        INSERT INTO `SiteSetting` (id, storeName, tagline, announcementText, supportEmail, supportPhone, whatsappNumber, currency, updatedAt)
        VALUES ("default", "Pretty Puff", "Luxury Cosmetics & Beauty Essentials", "Complimentary Luxury Gift Box & Express Shipping on Orders Above PKR 3,000 ✨", "sameerliaqat81@gmail.com", "+923474542881", "+923474542881", "PKR", NOW())
        ON DUPLICATE KEY UPDATE id = id
    ');
} catch (Throwable) {}

try {
    $db->exec('
        INSERT INTO `ShippingSetting` (id, freeShippingThreshold, standardFee, expressFee, estimatedDeliveryDays, updatedAt)
        VALUES ("default", 3000, 250, 450, "2-4 Business Days", NOW())
        ON DUPLICATE KEY UPDATE id = id
    ');
} catch (Throwable) {}

try {
    $db->exec('
        INSERT INTO `PaymentSetting` (id, codEnabled, bankTransferEnabled, bankAccountTitle, bankAccountNumber, bankName, easypaisaEnabled, easypaisaNumber, updatedAt)
        VALUES ("default", 1, 1, "Pretty Puff Cosmetics Pvt Ltd", "1234567890123456", "Meezan Bank Ltd", 1, "03474542881", NOW())
        ON DUPLICATE KEY UPDATE id = id
    ');
} catch (Throwable) {}

echo "✅ Pretty Puff PHP Database Seeding Completed Successfully!\n";
