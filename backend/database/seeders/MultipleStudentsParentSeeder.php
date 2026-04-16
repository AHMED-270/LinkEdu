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
        // Sample data: Multiple parents and students
        $studentsData = [
            [
                'parent' => [
                    'email' => 'parent1@linkedu.com',
                    'nom' => 'Kassim',
                    'prenom' => 'Fatima',
                    'password' => 'Parent@2026',
                ],
                'student' => [
                    'email' => 'etudiant1@linkedu.com',
                    'nom' => 'Kasim',
                    'prenom' => 'Amir',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1001',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent2@linkedu.com',
                    'nom' => 'Bennani',
                    'prenom' => 'Salima',
                    'password' => 'Parent@2026',
                ],
                'student' => [
                    'email' => 'etudiant2@linkedu.com',
                    'nom' => 'Bennani',
                    'prenom' => 'Zahra',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1002',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent3@linkedu.com',
                    'nom' => 'Alaoui',
                    'prenom' => 'Mohammad',
                    'password' => 'Parent@2026',
                ],
                'student' => [
                    'email' => 'etudiant3@linkedu.com',
                    'nom' => 'Alaoui',
                    'prenom' => 'Karim',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1003',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent4@linkedu.com',
                    'nom' => 'Bouchnaf',
                    'prenom' => 'Noor',
                    'password' => 'Parent@2026',
                ],
                'student' => [
                    'email' => 'etudiant4@linkedu.com',
                    'nom' => 'Bouchnaf',
                    'prenom' => 'Yasmine',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1004',
                ]
            ],
            [
                'parent' => [
                    'email' => 'parent5@linkedu.com',
                    'nom' => 'Idrissi',
                    'prenom' => 'Hassan',
                    'password' => 'Parent@2026',
                ],
                'student' => [
                    'email' => 'etudiant5@linkedu.com',
                    'nom' => 'Idrissi',
                    'prenom' => 'Omar',
                    'password' => 'Etudiant@2026',
                    'matricule' => 'STD-2026-1005',
                ]
            ],
        ];

        // Get or create a default class for students
        $defaultClass = DB::table('classes')->first();
        if (!$defaultClass) {
            $classId = DB::table('classes')->insertGetId([
                'nom' => '1ère Année',
                'niveau' => 'Premiere',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $classId = $defaultClass->id_classe;
        }

        // Create each parent-student pair
        foreach ($studentsData as $data) {
            // Create parent user
            $parentUser = User::updateOrCreate(
                ['email' => $data['parent']['email']],
                [
                    'name' => $data['parent']['prenom'] . ' ' . $data['parent']['nom'],
                    'nom' => $data['parent']['nom'],
                    'prenom' => $data['parent']['prenom'],
                    'password' => Hash::make($data['parent']['password']),
                    'role' => 'parent',
                    'account_status' => 'active',
                ]
            );

            // Create parent profile in parents table
            DB::table('parents')->updateOrInsert(
                ['id_parent' => $parentUser->id],
                [
                    'telephone' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Create student user
            $studentUser = User::updateOrCreate(
                ['email' => $data['student']['email']],
                [
                    'name' => $data['student']['prenom'] . ' ' . $data['student']['nom'],
                    'nom' => $data['student']['nom'],
                    'prenom' => $data['student']['prenom'],
                    'password' => Hash::make($data['student']['password']),
                    'role' => 'etudiant',
                    'account_status' => 'active',
                ]
            );

            // Create student profile in etudiants table
            DB::table('etudiants')->updateOrInsert(
                ['id_etudiant' => $studentUser->id],
                [
                    'matricule' => $data['student']['matricule'],
                    'id_classe' => $classId,
                    'id_parent' => $parentUser->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        echo "✓ 5 parents and 5 students created successfully!\n";
    }
}

