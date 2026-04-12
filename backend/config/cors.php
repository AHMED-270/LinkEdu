<?php

$defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

$envAllowedOrigins = array_values(array_filter(array_map(
    static fn ($origin) => trim((string) $origin),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', '')))
)));

$allowedOrigins = array_values(array_unique(array_merge($defaultAllowedOrigins, $envAllowedOrigins)));

return [
    // Ensure sanctum routes are included
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout', 'forgot-password', 'reset-password'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [
        '#^https?://localhost(:\d+)?$#',
        '#^https?://127\.0\.0\.1(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // ✅ MUST be true when Axios has withCredentials = true
    'supports_credentials' => true,
];