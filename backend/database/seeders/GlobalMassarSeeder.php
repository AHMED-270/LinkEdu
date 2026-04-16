<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GlobalMassarSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $this->truncateAll();

        $niveaux = config('school_options.niveaux', []);
        $filieresByNiveau = config('school_options.filieres_by_niveau', []);
        $pricingByNiveauFiliere = config('school_options.pricing_by_niveau_filiere', []);
        $matieresByNiveauFiliere = config('school_options.matieres_by_niveau_filiere', []);
        $matiereCatalog = config('school_options.matieres', []);

        $niveauLabelByCode = [];
        $cycleByCode = [];
        foreach ($niveaux as $niveauConfig) {
            $code = (string) ($niveauConfig['code'] ?? '');
            if ($code === '') {
                continue;
            }

            $niveauLabelByCode[$code] = (string) ($niveauConfig['label'] ?? strtoupper($code));
            $cycleByCode[$code] = (string) ($niveauConfig['cycle'] ?? 'lycee');
        }

        $passwordHashes = [
            'admin' => Hash::make('Admin@2026'),
            'directeur' => Hash::make('Dir@2026'),
            'secretaire' => Hash::make('Secr@2026'),
            'comptable' => Hash::make('Compt@2026'),
            'professeur' => Hash::make('Prof@2026'),
            'parent' => Hash::make('Parent@2026'),
            'parent_eleve' => Hash::make('ParentEleve@2026'),
            'etudiant' => Hash::make('Etudiant@2026'),
        ];

        $hasAccountStatus = Schema::hasColumn('users', 'account_status');
        $hasActivatedAt = Schema::hasColumn('users', 'activated_at');

        $createUser = function (
            string $email,
            string $role,
            string $prenom,
            string $nom,
            string $passwordHash
        ) use ($now, $hasAccountStatus, $hasActivatedAt): int {
            $payload = [
                'name' => trim($prenom . ' ' . $nom),
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => strtolower($email),
                'email_verified_at' => $now,
                'password' => $passwordHash,
                'role' => $role,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($hasAccountStatus) {
                $payload['account_status'] = 'active';
            }

            if ($hasActivatedAt) {
                $payload['activated_at'] = $now;
            }

            return (int) DB::table('users')->insertGetId($payload);
        };

        $adminId = $createUser('admin@linkedu.com', 'admin', 'Admin', 'LinkEdu', $passwordHashes['admin']);
        $directeurId = $createUser('directeur@linkedu.com', 'directeur', 'Nabil', 'Bennani', $passwordHashes['directeur']);
        $secretaireId = $createUser('secretaire@linkedu.com', 'secretaire', 'Salma', 'Alaoui', $passwordHashes['secretaire']);
        $comptableId = $createUser('comptable@linkedu.com', 'comptable', 'Hicham', 'Tazi', $passwordHashes['comptable']);
        $professeurCoreId = $createUser('professeur@linkedu.com', 'professeur', 'Karim', 'El Idrissi', $passwordHashes['professeur']);
        $parentCoreId = $createUser('parent@linkedu.com', 'parent', 'Khadija', 'Bennani', $passwordHashes['parent']);
        $parentEleveCoreId = $createUser('parent.eleve@linkedu.com', 'parent_eleve', 'Rachida', 'Mansouri', $passwordHashes['parent_eleve']);
        $studentCoreId = $createUser('etudiant@linkedu.com', 'etudiant', 'Yassine', 'El Amrani', $passwordHashes['etudiant']);
        $studentParentEleveId = $createUser('etudiant.parenteleve@linkedu.com', 'etudiant', 'Aya', 'Mansouri', $passwordHashes['etudiant']);

        $staffFirstNames = [
            'Youssef', 'Imane', 'Soufiane', 'Meryem', 'Hamza', 'Sara', 'Ayoub', 'Hajar', 'Mehdi', 'Nour',
            'Adil', 'Samira', 'Omar', 'Latifa', 'Rida', 'Siham', 'Anas', 'Wafae', 'Achraf', 'Zineb',
            'Ismail', 'Loubna', 'Taha', 'Nadia', 'Reda', 'Ilham', 'Amine', 'Ikram', 'Bilal', 'Nawal',
        ];

        $staffLastNames = [
            'Alaoui', 'Bennani', 'El Fassi', 'Mekkaoui', 'Idrissi', 'Ouazzani', 'Sefrioui', 'Kettani', 'Chraibi', 'Amrani',
            'Belhaj', 'Benjelloun', 'Moutaouakil', 'Bourquia', 'Rami', 'Lahlou', 'Jabri', 'Tazi', 'Sqalli', 'Lazrak',
        ];

        $professorMainSubjects = [
            'Mathematiques',
            'Francais',
            'Arabe',
            'Langue Arabe',
            'Anglais',
            'Physique-Chimie',
            'Sciences de la Vie et de la Terre (SVT)',
            'Histoire-Geographie',
            'Education Islamique',
            'Informatique',
            'Education Physique',
            'Philosophie',
            'Sciences d Ingenieur',
            'Electrotechnique',
            'Electronique',
            'Mecanique Appliquee',
            'Conception Mecanique',
            'Economie Generale et Statistiques',
            'Comptabilite Generale',
            'Sociologie',
            'Management des Ressources Humaines',
            'Technologie',
            'Communication et Soft Skills',
        ];

        $directeurHasTelephone = Schema::hasColumn('directeurs', 'telephone');
        $directeurRows = [
            [
                'id_directeur' => $directeurId,
                'mandat' => '2025-2029',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        if ($directeurHasTelephone) {
            $directeurRows[0]['telephone'] = '0610101010';
        }

        $secretaireRows = [
            [
                'id_secretaire' => $secretaireId,
                'departement' => 'Scolarite',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        $additionalSecretaries = 2;
        for ($i = 0; $i < $additionalSecretaries; $i++) {
            $prenom = $staffFirstNames[$i];
            $nom = $staffLastNames[$i];
            $id = $createUser(
                'secretaire' . ($i + 2) . '@linkedu.com',
                'secretaire',
                $prenom,
                $nom,
                $passwordHashes['secretaire']
            );

            $secretaireRows[] = [
                'id_secretaire' => $id,
                'departement' => $i % 2 === 0 ? 'Administration' : 'Comptabilite',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $adminRows = [
            [
                'id_admin' => $adminId,
                'permissions' => 'all',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        $profHasTelephone = Schema::hasColumn('professeurs', 'telephone');
        $profHasMatiere = Schema::hasColumn('professeurs', 'matiere_enseignement');
        $profHasNiveau = Schema::hasColumn('professeurs', 'niveau_enseignement');
        $profHasMatieres = Schema::hasColumn('professeurs', 'matieres_enseignement');

        $professeurRows = [];
        $professorIds = [];
        $professorsBySubject = [];

        $registerProfessor = function (int $id, string $mainSubject, string $niveau) use (
            &$professeurRows,
            &$professorIds,
            &$professorsBySubject,
            $profHasTelephone,
            $profHasMatiere,
            $profHasNiveau,
            $profHasMatieres,
            $now
        ): void {
            $professorIds[] = $id;
            $subjectList = [$mainSubject];

            $row = [
                'id_professeur' => $id,
                'specialite' => $mainSubject,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($profHasTelephone) {
                $row['telephone'] = '06' . str_pad((string) (10000000 + ($id % 90000000)), 8, '0', STR_PAD_LEFT);
            }

            if ($profHasMatiere) {
                $row['matiere_enseignement'] = $mainSubject;
            }

            if ($profHasNiveau) {
                $row['niveau_enseignement'] = $niveau;
            }

            if ($profHasMatieres) {
                $row['matieres_enseignement'] = json_encode($subjectList, JSON_UNESCAPED_UNICODE);
            }

            $professeurRows[] = $row;

            $normalized = $this->normalizeSubject($mainSubject);
            if (! isset($professorsBySubject[$normalized])) {
                $professorsBySubject[$normalized] = [];
            }

            $professorsBySubject[$normalized][] = $id;
        };

        $registerProfessor($professeurCoreId, 'Mathematiques', 'college,lycee');

        $professorCount = 28;
        for ($i = 0; $i < $professorCount; $i++) {
            $prenom = $staffFirstNames[($i + 3) % count($staffFirstNames)];
            $nom = $staffLastNames[($i + 4) % count($staffLastNames)];
            $mainSubject = $professorMainSubjects[$i % count($professorMainSubjects)];

            $id = $createUser(
                'prof' . str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) . '@linkedu.com',
                'professeur',
                $prenom,
                $nom,
                $passwordHashes['professeur']
            );

            $niveau = $i < 6 ? 'maternelle,primaire' : ($i < 14 ? 'primaire,college' : 'college,lycee');
            $registerProfessor($id, $mainSubject, $niveau);
        }

        $parentHasCountryCode = Schema::hasColumn('parents', 'country_code');
        $parentHasCin = Schema::hasColumn('parents', 'cin');
        $parentHasUrgencePhone = Schema::hasColumn('parents', 'urgence_phone');

        $childrenByParent = [];
        $studentsByClass = [];
        $studentMeta = [];
        $matriculeCounter = 1;
        $parentCounter = 1;

        $insertParentProfile = function (int $parentId, int $index) use (
            $now,
            $parentHasCountryCode,
            $parentHasCin,
            $parentHasUrgencePhone
        ): void {
            $row = [
                'id_parent' => $parentId,
                'telephone' => '06' . str_pad((string) (20000000 + $index), 8, '0', STR_PAD_LEFT),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($parentHasCountryCode) {
                $row['country_code'] = '+212';
            }

            if ($parentHasCin) {
                $row['cin'] = 'PA' . str_pad((string) (100000 + $index), 6, '0', STR_PAD_LEFT);
            }

            if ($parentHasUrgencePhone) {
                $row['urgence_phone'] = '07' . str_pad((string) (30000000 + $index), 8, '0', STR_PAD_LEFT);
            }

            DB::table('parents')->insert($row);
        };

        $insertParentProfile($parentCoreId, $parentCounter++);
        $insertParentProfile($parentEleveCoreId, $parentCounter++);

        $matiereHasNiveau = Schema::hasColumn('matieres', 'niveau');
        $matiereHasByLevel = Schema::hasColumn('matieres', 'coefficients_by_level');
        $matiereHasByCode = Schema::hasColumn('matieres', 'coefficients_by_niveau_code');
        $matiereHasLyceeNiveauCode = Schema::hasColumn('matieres', 'lycee_niveau_code');
        $matiereHasLyceeFiliere = Schema::hasColumn('matieres', 'lycee_filiere');

        $coefficientsBySubject = [];
        foreach ($matiereCatalog as $matiere) {
            $nom = trim((string) ($matiere['nom'] ?? ''));
            if ($nom === '') {
                continue;
            }

            $coefficientsBySubject[$nom] = (int) ($matiere['coefficient'] ?? 2);
        }

        $additionalSubjects = [
            'Communication Orale' => 1,
            'Lecture et Ecriture' => 2,
            'Activites d eveil' => 1,
            'Education Artistique' => 1,
        ];

        foreach ($additionalSubjects as $subject => $coefficient) {
            if (! isset($coefficientsBySubject[$subject])) {
                $coefficientsBySubject[$subject] = $coefficient;
            }
        }

        $matiereRows = [];
        foreach ($coefficientsBySubject as $subject => $coefficient) {
            $row = [
                'nom' => $subject,
                'coefficient' => $coefficient,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($matiereHasNiveau) {
                $row['niveau'] = null;
            }

            if ($matiereHasByLevel) {
                $row['coefficients_by_level'] = json_encode(new \stdClass());
            }

            if ($matiereHasByCode) {
                $row['coefficients_by_niveau_code'] = json_encode(new \stdClass());
            }

            if ($matiereHasLyceeNiveauCode) {
                $row['lycee_niveau_code'] = null;
            }

            if ($matiereHasLyceeFiliere) {
                $row['lycee_filiere'] = null;
            }

            $matiereRows[] = $row;
        }

        DB::table('admin_ecoles')->insert($adminRows);
        DB::table('directeurs')->insert($directeurRows);
        DB::table('secretaires')->insert($secretaireRows);
        DB::table('professeurs')->insert($professeurRows);
        DB::table('matieres')->insert($matiereRows);

        $matiereIdsByName = DB::table('matieres')
            ->pluck('id_matiere', 'nom')
            ->all();

        $sectionsByNiveau = [
            'ms' => 1,
            'mm' => 1,
            'gs' => 1,
            '1ap' => 2,
            '2ap' => 2,
            '3ap' => 2,
            '4ap' => 2,
            '5ap' => 2,
            '6ap' => 2,
            '1ac' => 1,
            '2ac' => 1,
            '3ac' => 1,
            'tc' => 1,
            '1bac' => 1,
            '2bac' => 1,
        ];

        $classHasFiliere = Schema::hasColumn('classes', 'filiere');
        $classHasPricing = Schema::hasColumn('classes', 'pricing');
        $classHasProfesseur = Schema::hasColumn('classes', 'id_professeur');

        $classesById = [];
        $classIdsByNiveau = [];

        $classIndex = 0;
        foreach ($niveauLabelByCode as $niveauCode => $niveauLabel) {
            $filieres = $filieresByNiveau[$niveauCode] ?? ['General'];
            $sectionCount = $sectionsByNiveau[$niveauCode] ?? 1;

            foreach ($filieres as $filiere) {
                for ($section = 1; $section <= $sectionCount; $section++) {
                    $sectionLabel = chr(64 + $section);
                    $className = $this->buildClassName($niveauLabel, (string) $filiere, $sectionLabel);
                    $pricing = (float) ($pricingByNiveauFiliere[$niveauCode][$filiere] ?? 0);
                    $classPrincipal = $professorIds[$classIndex % count($professorIds)];

                    $row = [
                        'nom' => $className,
                        'niveau' => $niveauCode,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if ($classHasFiliere) {
                        $row['filiere'] = (string) $filiere;
                    }

                    if ($classHasPricing) {
                        $row['pricing'] = $pricing;
                    }

                    if ($classHasProfesseur) {
                        $row['id_professeur'] = $classPrincipal;
                    }

                    $idClasse = (int) DB::table('classes')->insertGetId($row, 'id_classe');

                    $classesById[$idClasse] = [
                        'nom' => $className,
                        'niveau' => $niveauCode,
                        'cycle' => $cycleByCode[$niveauCode] ?? 'lycee',
                        'filiere' => (string) $filiere,
                        'pricing' => $pricing > 0 ? $pricing : 1200,
                    ];
                    $classIdsByNiveau[$niveauCode][] = $idClasse;
                    $classIndex++;
                }
            }
        }

        $pickClassId = function (string $niveauCode) use ($classIdsByNiveau, $classesById): int {
            if (! empty($classIdsByNiveau[$niveauCode])) {
                return (int) $classIdsByNiveau[$niveauCode][0];
            }

            return (int) array_key_first($classesById);
        };

        $studentClassId = $pickClassId('1bac');
        $studentParentEleveClassId = $pickClassId('2ac');

        $insertStudent = function (
            int $studentId,
            int $classId,
            int $parentId,
            string $matricule,
            int $age,
            int $index
        ) use (&$studentsByClass, &$childrenByParent, &$studentMeta, $now): void {
            DB::table('etudiants')->insert([
                'id_etudiant' => $studentId,
                'matricule' => $matricule,
                'id_classe' => $classId,
                'id_parent' => $parentId,
                'date_naissance' => now()->subYears($age)->subDays(($index * 11) % 365)->toDateString(),
                'genre' => $index % 2 === 0 ? 'F' : 'M',
                'adresse' => 'Casablanca - Quartier ' . (($index % 25) + 1),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $studentsByClass[$classId][] = $studentId;
            $childrenByParent[$parentId][] = $studentId;
            $studentMeta[$studentId] = [
                'class_id' => $classId,
                'parent_id' => $parentId,
            ];
        };

        $insertStudent(
            $studentCoreId,
            $studentClassId,
            $parentCoreId,
            'MAS-' . str_pad((string) $matriculeCounter++, 6, '0', STR_PAD_LEFT),
            17,
            $matriculeCounter
        );

        $insertStudent(
            $studentParentEleveId,
            $studentParentEleveClassId,
            $parentEleveCoreId,
            'MAS-' . str_pad((string) $matriculeCounter++, 6, '0', STR_PAD_LEFT),
            14,
            $matriculeCounter
        );

        $studentFirstNames = [
            'Aya', 'Yanis', 'Lina', 'Adam', 'Meriem', 'Ilyas', 'Sara', 'Rayan', 'Mina', 'Ibrahim',
            'Chaima', 'Nassim', 'Hiba', 'Aymane', 'Noura', 'Zakaria', 'Imane', 'Soumaya', 'Yahya', 'Anissa',
        ];

        $studentLastNames = [
            'El Alami', 'Bennani', 'Chraibi', 'Lahlou', 'Amrani', 'Tazi', 'Mekkaoui', 'Kabbaj', 'Alaoui', 'El Fassi',
        ];

        $studentCounter = 1;
        foreach ($classesById as $classId => $classMeta) {
            $niveauCode = $classMeta['niveau'];
            $studentsPerClass = match ($classMeta['cycle']) {
                'maternelle' => 10,
                'primaire' => 9,
                'college' => 8,
                default => 7,
            };

            for ($i = 0; $i < $studentsPerClass; $i++) {
                $firstName = $studentFirstNames[($studentCounter + $i) % count($studentFirstNames)];
                $lastName = $studentLastNames[($studentCounter + $i * 2) % count($studentLastNames)];

                $parentFirst = $staffFirstNames[($studentCounter + 5) % count($staffFirstNames)];
                $parentLast = $staffLastNames[($studentCounter + 7) % count($staffLastNames)];

                $parentUserId = $createUser(
                    'parent' . str_pad((string) $studentCounter, 4, '0', STR_PAD_LEFT) . '@linkedu.com',
                    'parent_eleve',
                    $parentFirst,
                    $parentLast,
                    $passwordHashes['parent_eleve']
                );

                $insertParentProfile($parentUserId, $parentCounter++);

                $studentUserId = $createUser(
                    'etudiant' . str_pad((string) $studentCounter, 4, '0', STR_PAD_LEFT) . '@linkedu.com',
                    'etudiant',
                    $firstName,
                    $lastName,
                    $passwordHashes['etudiant']
                );

                $insertStudent(
                    $studentUserId,
                    (int) $classId,
                    $parentUserId,
                    'MAS-' . str_pad((string) $matriculeCounter++, 6, '0', STR_PAD_LEFT),
                    $this->ageByNiveauCode($niveauCode),
                    $studentCounter
                );

                $studentCounter++;
            }
        }

        $defaultMaternelleSubjects = [
            'Communication Orale',
            'Langue Arabe',
            'Francais',
            'Activites d eveil',
            'Education Artistique',
            'Education Physique',
        ];

        $defaultPrimaireSubjects = [
            'Langue Arabe',
            'Francais',
            'Mathematiques',
            'Histoire-Geographie',
            'Education Islamique',
            'Anglais',
            'Education Physique',
            'Informatique',
        ];

        $defaultCollegeSubjects = [
            'Mathematiques',
            'Physique-Chimie',
            'Sciences de la Vie et de la Terre (SVT)',
            'Francais',
            'Arabe',
            'Education Islamique',
            'Histoire-Geographie',
            'Anglais',
            'Education Physique',
        ];

        $resolveProfessorCandidates = function (string $subject) use (&$professorsBySubject, $professorIds): array {
            $normalized = $this->normalizeSubject($subject);

            if (isset($professorsBySubject[$normalized])) {
                return $professorsBySubject[$normalized];
            }

            $fallback = [];
            foreach ($professorsBySubject as $key => $ids) {
                if (str_contains($key, $normalized) || str_contains($normalized, $key)) {
                    foreach ($ids as $id) {
                        $fallback[$id] = $id;
                    }
                }
            }

            if (! empty($fallback)) {
                return array_values($fallback);
            }

            return $professorIds;
        };

        $ensureMatiere = function (string $subject) use (
            &$matiereIdsByName,
            $coefficientsBySubject,
            $matiereHasNiveau,
            $matiereHasByLevel,
            $matiereHasByCode,
            $matiereHasLyceeNiveauCode,
            $matiereHasLyceeFiliere,
            $now
        ): int {
            if (isset($matiereIdsByName[$subject])) {
                return (int) $matiereIdsByName[$subject];
            }

            $row = [
                'nom' => $subject,
                'coefficient' => (int) ($coefficientsBySubject[$subject] ?? 2),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($matiereHasNiveau) {
                $row['niveau'] = null;
            }

            if ($matiereHasByLevel) {
                $row['coefficients_by_level'] = json_encode(new \stdClass());
            }

            if ($matiereHasByCode) {
                $row['coefficients_by_niveau_code'] = json_encode(new \stdClass());
            }

            if ($matiereHasLyceeNiveauCode) {
                $row['lycee_niveau_code'] = null;
            }

            if ($matiereHasLyceeFiliere) {
                $row['lycee_filiere'] = null;
            }

            $id = (int) DB::table('matieres')->insertGetId($row, 'id_matiere');
            $matiereIdsByName[$subject] = $id;

            return $id;
        };

        $enseignerRows = [];
        $assignmentRows = [];
        $assignmentKeyMap = [];
        $classAssignments = [];

        foreach ($classesById as $classId => $classMeta) {
            $niveauCode = $classMeta['niveau'];
            $filiere = $classMeta['filiere'];
            $cycle = $classMeta['cycle'];

            $subjects = $matieresByNiveauFiliere[$niveauCode][$filiere] ?? null;
            if (! is_array($subjects) || empty($subjects)) {
                if ($cycle === 'maternelle') {
                    $subjects = $defaultMaternelleSubjects;
                } elseif ($cycle === 'primaire') {
                    $subjects = $defaultPrimaireSubjects;
                } elseif ($cycle === 'college') {
                    $subjects = $defaultCollegeSubjects;
                } else {
                    $subjects = [
                        'Mathematiques',
                        'Physique-Chimie',
                        'Sciences de la Vie et de la Terre (SVT)',
                        'Francais',
                        'Arabe',
                        'Anglais',
                        'Philosophie',
                        'Histoire-Geographie',
                        'Education Islamique',
                    ];
                }
            }

            $subjects = array_values(array_unique(array_map('trim', $subjects)));

            foreach ($subjects as $subjectIndex => $subject) {
                if ($subject === '') {
                    continue;
                }

                $matiereId = $ensureMatiere($subject);
                $candidates = $resolveProfessorCandidates($subject);
                $professorId = $candidates[$subjectIndex % count($candidates)];

                $assignmentKey = $classId . '-' . $matiereId . '-' . $professorId;
                if (isset($assignmentKeyMap[$assignmentKey])) {
                    continue;
                }

                $assignmentKeyMap[$assignmentKey] = true;
                $enseignerRows[] = [
                    'id_professeur' => $professorId,
                    'id_classe' => $classId,
                    'id_matiere' => $matiereId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $pairKey = $classId . '-' . $professorId;
                if (! isset($assignmentRows[$pairKey])) {
                    $assignmentRows[$pairKey] = [
                        'id_classe' => $classId,
                        'id_professeur' => $professorId,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                $classAssignments[$classId][] = [
                    'id_matiere' => $matiereId,
                    'id_professeur' => $professorId,
                    'matiere_nom' => $subject,
                ];
            }
        }

        foreach (array_chunk($enseignerRows, 500) as $chunk) {
            DB::table('enseigner')->insert($chunk);
        }

        if (Schema::hasTable('classe_professeur_assignments')) {
            $rows = array_values($assignmentRows);
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('classe_professeur_assignments')->insert($chunk);
            }
        }

        $days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        $slots = [
            ['08:00:00', '09:00:00'],
            ['09:00:00', '10:00:00'],
            ['10:15:00', '11:15:00'],
            ['11:15:00', '12:15:00'],
            ['14:00:00', '15:00:00'],
            ['15:00:00', '16:00:00'],
        ];

        $emploiHasSalle = Schema::hasColumn('emploi_du_temps', 'salle');
        $emploiHasCouleur = Schema::hasColumn('emploi_du_temps', 'couleur');
        $emploiHasStatut = Schema::hasColumn('emploi_du_temps', 'statut');

        $colors = ['#0f766e', '#1d4ed8', '#be123c', '#ea580c', '#0369a1', '#4f46e5', '#15803d', '#a16207'];

        $emploiRows = [];
        $classPosition = 0;
        foreach ($classesById as $classId => $classMeta) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            foreach ($days as $dayIndex => $day) {
                foreach ($slots as $slotIndex => $slot) {
                    $assignment = $assignments[($dayIndex * count($slots) + $slotIndex) % count($assignments)];
                    $colorIndex = abs(crc32($assignment['matiere_nom'])) % count($colors);

                    $row = [
                        'jour' => $day,
                        'heure_debut' => $slot[0],
                        'heure_fin' => $slot[1],
                        'id_classe' => $classId,
                        'id_matiere' => $assignment['id_matiere'],
                        'id_professeur' => $assignment['id_professeur'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if ($emploiHasSalle) {
                        $row['salle'] = 'B' . str_pad((string) (($classPosition % 12) + 1), 2, '0', STR_PAD_LEFT) . '-' . ($slotIndex + 1);
                    }

                    if ($emploiHasCouleur) {
                        $row['couleur'] = $colors[$colorIndex];
                    }

                    if ($emploiHasStatut) {
                        $row['statut'] = 'planifie';
                    }

                    $emploiRows[] = $row;
                }
            }

            $classPosition++;
        }

        foreach (array_chunk($emploiRows, 1000) as $chunk) {
            DB::table('emploi_du_temps')->insert($chunk);
        }

        $leconRows = [];
        foreach ($matiereIdsByName as $subject => $matiereId) {
            for ($chapter = 1; $chapter <= 3; $chapter++) {
                $leconRows[] = [
                    'titre' => 'Module ' . $chapter . ' - ' . $subject,
                    'description' => 'Progression pedagogique du module ' . $chapter . ' pour ' . $subject . '.',
                    'id_matiere' => $matiereId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($leconRows, 1000) as $chunk) {
            DB::table('lecons')->insert($chunk);
        }

        $userNamesById = DB::table('users')
            ->select('id', 'nom', 'prenom')
            ->whereIn('id', [$adminId, $directeurId, $secretaireId, $professeurCoreId])
            ->get()
            ->mapWithKeys(function ($row) {
                return [$row->id => trim((string) $row->prenom . ' ' . (string) $row->nom)];
            })
            ->all();

        $annonceHasIdUser = Schema::hasColumn('annonces', 'id_user');
        $annonceHasIdProfesseur = Schema::hasColumn('annonces', 'id_professeur');
        $annonceHasType = Schema::hasColumn('annonces', 'type');
        $annonceHasAuteur = Schema::hasColumn('annonces', 'auteur');
        $annonceHasCible = Schema::hasColumn('annonces', 'cible');
        $annonceHasPhotoPath = Schema::hasColumn('annonces', 'photo_path');

        $announcementAuthors = [$adminId, $directeurId, $secretaireId, $professeurCoreId];
        $announcementTargets = ['Tous', 'etudiant', 'parent', 'professeur', 'secretaire', 'directeur'];
        $announcementTypes = ['Info', 'Rappel', 'Urgent', 'Evenement'];

        $annonceRows = [];
        for ($i = 0; $i < 24; $i++) {
            $authorId = $announcementAuthors[$i % count($announcementAuthors)];

            $row = [
                'titre' => 'Annonce institutionnelle ' . ($i + 1),
                'contenu' => 'Communication interne numero ' . ($i + 1) . ' pour assurer un suivi pedagogique continu.',
                'date_publication' => now()->subDays($i),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($annonceHasIdUser) {
                $row['id_user'] = $authorId;
            } elseif ($annonceHasIdProfesseur) {
                $row['id_professeur'] = $professeurCoreId;
            }

            if ($annonceHasType) {
                $row['type'] = $announcementTypes[$i % count($announcementTypes)];
            }

            if ($annonceHasAuteur) {
                $row['auteur'] = $userNamesById[$authorId] ?? 'Direction';
            }

            if ($annonceHasCible) {
                $row['cible'] = $announcementTargets[$i % count($announcementTargets)];
            }

            if ($annonceHasPhotoPath) {
                $row['photo_path'] = null;
            }

            $annonceRows[] = $row;
        }

        DB::table('annonces')->insert($annonceRows);

        $resourceHasTitre = Schema::hasColumn('ressources', 'titre');
        $resourceHasDescription = Schema::hasColumn('ressources', 'description');
        $resourceHasClass = Schema::hasColumn('ressources', 'id_classe');
        $resourceHasMatiere = Schema::hasColumn('ressources', 'id_matiere');

        $ressourceRows = [];
        foreach ($classesById as $classId => $classMeta) {
            $assignments = array_slice($classAssignments[$classId] ?? [], 0, 3);
            foreach ($assignments as $index => $assignment) {
                $slug = Str::slug($classMeta['nom']);
                $row = [
                    'fichier' => 'ressources/' . $slug . '-' . ($index + 1) . '.pdf',
                    'type_ressource' => 'PDF',
                    'id_professeur' => $assignment['id_professeur'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($resourceHasTitre) {
                    $row['titre'] = 'Support ' . $assignment['matiere_nom'] . ' - ' . $classMeta['nom'];
                }

                if ($resourceHasDescription) {
                    $row['description'] = 'Document de cours pour ' . $assignment['matiere_nom'] . ' (' . $classMeta['nom'] . ').';
                }

                if ($resourceHasClass) {
                    $row['id_classe'] = $classId;
                }

                if ($resourceHasMatiere) {
                    $row['id_matiere'] = $assignment['id_matiere'];
                }

                $ressourceRows[] = $row;
            }
        }

        foreach (array_chunk($ressourceRows, 1000) as $chunk) {
            DB::table('ressources')->insert($chunk);
        }

        $devoirsByClass = [];
        foreach ($classesById as $classId => $classMeta) {
            $assignments = array_slice($classAssignments[$classId] ?? [], 0, 4);

            foreach ($assignments as $index => $assignment) {
                $dateLimite = now()->addDays(7 + ($index * 3))->toDateString();

                $devoirId = (int) DB::table('devoirs')->insertGetId([
                    'titre' => 'Devoir ' . ($index + 1) . ' - ' . $assignment['matiere_nom'],
                    'description' => 'Serie d exercices pour consolider les acquis de ' . $assignment['matiere_nom'] . '.',
                    'date_limite' => $dateLimite,
                    'id_professeur' => $assignment['id_professeur'],
                    'id_classe' => $classId,
                    'id_matiere' => $assignment['id_matiere'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'id_devoir');

                $devoirsByClass[$classId][] = [
                    'id_devoir' => $devoirId,
                    'date_limite' => $dateLimite,
                ];
            }
        }

        if (Schema::hasTable('devoir_soumissions')) {
            $soumissionRows = [];
            foreach ($devoirsByClass as $classId => $devoirs) {
                $studentIds = array_slice($studentsByClass[$classId] ?? [], 0, 3);
                if (empty($studentIds)) {
                    continue;
                }

                foreach ($devoirs as $devoir) {
                    foreach ($studentIds as $idx => $studentId) {
                        $deadline = \Carbon\Carbon::parse($devoir['date_limite']);
                        $submittedAt = $idx === 2
                            ? $deadline->copy()->addDay()->setTime(18, 0)
                            : $deadline->copy()->subDays($idx + 1)->setTime(17, 30);

                        $soumissionRows[] = [
                            'id_devoir' => $devoir['id_devoir'],
                            'id_etudiant' => $studentId,
                            'fichier_path' => 'devoirs_soumis/devoir-' . $devoir['id_devoir'] . '-etu-' . $studentId . '.pdf',
                            'commentaire' => 'Soumission de l eleve pour correction.',
                            'date_soumission' => $submittedAt,
                            'statut' => $idx === 2 ? 'en_retard' : 'soumis',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            foreach (array_chunk($soumissionRows, 1000) as $chunk) {
                DB::table('devoir_soumissions')->insert($chunk);
            }
        }

        $noteHasType = Schema::hasColumn('notes', 'type_evaluation');
        $noteHasSemestre = Schema::hasColumn('notes', 'semestre');

        $evaluationTypes = ['Controle 1', 'Controle 2', 'Examen'];
        $noteRows = [];

        foreach ($studentsByClass as $classId => $studentIds) {
            $assignments = array_slice($classAssignments[$classId] ?? [], 0, 4);
            if (empty($assignments)) {
                continue;
            }

            foreach ($studentIds as $studentIndex => $studentId) {
                foreach ($assignments as $evalIndex => $assignment) {
                    $score = min(20, 10 + (($studentIndex + $evalIndex + $classId) % 9) + (($evalIndex % 2) * 0.5));

                    $row = [
                        'valeur' => $score,
                        'appreciation' => $this->appreciationForScore($score),
                        'id_etudiant' => $studentId,
                        'id_matiere' => $assignment['id_matiere'],
                        'id_professeur' => $assignment['id_professeur'],
                        'created_at' => now()->subDays(35 - ($evalIndex * 5)),
                        'updated_at' => $now,
                    ];

                    if ($noteHasType) {
                        $row['type_evaluation'] = $evaluationTypes[$evalIndex % count($evaluationTypes)];
                    }

                    if ($noteHasSemestre) {
                        $row['semestre'] = $evalIndex % 2 === 0 ? '1' : '2';
                    }

                    $noteRows[] = $row;
                }
            }
        }

        foreach (array_chunk($noteRows, 1000) as $chunk) {
            DB::table('notes')->insert($chunk);
        }

        $absenceHasHeure = Schema::hasColumn('absences', 'heure_seance');
        $absenceHasJustified = Schema::hasColumn('absences', 'est_justifiee');
        $absenceHasPoints = Schema::hasColumn('absences', 'points_sanction');

        $absenceRows = [];
        foreach ($studentsByClass as $classId => $studentIds) {
            $assignments = $classAssignments[$classId] ?? [];
            if (empty($assignments)) {
                continue;
            }

            $trackedStudents = array_slice($studentIds, 0, 2);
            foreach ($trackedStudents as $index => $studentId) {
                $assignment = $assignments[$index % count($assignments)];

                $row = [
                    'date_abs' => now()->subDays(($classId + $index) % 20)->toDateString(),
                    'motif' => $index % 2 === 0 ? 'Rendez-vous medical' : 'Retard transport',
                    'id_etudiant' => $studentId,
                    'id_professeur' => $assignment['id_professeur'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($absenceHasHeure) {
                    $row['heure_seance'] = $slots[$index % count($slots)][0];
                }

                if ($absenceHasJustified) {
                    $row['est_justifiee'] = $index % 2 === 0;
                }

                if ($absenceHasPoints) {
                    $row['points_sanction'] = $index % 2 === 0 ? 0 : 0.5;
                }

                $absenceRows[] = $row;
            }
        }

        foreach (array_chunk($absenceRows, 1000) as $chunk) {
            DB::table('absences')->insert($chunk);
        }

        $reclamationHasEtudiant = Schema::hasColumn('reclamations', 'id_etudiant');
        $reclamationHasDateEnvoi = Schema::hasColumn('reclamations', 'date_envoi');
        $reclamationHasCible = Schema::hasColumn('reclamations', 'cible');
        $reclamationHasProfesseur = Schema::hasColumn('reclamations', 'id_professeur');
        $reclamationHasSecretaire = Schema::hasColumn('reclamations', 'id_secretaire');

        $reclamationStatuses = ['en_attente', 'en_cours', 'resolue', 'rejetee'];
        $reclamationTargets = ['parent', 'professeur', 'secretaire'];

        $reclamationRows = [];
        $parentIds = array_keys($childrenByParent);
        $sliceParentIds = array_slice($parentIds, 0, 120);

        foreach ($sliceParentIds as $index => $parentId) {
            $studentId = $childrenByParent[$parentId][0] ?? null;
            $studentClassId = $studentId && isset($studentMeta[$studentId]) ? $studentMeta[$studentId]['class_id'] : null;
            $assignment = $studentClassId ? ($classAssignments[$studentClassId][0] ?? null) : null;
            $target = $reclamationTargets[$index % count($reclamationTargets)];

            $row = [
                'sujet' => 'Reclamation pedagogique #' . ($index + 1),
                'message' => 'Demande de suivi concernant le parcours scolaire de l eleve.',
                'date_soumission' => now()->subDays(($index % 30) + 1),
                'statut' => $reclamationStatuses[$index % count($reclamationStatuses)],
                'id_parent' => $parentId,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($reclamationHasEtudiant) {
                $row['id_etudiant'] = $studentId;
            }

            if ($reclamationHasDateEnvoi) {
                $row['date_envoi'] = now()->subDays($index % 20);
            }

            if ($reclamationHasCible) {
                $row['cible'] = $target;
            }

            if ($reclamationHasProfesseur) {
                $row['id_professeur'] = $target === 'professeur' && $assignment ? $assignment['id_professeur'] : null;
            }

            if ($reclamationHasSecretaire) {
                $row['id_secretaire'] = $target === 'secretaire' ? $secretaireId : null;
            }

            $reclamationRows[] = $row;
        }

        foreach (array_chunk($reclamationRows, 1000) as $chunk) {
            DB::table('reclamations')->insert($chunk);
        }

        if (Schema::hasTable('demandes')) {
            $demandeTypes = [
                'Certificat de scolarite',
                'Attestation de presence',
                'Demande de rendez-vous',
                'Demande de transfert',
            ];

            $demandeRows = [];
            foreach ($sliceParentIds as $index => $parentId) {
                $studentId = $childrenByParent[$parentId][0] ?? null;

                $demandeRows[] = [
                    'type_demande' => $demandeTypes[$index % count($demandeTypes)],
                    'message' => 'Traitement souhaite dans les meilleurs delais.',
                    'statut' => $reclamationStatuses[$index % count($reclamationStatuses)],
                    'date_demande' => now()->subDays(($index % 25) + 1),
                    'id_parent' => $parentId,
                    'id_etudiant' => $studentId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($demandeRows, 1000) as $chunk) {
                DB::table('demandes')->insert($chunk);
            }
        }

        if (Schema::hasTable('paiements')) {
            $paymentHasReste = Schema::hasColumn('paiements', 'reste');
            $month = (int) now()->format('n');
            $year = (int) now()->format('Y');

            $paiementRows = [];
            $studentIds = array_keys($studentMeta);

            foreach ($studentIds as $index => $studentId) {
                $classId = $studentMeta[$studentId]['class_id'];
                $classPricing = (float) ($classesById[$classId]['pricing'] ?? 1200);
                $isPaid = $index % 4 !== 0;
                $reste = $isPaid ? 0 : round($classPricing * 0.35, 2);

                $row = [
                    'id_etudiant' => $studentId,
                    'mois' => $month,
                    'annee' => $year,
                    'montant' => $classPricing,
                    'type' => 'mensuel',
                    'statut' => $isPaid ? 'paye' : 'non_paye',
                    'date_paiement' => $isPaid ? now()->subDays($index % 20)->toDateString() : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($paymentHasReste) {
                    $row['reste'] = $reste;
                }

                $paiementRows[] = $row;
            }

            foreach (array_chunk($paiementRows, 1000) as $chunk) {
                DB::table('paiements')->insert($chunk);
            }
        }

        if (Schema::hasTable('complaints')) {
            $complaintRows = [];
            $complaintTargets = ['directeur', 'secretaire', 'les_deux'];
            $complaintStatuses = ['en_attente', 'en_cours', 'resolue'];

            foreach ($professorIds as $index => $professorId) {
                $complaintRows[] = [
                    'id_professeur' => $professorId,
                    'subject' => 'Besoin de support pedagogique #' . ($index + 1),
                    'category' => $index % 2 === 0 ? 'Organisation' : 'Materiel',
                    'message' => 'Signalement interne pour ameliorer les conditions de cours.',
                    'cible' => $complaintTargets[$index % count($complaintTargets)],
                    'status' => $complaintStatuses[$index % count($complaintStatuses)],
                    'created_at' => now()->subDays($index % 40),
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($complaintRows, 1000) as $chunk) {
                DB::table('complaints')->insert($chunk);
            }
        }

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
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->insert([
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        if ($this->command) {
            $this->command->info('GlobalMassarSeeder executed successfully.');
            $this->command->line('Core credentials:');
            $this->command->line('admin@linkedu.com / Admin@2026');
            $this->command->line('directeur@linkedu.com / Dir@2026');
            $this->command->line('secretaire@linkedu.com / Secr@2026');
            $this->command->line('comptable@linkedu.com / Compt@2026');
            $this->command->line('professeur@linkedu.com / Prof@2026');
            $this->command->line('parent@linkedu.com / Parent@2026');
            $this->command->line('parent.eleve@linkedu.com / ParentEleve@2026');
            $this->command->line('etudiant@linkedu.com / Etudiant@2026');
        }

        // Mark variable as used when static analysis is strict.
        unset($comptableId);
    }

    private function truncateAll(): void
    {
        $tables = [
            'devoir_soumissions',
            'demandes',
            'paiements',
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
            'personal_access_tokens',
            'sessions',
            'password_reset_tokens',
            'users',
        ];

        Schema::disableForeignKeyConstraints();

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        Schema::enableForeignKeyConstraints();
    }

    private function normalizeSubject(string $subject): string
    {
        $ascii = Str::lower(Str::ascii($subject));
        $normalized = preg_replace('/[^a-z0-9]+/', ' ', $ascii);

        return trim((string) $normalized);
    }

    private function buildClassName(string $niveauLabel, string $filiere, string $section): string
    {
        if ($filiere === 'General') {
            return $niveauLabel . ' ' . $section;
        }

        return $niveauLabel . ' - ' . $filiere . ' ' . $section;
    }

    private function ageByNiveauCode(string $niveauCode): int
    {
        return match ($niveauCode) {
            'ms' => 4,
            'mm' => 5,
            'gs' => 6,
            '1ap' => 7,
            '2ap' => 8,
            '3ap' => 9,
            '4ap' => 10,
            '5ap' => 11,
            '6ap' => 12,
            '1ac' => 13,
            '2ac' => 14,
            '3ac' => 15,
            'tc' => 16,
            '1bac' => 17,
            '2bac' => 18,
            default => 14,
        };
    }

    private function appreciationForScore(float $score): string
    {
        if ($score >= 16) {
            return 'Excellent niveau, continuez ainsi.';
        }

        if ($score >= 13) {
            return 'Bon travail et participation reguliere.';
        }

        if ($score >= 10) {
            return 'Resultat satisfaisant, efforts a poursuivre.';
        }

        return 'Renforcement recommande sur les notions de base.';
    }
}
