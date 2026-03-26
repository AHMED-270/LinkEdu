<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
$user = User::where('email', 'admin@linkedu.com')->first();
if (!$user) {
    echo "NO USER\n";
    exit;
}
echo "HASH: " . $user->password . "\n";
echo "CHECK: " . (Hash::check('Admin@2026', $user->password) ? 'OK' : 'FAIL') . "\n";
