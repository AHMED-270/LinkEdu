<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentAndProfessorSeeder extends Seeder
{
    public function run(): void
    {
        $prof = User::updateOrCreate(
            ['email' => 'professeur@linkedu.com'],
            [
                'name'     => 'Professeur Demo',
                'nom'      => 'Demo',
                'prenom'   => 'Professeur',
                'password' => Hash::make('Professeur@2026'),
                'role'     => 'professeur',
            ]
        );

        DB::table('professeurs')->updateOrInsert(
            ['id_professeur' => $prof->id],
            [
                'specialite' => 'Mathématiques',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $student = User::updateOrCreate(
            ['email' => 'etudiant@linkedu.com'],
            [
                'name'     => 'Etudiant Demo',
                'nom'      => 'Demo',
                'prenom'   => 'Etudiant',
                'password' => Hash::make('Etudiant@2026'),
                'role'     => 'etudiant',
            ]
        );

        DB::table('etudiants')->updateOrInsert(
            ['id_etudiant' => $student->id],
            [
                'matricule'  => 'ETU-' . strtoupper(Str::random(6)),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}