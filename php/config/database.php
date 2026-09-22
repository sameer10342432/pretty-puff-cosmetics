<?php
/**
 * Pretty Puff Luxury Cosmetics — Centralized Database Connection (PDO MySQL)
 * Production-ready for cPanel Shared Hosting (PHP 8.2+ / MariaDB / MySQL)
 *
 * SECURE CREDENTIAL ARCHITECTURE:
 * To protect credentials from browser access, Git commits, and public HTTP downloads,
 * this centralized configuration checks credentials in order of priority:
 *
 * 1. External configuration OUTSIDE public_html (Recommended cPanel pattern):
 *    - /home/muhamma1/private-config/database.php
 *    - ../private-config/database.php
 * 2. External environment file OUTSIDE public_html:
 *    - /home/muhamma1/.env
 *    - ../.env
 * 3. Local secure override file (untracked in Git, blocked by .htaccess):
 *    - config/database.local.php
 * 4. Application environment file (blocked by .htaccess):
 *    - ./.env
 * 5. Server environment variables (cPanel / FastCGI / Apache SetEnv)
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// Helper to safely load key=value environment files
if (!function_exists('load_env_file')) {
    function load_env_file(string $path): void {
        if (!file_exists($path) || !is_readable($path)) {
            return;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                if (!getenv($key) && !isset($_ENV[$key])) {
                    putenv("$key=$value");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
    }
}

// 1. Scan candidate .env files in priority order (outside public_html first)
$candidateEnvFiles = [
    '/home/muhamma1/.env',
    dirname(__DIR__, 2) . '/.env',
    dirname(__DIR__) . '/.env',
];

foreach ($candidateEnvFiles as $envFile) {
    if (file_exists($envFile)) {
        load_env_file($envFile);
    }
}

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        // Default cPanel MySQL settings
        $host = 'localhost';
        $port = '3306';
        $dbName = 'muhamma1_prettypuff';
        $user = 'muhamma1_prettypuff';
        $pass = '';
        $charset = 'utf8mb4';

        // 1. Check for private configuration file outside public_html
        $privateConfigCandidates = [
            getenv('PRETTYPUFF_CONFIG_PATH') ?: '',
            '/home/muhamma1/private-config/database.php',
            dirname(__DIR__, 2) . '/private-config/database.php',
            dirname(__DIR__) . '/private-config/database.php',
            __DIR__ . '/database.local.php',
        ];

        foreach ($privateConfigCandidates as $configPath) {
            if ($configPath && file_exists($configPath)) {
                $loaded = require $configPath;
                if (is_array($loaded)) {
                    $host     = $loaded['host'] ?? $loaded['DB_HOST'] ?? $host;
                    $port     = (string)($loaded['port'] ?? $loaded['DB_PORT'] ?? $port);
                    $dbName   = $loaded['database'] ?? $loaded['DB_NAME'] ?? $dbName;
                    $user     = $loaded['username'] ?? $loaded['DB_USER'] ?? $user;
                    $pass     = $loaded['password'] ?? $loaded['DB_PASSWORD'] ?? $pass;
                    $charset  = $loaded['charset'] ?? $charset;
                    break;
                }
            }
        }

        // 2. Allow environment variable overrides
        if (getenv('DB_HOST')) $host = getenv('DB_HOST');
        if (getenv('DB_PORT')) $port = (string)getenv('DB_PORT');
        if (getenv('DB_NAME')) $dbName = getenv('DB_NAME');
        if (getenv('DB_USER')) $user = getenv('DB_USER');
        if (getenv('DB_PASSWORD') !== false && getenv('DB_PASSWORD') !== '') {
            $pass = getenv('DB_PASSWORD');
        }

        // 3. Allow DATABASE_URL connection string parsing
        $dbUrl = getenv('DATABASE_URL');
        if ($dbUrl && str_starts_with($dbUrl, 'mysql://')) {
            $parts = parse_url($dbUrl);
            if ($parts) {
                $host = $parts['host'] ?? $host;
                $port = (string)($parts['port'] ?? $port);
                $user = urldecode($parts['user'] ?? $user);
                $pass = urldecode($parts['pass'] ?? $pass);
                $dbName = ltrim($parts['path'] ?? '', '/');
            }
        }

        // Build PDO DSN string
        $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci",
        ];

        try {
            self::$instance = new PDO($dsn, $user, $pass, $options);
            return self::$instance;
        } catch (PDOException $e) {
            // Log full exception to server logs only (never to client)
            error_log('Pretty Puff PDO Error: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'message' => 'Database connection could not be established. Please check your cPanel MySQL credentials in /home/muhamma1/private-config/database.php.',
            ]);
            exit;
        }
    }
}

/**
 * Global helper function to retrieve active PDO database connection
 */
function get_db(): PDO {
    return Database::getConnection();
}
