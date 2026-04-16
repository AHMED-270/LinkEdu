<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComptablesSeeder extends Seeder
{
    public function run(): void
    {
        $comptables = [
            [
                'email'   => 'comptable@linkedu.com',
                'name'    => 'Ibrahim Comptable',
                'nom'     => 'Ibrahim',
                'prenom'  => 'Comptable',
                'password' => Hash::make('Comptable@2026'),
            ],
            [
                'email'   => 'comptable2@linkedu.com',
                'name'    => 'Hana Finance',
                'nom'     => 'Hana',
                'prenom'  => 'Finance',
                'password' => Hash::make('Comptable@2026'),
            ],
        ];

        foreach ($comptables as $comptable) {
            User::firstOrCreate(
                ['email' => $comptable['email']],
                [
                    'name'     => $comptable['name'],
                    'nom'      => $comptable['nom'],
                    'prenom'   => $comptable['prenom'],
                    'password' => $comptable['password'],
                    'role'     => 'comptable',
                ]
            );
        }
    }
}
