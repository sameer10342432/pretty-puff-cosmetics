<?php
/**
 * Pretty Puff — Newsletter API Endpoints
 * Converted from server/routes/newsletter.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';

// GET /api/newsletter/admin/export (CSV export)
if ($method === 'GET' && $first === 'admin' && $second === 'export') {
    Auth::requirePermission('customers.manage');

    $stmt = $db->query('SELECT email, createdAt FROM `NewsletterSubscriber` WHERE isActive = 1 ORDER BY createdAt DESC');
    $subscribers = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=pretty-puff-newsletter-subscribers.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['Email', 'Subscribed At']);
    foreach ($subscribers as $s) {
        fputcsv($out, [$s['email'], $s['createdAt']]);
    }
    fclose($out);
    exit;
}

// GET /api/newsletter/admin
if ($method === 'GET' && $first === 'admin') {
    Auth::requirePermission('customers.manage');
    $search = trim($_GET['search'] ?? '');
    $where = '1=1';
    $params = [];
    if ($search !== '') {
        $where = 'email LIKE :q';
        $params['q'] = "%$search%";
    }

    $stmt = $db->prepare("SELECT * FROM `NewsletterSubscriber` WHERE $where ORDER BY createdAt DESC");
    $stmt->execute($params);
    json_success($stmt->fetchAll());
}

// DELETE /api/newsletter/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('customers.manage');
    $id = $second;
    $db->prepare('DELETE FROM `NewsletterSubscriber` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Subscriber deleted.');
}

// POST /api/newsletter (Subscribe)
if ($method === 'POST' && empty($first)) {
    $input = get_json_input();
    $email = strtolower(trim((string)($input['email'] ?? '')));

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Please enter a valid email address.', 400);
    }

    $stmt = $db->prepare('SELECT id, isActive FROM `NewsletterSubscriber` WHERE LOWER(email) = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $existing = $stmt->fetch();

    $now = date('Y-m-d H:i:s');
    if ($existing) {
        if (!$existing['isActive']) {
            $db->prepare('UPDATE `NewsletterSubscriber` SET isActive = 1, updatedAt = :now WHERE id = :id')
               ->execute(['now' => $now, 'id' => $existing['id']]);
        }
        json_success(null, 'You are successfully subscribed to the Pretty Puff newsletter.');
    }

    $stmt = $db->prepare('
        INSERT INTO `NewsletterSubscriber` (id, email, isActive, createdAt, updatedAt)
        VALUES (:id, :email, 1, :now, :now)
    ');
    $stmt->execute([
        'id'    => generate_uuid(),
        'email' => $email,
        'now'   => $now,
    ]);

    json_success(null, 'Welcome to the Pretty Puff VIP Beauty Club!', [], 201);
}

json_error('Newsletter endpoint not found.', 404);
