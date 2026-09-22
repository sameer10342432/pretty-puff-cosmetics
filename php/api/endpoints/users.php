<?php
/**
 * Pretty Puff — Staff & RBAC Users API Endpoints
 * Converted from server/routes/users.ts
 */

declare(strict_types=1);

$db = get_db();
Auth::requirePermission('users.manage');

$first = $routeSegments[0] ?? '';

// GET /api/users/roles
if ($method === 'GET' && $first === 'roles') {
    $rolesStmt = $db->query('SELECT * FROM `Role` ORDER BY name ASC');
    $roles = $rolesStmt->fetchAll();

    $permsStmt = $db->query('SELECT * FROM `Permission` ORDER BY module ASC, name ASC');
    $permissions = $permsStmt->fetchAll();

    json_success([
        'roles'       => $roles,
        'permissions' => $permissions,
    ]);
}

// POST /api/users (Create new staff admin)
if ($method === 'POST' && empty($first)) {
    $input = get_json_input();

    $email = strtolower(trim((string)($input['email'] ?? '')));
    $name = trim((string)($input['name'] ?? ''));
    $password = (string)($input['password'] ?? '');
    $roleId = (string)($input['roleId'] ?? '');

    if (empty($email) || empty($name) || strlen($password) < 6 || empty($roleId)) {
        json_error('Email, name, password (min 6 chars), and role are required.', 400);
    }

    $existing = $db->prepare('SELECT id FROM `Admin` WHERE LOWER(email) = :email LIMIT 1');
    $existing->execute(['email' => $email]);
    if ($existing->fetch()) {
        json_error("Admin account with email '{$email}' already exists.", 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare('
        INSERT INTO `Admin` (id, email, passwordHash, name, avatar, roleId, isActive, createdAt, updatedAt)
        VALUES (:id, :email, :passwordHash, :name, :avatar, :roleId, :isActive, :now, :now)
    ');

    $stmt->execute([
        'id'           => $id,
        'email'        => $email,
        'passwordHash' => $passwordHash,
        'name'         => $name,
        'avatar'       => $input['avatar'] ?? null,
        'roleId'       => $roleId,
        'isActive'     => isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : 1,
        'now'          => $now,
    ]);

    json_success(['id' => $id, 'email' => $email], 'Staff user created successfully.', [], 201);
}

// PUT /api/users/:id
if ($method === 'PUT' && !empty($first)) {
    $id = $first;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    if (!empty($input['name'])) {
        $fields[] = 'name = :name';
        $params['name'] = trim((string)$input['name']);
    }
    if (!empty($input['email'])) {
        $fields[] = 'email = :email';
        $params['email'] = strtolower(trim((string)$input['email']));
    }
    if (!empty($input['roleId'])) {
        $fields[] = 'roleId = :roleId';
        $params['roleId'] = $input['roleId'];
    }
    if (isset($input['isActive'])) {
        $fields[] = 'isActive = :isActive';
        $params['isActive'] = $input['isActive'] ? 1 : 0;
    }
    if (!empty($input['password']) && strlen((string)$input['password']) >= 6) {
        $fields[] = 'passwordHash = :hash';
        $params['hash'] = password_hash((string)$input['password'], PASSWORD_DEFAULT);
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `Admin` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'User updated successfully.');
}

// DELETE /api/users/:id
if ($method === 'DELETE' && !empty($first)) {
    $id = $first;
    $currentAdmin = Auth::requireAuth();
    if ($currentAdmin['id'] === $id) {
        json_error('You cannot delete your own administrative account.', 400);
    }

    $db->prepare('DELETE FROM `Admin` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Staff user deleted successfully.');
}

// GET /api/users (List staff users)
if ($method === 'GET' && empty($first)) {
    $stmt = $db->query('
        SELECT a.id, a.email, a.name, a.avatar, a.isActive, a.lastLoginAt, a.createdAt,
               r.id as roleId, r.name as role
        FROM `Admin` a
        JOIN `Role` r ON a.roleId = r.id
        ORDER BY a.createdAt ASC
    ');
    $users = $stmt->fetchAll();
    json_success($users);
}

json_error('Users endpoint not found.', 404);
