<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EtudiantsSeeder extends Seeder
{
    public function run(): void
    {
        $etudiants = [
            [
                'email'   => 'etudiant1@linkedu.com',
                'name'    => 'Ahmed Etudiant',
                'nom'     => 'Ahmed',
                'prenom'  => 'Etudiant',
                'password' => Hash::make('Etudiant@2026'),
            ],
            [
                'email'   => 'etudiant2@linkedu.com',
                'name'    => 'Mariam Student',
                'nom'     => 'Mariam',
                'prenom'  => 'Student',
                'password' => Hash::make('Etudiant@2026'),
            ],
            [
                'email'   => 'etudiant3@linkedu.com',
                'name'    => 'Omar Etudiant',
                'nom'     => 'Omar',
                'prenom'  => 'Etudiant',
                'password' => Hash::make('Etudiant@2026'),
            ],
            [
                'email'   => 'etudiant4@linkedu.com',
                'name'    => 'Leila Student',
                'nom'     => 'Leila',
                'prenom'  => 'Student',
                'password' => Hash::make('Etudiant@2026'),
            ],
        ];

        foreach ($etudiants as $etudiant) {
            User::firstOrCreate(
                ['email' => $etudiant['email']],
                [
                    'name'     => $etudiant['name'],
                    'nom'      => $etudiant['nom'],
                    'prenom'   => $etudiant['prenom'],
                    'password' => $etudiant['password'],
                    'role'     => 'etudiant',
                ]
            );
        }
    }
}
