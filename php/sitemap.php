<?php
/**
 * Pretty Puff — Dynamic XML Sitemap Generator (SEO)
 * Converted from server/index.ts
 */

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/xml; charset=utf-8');

try {
    $db = get_db();
    $baseUrl = rtrim(APP_URL, '/');

    // Fetch dynamic content
    $products = $db->query('SELECT slug, updatedAt FROM `Product` WHERE isActive = 1 AND isArchived = 0')->fetchAll();
    $categories = $db->query('SELECT slug, updatedAt FROM `Category` WHERE isActive = 1')->fetchAll();
    $posts = $db->query('SELECT slug, updatedAt FROM `BlogPost` WHERE status = "PUBLISHED"')->fetchAll();

    $staticPages = [
        ['path' => '',         'priority' => '1.0', 'changefreq' => 'daily'],
        ['path' => 'shop',     'priority' => '0.9', 'changefreq' => 'daily'],
        ['path' => 'blog',     'priority' => '0.8', 'changefreq' => 'daily'],
        ['path' => 'about',    'priority' => '0.6', 'changefreq' => 'monthly'],
        ['path' => 'contact',  'priority' => '0.7', 'changefreq' => 'monthly'],
        ['path' => 'faq',      'priority' => '0.5', 'changefreq' => 'monthly'],
        ['path' => 'shipping', 'priority' => '0.4', 'changefreq' => 'monthly'],
        ['path' => 'returns',  'priority' => '0.4', 'changefreq' => 'monthly'],
        ['path' => 'privacy',  'priority' => '0.3', 'changefreq' => 'yearly'],
        ['path' => 'terms',    'priority' => '0.3', 'changefreq' => 'yearly'],
    ];

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    // Static Pages
    foreach ($staticPages as $page) {
        $loc = $page['path'] ? "{$baseUrl}/{$page['path']}" : $baseUrl;
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <changefreq>{$page['changefreq']}</changefreq>\n";
        echo "    <priority>{$page['priority']}</priority>\n";
        echo "  </url>\n";
    }

    // Categories
    foreach ($categories as $cat) {
        $loc = htmlspecialchars("{$baseUrl}/shop?category={$cat['slug']}", ENT_QUOTES, 'UTF-8');
        $date = !empty($cat['updatedAt']) ? substr($cat['updatedAt'], 0, 10) : date('Y-m-d');
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <lastmod>{$date}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }

    // Products
    foreach ($products as $prod) {
        $loc = htmlspecialchars("{$baseUrl}/product/{$prod['slug']}", ENT_QUOTES, 'UTF-8');
        $date = !empty($prod['updatedAt']) ? substr($prod['updatedAt'], 0, 10) : date('Y-m-d');
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <lastmod>{$date}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }

    // Blog Posts
    foreach ($posts as $post) {
        $loc = htmlspecialchars("{$baseUrl}/blog/{$post['slug']}", ENT_QUOTES, 'UTF-8');
        $date = !empty($post['updatedAt']) ? substr($post['updatedAt'], 0, 10) : date('Y-m-d');
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <lastmod>{$date}</lastmod>\n";
        echo "    <changefreq>monthly</changefreq>\n";
        echo "    <priority>0.7</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>';
} catch (\Throwable $e) {
    error_log('Sitemap generation exception: ' . $e->getMessage());
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    $baseUrl = rtrim(defined('APP_URL') ? APP_URL : 'https://prettypuff.store', '/');
    $defaultPages = ['', 'shop', 'blog', 'about', 'contact', 'faq'];
    $today = date('Y-m-d');
    foreach ($defaultPages as $p) {
        $loc = htmlspecialchars($p === '' ? $baseUrl : "{$baseUrl}/{$p}", ENT_QUOTES, 'UTF-8');
        echo "  <url>\n    <loc>{$loc}</loc>\n    <lastmod>{$today}</lastmod>\n    <priority>0.8</priority>\n  </url>\n";
    }
    echo '</urlset>';
}

