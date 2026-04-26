<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesSeeder extends Seeder
{
    /**
     * Seed test users for each role to the database.
     */
    public function run(): void
    {
        // Directeur
        User::firstOrCreate(
            ['email' => 'directeur@linkedu.com'],
            [
                'name'     => 'Mohammed Directeur',
                'nom'      => 'Mohammed',
                'prenom'   => 'Directeur',
                'password' => Hash::make('Directeur@2026'),
                'role'     => 'directeur',
            ]
        );

        // Comptable
        User::firstOrCreate(
            ['email' => 'comptable@linkedu.com'],
            [
                'name'     => 'Ahmed Comptable',
                'nom'      => 'Ahmed',
                'prenom'   => 'Comptable',
                'password' => Hash::make('Comptable@2026'),
                'role'     => 'comptable',
            ]
        );

        // Secrétaire
        User::firstOrCreate(
            ['email' => 'secretaire@linkedu.com'],
            [
                'name'     => 'Leila Secretaire',
                'nom'      => 'Leila',
                'prenom'   => 'Secretaire',
                'password' => Hash::make('Secretaire@2026'),
                'role'     => 'secretaire',
            ]
        );

        // Professeur
        User::firstOrCreate(
            ['email' => 'professeur@linkedu.com'],
            [
                'name'     => 'Samir Professeur',
                'nom'      => 'Samir',
                'prenom'   => 'Professeur',
                'password' => Hash::make('Prof@2026'),
                'role'     => 'professeur',
            ]
        );

        // Parent
        User::firstOrCreate(
            ['email' => 'parent@linkedu.com'],
            [
                'name'     => 'Fatima Parent',
                'nom'      => 'Fatima',
                'prenom'   => 'Parent',
                'password' => Hash::make('Parent@2026'),
                'role'     => 'parent',
            ]
        );

        // Étudiant
        User::firstOrCreate(
            ['email' => 'etudiant@linkedu.com'],
            [
                'name'     => 'Karim Etudiant',
                'nom'      => 'Karim',
                'prenom'   => 'Etudiant',
                'password' => Hash::make('Etudiant@2026'),
                'role'     => 'etudiant',
            ]
        );
    }
}
