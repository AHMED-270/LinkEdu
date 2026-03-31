<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Faker\Factory;

class ComprehensiveSchoolSeeder extends Seeder
{
    /**
     * Seed all business tables with rich demo data for QA.
     */
    public function run(): void
    {
        $faker = Factory::create('fr_FR');
        $now = now();

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tablesToTruncate = [
            'devoir_soumissions',
            'reclamations',
            'notes',
            'absences',
            'devoirs',
            'ressources',
            'annonces',
            'emploi_du_temps',
            'classe_professeur_assignments',
            'enseigner',
            'lecons',
            'etudiants',
            'parents',
            'admin_ecoles',
            'directeurs',
            'secretaires',
            'professeurs',
            'matieres',
            'classes',
            'complaints',
            'syllabus_progress',
            'grades',
            'attendances',
            'announcements',
            'schedules',
            'resources',
            'assignments',
            'students',
            'subjects',
            'users',
        ];

        foreach ($tablesToTruncate as $table) {
            DB::table($table)->truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $passwords = [
            'admin' => Hash::make('Admin@2026'),
            'professeur' => Hash::make('Prof@2026'),
            'parent' => Hash::make('Parent@2026'),
            'etudiant' => Hash::make('Etudiant@2026'),
            'default' => Hash::make('Password@2026'),
        ];

        $admins = [];
        $directeurs = [];
        $secretaires = [];
        $professeurs = [];
        $parents = [];
        $etudiantsUsers = [];

        $createUser = function (array $data) use ($now): int {
            return (int) DB::table('users')->insertGetId([
                'name' => $data['name'],
                'nom' => $data['nom'],
                'prenom' => $data['prenom'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        };

        // Stable admin account for login tests.
        $adminId = $createUser([
            'name' => 'Admin LinkEdu',
            'nom' => 'Admin',
            'prenom' => 'LinkEdu',
            'email' => 'admin@linkedu.com',
            'password' => $passwords['admin'],
            'role' => 'admin',
        ]);
        $admins[] = $adminId;

        for ($i = 0; $i < 2; $i++) {
            $prenom = $faker->firstName();
            $nom = $faker->lastName();
            $admins[] = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => 'admin' . ($i + 2) . '@linkedu.com',
                'password' => $passwords['default'],
                'role' => 'admin',
            ]);
        }

        foreach ($admins as $adminUserId) {
            DB::table('admin_ecoles')->insert([
                'id_admin' => $adminUserId,
                'permissions' => 'all',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        for ($i = 0; $i < 3; $i++) {
            $prenom = $i === 0 ? 'LinkEdu' : $faker->firstName();
            $nom = $i === 0 ? 'Directeur' : $faker->lastName();
            $id = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $i === 0 ? 'directeur@linkedu.com' : 'directeur' . ($i + 1) . '@linkedu.com',
                'password' => $i === 0 ? Hash::make('Directeur@2026') : $passwords['default'],
                'role' => 'directeur',
            ]);

            $directeurs[] = $id;
            DB::table('directeurs')->insert([
                'id_directeur' => $id,
                'mandat' => 'Mandat ' . (2024 + $i) . '-' . (2028 + $i),
                'telephone' => '06' . $faker->numerify('########'),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        for ($i = 0; $i < 4; $i++) {
            $prenom = $faker->firstName();
            $nom = $faker->lastName();
            $id = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => 'secretaire' . ($i + 1) . '@linkedu.com',
                'password' => $passwords['default'],
                'role' => 'secretaire',
            ]);

            $secretaires[] = $id;
            DB::table('secretaires')->insert([
                'id_secretaire' => $id,
                'departement' => $faker->randomElement(['Scolarite', 'Comptabilite', 'Admissions']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Stable professor account for login tests.
        $profStableId = $createUser([
            'name' => 'Professeur Test',
            'nom' => 'Professeur',
            'prenom' => 'Test',
            'email' => 'professeur@linkedu.com',
            'password' => $passwords['professeur'],
            'role' => 'professeur',
        ]);
        $professeurs[] = $profStableId;

        $specialites = [
            'Mathematiques',
            'Francais',
            'Arabe',
            'Anglais',
            'Physique-Chimie',
            'SVT',
            'Histoire-Geographie',
            'Informatique',
            'Philosophie',
            'EPS',
        ];

        DB::table('professeurs')->insert([
            'id_professeur' => $profStableId,
            'specialite' => 'Mathematiques',
            'telephone' => '0611122233',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        for ($i = 0; $i < 11; $i++) {
            $prenom = $faker->firstName();
            $nom = $faker->lastName();
            $id = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => 'prof' . ($i + 2) . '@linkedu.com',
                'password' => $passwords['default'],
                'role' => 'professeur',
            ]);

            $professeurs[] = $id;
            DB::table('professeurs')->insert([
                'id_professeur' => $id,
                'specialite' => $faker->randomElement($specialites),
                'telephone' => '06' . $faker->numerify('########'),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Stable parent account for login tests.
        $parentStableId = $createUser([
            'name' => 'Parent Demo',
            'nom' => 'Bennani',
            'prenom' => 'Khadija',
            'email' => 'parent@linkedu.com',
            'password' => $passwords['parent'],
            'role' => 'parent',
        ]);
        $parents[] = $parentStableId;

        DB::table('parents')->insert([
            'id_parent' => $parentStableId,
            'telephone' => '0612345678',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        for ($i = 0; $i < 29; $i++) {
            $prenom = $faker->firstName();
            $nom = $faker->lastName();
            $id = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => 'parent' . ($i + 2) . '@linkedu.com',
                'password' => $passwords['default'],
                'role' => 'parent',
            ]);

            $parents[] = $id;
            DB::table('parents')->insert([
                'id_parent' => $id,
                'telephone' => '06' . $faker->numerify('########'),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Stable student account for login tests.
        $studentStableId = $createUser([
            'name' => 'Etudiant Demo',
            'nom' => 'El Amrani',
            'prenom' => 'Yassine',
            'email' => 'etudiant@linkedu.com',
            'password' => $passwords['etudiant'],
            'role' => 'etudiant',
        ]);
        $etudiantsUsers[] = $studentStableId;

        for ($i = 0; $i < 89; $i++) {
            $prenom = $faker->firstName();
            $nom = $faker->lastName();
            $id = $createUser([
                'name' => $prenom . ' ' . $nom,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => 'etudiant' . ($i + 2) . '@linkedu.com',
                'password' => $passwords['default'],
                'role' => 'etudiant',
            ]);

            $etudiantsUsers[] = $id;
        }

        $classesPayload = [
            ['nom' => '1ere Bac SM A', 'niveau' => 'Lycee'],
            ['nom' => '1ere Bac SM B', 'niveau' => 'Lycee'],
            ['nom' => '2eme Bac SM A', 'niveau' => 'Lycee'],
            ['nom' => '2eme Bac PC', 'niveau' => 'Lycee'],
            ['nom' => 'TC Sciences 1', 'niveau' => 'Lycee'],
            ['nom' => 'TC Sciences 2', 'niveau' => 'Lycee'],
            ['nom' => '3eme College A', 'niveau' => 'College'],
            ['nom' => '3eme College B', 'niveau' => 'College'],
            ['nom' => '2eme College A', 'niveau' => 'College'],
            ['nom' => '1ere College A', 'niveau' => 'College'],
            ['nom' => 'CM2 A', 'niveau' => 'Primaire'],
            ['nom' => 'CM1 A', 'niveau' => 'Primaire'],
        ];

        $classIds = [];
        foreach ($classesPayload as $classPayload) {
            $profPrincipal = $faker->randomElement($professeurs);
            $classIds[] = (int) DB::table('classes')->insertGetId([
                'nom' => $classPayload['nom'],
                'niveau' => $classPayload['niveau'],
                'id_professeur' => $profPrincipal,
                'created_at' => $now,
                'updated_at' => $now,
            ], 'id_classe');
        }

        $matieresPayload = [
            ['nom' => 'Mathematiques', 'coefficient' => 5],
            ['nom' => 'Francais', 'coefficient' => 4],
            ['nom' => 'Arabe', 'coefficient' => 4],
            ['nom' => 'Anglais', 'coefficient' => 3],
            ['nom' => 'Physique-Chimie', 'coefficient' => 4],
            ['nom' => 'SVT', 'coefficient' => 3],
            ['nom' => 'Histoire-Geographie', 'coefficient' => 3],
            ['nom' => 'Informatique', 'coefficient' => 3],
            ['nom' => 'Philosophie', 'coefficient' => 2],
            ['nom' => 'EPS', 'coefficient' => 2],
            ['nom' => 'Education Civique', 'coefficient' => 2],
            ['nom' => 'Arts Plastiques', 'coefficient' => 1],
        ];

        $matiereIds = [];
        foreach ($matieresPayload as $matierePayload) {
            $matiereIds[] = (int) DB::table('matieres')->insertGetId([
                'nom' => $matierePayload['nom'],
                'coefficient' => $matierePayload['coefficient'],
                'created_at' => $now,
                'updated_at' => $now,
            ], 'id_matiere');
        }

        $studentsByClass = [];
        $studentRows = [];

        foreach ($etudiantsUsers as $idx => $studentUserId) {
            $classId = $classIds[$idx % count($classIds)];
            $parentId = $idx === 0 ? $parentStableId : $parents[array_rand($parents)];

            $studentRows[] = [
                'id_etudiant' => $studentUserId,
                'matricule' => 'STD-2026-' . str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT),
                'id_classe' => $classId,
                'id_parent' => $parentId,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $studentsByClass[$classId][] = $studentUserId;
        }

        DB::table('etudiants')->insert($studentRows);

        $enseignerRows = [];
        $assignmentKeys = [];
        $classAssignments = [];

        foreach ($classIds as $classId) {
            $subjectsForClass = (array) array_rand(array_flip($matiereIds), 6);

            foreach ($subjectsForClass as $matiereId) {
                $profId = $professeurs[array_rand($professeurs)];
                $key = $profId . '-' . $classId . '-' . $matiereId;

                if (isset($assignmentKeys[$key])) {
                    continue;
                }

                $assignmentKeys[$key] = true;
                $row = [
                    'id_professeur' => $profId,
                    'id_classe' => $classId,
                    'id_matiere' => $matiereId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $enseignerRows[] = $row;
                $classAssignments[$classId][] = $row;
            }
        }

        // Ensure the stable professor account always has assignments for testing.
        foreach (array_slice($classIds, 0, 4) as $classId) {
            foreach (array_slice($matiereIds, 0, 3) as $matiereId) {
                $key = $profStableId . '-' . $classId . '-' . $matiereId;
                if (isset($assignmentKeys[$key])) {
                    continue;
                }

                $assignmentKeys[$key] = true;
                $row = [
                    'id_professeur' => $profStableId,
                    'id_classe' => $classId,
                    'id_matiere' => $matiereId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $enseignerRows[] = $row;
                $classAssignments[$classId][] = $row;
            }
        }

        DB::table('enseigner')->insert($enseignerRows);

        $pairSeen = [];
        $pairRows = [];
        foreach ($enseignerRows as $row) {
            $pairKey = $row['id_classe'] . '-' . $row['id_professeur'];
            if (isset($pairSeen[$pairKey])) {
                continue;
            }
            $pairSeen[$pairKey] = true;
            $pairRows[] = [
                'id_classe' => $row['id_classe'],
                'id_professeur' => $row['id_professeur'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('classe_professeur_assignments')->insert($pairRows);

        $days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        $slots = [
            ['08:00:00', '09:00:00'],
            ['09:00:00', '10:00:00'],
            ['10:15:00', '11:15:00'],
            ['11:15:00', '12:15:00'],
            ['14:00:00', '15:00:00'],
            ['15:00:00', '16:00:00'],
        ];

        $edtRows = [];
        foreach ($classIds as $classIndex => $classId) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            for ($i = 0; $i < 18; $i++) {
                $pick = $assignments[array_rand($assignments)];
                $slot = $slots[$i % count($slots)];

                $edtRows[] = [
                    'jour' => $days[$i % count($days)],
                    'heure_debut' => $slot[0],
                    'heure_fin' => $slot[1],
                    'id_classe' => $classId,
                    'id_matiere' => $pick['id_matiere'],
                    'id_professeur' => $pick['id_professeur'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('emploi_du_temps')->insert($edtRows);

        $leconRows = [];
        foreach ($matiereIds as $matiereId) {
            for ($i = 1; $i <= 10; $i++) {
                $leconRows[] = [
                    'titre' => 'Lecon ' . $i . ' - ' . $faker->words(3, true),
                    'description' => $faker->sentence(18),
                    'id_matiere' => $matiereId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('lecons')->insert($leconRows);

        $annonceRows = [];
        for ($i = 0; $i < 120; $i++) {
            $annonceRows[] = [
                'titre' => $faker->sentence(6),
                'contenu' => $faker->paragraph(3),
                'date_publication' => $faker->dateTimeBetween('-120 days', 'now'),
                'id_professeur' => $professeurs[array_rand($professeurs)],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('annonces')->insert($annonceRows);

        $resourceTypes = ['PDF', 'Video', 'Lien', 'PPT', 'DOC'];
        $resourceRows = [];
        for ($i = 0; $i < 220; $i++) {
            $ext = strtolower($faker->randomElement(['pdf', 'pptx', 'docx', 'mp4']));
            $resourceRows[] = [
                'fichier' => 'ressource-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT) . '.' . $ext,
                'type_ressource' => $faker->randomElement($resourceTypes),
                'id_professeur' => $professeurs[array_rand($professeurs)],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('ressources')->insert($resourceRows);

        $devoirRows = [];
        foreach ($classIds as $classId) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            for ($i = 0; $i < 16; $i++) {
                $pick = $assignments[array_rand($assignments)];
                $deadline = $i % 4 === 0
                    ? $faker->dateTimeBetween('-25 days', '-1 day')
                    : $faker->dateTimeBetween('+2 days', '+30 days');

                $devoirRows[] = [
                    'titre' => 'DM ' . $faker->words(4, true),
                    'description' => $faker->paragraph(2),
                    'date_limite' => $deadline,
                    'id_professeur' => $pick['id_professeur'],
                    'id_classe' => $classId,
                    'id_matiere' => $pick['id_matiere'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('devoirs')->insert($devoirRows);

        $notesRows = [];
        foreach ($studentsByClass as $classId => $studentIds) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            foreach ($studentIds as $studentId) {
                for ($i = 0; $i < 10; $i++) {
                    $pick = $assignments[array_rand($assignments)];
                    $notesRows[] = [
                        'valeur' => $faker->randomFloat(2, 6, 20),
                        'appreciation' => $faker->randomElement([
                            'Tres bon travail',
                            'Bon niveau',
                            'Peut mieux faire',
                            'Doit renforcer les acquis',
                            'Participation satisfaisante',
                        ]),
                        'id_etudiant' => $studentId,
                        'id_matiere' => $pick['id_matiere'],
                        'id_professeur' => $pick['id_professeur'],
                        'created_at' => $faker->dateTimeBetween('-140 days', 'now'),
                        'updated_at' => $now,
                    ];
                }
            }
        }
        foreach (array_chunk($notesRows, 1000) as $chunk) {
            DB::table('notes')->insert($chunk);
        }

        $absenceRows = [];
        foreach ($studentsByClass as $classId => $studentIds) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            foreach ($studentIds as $studentId) {
                $count = random_int(0, 4);
                for ($i = 0; $i < $count; $i++) {
                    $pick = $assignments[array_rand($assignments)];
                    $absenceRows[] = [
                        'date_abs' => $faker->dateTimeBetween('-100 days', 'now'),
                        'motif' => $faker->randomElement([
                            'Maladie',
                            'Rendez-vous familial',
                            'Retard de transport',
                            'Motif personnel',
                        ]),
                        'id_etudiant' => $studentId,
                        'id_professeur' => $pick['id_professeur'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }
        if (! empty($absenceRows)) {
            foreach (array_chunk($absenceRows, 1000) as $chunk) {
                DB::table('absences')->insert($chunk);
            }
        }

        $reclamationRows = [];
        foreach ($parents as $parentId) {
            $count = random_int(1, 4);
            for ($i = 0; $i < $count; $i++) {
                $reclamationRows[] = [
                    'sujet' => $faker->randomElement([
                        'Demande d information sur les notes',
                        'Question sur l emploi du temps',
                        'Suivi des absences',
                        'Demande de rendez-vous',
                    ]),
                    'message' => $faker->paragraph(2),
                    'date_soumission' => $faker->dateTimeBetween('-70 days', 'now'),
                    'statut' => $faker->randomElement(['en_attente', 'traitee', 'rejetee']),
                    'id_parent' => $parentId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('reclamations')->insert($reclamationRows);

        $devoirs = DB::table('devoirs')->select('id_devoir', 'id_classe', 'date_limite')->get();
        $soumissionRows = [];
        foreach ($devoirs as $devoir) {
            $classStudentIds = $studentsByClass[$devoir->id_classe] ?? [];
            if (empty($classStudentIds)) {
                continue;
            }

            shuffle($classStudentIds);
            $take = max(3, (int) floor(count($classStudentIds) * 0.45));
            $pickedStudents = array_slice($classStudentIds, 0, $take);

            foreach ($pickedStudents as $studentId) {
                $submittedAt = $faker->dateTimeBetween('-20 days', 'now');
                $status = $submittedAt > $devoir->date_limite ? 'en_retard' : 'soumis';

                $soumissionRows[] = [
                    'id_devoir' => $devoir->id_devoir,
                    'id_etudiant' => $studentId,
                    'fichier_path' => 'devoirs_soumis/submission-' . $devoir->id_devoir . '-' . $studentId . '.pdf',
                    'commentaire' => $faker->sentence(10),
                    'date_soumission' => $submittedAt,
                    'statut' => $status,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        foreach (array_chunk($soumissionRows, 1000) as $chunk) {
            DB::table('devoir_soumissions')->insert($chunk);
        }

        $complaintRows = [];
        for ($i = 0; $i < 260; $i++) {
            $complaintRows[] = [
                'id_professeur' => $professeurs[array_rand($professeurs)],
                'subject' => $faker->randomElement([
                    'Materiel pedagogique insuffisant',
                    'Probleme d emploi du temps',
                    'Besoin de support informatique',
                    'Signalement administratif',
                ]),
                'category' => $faker->randomElement(['Technique', 'Materiel', 'Administratif', 'Organisation']),
                'message' => $faker->paragraph(2),
                'status' => $faker->randomElement(['en_attente', 'traitee', 'rejetee']),
                'created_at' => $faker->dateTimeBetween('-120 days', 'now'),
                'updated_at' => $now,
            ];
        }
        foreach (array_chunk($complaintRows, 1000) as $chunk) {
            DB::table('complaints')->insert($chunk);
        }

        // Seed all English mirror tables for additional testing volume.
        $englishTablesBulk = [
            'subjects' => 100,
            'students' => 300,
            'assignments' => 240,
            'resources' => 220,
            'schedules' => 180,
            'announcements' => 150,
            'attendances' => 600,
            'grades' => 700,
            'syllabus_progress' => 320,
        ];

        foreach ($englishTablesBulk as $table => $count) {
            $rows = [];
            for ($i = 0; $i < $count; $i++) {
                $rows[] = [
                    'created_at' => $faker->dateTimeBetween('-120 days', 'now'),
                    'updated_at' => $now,
                ];
            }
            foreach (array_chunk($rows, 1000) as $chunk) {
                DB::table($table)->insert($chunk);
            }
        }
    }
}
