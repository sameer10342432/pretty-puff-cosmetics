<?php
/**
 * Pretty Puff — Categories API Endpoints
 * Converted from server/routes/categories.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';
$third = $routeSegments[2] ?? '';

// -------------------------------------------------------------
// 1. ADMIN ENDPOINTS
// -------------------------------------------------------------

// POST /api/categories/admin/:categoryId/subcategories
if ($method === 'POST' && $first === 'admin' && !empty($second) && $third === 'subcategories') {
    Auth::requirePermission('categories.manage');
    $categoryId = $second;
    $input = get_json_input();
    $name = trim((string)($input['name'] ?? ''));
    $slug = strtolower(trim((string)($input['slug'] ?? '')));

    if (empty($name) || empty($slug)) {
        json_error('Subcategory name and slug are required.', 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare('
        INSERT INTO `Subcategory` (id, name, slug, categoryId, isActive, createdAt, updatedAt)
        VALUES (:id, :name, :slug, :categoryId, 1, :now, :now)
    ');
    $stmt->execute([
        'id'         => $id,
        'name'       => $name,
        'slug'       => $slug,
        'categoryId' => $categoryId,
        'now'        => $now,
    ]);

    json_success(['id' => $id, 'name' => $name, 'slug' => $slug], 'Subcategory added.', [], 201);
}

// DELETE /api/categories/admin/subcategories/:id
if ($method === 'DELETE' && $first === 'admin' && $second === 'subcategories' && !empty($third)) {
    Auth::requirePermission('categories.manage');
    $id = $third;
    $db->prepare('DELETE FROM `Subcategory` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Subcategory deleted.');
}

// POST /api/categories/admin (Create Category)
if ($method === 'POST' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('categories.manage');
    $input = get_json_input();

    $name = trim((string)($input['name'] ?? ''));
    $slug = strtolower(trim((string)($input['slug'] ?? '')));

    if (empty($name) || empty($slug)) {
        json_error('Category name and slug are required.', 400);
    }

    $existing = $db->prepare('SELECT id FROM `Category` WHERE LOWER(slug) = :slug LIMIT 1');
    $existing->execute(['slug' => $slug]);
    if ($existing->fetch()) {
        json_error("Category with slug '{$slug}' already exists.", 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare('
        INSERT INTO `Category` (id, name, slug, description, image, isActive, createdAt, updatedAt)
        VALUES (:id, :name, :slug, :description, :image, :isActive, :now, :now)
    ');
    $stmt->execute([
        'id'          => $id,
        'name'        => $name,
        'slug'        => $slug,
        'description' => $input['description'] ?? null,
        'image'       => $input['image'] ?? null,
        'isActive'    => isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : 1,
        'now'         => $now,
    ]);

    json_success(['id' => $id, 'name' => $name, 'slug' => $slug], 'Category created successfully.', [], 201);
}

// PUT /api/categories/admin/:id (Update Category)
if ($method === 'PUT' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('categories.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    if (isset($input['name'])) {
        $fields[] = '`name` = :name';
        $params['name'] = trim((string)$input['name']);
    }
    if (isset($input['slug'])) {
        $fields[] = '`slug` = :slug';
        $params['slug'] = strtolower(trim((string)$input['slug']));
    }
    if (array_key_exists('description', $input)) {
        $fields[] = '`description` = :description';
        $params['description'] = $input['description'];
    }
    if (array_key_exists('image', $input)) {
        $fields[] = '`image` = :image';
        $params['image'] = $input['image'];
    }
    if (isset($input['isActive'])) {
        $fields[] = '`isActive` = :isActive';
        $params['isActive'] = $input['isActive'] ? 1 : 0;
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `Category` SET ' . implode(', ', $fields) . ', `updatedAt` = :now WHERE `id` = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'Category updated.');
}

// DELETE /api/categories/admin/:id (Delete Category)
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('categories.manage');
    $id = $second;

    try {
        $db->prepare('DELETE FROM `Category` WHERE id = :id')->execute(['id' => $id]);
        json_success(null, 'Category deleted successfully.');
    } catch (\Throwable) {
        json_error('Cannot delete category with associated products.', 500);
    }
}

// -------------------------------------------------------------
// 2. PUBLIC ENDPOINTS
// -------------------------------------------------------------

// GET /api/categories/:slug
if ($method === 'GET' && !empty($first) && $first !== 'admin') {
    $slug = strtolower(trim($first));
    $stmt = $db->prepare('
        SELECT c.*, COUNT(p.id) as productCount
        FROM `Category` c
        LEFT JOIN `Product` p ON p.categoryId = c.id AND p.isActive = 1 AND p.isArchived = 0
        WHERE LOWER(c.slug) = :slug
        GROUP BY c.id
        LIMIT 1
    ');
    $stmt->execute(['slug' => $slug]);
    $cat = $stmt->fetch();

    if (!$cat) {
        json_error('Category not found.', 404);
    }

    // Fetch active subcategories
    $subStmt = $db->prepare('SELECT id, name, slug FROM `Subcategory` WHERE categoryId = :id AND isActive = 1');
    $subStmt->execute(['id' => $cat['id']]);
    $cat['subcategories'] = $subStmt->fetchAll();
    $cat['productCount'] = (int)$cat['productCount'];

    json_success($cat);
}

// GET /api/categories (All active categories)
if ($method === 'GET' && empty($first)) {
    try {
        $stmt = $db->query('
            SELECT c.*, COUNT(p.id) as productCount
            FROM `Category` c
            LEFT JOIN `Product` p ON p.categoryId = c.id AND p.isActive = 1 AND p.isArchived = 0
            WHERE c.isActive = 1
            GROUP BY c.id
            ORDER BY c.name ASC
        ');
        $categories = $stmt->fetchAll();

        // Fetch subcategories for all
        $subStmt = $db->query('SELECT id, name, slug, categoryId FROM `Subcategory` WHERE isActive = 1');
        $allSubs = $subStmt->fetchAll();

        $subsByCat = [];
        foreach ($allSubs as $s) {
            $subsByCat[$s['categoryId']][] = [
                'id'   => $s['id'],
                'name' => $s['name'],
                'slug' => $s['slug'],
            ];
        }

        $result = [];
        foreach ($categories as $c) {
            $result[] = [
                'id'            => $c['id'],
                'name'          => $c['name'],
                'slug'          => $c['slug'],
                'description'   => $c['description'] ?? '',
                'image'         => $c['image'] ?? '',
                'productCount'  => (int)$c['productCount'],
                'subcategories' => $subsByCat[$c['id']] ?? [],
            ];
        }

        json_success($result);
    } catch (PDOException $e) {
        error_log('Categories query notice: ' . $e->getMessage());
        json_success([]);
    }
}


json_error('Categories endpoint not found.', 404);
