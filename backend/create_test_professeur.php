<?php
// Script helper: create_test_professeur.php
// Usage: php create_test_professeur.php [email] [password] [niveau] [telephone]

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Professeur;
use Illuminate\Support\Facades\Hash;

$email = $argv[1] ?? 'prof.test@example.com';
$password = $argv[2] ?? 'P@ssProf2026!';
$niveau = $argv[3] ?? 'college';
$telephone = $argv[4] ?? null;

$matieres_arr = ['Mathematique'];

try {
    $existing = User::where('email', $email)->where('role', 'professeur')->first();

    if ($existing) {
        $existing->password = Hash::make($password);
        $existing->account_status = 'active';
        $existing->activated_at = now();
        $existing->save();
        $user = $existing;
        echo "Updated existing user (id: {$user->id})\n";
    } else {
        $user = User::create([
            'name' => 'Test Professeur',
            'prenom' => 'Test',
            'nom' => 'Professeur',
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'professeur',
            'account_status' => 'active',
            'activated_at' => now(),
        ]);
        echo "Created user id {$user->id}\n";
    }

    $prof = Professeur::where('id_professeur', $user->id)->first();

    if (!$prof) {
        Professeur::create([
            'id_professeur' => $user->id,
            'specialite' => $matieres_arr[0] ?? 'Non definie',
            'telephone' => $telephone,
            'matiere_enseignement' => $matieres_arr[0] ?? null,
            'matieres_enseignement' => json_encode($matieres_arr),
            'niveau_enseignement' => $niveau,
        ]);
        echo "Professeur profile created for user id {$user->id}\n";
    } else {
        $prof->specialite = $matieres_arr[0] ?? $prof->specialite;
        $prof->telephone = $telephone ?? $prof->telephone;
        $prof->matiere_enseignement = $matieres_arr[0] ?? $prof->matiere_enseignement;
        $prof->matieres_enseignement = json_encode($matieres_arr);
        $prof->niveau_enseignement = $niveau;
        $prof->save();
        echo "Professeur profile updated for user id {$user->id}\n";
    }

    echo "Login credentials: {$email} / {$password}\n";
    exit(0);
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(2);
}
