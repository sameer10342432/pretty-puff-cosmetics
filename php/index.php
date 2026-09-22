<?php
/**
 * Pretty Puff Luxury Cosmetics — Front Controller
 * Production-ready entry point for cPanel PHP Hosting
 *
 * Renders the Luxury React SPA storefront and admin portal while
 * dynamically generating SEO Open Graph metadata, canonical links,
 * and structured data for search engine crawlers (Google, Facebook, WhatsApp, Twitter).
 */

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';

// Extract request path
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}

// Default luxury SEO metadata
$metaTitle = 'Pretty Puff — Luxury Cosmetics & Beauty Essentials';
$metaDescription = 'Discover Pretty Puff luxury cosmetics, premium lip glazes, velvet blushes, and radiant beauty essentials in Pakistan. Cruelty-free elegance.';
$canonicalUrl = APP_URL . ($path === '/' ? '' : $path);
$ogImage = APP_URL . '/assets/og-cover.jpg';

// Dynamic SEO metadata injection for direct URL shares (Product & Blog routes)
if (str_starts_with($path, '/product/')) {
    $slug = substr($path, strlen('/product/'));
    try {
        require_once __DIR__ . '/config/database.php';
        $db = get_db();
        $stmt = $db->prepare('SELECT name, subtitle, description, images FROM `Product` WHERE slug = :slug AND isActive = 1 LIMIT 1');
        $stmt->execute(['slug' => $slug]);
        $product = $stmt->fetch();
        if ($product) {
            $metaTitle = htmlspecialchars($product['name']) . ' | Pretty Puff Luxury Cosmetics';
            $metaDescription = htmlspecialchars($product['subtitle'] ?: substr(strip_tags($product['description'] ?? ''), 0, 160));
            $imgs = json_decode($product['images'] ?? '[]', true);
            if (!empty($imgs) && is_array($imgs)) {
                $firstImg = $imgs[0];
                $ogImage = str_starts_with($firstImg, 'http') ? $firstImg : (APP_URL . $firstImg);
            }
        }
    } catch (Throwable) {
        // Fallback gracefully to default metadata if database is temporarily unavailable
    }
} elseif (str_starts_with($path, '/blog/')) {
    $slug = substr($path, strlen('/blog/'));
    try {
        require_once __DIR__ . '/config/database.php';
        $db = get_db();
        $stmt = $db->prepare('SELECT title, excerpt, coverImage FROM `BlogPost` WHERE slug = :slug AND isPublished = 1 LIMIT 1');
        $stmt->execute(['slug' => $slug]);
        $post = $stmt->fetch();
        if ($post) {
            $metaTitle = htmlspecialchars($post['title']) . ' | Pretty Puff Editorial';
            $metaDescription = htmlspecialchars($post['excerpt'] ?: 'Read the latest luxury beauty insights on Pretty Puff.');
            if (!empty($post['coverImage'])) {
                $ogImage = str_starts_with($post['coverImage'], 'http') ? $post['coverImage'] : (APP_URL . $post['coverImage']);
            }
        }
    } catch (Throwable) {
        // Fallback gracefully
    }
}

// Load built SPA HTML template
$htmlFile = __DIR__ . '/index.html';
if (file_exists($htmlFile)) {
    $html = file_get_contents($htmlFile);

    // Inject dynamic Title
    $html = preg_replace('/<title>.*?<\/title>/is', '<title>' . $metaTitle . '</title>', $html, 1);

    // Build SEO meta tags block
    $seoTags = <<<HTML
    <meta name="description" content="{$metaDescription}">
    <link rel="canonical" href="{$canonicalUrl}">
    <meta property="og:title" content="{$metaTitle}">
    <meta property="og:description" content="{$metaDescription}">
    <meta property="og:url" content="{$canonicalUrl}">
    <meta property="og:image" content="{$ogImage}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$metaTitle}">
    <meta name="twitter:description" content="{$metaDescription}">
    <meta name="twitter:image" content="{$ogImage}">
HTML;

    // Inject before </head>
    if (str_contains($html, '</head>')) {
        $html = str_replace('</head>', $seoTags . "\n  </head>", $html);
    }

    header('Content-Type: text/html; charset=UTF-8');
    echo $html;
    exit;
}

// Fallback in case index.html has not yet been extracted
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pretty Puff — Luxury Cosmetics</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFF5F7; color: #4A1525; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(224, 78, 122, 0.1); max-width: 500px; }
        h1 { color: #D6336C; margin-bottom: 8px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌸 Pretty Puff Luxury Cosmetics</h1>
        <p>Production PHP Backend is operational. Please ensure <code>index.html</code> and <code>assets/</code> are present in <code>public_html</code>.</p>
        <p><a href="/api/health" style="color: #D6336C; font-weight: 600;">Check System Health →</a></p>
    </div>
</body>
</html>
