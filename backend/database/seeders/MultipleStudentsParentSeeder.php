<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MultipleStudentsParentSeeder extends Seeder
{
    /**
     * Seed multiple demo students and parents with example credentials.
     */
    public function run(): void
    {
        // Ensure we have at least one professor and class
        $professor = User::where('email', 'professeur@linkedu.com')->first();
        if (!$professor) {
            $this->call(ProfesseurTestSeeder::class);
            $professor = User::where('email', 'professeur@linkedu.com')->first();
        }

        // Create or update demo class
        DB::table('classes')->updateOrInsert(
            ['nom' => '1ere Bac SM A', 'niveau' => 'Lycee'],
            [
                'id_professeur' => $professor->id,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $classeId = (int) DB::table('classes')
            ->where('nom', '1ere Bac SM A')
            ->where('niveau', 'Lycee')
            ->value('id_classe');

        // Ensure we have matieres
        $matiere = DB::table('matieres')->orderBy('id_matiere')->first();
        if (!$matiere) {
            $this->call(MatiereSeeder::class);
            $matiere = DB::table('matieres')->orderBy('id_matiere')->first();
        }
        $matiereId = (int) $matiere->id_matiere;

        // Create enseigner relationship
        DB::table('enseigner')->updateOrInsert(
            [
                'id_professeur' => $professor->id,
                'id_classe' => $classeId,
                'id_matiere' => $matiereId,
            ],
            [
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Sample data: Multiple parents and students
        $studentsData = [
            [
                'parent' => [
                    'email' => 'parent1@linkedu.com',
                    'nom' => 'Kassim',
                    'prenom' => 'Fatima',
                    'password' => 'Parent@2026',
                    'telephone' => '0612345601',
                ],
                'student' => [
                    'email' => 'etudiant1@linkedu.com',
                    'nom' => 'Kasim',
                    'prenom' => 'Amir',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1001',
                    'date_naissance' => '2008-03-15',
                    'genre' => 'M',
                    'adresse' => '123 Rue de la Paix, Casablanca',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent2@linkedu.com',
                    'nom' => 'Bennani',
                    'prenom' => 'Salima',
                    'password' => 'Parent@2026',
                    'telephone' => '0612345602',
                ],
                'student' => [
                    'email' => 'etudiant2@linkedu.com',
                    'nom' => 'Bennani',
                    'prenom' => 'Zahra',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1002',
                    'date_naissance' => '2007-07-22',
                    'genre' => 'F',
                    'adresse' => '456 Avenue Hassan II, Rabat',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent3@linkedu.com',
                    'nom' => 'Alaoui',
                    'prenom' => 'Mohammad',
                    'password' => 'Parent@2026',
                    'telephone' => '0612345603',
                ],
                'student' => [
                    'email' => 'etudiant3@linkedu.com',
                    'nom' => 'Alaoui',
                    'prenom' => 'Karim',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1003',
                    'date_naissance' => '2008-11-10',
                    'genre' => 'M',
                    'adresse' => '789 Rue Mohamed V, Fez',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent4@linkedu.com',
                    'nom' => 'Bouchnaf',
                    'prenom' => 'Noor',
                    'password' => 'Parent@2026',
                    'telephone' => '0612345604',
                ],
                'student' => [
                    'email' => 'etudiant4@linkedu.com',
                    'nom' => 'Bouchnaf',
                    'prenom' => 'Yasmine',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1004',
                    'date_naissance' => '2009-01-05',
                    'genre' => 'F',
                    'adresse' => '321 Boulevard Zerktouni, Marrakech',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent5@linkedu.com',
                    'nom' => 'Idrissi',
                    'prenom' => 'Hassan',
                    'password' => 'Parent@2026',
                    'telephone' => '0612345605',
                ],
                'student' => [
                    'email' => 'etudiant5@linkedu.com',
                    'nom' => 'Idrissi',
                    'prenom' => 'Omar',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1005',
                    'date_naissance' => '2008-05-18',
                    'genre' => 'M',
                    'adresse' => '654 Rue de Fez, Tangier',
                ]
            ],
        ];

        // Create each parent-student pair
        foreach ($studentsData as $data) {
            // Create or update parent
            $parentUser = User::updateOrCreate(
                ['email' => $data['parent']['email']],
                [
                    'name' => $data['parent']['prenom'] . ' ' . $data['parent']['nom'],
                    'nom' => $data['parent']['nom'],
                    'prenom' => $data['parent']['prenom'],
                    'password' => Hash::make($data['parent']['password']),
                    'role' => 'parent',
                ]
            );

            // Create parent record
            DB::table('parents')->updateOrInsert(
                ['id_parent' => $parentUser->id],
                [
                    'telephone' => $data['parent']['telephone'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Create or update student
            $studentUser = User::updateOrCreate(
                ['email' => $data['student']['email']],
                [
                    'name' => $data['student']['prenom'] . ' ' . $data['student']['nom'],
                    'nom' => $data['student']['nom'],
                    'prenom' => $data['student']['prenom'],
                    'password' => Hash::make($data['student']['password']),
                    'role' => 'etudiant',
                ]
            );

            // Create student record
            DB::table('etudiants')->updateOrInsert(
                ['id_etudiant' => $studentUser->id],
                [
                    'matricule' => $data['student']['matricule'],
                    'id_classe' => $classeId,
                    'id_parent' => $parentUser->id,
                    'date_naissance' => $data['student']['date_naissance'],
                    'genre' => $data['student']['genre'],
                    'adresse' => $data['student']['adresse'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('✓ ' . count($studentsData) . ' parents and ' . count($studentsData) . ' students created successfully!');
    }
}
