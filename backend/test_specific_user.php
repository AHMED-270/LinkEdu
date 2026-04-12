<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::where('email', 'sohaibfettah01@gmail.com')->get();
foreach($users as $user) {
    echo "ID: {$user->id} | Role: {$user->role} | Status: {$user->account_status}\n";
}