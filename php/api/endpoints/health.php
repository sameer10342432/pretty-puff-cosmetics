<?php
/**
 * Pretty Puff — API Health Check
 */

declare(strict_types=1);

json_response([
    'status'    => 'ok',
    'store'     => 'Pretty Puff Luxury Cosmetics',
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    'engine'    => 'PHP ' . PHP_VERSION,
    'database'  => 'MySQL (PDO)',
]);
