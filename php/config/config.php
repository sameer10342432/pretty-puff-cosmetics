<?php
/**
 * Pretty Puff Luxury Cosmetics — Production Configuration
 * cPanel PHP 8.2+ / MySQL Environment
 */

declare(strict_types=1);

// Prevent direct script access if needed
if (!defined('PRETTY_PUFF_APP')) {
    define('PRETTY_PUFF_APP', true);
}

// Environment: 'production' or 'development'
define('APP_ENV', getenv('APP_ENV') ?: 'production');

// Error Handling & Server-Side Logging
if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('log_errors', '1');
} else {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
}


// Base Public URL
define('APP_URL', rtrim(getenv('APP_URL') ?: 'https://prettypuff.store', '/'));

// JWT Signing Secret Key
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'prettypuff_super_secure_jwt_secret_key_2026_luxury_cosmetics');
define('JWT_EXPIRY', 7 * 24 * 60 * 60); // 7 days in seconds

// Store Details
define('STORE_NAME', 'Pretty Puff');
define('STORE_EMAIL', 'sameerliaqat81@gmail.com');
define('STORE_PHONE', '+923474542881');
define('CURRENCY', 'PKR');

// Upload Paths
define('BASE_DIR', dirname(__DIR__));
define('UPLOAD_DIR', BASE_DIR . '/uploads');
define('UPLOAD_MAX_BYTES', 5 * 1024 * 1024); // 5 MB max
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif']);
define('ALLOWED_MIMES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// CORS Configuration
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
