<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SecretairesSeeder extends Seeder
{
    public function run(): void
    {
        $secretaires = [
            [
                'email'   => 'secretaire1@linkedu.com',
                'name'    => 'Yasmine Secretaire',
                'nom'     => 'Yasmine',
                'prenom'  => 'Secretaire',
                'password' => Hash::make('Secretaire@2026'),
            ],
            [
                'email'   => 'secretaire2@linkedu.com',
                'name'    => 'Souad Admin',
                'nom'     => 'Souad',
                'prenom'  => 'Admin',
                'password' => Hash::make('Secretaire@2026'),
            ],
        ];

        foreach ($secretaires as $secretaire) {
            User::firstOrCreate(
                ['email' => $secretaire['email']],
                [
                    'name'     => $secretaire['name'],
                    'nom'      => $secretaire['nom'],
                    'prenom'   => $secretaire['prenom'],
                    'password' => $secretaire['password'],
                    'role'     => 'secretaire',
                ]
            );
        }
    }
}
