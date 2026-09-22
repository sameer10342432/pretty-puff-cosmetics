<?php
/**
 * Pretty Puff — Blog & Beauty Journal API Endpoints
 * Converted from server/routes/blog.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';

function format_post(array $p): array {
    $content = !empty($p['content']) ? json_decode((string)$p['content'], true) : [];
    $tags = !empty($p['tags']) ? json_decode((string)$p['tags'], true) : [];

    return [
        'id'            => $p['id'],
        'title'         => $p['title'],
        'slug'          => $p['slug'],
        'excerpt'       => $p['excerpt'] ?? '',
        'content'       => is_array($content) ? $content : [],
        'featuredImage' => $p['featuredImage'] ?? '',
        'author'        => $p['author'] ?? 'Pretty Puff Editorial',
        'readTime'      => $p['readTime'] ?? '5 min read',
        'tags'          => is_array($tags) ? $tags : [],
        'status'        => $p['status'] ?? 'PUBLISHED',
        'isFeatured'    => (bool)($p['isFeatured'] ?? false),
        'categoryId'    => $p['categoryId'] ?? null,
        'category'      => $p['categoryName'] ?? '',
        'categorySlug'  => $p['categorySlug'] ?? '',
        'publishedAt'   => $p['publishedAt'] ?? $p['createdAt'] ?? '',
        'createdAt'     => $p['createdAt'] ?? '',
        'updatedAt'     => $p['updatedAt'] ?? '',
    ];
}

// -------------------------------------------------------------
// 1. ADMIN ENDPOINTS
// -------------------------------------------------------------

// GET /api/blog/admin/all
if ($method === 'GET' && $first === 'admin' && $second === 'all') {
    Auth::requirePermission('blog.manage');
    $stmt = $db->query('
        SELECT b.*, c.name as categoryName, c.slug as categorySlug
        FROM `BlogPost` b
        LEFT JOIN `BlogCategory` c ON b.categoryId = c.id
        ORDER BY b.createdAt DESC
    ');
    $posts = array_map('format_post', $stmt->fetchAll());
    json_success($posts);
}

// POST /api/blog/admin (Create Article)
if ($method === 'POST' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('blog.manage');
    $input = get_json_input();

    $title = trim((string)($input['title'] ?? ''));
    $slug = !empty($input['slug']) ? strtolower(trim((string)$input['slug'])) : strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title));

    if (empty($title)) {
        json_error('Article title is required.', 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    $content = isset($input['content']) && is_array($input['content']) ? json_encode($input['content']) : '[]';
    $tags = isset($input['tags']) && is_array($input['tags']) ? json_encode($input['tags']) : '[]';

    $stmt = $db->prepare('
        INSERT INTO `BlogPost` (
            id, title, slug, excerpt, content, featuredImage, author, readTime,
            tags, status, isFeatured, categoryId, publishedAt, createdAt, updatedAt
        ) VALUES (
            :id, :title, :slug, :excerpt, :content, :featuredImage, :author, :readTime,
            :tags, :status, :isFeatured, :categoryId, :publishedAt, :now, :now
        )
    ');

    $stmt->execute([
        'id'            => $id,
        'title'         => $title,
        'slug'          => $slug,
        'excerpt'       => $input['excerpt'] ?? '',
        'content'       => $content,
        'featuredImage' => $input['featuredImage'] ?? '',
        'author'        => $input['author'] ?? 'Pretty Puff Editorial',
        'readTime'      => $input['readTime'] ?? '5 min read',
        'tags'          => $tags,
        'status'        => $input['status'] ?? 'PUBLISHED',
        'isFeatured'    => !empty($input['isFeatured']) ? 1 : 0,
        'categoryId'    => !empty($input['categoryId']) ? $input['categoryId'] : null,
        'publishedAt'   => ($input['status'] ?? 'PUBLISHED') === 'PUBLISHED' ? $now : null,
        'now'           => $now,
    ]);

    json_success(['id' => $id, 'slug' => $slug], 'Blog post created successfully.', [], 201);
}

// PUT /api/blog/admin/:id (Update Article)
if ($method === 'PUT' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('blog.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    $allowed = ['title', 'slug', 'excerpt', 'featuredImage', 'author', 'readTime', 'status', 'isFeatured', 'categoryId'];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $input)) {
            $val = $input[$k];
            if ($k === 'isFeatured') $val = !empty($val) ? 1 : 0;
            $fields[] = "`$k` = :$k";
            $params[$k] = $val;
        }
    }

    if (isset($input['content'])) {
        $fields[] = '`content` = :content';
        $params['content'] = is_array($input['content']) ? json_encode($input['content']) : $input['content'];
    }
    if (isset($input['tags'])) {
        $fields[] = '`tags` = :tags';
        $params['tags'] = is_array($input['tags']) ? json_encode($input['tags']) : $input['tags'];
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `BlogPost` SET ' . implode(', ', $fields) . ', `updatedAt` = :now WHERE `id` = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'Blog post updated.');
}

// DELETE /api/blog/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('blog.manage');
    $id = $second;
    $db->prepare('DELETE FROM `BlogPost` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Blog post deleted.');
}

// -------------------------------------------------------------
// 2. PUBLIC ENDPOINTS
// -------------------------------------------------------------

// GET /api/blog/categories
if ($method === 'GET' && $first === 'categories') {
    $stmt = $db->query('
        SELECT c.*, COUNT(b.id) as postCount
        FROM `BlogCategory` c
        LEFT JOIN `BlogPost` b ON b.categoryId = c.id AND b.status = "PUBLISHED"
        GROUP BY c.id
        ORDER BY c.name ASC
    ');
    $cats = $stmt->fetchAll();
    json_success($cats);
}

// GET /api/blog/featured
if ($method === 'GET' && $first === 'featured') {
    $stmt = $db->query('
        SELECT b.*, c.name as categoryName, c.slug as categorySlug
        FROM `BlogPost` b
        LEFT JOIN `BlogCategory` c ON b.categoryId = c.id
        WHERE b.status = "PUBLISHED" AND b.isFeatured = 1
        ORDER BY b.createdAt DESC
        LIMIT 1
    ');
    $post = $stmt->fetch();
    json_success($post ? format_post($post) : null);
}

// GET /api/blog/slug/:slug
if ($method === 'GET' && $first === 'slug' && !empty($second)) {
    $slug = strtolower(trim($second));
    $stmt = $db->prepare('
        SELECT b.*, c.name as categoryName, c.slug as categorySlug
        FROM `BlogPost` b
        LEFT JOIN `BlogCategory` c ON b.categoryId = c.id
        WHERE LOWER(b.slug) = :slug AND b.status = "PUBLISHED"
        LIMIT 1
    ');
    $stmt->execute(['slug' => $slug]);
    $post = $stmt->fetch();

    if (!$post) {
        json_error('Article not found.', 404);
    }

    json_success(format_post($post));
}

// GET /api/blog (Public articles list)
if ($method === 'GET' && empty($first)) {
    $category = $_GET['category'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(50, (int)($_GET['limit'] ?? 12)));
    $offset = ($page - 1) * $limit;

    $where = ['b.status = "PUBLISHED"'];
    $params = [];

    if ($category !== '' && $category !== 'all') {
        $where[] = 'LOWER(c.slug) = :cat';
        $params['cat'] = strtolower($category);
    }

    $whereSql = implode(' AND ', $where);

    $countStmt = $db->prepare("
        SELECT COUNT(*)
        FROM `BlogPost` b
        LEFT JOIN `BlogCategory` c ON b.categoryId = c.id
        WHERE $whereSql
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $dataStmt = $db->prepare("
        SELECT b.*, c.name as categoryName, c.slug as categorySlug
        FROM `BlogPost` b
        LEFT JOIN `BlogCategory` c ON b.categoryId = c.id
        WHERE $whereSql
        ORDER BY b.createdAt DESC
        LIMIT $limit OFFSET $offset
    ");
    $dataStmt->execute($params);
    $posts = array_map('format_post', $dataStmt->fetchAll());

    json_response([
        'success'    => true,
        'data'       => $posts,
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $limit),
        ],
    ]);
}

json_error('Blog endpoint not found.', 404);
