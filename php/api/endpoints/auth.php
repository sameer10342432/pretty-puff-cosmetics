<?php
/**
 * Pretty Puff — Authentication API Endpoints
 * Converted from server/routes/auth.ts
 */

declare(strict_types=1);

$db = get_db();
$subRoute = $routeSegments[0] ?? '';

// POST /api/auth/login
if ($method === 'POST' && $subRoute === 'login') {
    $input = get_json_input();
    $email = trim((string)($input['email'] ?? ''));
    $password = (string)($input['password'] ?? '');

    // 1. Validation
    if (empty($email) || empty($password)) {
        json_error('Email and password are required.', 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Invalid email address format.', 400);
    }

    if (strlen($password) < 6) {
        json_error('Password must be at least 6 characters.', 400);
    }

    // 2. Query Admin with Role
    try {
        $stmt = $db->prepare('
            SELECT a.id, a.email, a.passwordHash, a.name, a.avatar, a.isActive, a.lastLoginAt,
                   COALESCE(r.name, "SUPER_ADMIN") as roleName
            FROM `Admin` a
            LEFT JOIN `Role` r ON a.roleId = r.id
            WHERE LOWER(a.email) = LOWER(:email)
            LIMIT 1
        ');
        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch();
    } catch (PDOException $e) {
        error_log('Auth Login Database Error: ' . $e->getMessage());
        if (str_contains($e->getMessage(), "doesn't exist") || str_contains($e->getMessage(), "Base table or view not found")) {
            json_error('Database tables have not been created yet. Please run database/safe_schema.sql or seed.php.', 500);
        }
        json_error('A database query error occurred while processing authentication.', 500);
    }

    // 3. Check Admin Existence
    if (!$admin) {
        // If Admin table has 0 records, automatically bootstrap initial Super Admin
        try {
            $countCheck = (int)$db->query('SELECT COUNT(*) FROM `Admin`')->fetchColumn();
            if ($countCheck === 0) {
                $defaultEmail = strtolower(trim(getenv('ADMIN_EMAIL') ?: 'sameerliaqat81@gmail.com'));
                $defaultPassword = getenv('ADMIN_PASSWORD') ?: 'o3!753NA~OQ@';
                $defaultName = getenv('ADMIN_NAME') ?: 'Sameer Liaqat';

                // Ensure Super Admin Role exists
                $roleId = 'super_admin';
                try {
                    $db->prepare('
                        INSERT INTO `Role` (id, name, description, createdAt, updatedAt)
                        VALUES (:id, "SUPER_ADMIN", "Complete administrative access", NOW(3), NOW(3))
                        ON DUPLICATE KEY UPDATE name = VALUES(name)
                    ')->execute(['id' => $roleId]);
                } catch (Throwable) {}

                // Create initial Super Admin
                $newAdminId = generate_uuid();
                $newHash = password_hash($defaultPassword, PASSWORD_BCRYPT);
                $db->prepare('
                    INSERT INTO `Admin` (id, email, passwordHash, name, roleId, isActive, createdAt, updatedAt)
                    VALUES (:id, :email, :hash, :name, :roleId, 1, NOW(3), NOW(3))
                ')->execute([
                    'id'     => $newAdminId,
                    'email'  => $defaultEmail,
                    'hash'   => $newHash,
                    'name'   => $defaultName,
                    'roleId' => $roleId,
                ]);

                // Re-query admin if matching the submitted email
                if (strtolower($email) === $defaultEmail) {
                    $stmt->execute(['email' => $email]);
                    $admin = $stmt->fetch();
                }
            }
        } catch (Throwable $e) {
            error_log('Initial admin auto-create notice: ' . $e->getMessage());
        }

        if (!$admin) {
            json_error('Invalid email or password credentials.', 401);
        }
    }


    // 4. Check Active Status
    if (isset($admin['isActive']) && !$admin['isActive']) {
        json_error('This administrative account has been deactivated. Please contact the Super Admin.', 403);
    }

    // 5. Verify Password
    $passwordValid = password_verify($password, $admin['passwordHash']);
    if (!$passwordValid && $password === $admin['passwordHash']) {
        // Transparently upgrade legacy plaintext password to secure bcrypt hash
        $passwordValid = true;
        try {
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $db->prepare('UPDATE `Admin` SET passwordHash = :hash WHERE id = :id')
               ->execute(['hash' => $newHash, 'id' => $admin['id']]);
        } catch (Throwable) {}
    }

    if (!$passwordValid) {
        json_error('Invalid email or password credentials.', 401);
    }

    // 6. Update lastLoginAt
    $now = date('Y-m-d H:i:s');
    try {
        $db->prepare('UPDATE `Admin` SET lastLoginAt = :now WHERE id = :id')
           ->execute(['now' => $now, 'id' => $admin['id']]);
    } catch (Throwable $e) {
        error_log('Notice: Failed to update lastLoginAt: ' . $e->getMessage());
    }

    // 7. Fetch Permissions
    $permissions = [];
    try {
        $permStmt = $db->prepare('
            SELECT p.name
            FROM `Permission` p
            JOIN `RolePermission` rp ON p.id = rp.permissionId
            JOIN `Admin` a ON a.roleId = rp.roleId
            WHERE a.id = :id
        ');
        $permStmt->execute(['id' => $admin['id']]);
        $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        error_log('Permission query notice: ' . $e->getMessage());
        if ($admin['roleName'] === 'SUPER_ADMIN') {
            $permissions = ['*'];
        }
    }

    // 8. Session & Cookie Configuration
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 7 * 24 * 3600,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        @session_start();
    }
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['admin_role'] = $admin['roleName'];

    // 9. Generate JWT Token
    $tokenPayload = [
        'id'    => $admin['id'],
        'email' => $admin['email'],
        'name'  => $admin['name'],
        'role'  => $admin['roleName'],
    ];

    $token = JWT::sign($tokenPayload, JWT_SECRET, JWT_EXPIRY);

    // Set secure cookie for browser sessions
    setcookie('pretty_puff_admin_token', $token, [
        'expires'  => time() + JWT_EXPIRY,
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    // 10. Success Response
    json_response([
        'success' => true,
        'message' => 'Login successful',
        'token'   => $token,
        'admin'   => [
            'id'          => $admin['id'],
            'email'       => $admin['email'],
            'name'        => $admin['name'],
            'avatar'      => $admin['avatar'] ?? null,
            'role'        => $admin['roleName'],
            'permissions' => $permissions ?: ['*'],
            'lastLoginAt' => $now,
        ],
    ]);
}

// GET /api/auth/me
if ($method === 'GET' && $subRoute === 'me') {
    $currentAdmin = Auth::requireAuth();
    json_response([
        'success' => true,
        'admin'   => $currentAdmin,
    ]);
}

// POST /api/auth/forgot-password
if ($method === 'POST' && $subRoute === 'forgot-password') {
    $input = get_json_input();
    $email = trim((string)($input['email'] ?? ''));

    if (empty($email)) {
        json_error('Email is required.', 400);
    }

    json_response([
        'success' => true,
        'message' => 'If an administrative account matches this email, password reset instructions have been generated.',
    ]);
}

// POST /api/auth/reset-password
if ($method === 'POST' && $subRoute === 'reset-password') {
    $input = get_json_input();
    $email = trim((string)($input['email'] ?? ''));
    $newPassword = (string)($input['newPassword'] ?? '');

    if (empty($email) || empty($newPassword)) {
        json_error('Email and new password are required.', 400);
    }

    if (strlen($newPassword) < 8) {
        json_error('Password must be at least 8 characters long.', 400);
    }

    try {
        $stmt = $db->prepare('SELECT id FROM `Admin` WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch();

        if (!$admin) {
            json_error('Admin account not found.', 404);
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $db->prepare('UPDATE `Admin` SET passwordHash = :hash, updatedAt = :now WHERE id = :id')
           ->execute(['hash' => $hash, 'now' => date('Y-m-d H:i:s'), 'id' => $admin['id']]);

        json_response([
            'success' => true,
            'message' => 'Password has been successfully updated. You may now log in.',
        ]);
    } catch (PDOException $e) {
        error_log('Reset password DB error: ' . $e->getMessage());
        json_error('Failed to reset password due to a database error.', 500);
    }
}

json_error('Auth endpoint not found.', 404);
