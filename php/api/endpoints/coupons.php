<?php
/**
 * Pretty Puff — Coupons API Endpoints
 * Converted from server/routes/coupons.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';

// POST /api/coupons/validate (Public customer coupon verification)
if ($method === 'POST' && $first === 'validate') {
    $input = get_json_input();
    $code = strtoupper(trim((string)($input['code'] ?? '')));
    $subtotal = (float)($input['subtotal'] ?? 0);

    if (empty($code)) {
        json_error('Coupon code is required.', 400);
    }

    $stmt = $db->prepare('SELECT * FROM `Coupon` WHERE UPPER(code) = :code LIMIT 1');
    $stmt->execute(['code' => $code]);
    $coupon = $stmt->fetch();

    if (!$coupon) {
        json_error("Coupon code '{$code}' does not exist.", 404);
    }

    if (!$coupon['isActive']) {
        json_error('This coupon is currently inactive.', 400);
    }

    $now = time();
    if ($coupon['startDate'] && strtotime($coupon['startDate']) > $now) {
        json_error('This promotional coupon is not active yet.', 400);
    }

    if ($coupon['expiryDate'] && strtotime($coupon['expiryDate']) < $now) {
        json_error('This coupon has expired.', 400);
    }

    if ($coupon['minOrderAmount'] && $subtotal < (float)$coupon['minOrderAmount']) {
        $min = number_format((float)$coupon['minOrderAmount']);
        json_error("Minimum order amount of PKR {$min} required for this coupon.", 400);
    }

    if ($coupon['usageLimit'] && (int)$coupon['usageCount'] >= (int)$coupon['usageLimit']) {
        json_error('This coupon has reached its maximum redemptions limit.', 400);
    }

    $discountAmount = 0.0;
    if ($coupon['discountType'] === 'PERCENTAGE') {
        $discountAmount = round(($subtotal * (float)$coupon['discountValue']) / 100);
        if ($coupon['maxDiscountAmount'] && $discountAmount > (float)$coupon['maxDiscountAmount']) {
            $discountAmount = (float)$coupon['maxDiscountAmount'];
        }
    } else {
        $discountAmount = min((float)$coupon['discountValue'], $subtotal);
    }

    json_success([
        'coupon' => [
            'id'            => $coupon['id'],
            'code'          => $coupon['code'],
            'discountType'  => $coupon['discountType'],
            'discountValue' => (float)$coupon['discountValue'],
            'description'   => $coupon['description'],
        ],
        'discountAmount' => $discountAmount,
        'newTotal'       => max(0.0, $subtotal - $discountAmount),
    ], 'Coupon successfully applied.');
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// GET /api/coupons/admin
if ($method === 'GET' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('coupons.manage');
    $stmt = $db->query('SELECT * FROM `Coupon` ORDER BY createdAt DESC');
    $coupons = $stmt->fetchAll();
    json_success($coupons);
}

// POST /api/coupons/admin
if ($method === 'POST' && $first === 'admin' && empty($second)) {
    Auth::requirePermission('coupons.manage');
    $input = get_json_input();

    $code = strtoupper(trim((string)($input['code'] ?? '')));
    $discountType = ($input['discountType'] ?? 'PERCENTAGE') === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    $discountValue = (float)($input['discountValue'] ?? 0);

    if (empty($code) || $discountValue <= 0) {
        json_error('Coupon code and positive discount value are required.', 400);
    }

    $existing = $db->prepare('SELECT id FROM `Coupon` WHERE UPPER(code) = :code LIMIT 1');
    $existing->execute(['code' => $code]);
    if ($existing->fetch()) {
        json_error("Coupon with code '{$code}' already exists.", 400);
    }

    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `Coupon` (
            id, code, description, discountType, discountValue, maxDiscountAmount,
            minOrderAmount, usageLimit, usageCount, startDate, expiryDate, isActive, createdAt, updatedAt
        ) VALUES (
            :id, :code, :description, :discountType, :discountValue, :maxDiscountAmount,
            :minOrderAmount, :usageLimit, 0, :startDate, :expiryDate, :isActive, :now, :now
        )
    ');

    $stmt->execute([
        'id'                => $id,
        'code'              => $code,
        'description'       => $input['description'] ?? null,
        'discountType'      => $discountType,
        'discountValue'     => $discountValue,
        'maxDiscountAmount' => !empty($input['maxDiscountAmount']) ? (float)$input['maxDiscountAmount'] : null,
        'minOrderAmount'    => !empty($input['minOrderAmount']) ? (float)$input['minOrderAmount'] : null,
        'usageLimit'        => !empty($input['usageLimit']) ? (int)$input['usageLimit'] : null,
        'startDate'         => !empty($input['startDate']) ? date('Y-m-d H:i:s', strtotime($input['startDate'])) : null,
        'expiryDate'        => !empty($input['expiryDate']) ? date('Y-m-d H:i:s', strtotime($input['expiryDate'])) : null,
        'isActive'          => isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : 1,
        'now'               => $now,
    ]);

    json_success(['id' => $id, 'code' => $code], 'Coupon created successfully.', [], 201);
}

// PUT /api/coupons/admin/:id
if ($method === 'PUT' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('coupons.manage');
    $id = $second;
    $input = get_json_input();

    $fields = [];
    $params = ['id' => $id, 'now' => date('Y-m-d H:i:s')];

    if (isset($input['code'])) {
        $fields[] = 'code = :code';
        $params['code'] = strtoupper(trim((string)$input['code']));
    }
    if (array_key_exists('description', $input)) {
        $fields[] = 'description = :description';
        $params['description'] = $input['description'];
    }
    if (isset($input['discountType'])) {
        $fields[] = 'discountType = :discountType';
        $params['discountType'] = $input['discountType'] === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    }
    if (isset($input['discountValue'])) {
        $fields[] = 'discountValue = :discountValue';
        $params['discountValue'] = (float)$input['discountValue'];
    }
    if (array_key_exists('maxDiscountAmount', $input)) {
        $fields[] = 'maxDiscountAmount = :maxDiscountAmount';
        $params['maxDiscountAmount'] = !empty($input['maxDiscountAmount']) ? (float)$input['maxDiscountAmount'] : null;
    }
    if (array_key_exists('minOrderAmount', $input)) {
        $fields[] = 'minOrderAmount = :minOrderAmount';
        $params['minOrderAmount'] = !empty($input['minOrderAmount']) ? (float)$input['minOrderAmount'] : null;
    }
    if (array_key_exists('usageLimit', $input)) {
        $fields[] = 'usageLimit = :usageLimit';
        $params['usageLimit'] = !empty($input['usageLimit']) ? (int)$input['usageLimit'] : null;
    }
    if (isset($input['isActive'])) {
        $fields[] = 'isActive = :isActive';
        $params['isActive'] = $input['isActive'] ? 1 : 0;
    }

    if (!empty($fields)) {
        $sql = 'UPDATE `Coupon` SET ' . implode(', ', $fields) . ', updatedAt = :now WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    json_success(['id' => $id], 'Coupon updated successfully.');
}

// DELETE /api/coupons/admin/:id
if ($method === 'DELETE' && $first === 'admin' && !empty($second)) {
    Auth::requirePermission('coupons.manage');
    $id = $second;

    $db->prepare('DELETE FROM `CouponUsage` WHERE couponId = :id')->execute(['id' => $id]);
    $db->prepare('DELETE FROM `Coupon` WHERE id = :id')->execute(['id' => $id]);
    json_success(null, 'Coupon deleted.');
}

json_error('Coupon endpoint not found.', 404);
