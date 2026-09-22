<?php
/**
 * Pretty Puff — Central API Front Controller & Router
 * Dispatches all /api/* requests to specific endpoint modules.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/config.php';
require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/includes/response_helper.php';
require_once dirname(__DIR__) . '/includes/jwt_helper.php';
require_once dirname(__DIR__) . '/includes/auth_middleware.php';

// Normalize the request URI path
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$scriptDir = dirname($scriptName);

// Strip subdirectories if deployed in a subfolder
if ($scriptDir !== '/' && str_starts_with($requestUri, $scriptDir)) {
    $requestUri = substr($requestUri, strlen($scriptDir));
}

// Strip leading /api or /api/
$path = preg_replace('#^/api/?#i', '', $requestUri);
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

$module = $segments[0] ?? '';
$subPath = implode('/', array_slice($segments, 1));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Router mapping
$endpoints = [
    'auth'        => __DIR__ . '/endpoints/auth.php',
    'products'    => __DIR__ . '/endpoints/products.php',
    'categories'  => __DIR__ . '/endpoints/categories.php',
    'orders'      => __DIR__ . '/endpoints/orders.php',
    'coupons'     => __DIR__ . '/endpoints/coupons.php',
    'inventory'   => __DIR__ . '/endpoints/inventory.php',
    'blog'        => __DIR__ . '/endpoints/blog.php',
    'reviews'     => __DIR__ . '/endpoints/reviews.php',
    'banners'     => __DIR__ . '/endpoints/banners.php',
    'contact'     => __DIR__ . '/endpoints/contact.php',
    'newsletter'  => __DIR__ . '/endpoints/newsletter.php',
    'settings'    => __DIR__ . '/endpoints/settings.php',
    'customers'   => __DIR__ . '/endpoints/customers.php',
    'users'       => __DIR__ . '/endpoints/users.php',
    'analytics'   => __DIR__ . '/endpoints/analytics.php',
    'upload'      => __DIR__ . '/endpoints/upload.php',
    'health'      => __DIR__ . '/endpoints/health.php',
];

if (isset($endpoints[$module]) && file_exists($endpoints[$module])) {
    // Provide variables to the controller
    $route = $subPath;
    $routeSegments = array_slice($segments, 1);
    try {
        require $endpoints[$module];
        exit;
    } catch (Throwable $e) {
        error_log("API Module Exception [{$module}]: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
        json_error(
            APP_ENV === 'development'
                ? 'Internal Server Error: ' . $e->getMessage()
                : 'An unexpected server error occurred. Details have been logged.',
            500
        );
    }
}


// 404 handler for unmatched API routes
json_error('API endpoint not found.', 404);
