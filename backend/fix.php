<?php
$f = 'app/Http/Controllers/SecretaireController.php';
$c = file_get_contents($f);
$old = "User::firstOrCreate(
                ['email' => \$parentEmail],
                [
                    'name' => trim(\$validated['parent_prenom'] . ' ' . \$validated['parent_nom']),
                    'nom' => \$validated['parent_nom'],
                    'prenom' => \$validated['parent_prenom'],
                    'password' => Hash::make('Parent@2026'),
                    'role' => 'parent',
                    'account_status' => 'pending_activation',
                ]
            );";
$new = "User::firstOrCreate(
                ['email' => \$parentEmail, 'role' => 'parent'],
                [
                    'name' => trim(\$validated['parent_prenom'] . ' ' . \$validated['parent_nom']),
                    'nom' => \$validated['parent_nom'],
                    'prenom' => \$validated['parent_prenom'],
                    'password' => Hash::make('Parent@2026'),
                    'account_status' => 'pending_activation',
                ]
            );";

$c = str_replace(str_replace('parent', 'parent_eleve', $old), str_replace('parent', 'parent_eleve', $new), $c);
$c = str_replace($old, $new, $c);

file_put_contents($f, $c);
echo "done\n";