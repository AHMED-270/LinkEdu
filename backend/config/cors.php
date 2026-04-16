<?php

return [
    // Ensure sanctum routes are included
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout', 'forgot-password', 'reset-password'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'allowed_origins_patterns' => [
        '/^https?:\/\/localhost(:\d+)?$/',
        '/^https?:\/\/127\.0\.0\.1(:\d+)?$/',
        '/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/',
        '/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/',
        '/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/',
        '/^https:\/\/[a-z0-9-]+\.onrender\.com$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // ✅ MUST be true when Axios has withCredentials = true
    'supports_credentials' => true,
];