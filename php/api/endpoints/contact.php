<?php
/**
 * Pretty Puff — Contact Inquiries API Endpoints
 * Converted from server/routes/contact.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';
$third = $routeSegments[2] ?? '';

// POST /api/contact (Customer inquiry submission)
if ($method === 'POST' && empty($first)) {
    $input = get_json_input();
    $name = trim((string)($input['name'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $message = trim((string)($input['message'] ?? ''));

    if (empty($name) || empty($email) || empty($message)) {
        json_error('Name, email, and message are required.', 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `ContactMessage` (id, name, email, phone, subject, message, status, createdAt, updatedAt)
        VALUES (:id, :name, :email, :phone, :subject, :message, "NEW", :now, :now)
    ');

    $stmt->execute([
        'id'      => $id,
        'name'    => $name,
        'email'   => $email,
        'phone'   => !empty($input['phone']) ? trim((string)$input['phone']) : null,
        'subject' => !empty($input['subject']) ? trim((string)$input['subject']) : 'Customer Inquiry',
        'message' => $message,
        'now'     => $now,
    ]);

    json_success(['id' => $id], 'Thank you for your message. The Pretty Puff concierge will contact you shortly.', [], 201);
}

// -------------------------------------------------------------
// ADMIN CONTACT MESSAGES
// -------------------------------------------------------------

// GET /api/contact/admin
if ($method === 'GET' && $first === 'admin') {
    Auth::requirePermission('messages.manage');
    $status = $_GET['status'] ?? '';
    $where = '1=1';
    $params = [];
    if ($status !== '') {
        $where = 'status = :status';
        $params['status'] = $status;
    }

    $stmt = $db->prepare("SELECT * FROM `ContactMessage` WHERE $where ORDER BY createdAt DESC");
    $stmt->execute($params);
    json_success($stmt->fetchAll());
}

// PATCH /api/contact/admin/:id/status
if ($method === 'PATCH' && $first === 'admin' && !empty($second) && $third === 'status') {
    Auth::requirePermission('messages.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    if (isset($input['status'])) {
        $fields[] = 'status = :status';
        $params['status'] = $input['status'];
    }
    if (isset($input['internalNotes'])) {
        $fields[] = 'internalNotes = :internalNotes';
        $params['internalNotes'] = $input['internalNotes'];
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `ContactMessage` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'Message status updated.');
}

// DELETE /api/contact/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('messages.manage');
    $id = $second;
    $db->prepare('DELETE FROM `ContactMessage` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Message deleted.');
}

json_error('Contact endpoint not found.', 404);
