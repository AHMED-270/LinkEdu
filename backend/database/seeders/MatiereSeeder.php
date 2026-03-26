<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MatiereSeeder extends Seeder
{
    /**
     * Seed default school subjects.
     */
    public function run(): void
    {
        $matieres = [
            ['nom' => 'Mathematiques', 'coefficient' => 5],
            ['nom' => 'Francais', 'coefficient' => 4],
            ['nom' => 'Arabe', 'coefficient' => 4],
            ['nom' => 'Anglais', 'coefficient' => 3],
            ['nom' => 'Physique-Chimie', 'coefficient' => 4],
            ['nom' => 'SVT', 'coefficient' => 3],
            ['nom' => 'Histoire-Geographie', 'coefficient' => 3],
            ['nom' => 'Informatique', 'coefficient' => 3],
            ['nom' => 'Education Islamique', 'coefficient' => 2],
            ['nom' => 'Education Civique', 'coefficient' => 2],
            ['nom' => 'Philosophie', 'coefficient' => 2],
            ['nom' => 'EPS', 'coefficient' => 2],
            ['nom' => 'Arts Plastiques', 'coefficient' => 1],
        ];

        foreach ($matieres as $matiere) {
            DB::table('matieres')->updateOrInsert(
                ['nom' => $matiere['nom']],
                [
                    'coefficient' => $matiere['coefficient'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
