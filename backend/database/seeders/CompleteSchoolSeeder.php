<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class CompleteSchoolSeeder extends Seeder
{
    /**
     * Seed all school-related tables with coherent sample data.
     */
    public function run(): void
    {
        $now = now();

        $admin = User::updateOrCreate(
            ['email' => 'admin@linkedu.com'],
            [
                'name' => 'Admin LinkEdu',
                'nom' => 'Admin',
                'prenom' => 'LinkEdu',
                'password' => Hash::make('Admin@2026'),
                'role' => 'admin',
                'account_status' => 'active',
            ]
        );

        $directeur = User::updateOrCreate(
            ['email' => 'directeur@linkedu.com'],
            [
                'name' => 'Directeur Test',
                'nom' => 'Directeur',
                'prenom' => 'Test',
                'password' => Hash::make('Dir@2026'),
                'role' => 'directeur',
                'account_status' => 'active',
            ]
        );

        $secretaire = User::updateOrCreate(
            ['email' => 'secretaire@linkedu.com'],
            [
                'name' => 'Secretaire Test',
                'nom' => 'Secretaire',
                'prenom' => 'Test',
                'password' => Hash::make('Secr@2026'),
                'role' => 'secretaire',
                'account_status' => 'active',
            ]
        );

        $professeur = User::updateOrCreate(
            ['email' => 'professeur@linkedu.com'],
            [
                'name' => 'Professeur Test',
                'nom' => 'Professeur',
                'prenom' => 'Test',
                'password' => Hash::make('Prof@2026'),
                'role' => 'professeur',
                'account_status' => 'active',
            ]
        );

        $parent = User::updateOrCreate(
            ['email' => 'parent@linkedu.com'],
            [
                'name' => 'Parent Test',
                'nom' => 'Parent',
                'prenom' => 'Test',
                'password' => Hash::make('Parent@2026'),
                'role' => 'parent',
                'account_status' => 'active',
            ]
        );

        $etudiant = User::updateOrCreate(
            ['email' => 'etudiant@linkedu.com'],
            [
                'name' => 'Etudiant Test',
                'nom' => 'Etudiant',
                'prenom' => 'Test',
                'password' => Hash::make('Stud@2026'),
                'role' => 'etudiant',
                'account_status' => 'active',
            ]
        );

        DB::table('admin_ecoles')->updateOrInsert(
            ['id_admin' => $admin->id],
            [
                'permissions' => 'all',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('directeurs')->updateOrInsert(
            ['id_directeur' => $directeur->id],
            [
                'mandat' => '2026-2029',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('secretaires')->updateOrInsert(
            ['id_secretaire' => $secretaire->id],
            [
                'departement' => 'Scolarite',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('professeurs')->updateOrInsert(
            ['id_professeur' => $professeur->id],
            [
                'specialite' => 'Mathematiques',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('parents')->updateOrInsert(
            ['id_parent' => $parent->id],
            [
                'telephone' => '0600000000',
                'country_code' => '+212',
                'cin' => 'PA123456',
                'urgence_phone' => '0611111111',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('classes')->updateOrInsert(
            ['nom' => '6A'],
            [
                'niveau' => 'College',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('classes')->updateOrInsert(
            ['nom' => '6B'],
            [
                'niveau' => 'College',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('classes')->updateOrInsert(
            ['nom' => '1BAC-SM'],
            [
                'niveau' => 'Lycee',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $classe = DB::table('classes')->where('nom', '6A')->first();

        DB::table('matieres')->updateOrInsert(
            ['nom' => 'Mathematiques'],
            [
                'coefficient' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('matieres')->updateOrInsert(
            ['nom' => 'Francais'],
            [
                'coefficient' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('matieres')->updateOrInsert(
            ['nom' => 'Anglais'],
            [
                'coefficient' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('matieres')->updateOrInsert(
            ['nom' => 'Physique-Chimie'],
            [
                'coefficient' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $matiere = DB::table('matieres')->where('nom', 'Mathematiques')->first();

        DB::table('etudiants')->updateOrInsert(
            ['id_etudiant' => $etudiant->id],
            [
                'matricule' => 'ETU-' . str_pad((string) $etudiant->id, 4, '0', STR_PAD_LEFT),
                'id_classe' => $classe?->id_classe,
                'id_parent' => $parent->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('lecons')->updateOrInsert(
            ['titre' => 'Nombres entiers'],
            [
                'description' => 'Introduction aux nombres entiers et operations.',
                'id_matiere' => $matiere?->id_matiere,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('enseigner')->updateOrInsert(
            [
                'id_professeur' => $professeur->id,
                'id_classe' => $classe?->id_classe,
                'id_matiere' => $matiere?->id_matiere,
            ],
            [
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if (Schema::hasTable('classe_professeur_assignments')) {
            DB::table('classe_professeur_assignments')->updateOrInsert(
                [
                    'id_classe' => $classe?->id_classe,
                    'id_professeur' => $professeur->id,
                ],
                [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        DB::table('emploi_du_temps')->updateOrInsert(
            [
                'jour' => 'Lundi',
                'heure_debut' => '08:00:00',
                'heure_fin' => '10:00:00',
                'id_classe' => $classe?->id_classe,
                'id_matiere' => $matiere?->id_matiere,
                'id_professeur' => $professeur->id,
            ],
            [
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('annonces')->updateOrInsert(
            ['titre' => 'Bienvenue sur LinkEdu'],
            [
                'contenu' => 'Debut de l\'annee scolaire et regles generales.',
                'cible' => 'all',
                'photo_path' => null,
                'date_publication' => $now,
                'id_user' => $professeur->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('ressources')->updateOrInsert(
            ['fichier' => 'chapitre-1.pdf'],
            [
                'type_ressource' => 'pdf',
                'id_professeur' => $professeur->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('devoirs')->updateOrInsert(
            ['titre' => 'Exercices sur les entiers'],
            [
                'description' => 'Serie d\'exercices a rendre en classe.',
                'date_limite' => now()->addWeek()->toDateString(),
                'id_professeur' => $professeur->id,
                'id_classe' => $classe?->id_classe,
                'id_matiere' => $matiere?->id_matiere,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('absences')->updateOrInsert(
            [
                'date_abs' => now()->subDays(2)->toDateString(),
                'id_etudiant' => $etudiant->id,
                'id_professeur' => $professeur->id,
            ],
            [
                'motif' => 'Rendez-vous medical',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('notes')->updateOrInsert(
            [
                'id_etudiant' => $etudiant->id,
                'id_matiere' => $matiere?->id_matiere,
                'id_professeur' => $professeur->id,
            ],
            [
                'valeur' => 15.5,
                'appreciation' => 'Tres bon travail.',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('reclamations')->updateOrInsert(
            [
                'sujet' => 'Question sur l\'emploi du temps',
                'id_parent' => $parent->id,
            ],
            [
                'message' => 'Merci de confirmer les horaires du vendredi.',
                'date_soumission' => $now,
                'statut' => 'en_attente',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $allClasses = DB::table('classes')->select('id_classe')->orderBy('id_classe')->get();
        for ($i = 1; $i <= 12; $i++) {
            $parentUser = User::updateOrCreate(
                ['email' => "parent{$i}@linkedu.com"],
                [
                    'name' => "Parent {$i}",
                    'nom' => "Parent{$i}",
                    'prenom' => 'Demo',
                    'password' => Hash::make('Parent@2026'),
                    'role' => 'parent_eleve',
                    'account_status' => 'active',
                ]
            );

            DB::table('parents')->updateOrInsert(
                ['id_parent' => $parentUser->id],
                [
                    'telephone' => '0600000' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'country_code' => '+212',
                    'cin' => 'CINP' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                    'urgence_phone' => '0610000' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $studentUser = User::updateOrCreate(
                ['email' => "etudiant{$i}@linkedu.com"],
                [
                    'name' => "Etudiant {$i}",
                    'nom' => "Etudiant{$i}",
                    'prenom' => 'Demo',
                    'password' => Hash::make('Etudiant@2026'),
                    'role' => 'etudiant',
                    'account_status' => 'active',
                ]
            );

            $classId = $allClasses->isNotEmpty()
                ? $allClasses[($i - 1) % $allClasses->count()]->id_classe
                : null;

            DB::table('etudiants')->updateOrInsert(
                ['id_etudiant' => $studentUser->id],
                [
                    'matricule' => 'ETU-' . str_pad((string) $studentUser->id, 5, '0', STR_PAD_LEFT),
                    'id_classe' => $classId,
                    'id_parent' => $parentUser->id,
                    'date_naissance' => now()->subYears(12 + ($i % 6))->toDateString(),
                    'genre' => $i % 2 === 0 ? 'F' : 'M',
                    'adresse' => 'Casablanca - Quartier ' . $i,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // Seed minimal rows for auxiliary english-named tables.
        foreach ([
            'subjects',
            'students',
            'assignments',
            'resources',
            'schedules',
            'announcements',
            'attendances',
            'grades',
            'syllabus_progress',
            'complaints',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->insertOrIgnore([
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
