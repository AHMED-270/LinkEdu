<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'LinkEdu API',
        'status' => 'ok',
        'debug' => 'my-custom-change',
    ]);
});

require __DIR__.'/auth.php';
