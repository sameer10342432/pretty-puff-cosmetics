<?php
/**
 * Pretty Puff — Orders & Checkout API Endpoints
 * Converted from server/routes/orders.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';
$third = $routeSegments[2] ?? '';

// -------------------------------------------------------------
// 1. ADMIN ORDER MANAGEMENT
// -------------------------------------------------------------

// GET /api/orders/admin/list
if ($method === 'GET' && $first === 'admin' && $second === 'list') {
    Auth::requirePermission('orders.manage');

    $status = $_GET['status'] ?? '';
    $paymentStatus = $_GET['paymentStatus'] ?? '';
    $search = trim($_GET['search'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($status !== '') {
        $where[] = 'o.orderStatus = :status';
        $params['status'] = $status;
    }
    if ($paymentStatus !== '') {
        $where[] = 'o.paymentStatus = :paymentStatus';
        $params['paymentStatus'] = $paymentStatus;
    }
    if ($search !== '') {
        $where[] = '(o.orderNumber LIKE :q OR o.fullName LIKE :q OR o.email LIKE :q OR o.phone LIKE :q)';
        $params['q'] = "%$search%";
    }

    $whereSql = implode(' AND ', $where);

    $countStmt = $db->prepare("SELECT COUNT(*) FROM `Order` o WHERE $whereSql");
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();

    $dataStmt = $db->prepare("
        SELECT o.* 
        FROM `Order` o
        WHERE $whereSql
        ORDER BY o.createdAt DESC
        LIMIT $limit OFFSET $offset
    ");
    $dataStmt->execute($params);
    $orders = $dataStmt->fetchAll();

    // Attach items to each order
    if (!empty($orders)) {
        $orderIds = array_column($orders, 'id');
        $inQuery = implode(',', array_fill(0, count($orderIds), '?'));
        $itemStmt = $db->prepare("SELECT * FROM `OrderItem` WHERE orderId IN ($inQuery)");
        $itemStmt->execute($orderIds);
        $allItems = $itemStmt->fetchAll();

        $itemsByOrder = [];
        foreach ($allItems as $it) {
            $itemsByOrder[$it['orderId']][] = $it;
        }

        foreach ($orders as &$ord) {
            $ord['items'] = $itemsByOrder[$ord['id']] ?? [];
        }
        unset($ord);
    }

    json_response([
        'success'    => true,
        'data'       => $orders,
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $totalCount,
            'totalPages' => (int)ceil($totalCount / $limit),
        ],
    ]);
}

// PATCH /api/orders/admin/:id/status
if ($method === 'PATCH' && $first === 'admin' && !empty($second) && $third === 'status') {
    Auth::requirePermission('orders.manage');
    $orderId = $second;
    $input = get_json_input();
    $newStatus = $input['status'] ?? null;
    $paymentStatus = $input['paymentStatus'] ?? null;

    $stmt = $db->prepare('SELECT * FROM `Order` WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        json_error('Order not found.', 404);
    }

    $fields = [];
    $params = ['id' => $orderId, 'now' => date('Y-m-d H:i:s')];

    if ($newStatus !== null) {
        $fields[] = 'orderStatus = :orderStatus';
        $params['orderStatus'] = $newStatus;
    }
    if ($paymentStatus !== null) {
        $fields[] = 'paymentStatus = :paymentStatus';
        $params['paymentStatus'] = $paymentStatus;
    }

    if (!empty($fields)) {
        $db->beginTransaction();
        try {
            $sql = 'UPDATE `Order` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
            $db->prepare($sql)->execute($params);

            // If order cancelled and wasn't previously cancelled, restore inventory
            if ($newStatus === 'CANCELLED' && $order['orderStatus'] !== 'CANCELLED') {
                $itemsStmt = $db->prepare('SELECT * FROM `OrderItem` WHERE orderId = :id');
                $itemsStmt->execute(['id' => $orderId]);
                $items = $itemsStmt->fetchAll();

                $now = date('Y-m-d H:i:s');
                foreach ($items as $item) {
                    $prodStmt = $db->prepare('SELECT stock FROM `Product` WHERE id = :id LIMIT 1');
                    $prodStmt->execute(['id' => $item['productId']]);
                    $prod = $prodStmt->fetch();

                    if ($prod) {
                        $prevStock = (int)$prod['stock'];
                        $restoredStock = $prevStock + (int)$item['quantity'];

                        $db->prepare('UPDATE `Product` SET stock = :s, updatedAt = :now WHERE id = :id')
                           ->execute(['s' => $restoredStock, 'now' => $now, 'id' => $item['productId']]);

                        $db->prepare('
                            INSERT INTO `InventoryTransaction` (id, productId, variantId, orderId, changeType, quantityChanged, previousStock, newStock, reason, createdBy, createdAt)
                            VALUES (:id, :productId, :variantId, :orderId, "ORDER_CANCELLATION", :qty, :prev, :new, :reason, "ADMIN", :now)
                        ')->execute([
                            'id'         => generate_uuid(),
                            'productId'  => $item['productId'],
                            'variantId'  => $item['variantId'],
                            'orderId'    => $orderId,
                            'qty'        => (int)$item['quantity'],
                            'prev'       => $prevStock,
                            'new'        => $restoredStock,
                            'reason'     => "Restored stock from cancelled order #{$order['orderNumber']}",
                            'now'        => $now,
                        ]);
                    }
                }
            }

            $db->commit();
            json_success(['id' => $orderId], 'Order status updated successfully.');
        } catch (\Throwable $e) {
            $db->rollBack();
            json_error('Failed to update order status: ' . $e->getMessage(), 500);
        }
    }

    json_success(['id' => $orderId], 'No changes applied.');
}

// PATCH /api/orders/admin/:id/details
if ($method === 'PATCH' && $first === 'admin' && !empty($second) && $third === 'details') {
    Auth::requirePermission('orders.manage');
    $orderId = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $orderId, 'now' => date('Y-m-d H:i:s')];

    if (isset($input['trackingNumber'])) {
        $fields[] = 'trackingNumber = :trackingNumber';
        $params['trackingNumber'] = trim((string)$input['trackingNumber']);
    }
    if (isset($input['internalNotes'])) {
        $fields[] = 'internalNotes = :internalNotes';
        $params['internalNotes'] = trim((string)$input['internalNotes']);
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `Order` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $orderId], 'Order details updated.');
}

// DELETE /api/orders/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('orders.manage');
    $orderId = $second;

    $db->prepare('DELETE FROM `OrderItem` WHERE orderId = :id')->execute(['id' => $orderId]);
    $db->prepare('DELETE FROM `Order` WHERE id = :id')->execute(['id' => $orderId]);
    json_success(null, 'Order deleted successfully.');
}

// -------------------------------------------------------------
// 2. PUBLIC CUSTOMER CHECKOUT & ORDER LOOKUP
// -------------------------------------------------------------

// GET /api/orders/:orderNumber (Order confirmation / tracking)
if ($method === 'GET' && !empty($first) && $first !== 'admin') {
    $orderNumber = strtoupper(trim($first));
    $stmt = $db->prepare('SELECT * FROM `Order` WHERE UPPER(orderNumber) = :on LIMIT 1');
    $stmt->execute(['on' => $orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        json_error('Order not found.', 404);
    }

    $itemStmt = $db->prepare('SELECT * FROM `OrderItem` WHERE orderId = :id');
    $itemStmt->execute(['id' => $order['id']]);
    $order['items'] = $itemStmt->fetchAll();

    json_success($order);
}

// POST /api/orders (Customer Place Order)
if ($method === 'POST' && empty($first)) {
    $input = get_json_input();

    $fullName = trim((string)($input['fullName'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $phone = trim((string)($input['phone'] ?? ''));
    $city = trim((string)($input['city'] ?? ''));
    $province = !empty($input['province']) ? trim((string)$input['province']) : null;
    $postalCode = !empty($input['postalCode']) ? trim((string)$input['postalCode']) : null;
    $address = trim((string)($input['address'] ?? ''));
    $notes = !empty($input['notes']) ? trim((string)$input['notes']) : null;
    $couponCode = !empty($input['couponCode']) ? strtoupper(trim((string)$input['couponCode'])) : null;
    $rawPayment = strtoupper(trim((string)($input['paymentMethod'] ?? 'COD')));
    $items = $input['items'] ?? [];

    if (empty($fullName) || empty($email) || empty($phone) || empty($city) || empty($address)) {
        json_error('Please complete all required customer and shipping fields.', 400);
    }

    if (!is_array($items) || count($items) === 0) {
        json_error('Your order cart is empty.', 400);
    }

    // Payment method mapping
    $paymentMethod = 'COD';
    if (str_contains($rawPayment, 'BANK') || str_contains($rawPayment, 'TRANSFER')) {
        $paymentMethod = 'BANK_TRANSFER';
    } elseif (str_contains($rawPayment, 'EASYPAISA') || str_contains($rawPayment, 'JAZZCASH')) {
        $paymentMethod = 'EASYPAISA';
    }

    // Fetch shipping settings
    $shipSetting = $db->query('SELECT freeShippingThreshold, standardFee FROM `ShippingSetting` WHERE id = "default" LIMIT 1')->fetch();
    $freeThreshold = $shipSetting ? (float)$shipSetting['freeShippingThreshold'] : 3000.0;
    $standardFee = $shipSetting ? (float)$shipSetting['standardFee'] : 250.0;

    // Resolve items from database and calculate subtotal
    $subtotal = 0.0;
    $resolvedItems = [];

    foreach ($items as $it) {
        $productId = $it['productId'] ?? null;
        $sku = $it['sku'] ?? null;
        $productName = $it['productName'] ?? '';
        $qty = max(1, (int)($it['quantity'] ?? 1));

        $dbProduct = null;
        if ($productId) {
            $pStmt = $db->prepare('SELECT * FROM `Product` WHERE id = :id LIMIT 1');
            $pStmt->execute(['id' => $productId]);
            $dbProduct = $pStmt->fetch();
        }
        if (!$dbProduct && $sku) {
            $pStmt = $db->prepare('SELECT * FROM `Product` WHERE sku = :sku LIMIT 1');
            $pStmt->execute(['sku' => $sku]);
            $dbProduct = $pStmt->fetch();
        }
        if (!$dbProduct && $productName) {
            $pStmt = $db->prepare('SELECT * FROM `Product` WHERE name = :name LIMIT 1');
            $pStmt->execute(['name' => $productName]);
            $dbProduct = $pStmt->fetch();
        }
        if (!$dbProduct) {
            $dbProduct = $db->query('SELECT * FROM `Product` WHERE isActive = 1 LIMIT 1')->fetch();
        }

        if (!$dbProduct) {
            json_error("Product '{$productName}' could not be located in catalog.", 400);
        }

        $activePrice = isset($dbProduct['salePrice']) && $dbProduct['salePrice'] !== null
            ? (float)$dbProduct['salePrice']
            : (float)$dbProduct['price'];

        $subtotal += $activePrice * $qty;

        $resolvedItems[] = [
            'dbProductId'    => $dbProduct['id'],
            'variantId'      => $it['variantId'] ?? null,
            'productName'    => $dbProduct['name'],
            'variantName'    => $it['variantName'] ?? null,
            'sku'            => $dbProduct['sku'] ?: 'PP-SKU',
            'price'          => $activePrice,
            'quantity'       => $qty,
            'selectedColour' => $it['selectedColour'] ?? null,
            'selectedSize'   => $it['selectedSize'] ?? null,
        ];
    }

    // Validate Coupon
    $discount = 0.0;
    $validCouponId = null;

    if ($couponCode) {
        $cStmt = $db->prepare('SELECT * FROM `Coupon` WHERE UPPER(code) = :code LIMIT 1');
        $cStmt->execute(['code' => $couponCode]);
        $coupon = $cStmt->fetch();

        if ($coupon && $coupon['isActive']) {
            $nowTime = time();
            $startTime = $coupon['startDate'] ? strtotime($coupon['startDate']) : null;
            $expiryTime = $coupon['expiryDate'] ? strtotime($coupon['expiryDate']) : null;

            $notExpired = (!$startTime || $startTime <= $nowTime) && (!$expiryTime || $expiryTime >= $nowTime);
            $meetsMin = !$coupon['minOrderAmount'] || $subtotal >= (float)$coupon['minOrderAmount'];
            $withinLimit = !$coupon['usageLimit'] || (int)$coupon['usageCount'] < (int)$coupon['usageLimit'];

            if ($notExpired && $meetsMin && $withinLimit) {
                $validCouponId = $coupon['id'];
                if ($coupon['discountType'] === 'PERCENTAGE') {
                    $discount = round(($subtotal * (float)$coupon['discountValue']) / 100);
                    if ($coupon['maxDiscountAmount'] && $discount > (float)$coupon['maxDiscountAmount']) {
                        $discount = (float)$coupon['maxDiscountAmount'];
                    }
                } else {
                    $discount = min((float)$coupon['discountValue'], $subtotal);
                }
            }
        }
    }

    $shippingFee = $subtotal >= $freeThreshold ? 0.0 : $standardFee;
    $total = max(0.0, $subtotal - $discount + $shippingFee);
    $orderNumber = 'PP-' . random_int(100000, 999999);
    $orderId = generate_uuid();
    $now = date('Y-m-d H:i:s');

    // Atomic PDO Transaction
    $db->beginTransaction();
    try {
        // Insert Order
        $orderStmt = $db->prepare('
            INSERT INTO `Order` (
                id, orderNumber, fullName, email, phone, city, province, postalCode, address, notes,
                subtotal, discount, shippingFee, total, couponCode, paymentMethod, paymentStatus, orderStatus,
                createdAt, updatedAt
            ) VALUES (
                :id, :orderNumber, :fullName, :email, :phone, :city, :province, :postalCode, :address, :notes,
                :subtotal, :discount, :shippingFee, :total, :couponCode, :paymentMethod, "PENDING", "PENDING",
                :now, :now
            )
        ');
        $orderStmt->execute([
            'id'            => $orderId,
            'orderNumber'   => $orderNumber,
            'fullName'      => $fullName,
            'email'         => $email,
            'phone'         => $phone,
            'city'          => $city,
            'province'      => $province,
            'postalCode'    => $postalCode,
            'address'       => $address,
            'notes'         => $notes,
            'subtotal'      => $subtotal,
            'discount'      => $discount,
            'shippingFee'   => $shippingFee,
            'total'         => $total,
            'couponCode'    => $couponCode,
            'paymentMethod' => $paymentMethod,
            'now'           => $now,
        ]);

        // Insert OrderItems & Decrement Stock
        $itemIns = $db->prepare('
            INSERT INTO `OrderItem` (id, orderId, productId, variantId, productName, variantName, sku, price, quantity, total, selectedColour, selectedSize, createdAt, updatedAt)
            VALUES (:id, :orderId, :productId, :variantId, :productName, :variantName, :sku, :price, :quantity, :total, :selectedColour, :selectedSize, :now, :now)
        ');

        $stockStmt = $db->prepare('SELECT stock FROM `Product` WHERE id = :id LIMIT 1');
        $stockUpdate = $db->prepare('UPDATE `Product` SET stock = :newStock, updatedAt = :now WHERE id = :id');
        $txStmt = $db->prepare('
            INSERT INTO `InventoryTransaction` (id, productId, variantId, orderId, changeType, quantityChanged, previousStock, newStock, reason, createdBy, createdAt)
            VALUES (:id, :productId, :variantId, :orderId, "ORDER_DEDUCTION", :qty, :prev, :new, :reason, "SYSTEM_CHECKOUT", :now)
        ');

        foreach ($resolvedItems as $ritem) {
            $itemId = generate_uuid();
            $itemTotal = $ritem['price'] * $ritem['quantity'];

            $itemIns->execute([
                'id'             => $itemId,
                'orderId'        => $orderId,
                'productId'      => $ritem['dbProductId'],
                'variantId'      => $ritem['variantId'],
                'productName'    => $ritem['productName'],
                'variantName'    => $ritem['variantName'],
                'sku'            => $ritem['sku'],
                'price'          => $ritem['price'],
                'quantity'       => $ritem['quantity'],
                'total'          => $itemTotal,
                'selectedColour' => $ritem['selectedColour'],
                'selectedSize'   => $ritem['selectedSize'],
                'now'            => $now,
            ]);

            // Stock update
            $stockStmt->execute(['id' => $ritem['dbProductId']]);
            $prodRow = $stockStmt->fetch();
            if ($prodRow) {
                $prev = (int)$prodRow['stock'];
                $new = max(0, $prev - $ritem['quantity']);
                $stockUpdate->execute(['newStock' => $new, 'now' => $now, 'id' => $ritem['dbProductId']]);

                $txStmt->execute([
                    'id'         => generate_uuid(),
                    'productId'  => $ritem['dbProductId'],
                    'variantId'  => $ritem['variantId'],
                    'orderId'    => $orderId,
                    'qty'        => -$ritem['quantity'],
                    'prev'       => $prev,
                    'new'        => $new,
                    'reason'     => "Deduction for customer order #{$orderNumber}",
                    'now'        => $now,
                ]);
            }
        }

        // Record Coupon Usage
        if ($validCouponId) {
            $db->prepare('
                INSERT INTO `CouponUsage` (id, couponId, orderId, customerEmail, discountAmount, createdAt)
                VALUES (:id, :couponId, :orderId, :email, :disc, :now)
            ')->execute([
                'id'       => generate_uuid(),
                'couponId' => $validCouponId,
                'orderId'  => $orderId,
                'email'    => $email,
                'disc'     => $discount,
                'now'      => $now,
            ]);

            $db->prepare('UPDATE `Coupon` SET usageCount = usageCount + 1 WHERE id = :id')
               ->execute(['id' => $validCouponId]);
        }

        $db->commit();

        json_success([
            'id'          => $orderId,
            'orderNumber' => $orderNumber,
            'total'       => $total,
            'subtotal'    => $subtotal,
            'discount'    => $discount,
            'shippingFee' => $shippingFee,
        ], 'Order created successfully.', [], 201);
    } catch (\Throwable $e) {
        $db->rollBack();
        json_error('Order processing failed: ' . $e->getMessage(), 500);
    }
}

json_error('Orders endpoint not found.', 404);
