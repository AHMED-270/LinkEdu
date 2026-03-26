<?php

return [
    // Ensure sanctum routes are included
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

<<<<<<< HEAD
    
    'allowed_origins' => [ '*'],
=======
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
>>>>>>> 841693ccf38102b7643a92672f6482cff10ce837

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // ✅ MUST be true when Axios has withCredentials = true
    'supports_credentials' => true,
];