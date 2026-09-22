<?php
/**
 * Pretty Puff — Pure PHP JWT Helper
 * Generates and validates standard HS256 JSON Web Tokens
 * Fully compatible with jsonwebtoken npm package.
 */

declare(strict_types=1);

class JWT {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Sign payload with HS256 algorithm
     */
    public static function sign(array $payload, string $secret, int $expirySeconds = 604800): string {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $payload['iat'] = time();
        $payload['exp'] = time() + $expirySeconds;

        $encodedHeader = self::base64UrlEncode((string)json_encode($header));
        $encodedPayload = self::base64UrlEncode((string)json_encode($payload));

        $signature = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secret, true);
        $encodedSignature = self::base64UrlEncode($signature);

        return "{$encodedHeader}.{$encodedPayload}.{$encodedSignature}";
    }

    /**
     * Verify and decode a JWT token
     */
    public static function verify(string $token, string $secret): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        // Verify signature
        $expectedSignature = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secret, true);
        $actualSignature = self::base64UrlDecode($encodedSignature);

        if (!hash_equals($expectedSignature, $actualSignature)) {
            return null;
        }

        // Decode payload
        $payloadJson = self::base64UrlDecode($encodedPayload);
        $payload = json_decode($payloadJson, true);

        if (!is_array($payload)) {
            return null;
        }

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Expired
        }

        return $payload;
    }
}
