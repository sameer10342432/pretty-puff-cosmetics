<?php
/**
 * Pretty Puff — HTTP & JSON Response Helpers
 */

declare(strict_types=1);

function json_response(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_success(mixed $data = null, ?string $message = null, array $extra = [], int $statusCode = 200): void {
    $res = ['success' => true];
    if ($message !== null) {
        $res['message'] = $message;
    }
    if ($data !== null) {
        $res['data'] = $data;
    }
    foreach ($extra as $key => $val) {
        $res[$key] = $val;
    }
    json_response($res, $statusCode);
}

function json_error(string $message, int $statusCode = 400, mixed $errors = null): void {
    $res = [
        'success' => false,
        'message' => $message,
    ];
    if ($errors !== null) {
        $res['errors'] = $errors;
    }
    json_response($res, $statusCode);
}

function get_json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $_POST;
    }
    return array_merge($_POST, $decoded);
}

function generate_uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant RFC 4122
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
