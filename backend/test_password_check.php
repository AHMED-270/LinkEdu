<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = $argv[1] ?? 'prof.test@example.com';
$password = $argv[2] ?? 'P@ssProf2026!';

$user = User::where('email', $email)->first();

if (! $user) {
    echo "User not found for email: {$email}\n";
    exit(1);
}

$id = $user->id ?? $user->getKey();
echo "Found user id: {$id}\n";
echo "role: " . ($user->role ?? 'null') . "\n";
echo "account_status: " . ($user->account_status ?? 'null') . "\n";
$stored = $user->password ?? '';

echo "stored password preview: " . (strlen($stored) > 80 ? substr($stored,0,80).'...' : $stored) . "\n";
echo "stored length: " . strlen($stored) . "\n";
$prefix = substr($stored,0,4);
echo "stored prefix: {$prefix}\n";

$check = Hash::check($password, $stored) ? 'MATCH' : 'NO MATCH';
echo "Hash::check('given', stored) => {$check}\n";

$needs = Hash::needsRehash($stored) ? 'true' : 'false';
echo "Hash::needsRehash(stored) => {$needs}\n";

// Try re-hash test: hash the given password and compare
$hashedGiven = Hash::make($password);
echo "Hashed sample (new): " . substr($hashedGiven,0,60) . "... (len=" . strlen($hashedGiven) . ")\n";

exit(0);
