<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProfesseurTestSeeder extends Seeder
{
    /**
     * Seed a test professeur account.
     */
    public function run(): void
    {
        $professeur = User::updateOrCreate(
            ['email' => 'professeur@linkedu.com'],
            [
                'name' => 'Professeur Test',
                'nom' => 'Professeur',
                'prenom' => 'Test',
                'password' => Hash::make('Prof@2026'),
                'role' => 'professeur',
            ]
        );

        DB::table('professeurs')->updateOrInsert(
            ['id_professeur' => $professeur->id],
            [
                'specialite' => 'Mathematiques',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
