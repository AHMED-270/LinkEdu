<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$secretaires = \Illuminate\Support\Facades\DB::table('users')
    ->where('role', 'secretaire')
    ->select('id', 'name', 'email', 'role')
    ->get();

echo "\n========== SECRETAIRES ==========\n";
foreach ($secretaires as $s) {
    echo "ID: " . $s->id . " | Name: " . $s->name . " | Email: " . $s->email . "\n";
}
echo "\n";
