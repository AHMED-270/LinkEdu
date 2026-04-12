<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DirecteurSeeder extends Seeder
{
    /**
     * Creer ou mettre a jour un compte directeur de demo.
     */
    public function run(): void
    {
        $directeur = User::updateOrCreate(
            ['email' => 'directeur@linkedu.com'],
            [
                'name' => 'Directeur LinkEdu',
                'nom' => 'Directeur',
                'prenom' => 'LinkEdu',
                'password' => Hash::make('Directeur@2026'),
                'role' => 'directeur',
            ]
        );

        DB::table('directeurs')->updateOrInsert(
            ['id_directeur' => $directeur->id],
            [
                'mandat' => '2026-2029',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
