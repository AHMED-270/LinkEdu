<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentParentDemoSeeder extends Seeder
{
    /**
     * Seed realistic demo data for Student and Parent role testing.
     */
    public function run(): void
    {
        $professor = User::where('email', 'professeur@linkedu.com')->first();

        if (! $professor) {
            $this->call(ProfesseurTestSeeder::class);
            $professor = User::where('email', 'professeur@linkedu.com')->first();
        }

        $parentUser = User::updateOrCreate(
            ['email' => 'parent@linkedu.com'],
            [
                'name' => 'Parent Demo',
                'nom' => 'Bennani',
                'prenom' => 'Khadija',
                'password' => Hash::make('Parent@2026'),
                'role' => 'parent',
            ]
        );

        DB::table('parents')->updateOrInsert(
            ['id_parent' => $parentUser->id],
            [
                'telephone' => '0612345678',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $studentUser = User::updateOrCreate(
            ['email' => 'etudiant@linkedu.com'],
            [
                'name' => 'Etudiant Demo',
                'nom' => 'El Amrani',
                'prenom' => 'Yassine',
                'password' => Hash::make('Etudiant@2026'),
                'role' => 'etudiant',
            ]
        );

        $classeId = (int) DB::table('classes')->updateOrInsert(
            ['nom' => '1ere Bac SM A', 'niveau' => 'Lycée'],
            ['updated_at' => now(), 'created_at' => now()]
        );

        // updateOrInsert does not return id; resolve explicitly.
        $classe = DB::table('classes')
            ->where('nom', '1ere Bac SM A')
            ->where('niveau', 'Lycée')
            ->first();

        $classeId = (int) ($classe->id_classe ?? $classe->id ?? 0);

        DB::table('etudiants')->updateOrInsert(
            ['id_etudiant' => $studentUser->id],
            [
                'matricule' => 'STD-2026-0001',
                'id_classe' => $classeId,
                'id_parent' => $parentUser->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $matiere = DB::table('matieres')->orderBy('id_matiere')->first();

        if (! $matiere) {
            $this->call(MatiereSeeder::class);
            $matiere = DB::table('matieres')->orderBy('id_matiere')->first();
        }

        $matiereId = (int) $matiere->id_matiere;

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

        if (DB::getSchemaBuilder()->hasTable('classe_professeur_assignments')) {
            DB::table('classe_professeur_assignments')->updateOrInsert(
                [
                    'id_classe' => $classeId,
                    'id_professeur' => $professor->id,
                ],
                [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        DB::table('emploi_du_temps')->updateOrInsert(
            [
                'jour' => 'Lundi',
                'heure_debut' => '08:00:00',
                'heure_fin' => '10:00:00',
                'id_classe' => $classeId,
                'id_matiere' => $matiereId,
                'id_professeur' => $professor->id,
            ],
            [
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('lecons')->updateOrInsert(
            [
                'titre' => 'Fonctions et Derivees',
                'id_matiere' => $matiereId,
            ],
            [
                'description' => 'Revision des bases des fonctions, limites et derivees.',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('annonces')->updateOrInsert(
            [
                'titre' => 'Controle Continu Semaine Prochaine',
                'id_professeur' => $professor->id,
            ],
            [
                'contenu' => 'Le controle de mathematiques aura lieu mardi prochain.',
                'date_publication' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('ressources')->updateOrInsert(
            [
                'fichier' => 'chapitre-fonctions.pdf',
                'id_professeur' => $professor->id,
            ],
            [
                'type_ressource' => 'PDF',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('devoirs')->updateOrInsert(
            [
                'titre' => 'Devoir Maison - Fonctions',
                'id_classe' => $classeId,
                'id_matiere' => $matiereId,
                'id_professeur' => $professor->id,
            ],
            [
                'description' => 'Exercices 1 a 6 du chapitre fonctions.',
                'date_limite' => now()->addDays(7)->toDateString(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('notes')->updateOrInsert(
            [
                'id_etudiant' => $studentUser->id,
                'id_matiere' => $matiereId,
                'id_professeur' => $professor->id,
            ],
            [
                'valeur' => 15.5,
                'appreciation' => 'Bon niveau et participation active.',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('absences')->updateOrInsert(
            [
                'id_etudiant' => $studentUser->id,
                'id_professeur' => $professor->id,
                'date_abs' => now()->subDays(3)->toDateString(),
            ],
            [
                'motif' => 'Rendez-vous medical',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        DB::table('reclamations')->updateOrInsert(
            [
                'id_parent' => $parentUser->id,
                'sujet' => 'Demande de precision sur la note',
            ],
            [
                'message' => 'Merci de preciser les criteres de correction du dernier controle.',
                'date_soumission' => now()->subDay(),
                'statut' => 'en_attente',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }
}
