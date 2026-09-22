<?php
/**
 * Pretty Puff — Authentication & RBAC Authorization Middleware
 */

declare(strict_types=1);

require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/response_helper.php';
require_once dirname(__DIR__) . '/config/database.php';

class Auth {
    private static ?array $currentAdmin = null;

    /**
     * Get bearer token from request headers
     */
    public static function getBearerToken(): ?string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $headers = $requestHeaders['Authorization'] ?? $requestHeaders['authorization'] ?? '';
        }

        if (!empty($headers) && preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
            return $matches[1];
        }

        // Also allow cookie fallback if used
        if (isset($_COOKIE['pretty_puff_admin_token'])) {
            return $_COOKIE['pretty_puff_admin_token'];
        }

        return null;
    }

    /**
     * Require authentication - halts with 401 if missing or invalid
     */
    public static function requireAuth(): array {
        if (self::$currentAdmin !== null) {
            return self::$currentAdmin;
        }

        $token = self::getBearerToken();
        if (!$token) {
            json_error('Authentication required. Missing or malformed authorization token.', 401);
        }

        $payload = JWT::verify($token, JWT_SECRET);
        if (!$payload || empty($payload['id'])) {
            json_error('Invalid or expired authentication token.', 401);
        }

        try {
            $db = get_db();
            $stmt = $db->prepare('
                SELECT a.id, a.email, a.name, a.avatar, a.isActive, a.lastLoginAt, 
                       COALESCE(r.name, "SUPER_ADMIN") as roleName
                FROM `Admin` a
                LEFT JOIN `Role` r ON a.roleId = r.id
                WHERE a.id = :id
                LIMIT 1
            ');
            $stmt->execute(['id' => $payload['id']]);
            $admin = $stmt->fetch();

            if (!$admin || (isset($admin['isActive']) && !$admin['isActive'])) {
                json_error('Admin account is either invalid or inactive.', 401);
            }

            // Fetch permissions for the role
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
            } catch (Throwable) {
                if ($admin['roleName'] === 'SUPER_ADMIN') {
                    $permissions = ['*'];
                }
            }

            self::$currentAdmin = [
                'id'          => $admin['id'],
                'email'       => $admin['email'],
                'name'        => $admin['name'],
                'avatar'      => $admin['avatar'] ?? null,
                'role'        => $admin['roleName'],
                'permissions' => $permissions ?: ['*'],
                'lastLoginAt' => $admin['lastLoginAt'] ?? null,
            ];

            return self::$currentAdmin;
        } catch (Throwable $e) {
            error_log('Auth Middleware Exception: ' . $e->getMessage());
            json_error('Authentication verification failed.', 401);
        }

    }

    /**
     * Require a specific permission (e.g. 'products.manage')
     */
    public static function requirePermission(string $permission): array {
        $admin = self::requireAuth();

        if ($admin['role'] === 'SUPER_ADMIN') {
            return $admin;
        }

        if (!in_array($permission, $admin['permissions'], true)) {
            json_error("Forbidden. You do not possess the required permission: '{$permission}'", 403);
        }

        return $admin;
    }

    /**
     * Require one of allowed roles
     */
    public static function requireRole(array $allowedRoles): array {
        $admin = self::requireAuth();

        if ($admin['role'] === 'SUPER_ADMIN') {
            return $admin;
        }

        if (!in_array($admin['role'], $allowedRoles, true)) {
            json_error('Forbidden. Your role is not authorized to access this resource.', 403);
        }

        return $admin;
    }

    /**
     * Optional auth (doesn't abort if unauthenticated)
     */
    public static function optionalAuth(): ?array {
        try {
            $token = self::getBearerToken();
            if (!$token) {
                return null;
            }
            return self::requireAuth();
        } catch (\Throwable) {
            return null;
        }
    }
}
