<?php
/**
 * Pretty Puff — Promotional Banners API Endpoints
 * Converted from server/routes/banners.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';

// GET /api/banners (Public active homepage banners)
if ($method === 'GET' && empty($first)) {
    $stmt = $db->query('SELECT * FROM `Banner` WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC');
    json_success($stmt->fetchAll());
}

// -------------------------------------------------------------
// ADMIN BANNERS
// -------------------------------------------------------------

// GET /api/banners/admin
if ($method === 'GET' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('banners.manage');
    $stmt = $db->query('SELECT * FROM `Banner` ORDER BY sortOrder ASC, createdAt DESC');
    json_success($stmt->fetchAll());
}

// POST /api/banners/admin
if ($method === 'POST' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('banners.manage');
    $input = get_json_input();

    $title = trim((string)($input['title'] ?? ''));
    $image = trim((string)($input['image'] ?? ''));

    if (empty($title) || empty($image)) {
        json_error('Banner title and image URL are required.', 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `Banner` (
            id, title, subtitle, image, link, buttonText, position,
            sortOrder, isActive, startDate, endDate, createdAt, updatedAt
        ) VALUES (
            :id, :title, :subtitle, :image, :link, :buttonText, :position,
            :sortOrder, :isActive, :startDate, :endDate, :now, :now
        )
    ');

    $stmt->execute([
        'id'         => $id,
        'title'      => $title,
        'subtitle'   => $input['subtitle'] ?? null,
        'image'      => $image,
        'link'       => $input['link'] ?? null,
        'buttonText' => $input['buttonText'] ?? 'Shop Collection',
        'position'   => $input['position'] ?? 'HERO',
        'sortOrder'  => (int)($input['sortOrder'] ?? 0),
        'isActive'   => isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : 1,
        'startDate'  => !empty($input['startDate']) ? date('Y-m-d H:i:s', strtotime($input['startDate'])) : null,
        'endDate'    => !empty($input['endDate']) ? date('Y-m-d H:i:s', strtotime($input['endDate'])) : null,
        'now'        => $now,
    ]);

    json_success(['id' => $id], 'Banner created successfully.', [], 201);
}

// PUT /api/banners/admin/:id
if ($method === 'PUT' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('banners.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    $allowed = ['title', 'subtitle', 'image', 'link', 'buttonText', 'position', 'sortOrder', 'isActive'];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $input)) {
            $val = $input[$k];
            if ($k === 'isActive') $val = !empty($val) ? 1 : 0;
            if ($k === 'sortOrder') $val = (int)$val;
            $fields[] = "`$k` = :$k";
            $params[$k] = $val;
        }
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `Banner` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'Banner updated.');
}

// DELETE /api/banners/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('banners.manage');
    $id = $second;
    $db->prepare('DELETE FROM `Banner` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Banner deleted.');
}

json_error('Banner endpoint not found.', 404);
