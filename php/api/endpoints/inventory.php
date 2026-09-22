<?php
/**
 * Pretty Puff — Inventory API Endpoints
 * Converted from server/routes/inventory.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';

// GET /api/inventory/transactions (Audit logs)
if ($method === 'GET' && $first === 'transactions') {
    Auth::requirePermission('inventory.manage');

    $stmt = $db->query('
        SELECT t.*, p.name as productName, p.sku as productSku
        FROM `InventoryTransaction` t
        JOIN `Product` p ON t.productId = p.id
        ORDER BY t.createdAt DESC
        LIMIT 100
    ');
    $transactions = $stmt->fetchAll();
    json_success($transactions);
}

// POST /api/inventory/adjust (Adjust stock quantity)
if ($method === 'POST' && $first === 'adjust') {
    $admin = Auth::requirePermission('inventory.manage');
    $input = get_json_input();

    $productId = $input['productId'] ?? '';
    $variantId = $input['variantId'] ?? null;
    $changeType = $input['changeType'] ?? 'MANUAL_ADJUSTMENT';
    $quantity = (int)($input['quantity'] ?? 0);
    $reason = trim((string)($input['reason'] ?? 'Manual stock adjustment by admin'));

    if (empty($productId) || $quantity === 0) {
        json_error('Product ID and non-zero quantity change are required.', 400);
    }

    $pStmt = $db->prepare('SELECT id, name, stock FROM `Product` WHERE id = :id LIMIT 1');
    $pStmt->execute(['id' => $productId]);
    $prod = $pStmt->fetch();

    if (!$prod) {
        json_error('Product not found.', 404);
    }

    $prevStock = (int)$prod['stock'];
    $newStock = max(0, $prevStock + $quantity);
    $now = date('Y-m-d H:i:s');

    $db->beginTransaction();
    try {
        $db->prepare('UPDATE `Product` SET stock = :newStock, updatedAt = :now WHERE id = :id')
           ->execute(['newStock' => $newStock, 'now' => $now, 'id' => $productId]);

        $db->prepare('
            INSERT INTO `InventoryTransaction` (id, productId, variantId, changeType, quantityChanged, previousStock, newStock, reason, createdBy, createdAt)
            VALUES (:id, :productId, :variantId, :changeType, :qty, :prev, :new, :reason, :createdBy, :now)
        ')->execute([
            'id'         => generate_uuid(),
            'productId'  => $productId,
            'variantId'  => $variantId,
            'changeType' => $changeType,
            'qty'        => $quantity,
            'prev'       => $prevStock,
            'new'        => $newStock,
            'reason'     => $reason,
            'createdBy'  => $admin['email'] ?? 'ADMIN',
            'now'        => $now,
        ]);

        $db->commit();

        json_success([
            'productId' => $productId,
            'previous'  => $prevStock,
            'current'   => $newStock,
        ], 'Inventory stock adjusted successfully.');
    } catch (\Throwable $e) {
        $db->rollBack();
        json_error('Inventory adjustment failed: ' . $e->getMessage(), 500);
    }
}

// GET /api/inventory (Overview & Summary)
if ($method === 'GET' && empty($first)) {
    Auth::requirePermission('inventory.manage');

    $stmt = $db->query('
        SELECT p.id, p.name, p.sku, p.stock, p.lowStockThreshold, p.price, p.salePrice, p.thumbnail,
               c.name as categoryName
        FROM `Product` p
        LEFT JOIN `Category` c ON p.categoryId = c.id
        WHERE p.isArchived = 0
        ORDER BY p.stock ASC
    ');
    $products = $stmt->fetchAll();

    $totalProducts = count($products);
    $totalUnits = 0;
    $lowStockCount = 0;
    $outOfStockCount = 0;

    foreach ($products as &$p) {
        $stock = (int)$p['stock'];
        $threshold = (int)($p['lowStockThreshold'] ?? 5);

        $totalUnits += $stock;
        if ($stock <= 0) {
            $outOfStockCount++;
        } elseif ($stock <= $threshold) {
            $lowStockCount++;
        }

        $p['stock'] = $stock;
        $p['lowStockThreshold'] = $threshold;
    }
    unset($p);

    json_response([
        'success' => true,
        'data'    => $products,
        'summary' => [
            'totalProducts'   => $totalProducts,
            'totalUnits'      => $totalUnits,
            'lowStockCount'   => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
        ],
    ]);
}

json_error('Inventory endpoint not found.', 404);
