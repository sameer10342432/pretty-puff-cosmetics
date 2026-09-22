<?php
/**
 * Pretty Puff — Analytics & Dashboard API Endpoints
 * Converted from server/routes/analytics.ts
 */

declare(strict_types=1);

$db = get_db();
Auth::requirePermission('dashboard.view');

$first = $routeSegments[0] ?? '';

// GET /api/analytics/dashboard
if ($method === 'GET' && ($first === 'dashboard' || empty($first))) {
    $now = new DateTime();
    $todayStr = $now->format('Y-m-d 00:00:00');
    $monthStr = $now->format('Y-m-01 00:00:00');

    // 1. Sales and order summary
    $salesRow = $db->query('
        SELECT 
            COALESCE(SUM(total), 0) as totalSales,
            COUNT(id) as totalOrders,
            COALESCE(AVG(total), 0) as averageOrderValue
        FROM `Order`
        WHERE orderStatus != "CANCELLED"
    ')->fetch();

    $todaySales = (float)$db->query("
        SELECT COALESCE(SUM(total), 0)
        FROM `Order`
        WHERE createdAt >= '{$todayStr}' AND orderStatus != 'CANCELLED'
    ")->fetchColumn();

    $thisMonthSales = (float)$db->query("
        SELECT COALESCE(SUM(total), 0)
        FROM `Order`
        WHERE createdAt >= '{$monthStr}' AND orderStatus != 'CANCELLED'
    ")->fetchColumn();

    $totalCustomers = (int)$db->query('SELECT COUNT(DISTINCT email) FROM `Order`')->fetchColumn();
    $totalProducts = (int)$db->query('SELECT COUNT(id) FROM `Product` WHERE isArchived = 0')->fetchColumn();
    $lowStockProducts = (int)$db->query('SELECT COUNT(id) FROM `Product` WHERE isArchived = 0 AND stock > 0 AND stock <= 5')->fetchColumn();
    $outOfStockProducts = (int)$db->query('SELECT COUNT(id) FROM `Product` WHERE isArchived = 0 AND stock <= 0')->fetchColumn();
    $publishedBlogs = (int)$db->query('SELECT COUNT(id) FROM `BlogPost` WHERE status = "PUBLISHED" OR isPublished = 1')->fetchColumn();

    $pendingOrders = (int)$db->query('SELECT COUNT(id) FROM `Order` WHERE orderStatus = "PENDING"')->fetchColumn();
    $completedOrders = (int)$db->query('SELECT COUNT(id) FROM `Order` WHERE orderStatus = "DELIVERED" OR orderStatus = "COMPLETED"')->fetchColumn();
    $cancelledOrders = (int)$db->query('SELECT COUNT(id) FROM `Order` WHERE orderStatus = "CANCELLED"')->fetchColumn();

    $metrics = [
        'totalSales'         => (float)($salesRow['totalSales'] ?? 0),
        'todaySales'         => $todaySales,
        'thisMonthSales'     => $thisMonthSales,
        'totalOrders'        => (int)($salesRow['totalOrders'] ?? 0),
        'pendingOrders'      => $pendingOrders,
        'completedOrders'    => $completedOrders,
        'cancelledOrders'    => $cancelledOrders,
        'totalCustomers'     => $totalCustomers,
        'totalProducts'      => $totalProducts,
        'lowStockProducts'   => $lowStockProducts,
        'outOfStockProducts' => $outOfStockProducts,
        'publishedBlogs'     => $publishedBlogs,
        'averageOrderValue'  => round((float)($salesRow['averageOrderValue'] ?? 0), 2),
    ];

    // 2. Sales Over Time (Last 7 Days) for Live Feed Chart
    $salesOverTime = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = (new DateTime())->modify("-{$i} days");
        $dayStart = $d->format('Y-m-d 00:00:00');
        $dayEnd = $d->format('Y-m-d 23:59:59');
        $dayLabel = $d->format('D, M j');

        $stmt = $db->prepare('
            SELECT COALESCE(SUM(total), 0) as sales, COUNT(id) as orders
            FROM `Order`
            WHERE createdAt >= :start AND createdAt <= :end AND orderStatus != "CANCELLED"
        ');
        $stmt->execute(['start' => $dayStart, 'end' => $dayEnd]);
        $row = $stmt->fetch();

        $salesOverTime[] = [
            'date'   => $dayLabel,
            'sales'  => (float)($row['sales'] ?? 0),
            'orders' => (int)($row['orders'] ?? 0),
        ];
    }

    // 3. Category Distribution (Count of active products per category)
    $catStmt = $db->query('
        SELECT c.name as category, COUNT(p.id) as count
        FROM `Category` c
        LEFT JOIN `Product` p ON p.categoryId = c.id AND p.isArchived = 0
        WHERE c.isActive = 1
        GROUP BY c.id
        ORDER BY count DESC
        LIMIT 6
    ');
    $categoryDistribution = [];
    while ($row = $catStmt->fetch()) {
        $categoryDistribution[] = [
            'category' => (string)$row['category'],
            'count'    => (int)$row['count'],
        ];
    }

    // 4. Low Stock Alert Items (≤ 5 units in stock)
    $lowStockStmt = $db->query('
        SELECT id, name, sku, thumbnail, stock, lowStockThreshold
        FROM `Product`
        WHERE isArchived = 0 AND stock <= 5
        ORDER BY stock ASC
        LIMIT 5
    ');
    $lowStockAlerts = [];
    while ($row = $lowStockStmt->fetch()) {
        $lowStockAlerts[] = [
            'id'                => (string)$row['id'],
            'name'              => (string)$row['name'],
            'sku'               => (string)($row['sku'] ?? ''),
            'thumbnail'         => (string)($row['thumbnail'] ?? ''),
            'stock'             => (int)$row['stock'],
            'lowStockThreshold' => (int)($row['lowStockThreshold'] ?? 5),
        ];
    }

    // 5. Recent 8 Orders
    $recentStmt = $db->query('
        SELECT id, orderNumber, fullName, email, city, total, orderStatus, paymentStatus, paymentMethod, createdAt
        FROM `Order`
        ORDER BY createdAt DESC
        LIMIT 8
    ');
    $recentOrders = [];
    while ($row = $recentStmt->fetch()) {
        $recentOrders[] = [
            'id'            => (string)$row['id'],
            'orderNumber'   => (string)$row['orderNumber'],
            'fullName'      => (string)$row['fullName'],
            'email'         => (string)$row['email'],
            'city'          => (string)($row['city'] ?? 'N/A'),
            'total'         => (float)$row['total'],
            'orderStatus'   => (string)$row['orderStatus'],
            'paymentStatus' => (string)$row['paymentStatus'],
            'paymentMethod' => (string)$row['paymentMethod'],
            'createdAt'     => (string)$row['createdAt'],
        ];
    }

    // 6. Top Products
    $topProductsStmt = $db->query('
        SELECT p.id, p.name, p.thumbnail, p.price, p.salePrice, p.stock, p.rating
        FROM `Product` p
        WHERE p.isActive = 1 AND p.isArchived = 0
        ORDER BY p.isBestSeller DESC, p.rating DESC
        LIMIT 5
    ');
    $topProducts = $topProductsStmt->fetchAll();

    json_success([
        'metrics'        => $metrics,
        'charts'         => [
            'salesOverTime'        => $salesOverTime,
            'categoryDistribution' => $categoryDistribution,
        ],
        'recentOrders'   => $recentOrders,
        'lowStockAlerts' => $lowStockAlerts,
        'topProducts'    => $topProducts,
    ]);
}

json_error('Analytics endpoint not found.', 404);
