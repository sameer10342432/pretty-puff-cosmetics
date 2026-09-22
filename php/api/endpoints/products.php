<?php
/**
 * Pretty Puff — Products API Endpoints
 * Converted from server/routes/products.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';
$third = $routeSegments[2] ?? '';

// Helper to format product DB row into API response object
function format_product(array $p): array {
    $images = !empty($p['images']) ? json_decode((string)$p['images'], true) : [];
    $colours = !empty($p['colours']) ? json_decode((string)$p['colours'], true) : [];
    $sizes = !empty($p['sizes']) ? json_decode((string)$p['sizes'], true) : [];
    $benefits = !empty($p['benefits']) ? json_decode((string)$p['benefits'], true) : [];

    return [
        'id'               => $p['id'],
        'name'             => $p['name'],
        'slug'             => $p['slug'],
        'sku'              => $p['sku'] ?? '',
        'brand'            => $p['brand'] ?? '',
        'categoryId'       => $p['categoryId'],
        'subcategoryId'    => $p['subcategoryId'] ?? null,
        'category'         => $p['categoryName'] ?? ($p['category'] ?? ''),
        'categorySlug'     => $p['categorySlug'] ?? '',
        'subcategory'      => $p['subcategoryName'] ?? ($p['subcategory'] ?? ''),
        'subcategorySlug'  => $p['subcategorySlug'] ?? '',
        'shortDescription' => $p['shortDescription'] ?? '',
        'description'      => $p['description'] ?? '',
        'price'            => (float)$p['price'],
        'salePrice'        => isset($p['salePrice']) && $p['salePrice'] !== null ? (float)$p['salePrice'] : null,
        'stock'            => (int)$p['stock'],
        'lowStockThreshold'=> (int)($p['lowStockThreshold'] ?? 5),
        'thumbnail'        => $p['thumbnail'] ?? '',
        'images'           => is_array($images) ? $images : [],
        'colours'          => is_array($colours) ? $colours : [],
        'sizes'            => is_array($sizes) ? $sizes : [],
        'benefits'         => is_array($benefits) ? $benefits : [],
        'rating'           => (float)($p['rating'] ?? 5.0),
        'reviewCount'      => (int)($p['reviewCount'] ?? 0),
        'isFeatured'       => (bool)($p['isFeatured'] ?? false),
        'isBestSeller'     => (bool)($p['isBestSeller'] ?? false),
        'isNew'            => (bool)($p['isNew'] ?? false),
        'isActive'         => (bool)($p['isActive'] ?? true),
        'isArchived'       => (bool)($p['isArchived'] ?? false),
        'variants'         => $p['variants'] ?? [],
        'createdAt'        => $p['createdAt'] ?? '',
        'updatedAt'        => $p['updatedAt'] ?? '',
    ];
}

// -------------------------------------------------------------
// 1. ADMIN ENDPOINTS
// -------------------------------------------------------------

// GET /api/products/admin/all
if ($method === 'GET' && $first === 'admin' && $second === 'all') {
    Auth::requirePermission('products.manage');

    $stmt = $db->query('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE p.isArchived = 0
        ORDER BY p.createdAt DESC
    ');
    $rows = $stmt->fetchAll();

    $products = array_map('format_product', $rows);
    json_success($products);
}

// POST /api/products/admin/create
if ($method === 'POST' && $first === 'admin' && $second === 'create') {
    Auth::requirePermission('products.manage');
    $input = get_json_input();

    if (empty($input['name']) || empty($input['price'])) {
        json_error('Product name and price are required.', 400);
    }

    $id = generate_uuid();
    $name = trim((string)$input['name']);
    $slug = !empty($input['slug']) ? strtolower(trim((string)$input['slug'])) : strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
    $sku = !empty($input['sku']) ? trim((string)$input['sku']) : 'SKU-' . strtoupper(substr(uniqid(), -6));
    $categoryId = (string)($input['categoryId'] ?? '');
    $subcategoryId = !empty($input['subcategoryId']) ? (string)$input['subcategoryId'] : null;

    // Verify category exists
    if ($categoryId) {
        $catCheck = $db->prepare('SELECT id FROM `Category` WHERE id = :id LIMIT 1');
        $catCheck->execute(['id' => $categoryId]);
        if (!$catCheck->fetch()) {
            $catFallback = $db->query('SELECT id FROM `Category` LIMIT 1')->fetch();
            $categoryId = $catFallback['id'] ?? $categoryId;
        }
    }

    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare('
        INSERT INTO `Product` (
            id, name, slug, sku, brand, categoryId, subcategoryId,
            shortDescription, description, price, salePrice, stock, lowStockThreshold,
            thumbnail, images, colours, sizes, benefits, rating, reviewCount,
            isFeatured, isBestSeller, isNew, isActive, isArchived, createdAt, updatedAt
        ) VALUES (
            :id, :name, :slug, :sku, :brand, :categoryId, :subcategoryId,
            :shortDescription, :description, :price, :salePrice, :stock, :lowStockThreshold,
            :thumbnail, :images, :colours, :sizes, :benefits, :rating, :reviewCount,
            :isFeatured, :isBestSeller, :isNew, :isActive, :isArchived, :createdAt, :updatedAt
        )
    ');

    $images = isset($input['images']) && is_array($input['images']) ? json_encode($input['images']) : '[]';
    $colours = isset($input['colours']) && is_array($input['colours']) ? json_encode($input['colours']) : '[]';
    $sizes = isset($input['sizes']) && is_array($input['sizes']) ? json_encode($input['sizes']) : '[]';
    $benefits = isset($input['benefits']) && is_array($input['benefits']) ? json_encode($input['benefits']) : '[]';

    $stmt->execute([
        'id'                => $id,
        'name'              => $name,
        'slug'              => $slug,
        'sku'               => $sku,
        'brand'             => $input['brand'] ?? 'Pretty Puff',
        'categoryId'        => $categoryId,
        'subcategoryId'     => $subcategoryId,
        'shortDescription'  => $input['shortDescription'] ?? '',
        'description'       => $input['description'] ?? '',
        'price'             => (float)$input['price'],
        'salePrice'         => isset($input['salePrice']) && $input['salePrice'] !== '' ? (float)$input['salePrice'] : null,
        'stock'             => (int)($input['stock'] ?? 0),
        'lowStockThreshold' => (int)($input['lowStockThreshold'] ?? 5),
        'thumbnail'         => $input['thumbnail'] ?? '',
        'images'            => $images,
        'colours'           => $colours,
        'sizes'             => $sizes,
        'benefits'          => $benefits,
        'rating'            => (float)($input['rating'] ?? 5.0),
        'reviewCount'       => (int)($input['reviewCount'] ?? 0),
        'isFeatured'        => !empty($input['isFeatured']) ? 1 : 0,
        'isBestSeller'      => !empty($input['isBestSeller']) ? 1 : 0,
        'isNew'             => !empty($input['isNew']) ? 1 : 0,
        'isActive'          => isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : 1,
        'isArchived'        => 0,
        'createdAt'         => $now,
        'updatedAt'         => $now,
    ]);

    // Handle product variants if provided
    if (!empty($input['variants']) && is_array($input['variants'])) {
        $vStmt = $db->prepare('
            INSERT INTO `ProductVariant` (id, productId, name, sku, price, stock, shadeColour, createdAt, updatedAt)
            VALUES (:id, :productId, :name, :sku, :price, :stock, :shadeColour, :createdAt, :updatedAt)
        ');
        foreach ($input['variants'] as $v) {
            $vStmt->execute([
                'id'          => generate_uuid(),
                'productId'   => $id,
                'name'        => $v['name'] ?? 'Default',
                'sku'         => $v['sku'] ?? $sku . '-V',
                'price'       => isset($v['price']) ? (float)$v['price'] : null,
                'stock'       => (int)($v['stock'] ?? 0),
                'shadeColour' => $v['shadeColour'] ?? null,
                'createdAt'   => $now,
                'updatedAt'   => $now,
            ]);
        }
    }

    json_success(['id' => $id, 'name' => $name, 'slug' => $slug], 'Product created successfully.', [], 201);
}

// POST /api/products/admin/:id/duplicate
if ($method === 'POST' && $first === 'admin' && !empty($second) && $third === 'duplicate') {
    Auth::requirePermission('products.manage');
    $prodId = $second;

    $stmt = $db->prepare('SELECT * FROM `Product` WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $prodId]);
    $prod = $stmt->fetch();

    if (!$prod) {
        json_error('Original product not found.', 404);
    }

    $newId = generate_uuid();
    $now = date('Y-m-d H:i:s');
    $newName = $prod['name'] . ' (Copy)';
    $newSlug = $prod['slug'] . '-copy-' . time();
    $newSku = ($prod['sku'] ? $prod['sku'] . '-COPY' : 'SKU-' . strtoupper(substr(uniqid(), -6)));

    $ins = $db->prepare('
        INSERT INTO `Product` (
            id, name, slug, sku, brand, categoryId, subcategoryId,
            shortDescription, description, price, salePrice, stock, lowStockThreshold,
            thumbnail, images, colours, sizes, benefits, rating, reviewCount,
            isFeatured, isBestSeller, isNew, isActive, isArchived, createdAt, updatedAt
        ) VALUES (
            :id, :name, :slug, :sku, :brand, :categoryId, :subcategoryId,
            :shortDescription, :description, :price, :salePrice, :stock, :lowStockThreshold,
            :thumbnail, :images, :colours, :sizes, :benefits, :rating, :reviewCount,
            :isFeatured, :isBestSeller, :isNew, :isActive, :isArchived, :createdAt, :updatedAt
        )
    ');

    $ins->execute([
        'id'                => $newId,
        'name'              => $newName,
        'slug'              => $newSlug,
        'sku'               => $newSku,
        'brand'             => $prod['brand'],
        'categoryId'        => $prod['categoryId'],
        'subcategoryId'     => $prod['subcategoryId'],
        'shortDescription'  => $prod['shortDescription'],
        'description'       => $prod['description'],
        'price'             => $prod['price'],
        'salePrice'         => $prod['salePrice'],
        'stock'             => $prod['stock'],
        'lowStockThreshold' => $prod['lowStockThreshold'],
        'thumbnail'         => $prod['thumbnail'],
        'images'            => $prod['images'],
        'colours'           => $prod['colours'],
        'sizes'             => $prod['sizes'],
        'benefits'          => $prod['benefits'],
        'rating'            => $prod['rating'],
        'reviewCount'       => $prod['reviewCount'],
        'isFeatured'        => $prod['isFeatured'],
        'isBestSeller'      => $prod['isBestSeller'],
        'isNew'             => $prod['isNew'],
        'isActive'          => $prod['isActive'],
        'isArchived'        => 0,
        'createdAt'         => $now,
        'updatedAt'         => $now,
    ]);

    json_success(['id' => $newId, 'name' => $newName, 'slug' => $newSlug], 'Product duplicated successfully.');
}

// PUT /api/products/admin/:id
if ($method === 'PUT' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('products.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'updatedAt' => date('Y-m-d H:i:s')];

    $allowed = [
        'name', 'slug', 'sku', 'brand', 'categoryId', 'subcategoryId',
        'shortDescription', 'description', 'price', 'salePrice', 'stock',
        'lowStockThreshold', 'thumbnail', 'isFeatured', 'isBestSeller', 'isNew', 'isActive'
    ];

    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            $val = $input[$key];
            if (in_array($key, ['isFeatured', 'isBestSeller', 'isNew', 'isActive'], true)) {
                $val = !empty($val) ? 1 : 0;
            } elseif ($key === 'price' || $key === 'salePrice') {
                $val = $val !== null && $val !== '' ? (float)$val : null;
            } elseif ($key === 'stock' || $key === 'lowStockThreshold') {
                $val = (int)$val;
            }
            $fields[] = "`$key` = :$key";
            $params[$key] = $val;
        }
    }

    foreach (['images', 'colours', 'sizes', 'benefits'] as $jsonField) {
        if (isset($input[$jsonField])) {
            $fields[] = "`$jsonField` = :$jsonField";
            $params[$jsonField] = is_array($input[$jsonField]) ? json_encode($input[$jsonField]) : $input[$jsonField];
        }
    }

    if (empty($fields)) {
        json_success(null, 'No changes made.');
    }

    $sql = 'UPDATE `Product` SET ' . implode(', ', $fields) . ', `updatedAt` = :updatedAt WHERE `id` = :id';
    $db->prepare($sql)->execute($params);

    json_success(['id' => $id], 'Product updated successfully.');
}

// DELETE /api/products/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('products.manage');
    $id = $second;

    $db->prepare('DELETE FROM `Product` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Product deleted successfully.');
}

// -------------------------------------------------------------
// 2. PUBLIC CUSTOMER ENDPOINTS
// -------------------------------------------------------------

// GET /api/products/featured
if ($method === 'GET' && $first === 'featured') {
    $stmt = $db->query('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE p.isActive = 1 AND p.isArchived = 0 AND p.isFeatured = 1
        ORDER BY p.createdAt DESC
        LIMIT 8
    ');
    $products = array_map('format_product', $stmt->fetchAll());
    json_success($products);
}

// GET /api/products/bestsellers
if ($method === 'GET' && $first === 'bestsellers') {
    $stmt = $db->query('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE p.isActive = 1 AND p.isArchived = 0 AND p.isBestSeller = 1
        ORDER BY p.rating DESC, p.createdAt DESC
        LIMIT 8
    ');
    $products = array_map('format_product', $stmt->fetchAll());
    json_success($products);
}

// GET /api/products/new-arrivals
if ($method === 'GET' && $first === 'new-arrivals') {
    $stmt = $db->query('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE p.isActive = 1 AND p.isArchived = 0 AND p.isNew = 1
        ORDER BY p.createdAt DESC
        LIMIT 8
    ');
    $products = array_map('format_product', $stmt->fetchAll());
    json_success($products);
}

// GET /api/products/slug/:slug
if ($method === 'GET' && $first === 'slug' && !empty($second)) {
    $slug = strtolower(trim($second));
    $stmt = $db->prepare('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE LOWER(p.slug) = :slug AND p.isActive = 1 AND p.isArchived = 0
        LIMIT 1
    ');
    $stmt->execute(['slug' => $slug]);
    $prod = $stmt->fetch();

    if (!$prod) {
        json_error('Product not found.', 404);
    }

    // Fetch product variants
    $vStmt = $db->prepare('SELECT * FROM `ProductVariant` WHERE productId = :id');
    $vStmt->execute(['id' => $prod['id']]);
    $prod['variants'] = $vStmt->fetchAll();

    json_success(format_product($prod));
}

// GET /api/products/:id (Single product by ID)
if ($method === 'GET' && !empty($first) && $first !== 'slug' && $first !== 'admin') {
    $id = $first;
    $stmt = $db->prepare('
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
        WHERE p.id = :id
        LIMIT 1
    ');
    $stmt->execute(['id' => $id]);
    $prod = $stmt->fetch();

    if (!$prod) {
        json_error('Product not found.', 404);
    }

    $vStmt = $db->prepare('SELECT * FROM `ProductVariant` WHERE productId = :id');
    $vStmt->execute(['id' => $prod['id']]);
    $prod['variants'] = $vStmt->fetchAll();

    json_success(format_product($prod));
}

// GET /api/products (Public Catalog with Filters & Pagination)
if ($method === 'GET' && empty($first)) {
    $category = $_GET['category'] ?? '';
    $subcategory = $_GET['subcategory'] ?? '';
    $brand = $_GET['brand'] ?? '';
    $minPrice = isset($_GET['minPrice']) && $_GET['minPrice'] !== '' ? (float)$_GET['minPrice'] : null;
    $maxPrice = isset($_GET['maxPrice']) && $_GET['maxPrice'] !== '' ? (float)$_GET['maxPrice'] : null;
    $rating = isset($_GET['rating']) && $_GET['rating'] !== '' ? (float)$_GET['rating'] : null;
    $inStock = ($_GET['inStock'] ?? '') === 'true';
    $onSale = ($_GET['onSale'] ?? '') === 'true';
    $search = trim($_GET['search'] ?? '');
    $sort = $_GET['sort'] ?? 'newest';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $where = ['p.isActive = 1', 'p.isArchived = 0'];
    $params = [];

    if ($category !== '') {
        $where[] = 'LOWER(c.slug) = :category';
        $params['category'] = strtolower($category);
    }
    if ($subcategory !== '') {
        $where[] = 'LOWER(s.slug) = :subcategory';
        $params['subcategory'] = strtolower($subcategory);
    }
    if ($brand !== '') {
        $where[] = 'p.brand = :brand';
        $params['brand'] = $brand;
    }
    if ($minPrice !== null) {
        $where[] = 'p.price >= :minPrice';
        $params['minPrice'] = $minPrice;
    }
    if ($maxPrice !== null) {
        $where[] = 'p.price <= :maxPrice';
        $params['maxPrice'] = $maxPrice;
    }
    if ($rating !== null) {
        $where[] = 'p.rating >= :rating';
        $params['rating'] = $rating;
    }
    if ($inStock) {
        $where[] = 'p.stock > 0';
    }
    if ($onSale) {
        $where[] = 'p.salePrice IS NOT NULL';
    }
    if ($search !== '') {
        $where[] = '(p.name LIKE :q OR p.shortDescription LIKE :q OR p.description LIKE :q OR p.sku LIKE :q OR p.brand LIKE :q)';
        $params['q'] = "%$search%";
    }

    $whereSql = implode(' AND ', $where);

    // Sorting
    $orderBy = 'p.createdAt DESC';
    if ($sort === 'price-asc') $orderBy = 'p.price ASC';
    elseif ($sort === 'price-desc') $orderBy = 'p.price DESC';
    elseif ($sort === 'best-selling') $orderBy = 'p.isBestSeller DESC, p.rating DESC';
    elseif ($sort === 'highest-rated') $orderBy = 'p.rating DESC';
    elseif ($sort === 'featured') $orderBy = 'p.isFeatured DESC, p.createdAt DESC';
    elseif ($sort === 'newest') $orderBy = 'p.createdAt DESC';

    // Count & Data query
    try {
        $countStmt = $db->prepare("
            SELECT COUNT(*) 
            FROM `Product` p
            LEFT JOIN `Category` c ON p.categoryId = c.id
            LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
            WHERE $whereSql
        ");
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        $dataStmt = $db->prepare("
            SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug
            FROM `Product` p
            LEFT JOIN `Category` c ON p.categoryId = c.id
            LEFT JOIN `Subcategory` s ON p.subcategoryId = s.id
            WHERE $whereSql
            ORDER BY $orderBy
            LIMIT $limit OFFSET $offset
        ");
        $dataStmt->execute($params);
        $rows = $dataStmt->fetchAll();
        $products = array_map('format_product', $rows);
    } catch (PDOException $e) {
        error_log('Products query error: ' . $e->getMessage());
        $totalCount = 0;
        $products = [];
    }


    json_response([
        'success'    => true,
        'data'       => $products,
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $totalCount,
            'totalPages' => (int)ceil($totalCount / $limit),
        ],
    ]);
}

json_error('Product endpoint not found.', 404);
