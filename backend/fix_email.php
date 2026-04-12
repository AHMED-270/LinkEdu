<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::where('email', 'sohaibfettah01@gmail.com')->where('role', 'professeur')->get();
foreach ($users as $user) {
    if ($user->id !== 6) {
        $user->email = 'sohaibfettah01+professeur@gmail.com';
        $user->save();
        echo "L'email du professeur (ID: {$user->id}) a ete modifie en: {$user->email}\n";
    }
}
