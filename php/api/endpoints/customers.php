<?php
/**
 * Pretty Puff — Customers Directory API Endpoints
 * Converted from server/routes/customers.ts
 */

declare(strict_types=1);

$db = get_db();
Auth::requirePermission('customers.manage');

$search = trim($_GET['search'] ?? '');
$where = '1=1';
$params = [];
if ($search !== '') {
    $where = '(fullName LIKE :q OR email LIKE :q OR phone LIKE :q OR city LIKE :q)';
    $params['q'] = "%$search%";
}

$stmt = $db->prepare("
    SELECT 
        email,
        MAX(fullName) as fullName,
        MAX(phone) as phone,
        MAX(city) as city,
        COUNT(id) as totalOrders,
        SUM(total) as totalSpent,
        MAX(createdAt) as lastOrderDate
    FROM `Order`
    WHERE $where
    GROUP BY email
    ORDER BY totalSpent DESC
");
$stmt->execute($params);
$customers = $stmt->fetchAll();

$totalCustomers = count($customers);
$totalRevenue = 0.0;
foreach ($customers as &$c) {
    $c['totalOrders'] = (int)$c['totalOrders'];
    $c['totalSpent'] = (float)$c['totalSpent'];
    $totalRevenue += $c['totalSpent'];
}
unset($c);

json_response([
    'success' => true,
    'data'    => $customers,
    'summary' => [
        'totalCustomers' => $totalCustomers,
        'totalRevenue'   => $totalRevenue,
    ],
]);
