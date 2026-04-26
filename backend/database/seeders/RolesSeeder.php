<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Directeur;
use App\Models\Professeur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    /**
     * Seed test users for each role to the database.
     */
    public function run(): void
    {
        DB::beginTransaction();
        try {
            // Admin
            $admin = User::firstOrCreate(
                ['email' => 'admin@linkedu.com'],
                [
                    'name'     => 'Admin Master',
                    'nom'      => 'Admin',
                    'prenom'   => 'Master',
                    'password' => Hash::make('Admin@2026'),
                    'role'     => 'admin',
                    'account_status' => 'active',
                    'activated_at' => now(),
                ]
            );

            // Directeur
            $directeur = User::firstOrCreate(
                ['email' => 'directeur@linkedu.com'],
                [
                    'name'     => 'Mohammed Directeur',
                    'nom'      => 'Mohammed',
                    'prenom'   => 'Directeur',
                    'password' => Hash::make('Directeur@2026'),
                    'role'     => 'directeur',
                    'account_status' => 'active',
                    'activated_at' => now(),
                ]
            );
            // Create associated Directeur record if not exists
            Directeur::firstOrCreate(
                ['id_directeur' => $directeur->id],
                ['telephone' => null]
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
                    'account_status' => 'active',
                    'activated_at' => now(),
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
                    'account_status' => 'active',
                    'activated_at' => now(),
                ]
            );

            // Professeur
            $professeur = User::firstOrCreate(
                ['email' => 'professeur@linkedu.com'],
                [
                    'name'     => 'Samir Professeur',
                    'nom'      => 'Samir',
                    'prenom'   => 'Professeur',
                    'password' => Hash::make('Prof@2026'),
                    'role'     => 'professeur',
                    'account_status' => 'active',
                    'activated_at' => now(),
                ]
            );
            // Create associated Professeur record if not exists
            Professeur::firstOrCreate(
                ['id_professeur' => $professeur->id],
                [
                    'specialite' => 'Mathematiques',
                    'telephone' => null,
                    'matiere_enseignement' => 'Mathematiques',
                    'matieres_enseignement' => json_encode(['Mathematiques']),
                    'niveau_enseignement' => null,
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
                    'account_status' => 'active',
                    'activated_at' => now(),
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
                    'account_status' => 'active',
                    'activated_at' => now(),
                ]
            );

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
