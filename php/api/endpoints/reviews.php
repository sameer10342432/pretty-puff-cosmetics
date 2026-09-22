<?php
/**
 * Pretty Puff — Product Reviews API Endpoints
 * Converted from server/routes/reviews.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';
$third = $routeSegments[2] ?? '';

// GET /api/reviews/product/:productId (Public product reviews)
if ($method === 'GET' && $first === 'product' && !empty($second)) {
    $productId = $second;
    $stmt = $db->prepare('
        SELECT * FROM `ProductReview`
        WHERE productId = :pid AND status = "APPROVED"
        ORDER BY createdAt DESC
    ');
    $stmt->execute(['pid' => $productId]);
    json_success($stmt->fetchAll());
}

// POST /api/reviews (Customer submit review)
if ($method === 'POST' && empty($first)) {
    $input = get_json_input();
    $productId = $input['productId'] ?? '';
    $author = trim((string)($input['author'] ?? ''));
    $rating = max(1, min(5, (int)($input['rating'] ?? 5)));
    $comment = trim((string)($input['comment'] ?? ''));

    if (empty($productId) || empty($author) || empty($comment)) {
        json_error('Product ID, your name, and a review comment are required.', 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `ProductReview` (id, productId, author, rating, comment, status, createdAt, updatedAt)
        VALUES (:id, :productId, :author, :rating, :comment, "APPROVED", :now, :now)
    ');
    $stmt->execute([
        'id'        => $id,
        'productId' => $productId,
        'author'    => $author,
        'rating'    => $rating,
        'comment'   => $comment,
        'now'       => $now,
    ]);

    // Update product rating and review count
    $avgStmt = $db->prepare('
        SELECT COUNT(*) as count, AVG(rating) as avgRating
        FROM `ProductReview`
        WHERE productId = :pid AND status = "APPROVED"
    ');
    $avgStmt->execute(['pid' => $productId]);
    $stats = $avgStmt->fetch();

    if ($stats) {
        $db->prepare('
            UPDATE `Product` 
            SET rating = :rating, reviewCount = :count, updatedAt = :now
            WHERE id = :pid
        ')->execute([
            'rating' => round((float)$stats['avgRating'], 1),
            'count'  => (int)$stats['count'],
            'now'    => $now,
            'pid'    => $productId,
        ]);
    }

    json_success(['id' => $id], 'Review submitted successfully.', [], 201);
}

// -------------------------------------------------------------
// ADMIN REVIEWS
// -------------------------------------------------------------

// GET /api/reviews/admin
if ($method === 'GET' && $first === 'admin') {
    Auth::requirePermission('reviews.manage');
    $status = $_GET['status'] ?? '';
    $where = '1=1';
    $params = [];
    if ($status !== '') {
        $where = 'r.status = :status';
        $params['status'] = $status;
    }

    $stmt = $db->prepare("
        SELECT r.*, p.name as productName, p.thumbnail as productThumbnail
        FROM `ProductReview` r
        JOIN `Product` p ON r.productId = p.id
        WHERE $where
        ORDER BY r.createdAt DESC
    ");
    $stmt->execute($params);
    json_success($stmt->fetchAll());
}

// PATCH /api/reviews/admin/:id/status
if ($method === 'PATCH' && $first === 'admin' && !empty($second) && $third === 'status') {
    Auth::requirePermission('reviews.manage');
    $id = $second;
    $input = get_json_input();
    $status = $input['status'] ?? 'APPROVED';

    $db->prepare('UPDATE `ProductReview` SET status = :s, updatedAt = :now WHERE id = :id')
       ->execute(['s' => $status, 'now' => date('Y-m-d H:i:s'), 'id' => $id]);

    json_success(['id' => $id], 'Review status updated.');
}

// DELETE /api/reviews/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('reviews.manage');
    $id = $second;
    $db->prepare('DELETE FROM `ProductReview` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Review deleted.');
}

json_error('Review endpoint not found.', 404);
