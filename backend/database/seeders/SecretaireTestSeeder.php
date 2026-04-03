<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SecretaireTestSeeder extends Seeder
{
    /**
     * Seed a test secretaire account.
     */
    public function run(): void
    {
        $secretaire = User::updateOrCreate(
            ['email' => 'secretaire@linkedu.com'],
            [
                'name' => 'Secretaire Test',
                'nom' => 'Secretaire',
                'prenom' => 'Test',
                'password' => Hash::make('Secr@2026'),
                'role' => 'secretaire',
            ]
        );

        DB::table('secretaires')->updateOrInsert(
            ['id_secretaire' => $secretaire->id],
            [
                'departement' => 'Scolarite',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
