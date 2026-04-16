<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProfesseursSeeder extends Seeder
{
    public function run(): void
    {
        $professeurs = [
            [
                'email'   => 'prof1@linkedu.com',
                'name'    => 'Hassan Professeur',
                'nom'     => 'Hassan',
                'prenom'  => 'Professeur',
                'password' => Hash::make('Prof@2026'),
            ],
            [
                'email'   => 'prof2@linkedu.com',
                'name'    => 'Fatima Prof',
                'nom'     => 'Fatima',
                'prenom'  => 'Prof',
                'password' => Hash::make('Prof@2026'),
            ],
            [
                'email'   => 'prof3@linkedu.com',
                'name'    => 'Ali Professeur',
                'nom'     => 'Ali',
                'prenom'  => 'Professeur',
                'password' => Hash::make('Prof@2026'),
            ],
        ];

        foreach ($professeurs as $prof) {
            User::firstOrCreate(
                ['email' => $prof['email']],
                [
                    'name'     => $prof['name'],
                    'nom'      => $prof['nom'],
                    'prenom'   => $prof['prenom'],
                    'password' => $prof['password'],
                    'role'     => 'professeur',
                ]
            );
        }
    }
}
