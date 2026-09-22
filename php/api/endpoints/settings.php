<?php
/**
 * Pretty Puff — Store, Shipping & Payment Settings API Endpoints
 * Converted from server/routes/settings.ts
 */

declare(strict_types=1);

$db = get_db();
$first = $routeSegments[0] ?? '';
$second = $routeSegments[1] ?? '';

// GET /api/settings (Public store settings)
if ($method === 'GET' && empty($first)) {
    $site = $db->query('SELECT * FROM `SiteSetting` WHERE id = "default" LIMIT 1')->fetch() ?: [
        'id'               => 'default',
        'storeName'        => 'Pretty Puff',
        'tagline'          => 'Luxury Cosmetics & Beauty Essentials',
        'announcementText' => 'Complimentary Luxury Gift Box & Express Shipping on Orders Above PKR 3,000 ✨',
        'supportEmail'     => 'sameerliaqat81@gmail.com',
        'supportPhone'     => '+923474542881',
        'whatsappNumber'   => '+923474542881',
        'currency'         => 'PKR',
    ];

    $shipping = $db->query('SELECT * FROM `ShippingSetting` WHERE id = "default" LIMIT 1')->fetch() ?: [
        'id'                    => 'default',
        'freeShippingThreshold' => 3000,
        'standardFee'           => 250,
        'expressFee'            => 450,
        'estimatedDeliveryDays' => '2-4 Business Days',
    ];

    $payment = $db->query('SELECT * FROM `PaymentSetting` WHERE id = "default" LIMIT 1')->fetch() ?: [
        'id'                    => 'default',
        'codEnabled'            => 1,
        'bankTransferEnabled'   => 1,
        'bankAccountTitle'      => 'Pretty Puff Cosmetics Pvt Ltd',
        'bankAccountNumber'     => '1234567890123456',
        'bankName'              => 'Meezan Bank Ltd',
        'easypaisaEnabled'      => 1,
        'easypaisaNumber'       => '03474542881',
    ];

    json_success([
        'site'     => $site,
        'shipping' => $shipping,
        'payment'  => $payment,
    ]);
}

// -------------------------------------------------------------
// ADMIN SETTINGS UPDATES
// -------------------------------------------------------------

// PUT /api/settings/admin/site
if ($method === 'PUT' && $first === 'admin' && $second === 'site') {
    Auth::requirePermission('settings.manage');
    $input = get_json_input();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `SiteSetting` (id, storeName, tagline, announcementText, supportEmail, supportPhone, whatsappNumber, currency, updatedAt)
        VALUES ("default", :storeName, :tagline, :announcementText, :supportEmail, :supportPhone, :whatsappNumber, :currency, :now)
        ON DUPLICATE KEY UPDATE
            storeName = VALUES(storeName),
            tagline = VALUES(tagline),
            announcementText = VALUES(announcementText),
            supportEmail = VALUES(supportEmail),
            supportPhone = VALUES(supportPhone),
            whatsappNumber = VALUES(whatsappNumber),
            currency = VALUES(currency),
            updatedAt = VALUES(updatedAt)
    ');

    $stmt->execute([
        'storeName'        => $input['storeName'] ?? 'Pretty Puff',
        'tagline'          => $input['tagline'] ?? '',
        'announcementText' => $input['announcementText'] ?? '',
        'supportEmail'     => $input['supportEmail'] ?? '',
        'supportPhone'     => $input['supportPhone'] ?? '',
        'whatsappNumber'   => $input['whatsappNumber'] ?? '',
        'currency'         => $input['currency'] ?? 'PKR',
        'now'              => $now,
    ]);

    json_success(null, 'Site settings updated successfully.');
}

// PUT /api/settings/admin/shipping
if ($method === 'PUT' && $first === 'admin' && $second === 'shipping') {
    Auth::requirePermission('settings.manage');
    $input = get_json_input();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `ShippingSetting` (id, freeShippingThreshold, standardFee, expressFee, estimatedDeliveryDays, updatedAt)
        VALUES ("default", :freeThreshold, :standardFee, :expressFee, :deliveryDays, :now)
        ON DUPLICATE KEY UPDATE
            freeShippingThreshold = VALUES(freeShippingThreshold),
            standardFee = VALUES(standardFee),
            expressFee = VALUES(expressFee),
            estimatedDeliveryDays = VALUES(estimatedDeliveryDays),
            updatedAt = VALUES(updatedAt)
    ');

    $stmt->execute([
        'freeThreshold' => (float)($input['freeShippingThreshold'] ?? 3000),
        'standardFee'   => (float)($input['standardFee'] ?? 250),
        'expressFee'    => (float)($input['expressFee'] ?? 450),
        'deliveryDays'  => $input['estimatedDeliveryDays'] ?? '2-4 Business Days',
        'now'           => $now,
    ]);

    json_success(null, 'Shipping settings updated successfully.');
}

// PUT /api/settings/admin/payment
if ($method === 'PUT' && $first === 'admin' && $second === 'payment') {
    Auth::requirePermission('settings.manage');
    $input = get_json_input();
    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare('
        INSERT INTO `PaymentSetting` (id, codEnabled, bankTransferEnabled, bankAccountTitle, bankAccountNumber, bankName, easypaisaEnabled, easypaisaNumber, updatedAt)
        VALUES ("default", :cod, :bank, :accountTitle, :accountNumber, :bankName, :ep, :epNumber, :now)
        ON DUPLICATE KEY UPDATE
            codEnabled = VALUES(codEnabled),
            bankTransferEnabled = VALUES(bankTransferEnabled),
            bankAccountTitle = VALUES(bankAccountTitle),
            bankAccountNumber = VALUES(bankAccountNumber),
            bankName = VALUES(bankName),
            easypaisaEnabled = VALUES(easypaisaEnabled),
            easypaisaNumber = VALUES(easypaisaNumber),
            updatedAt = VALUES(updatedAt)
    ');

    $stmt->execute([
        'cod'           => !empty($input['codEnabled']) ? 1 : 0,
        'bank'          => !empty($input['bankTransferEnabled']) ? 1 : 0,
        'accountTitle'  => $input['bankAccountTitle'] ?? '',
        'accountNumber' => $input['bankAccountNumber'] ?? '',
        'bankName'      => $input['bankName'] ?? '',
        'ep'            => !empty($input['easypaisaEnabled']) ? 1 : 0,
        'epNumber'      => $input['easypaisaNumber'] ?? '',
        'now'           => $now,
    ]);

    json_success(null, 'Payment settings updated successfully.');
}

json_error('Settings endpoint not found.', 404);
