<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Etudiant;
use App\Models\Professeur;
use App\Models\Reclamation;
use App\Models\Secretaire;

class DirecteurController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $stats = [
            'classes' => DB::table('classes')->count(),
            'professeurs' => DB::table('professeurs')->count(),
            'etudiants' => DB::table('etudiants')->count(),
            'devoirs' => DB::table('devoirs')->count(),
            'annonces' => DB::table('annonces')->count(),
            'absence_rate' => '2.5%', 
            'performance' => '13.8/20', 
            'reclamations' => DB::table('reclamations')->whereIn('statut', ['Nouveau', 'En cours', 'nouveau', 'en cours'])->count(),
            'dossiers_attente' => DB::table('etudiants')->whereNull('id_classe')->count()
        ];

        $latestDevoirs = DB::table('devoirs')
            ->select('id_devoir', 'titre', 'date_limite', 'created_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'message' => 'Dashboard directeur',
            'stats' => $stats,
            'latest_devoirs' => $latestDevoirs,
        ]);
    }

    public function getProfessors(Request $request): JsonResponse
    {
        $niveauFilter = mb_strtolower(trim((string) $request->query('niveau', '')));
        $matiereFilter = mb_strtolower(trim((string) $request->query('matiere', '')));

        $normalizeMatiere = static function (string $label): string {
            $trimmed = trim($label);
            $lower = mb_strtolower($trimmed);

            if (in_array($lower, ['mathematique', 'mathématique', 'maths', 'math'], true)) {
                return 'math';
            }

            return $trimmed;
        };

        if (in_array($matiereFilter, ['mathematique', 'mathématique', 'maths'], true)) {
            $matiereFilter = 'math';
        }

        $professeurs = Professeur::with(['user', 'classes'])
            ->get()
            ->map(function ($prof) use ($normalizeMatiere) {
                $matieres = collect($prof->matieres_enseignement ?? [])
                    ->map(fn ($matiere) => $normalizeMatiere((string) $matiere))
                    ->filter()
                    ->unique(fn ($matiere) => mb_strtolower((string) $matiere))
                    ->values();

                if ($matieres->isEmpty() && ! empty($prof->matiere_enseignement)) {
                    $matieres = collect([$normalizeMatiere((string) $prof->matiere_enseignement)]);
                }

                if ($matieres->isEmpty() && ! empty($prof->specialite)) {
                    $matieres = collect([$normalizeMatiere((string) $prof->specialite)]);
                }

                $classes = $prof->classes->map(function ($classe) {
                    return [
                        'id_classe' => $classe->id_classe,
                        'nom' => $classe->nom,
                        'niveau' => $classe->niveau,
                    ];
                })->unique('id_classe')->values();

                $niveaux = collect([$prof->niveau_enseignement])
                    ->merge($classes->pluck('niveau'))
                    ->map(fn ($niveau) => trim((string) $niveau))
                    ->filter()
                    ->unique()
                    ->values();

            return [
                'id' => $prof->id_professeur,
                'id_professeur' => $prof->id_professeur,
                'name' => $prof->user ? $prof->user->name : 'Inconnu',
                'nom' => $prof->user ? $prof->user->nom : '',
                'prenom' => $prof->user ? $prof->user->prenom : '',
                'email' => $prof->user ? $prof->user->email : 'Inconnu',
                'telephone' => $prof->telephone,
                'avatar' => 'https://i.pravatar.cc/150?u=' . $prof->id_professeur,
                'subject' => strtoupper((string) ($matieres->first() ?? '')), // backward compatibility
                'matieres' => $matieres->values(),
                'classes' => $classes,
                'niveaux' => $niveaux,
                'niveau_enseignement' => $prof->niveau_enseignement,
                'status' => 'Actif',
                'progress' => 100,
                'lastActivityDate' => $prof->updated_at ? $prof->updated_at->diffForHumans() : 'Récemment',
                'lastActivityDesc' => 'Actif',
            ];
            })
            ->filter(function ($professeur) use ($niveauFilter, $matiereFilter) {
                if ($niveauFilter !== '') {
                    $matchesNiveau = collect($professeur['niveaux'] ?? [])
                        ->contains(fn ($niveau) => mb_strtolower((string) $niveau) === $niveauFilter);

                    if (! $matchesNiveau) {
                        return false;
                    }
                }

                if ($matiereFilter !== '') {
                    $matchesMatiere = collect($professeur['matieres'] ?? [])
                        ->contains(fn ($matiere) => mb_strtolower((string) $matiere) === $matiereFilter);

                    if (! $matchesMatiere) {
                        return false;
                    }
                }

                return true;
            })
            ->values();

        return response()->json($professeurs);
    }

    public function getStudents(Request $request): JsonResponse
    {
        $query = Etudiant::with(['user', 'classe', 'parentEleve.user'])
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->select('etudiants.*')
            ->orderBy('users.nom')
            ->orderBy('users.prenom');

        if ($request->filled('q')) {
            $term = trim((string) $request->query('q'));
            $query->where(function ($inner) use ($term) {
                $inner->whereHas('user', function ($q) use ($term) {
                    $q->where('nom', 'like', "%{$term}%")
                        ->orWhere('prenom', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                })->orWhere('etudiants.matricule', 'like', "%{$term}%");
            });
        }

        if ($request->filled('id_classe')) {
            $query->where('etudiants.id_classe', (int) $request->query('id_classe'));
        }

        if ($request->filled('niveau')) {
            $niveau = trim((string) $request->query('niveau'));
            $query->whereHas('classe', function ($q) use ($niveau) {
                $q->where('niveau', $niveau);
            });
        }

        $students = $query->get()->map(function ($etudiant) {
            return [
                'id_etudiant' => $etudiant->id_etudiant,
                'matricule' => $etudiant->matricule,
                'nom' => $etudiant->user->nom ?? '',
                'prenom' => $etudiant->user->prenom ?? '',
                'name' => $etudiant->user->name ?? '',
                'email' => $etudiant->user->email ?? '',
                'date_naissance' => $etudiant->date_naissance,
                'genre' => $etudiant->genre,
                'adresse' => $etudiant->adresse,
                'id_classe' => $etudiant->id_classe,
                'classe_nom' => $etudiant->classe->nom ?? null,
                'classe_niveau' => $etudiant->classe->niveau ?? null,
                'classe' => $etudiant->classe ? trim((string) $etudiant->classe->nom . ' - ' . (string) $etudiant->classe->niveau) : null,
                'parent_nom' => $etudiant->parentEleve->user->nom ?? '',
                'parent_prenom' => $etudiant->parentEleve->user->prenom ?? '',
                'parent_email' => $etudiant->parentEleve->user->email ?? '',
            ];
        })->values();

        return response()->json(['students' => $students]);
    }

    public function getStudentAbsences(int $id): JsonResponse
    {
        $student = Etudiant::with(['user', 'classe'])->find($id);

        if (! $student) {
            return response()->json([
                'message' => 'Etudiant introuvable.',
            ], 404);
        }

        $hasEstJustifiee = Schema::hasColumn('absences', 'est_justifiee');
        $hasPointsSanction = Schema::hasColumn('absences', 'points_sanction');
        $hasHeureSeance = Schema::hasColumn('absences', 'heure_seance');

        $select = [
            'absences.id_absence',
            'absences.date_abs',
            'absences.motif',
            'absences.id_etudiant',
            'absences.id_professeur',
            'prof_users.nom as prof_nom',
            'prof_users.prenom as prof_prenom',
        ];

        if ($hasEstJustifiee) {
            $select[] = 'absences.est_justifiee';
        }

        if ($hasPointsSanction) {
            $select[] = 'absences.points_sanction';
        }

        if ($hasHeureSeance) {
            $select[] = 'absences.heure_seance';
        }

        $rows = DB::table('absences')
            ->leftJoin('professeurs', 'absences.id_professeur', '=', 'professeurs.id_professeur')
            ->leftJoin('users as prof_users', 'professeurs.id_professeur', '=', 'prof_users.id')
            ->where('absences.id_etudiant', $id)
            ->orderByDesc('absences.date_abs')
            ->get($select);

        $absences = $rows->map(function ($row) use ($hasEstJustifiee, $hasPointsSanction, $hasHeureSeance) {
            $motif = trim((string) ($row->motif ?? ''));
            $justifiee = $hasEstJustifiee
                ? (bool) ($row->est_justifiee ?? false)
                : ($motif !== '' && ! str_contains(mb_strtolower($motif), 'attente'));

            $points = $hasPointsSanction
                ? (float) ($row->points_sanction ?? 0)
                : ($justifiee ? 0.0 : 0.25);

            return [
                'id_absence' => $row->id_absence,
                'date_abs' => $row->date_abs,
                'heure_seance' => $hasHeureSeance ? ($row->heure_seance ?? null) : null,
                'motif' => $row->motif,
                'justifiee' => $justifiee,
                'points_sanction' => $points,
                'heures' => 2,
                'professeur' => trim((string) (($row->prof_prenom ?? '') . ' ' . ($row->prof_nom ?? ''))),
            ];
        })->values();

        $totalAbsences = $absences->count();
        $totalHours = (int) $absences->sum('heures');
        $allJustified = $totalAbsences > 0 && $absences->every(fn ($absence) => (bool) ($absence['justifiee'] ?? false));
        $totalPenalty = (float) $absences->sum('points_sanction');

        $note = ($totalAbsences === 0 || $allJustified)
            ? 20.0
            : max(0.0, round(20.0 - $totalPenalty, 2));

        return response()->json([
            'student' => [
                'id_etudiant' => $student->id_etudiant,
                'nom' => $student->user->nom ?? '',
                'prenom' => $student->user->prenom ?? '',
                'matricule' => $student->matricule,
                'classe_nom' => $student->classe->nom ?? null,
                'classe_niveau' => $student->classe->niveau ?? null,
            ],
            'summary' => [
                'total_absences' => $totalAbsences,
                'total_heures' => $totalHours,
                'all_justifiees' => $allJustified,
                'note' => $note,
            ],
            'absences' => $absences,
        ]);
    }

    public function getSecretaires(): JsonResponse
    {
        $secretaires = Secretaire::with('user')
            ->get()
            ->map(function ($secretaire) {
                return [
                    'id_secretaire' => $secretaire->id_secretaire,
                    'nom' => $secretaire->user->nom ?? '',
                    'prenom' => $secretaire->user->prenom ?? '',
                    'email' => $secretaire->user->email ?? '',
                ];
            })
            ->values();

        return response()->json(['secretaires' => $secretaires]);
    }

    public function getReclamations(): JsonResponse
    {
        $hasProfesseurColumn = Schema::hasColumn('reclamations', 'id_professeur');
        $hasSecretaireColumn = Schema::hasColumn('reclamations', 'id_secretaire');
        $hasCibleColumn = Schema::hasColumn('reclamations', 'cible');

        $query = DB::table('reclamations')
            ->leftJoin('parents', 'reclamations.id_parent', '=', 'parents.id_parent')
            ->leftJoin('users as parent_user', 'parents.id_parent', '=', 'parent_user.id')
            ->leftJoin('etudiants', 'reclamations.id_etudiant', '=', 'etudiants.id_etudiant')
            ->leftJoin('users as etu_user', 'etudiants.id_etudiant', '=', 'etu_user.id')
            ->orderByDesc('created_at')

            ->select(
                'reclamations.id_reclamation',
                'reclamations.statut',
                'reclamations.date_soumission',
                'reclamations.created_at',
                'reclamations.id_parent',
                'reclamations.id_etudiant',
                'reclamations.sujet',
                'reclamations.message',
                DB::raw("CONCAT(COALESCE(parent_user.prenom, ''), ' ', COALESCE(parent_user.nom, '')) as parent_nom_complet"),
                DB::raw("CONCAT(COALESCE(etu_user.prenom, ''), ' ', COALESCE(etu_user.nom, '')) as etudiant_nom_complet")
            );

        if ($hasProfesseurColumn) {
            $query->leftJoin('professeurs', 'reclamations.id_professeur', '=', 'professeurs.id_professeur')
                ->leftJoin('users as prof_user', 'professeurs.id_professeur', '=', 'prof_user.id')
                ->addSelect(
                    'reclamations.id_professeur',
                    DB::raw("CONCAT(COALESCE(prof_user.prenom, ''), ' ', COALESCE(prof_user.nom, '')) as professeur_nom_complet")
                );
        } else {
            $query->addSelect(DB::raw('NULL as id_professeur'), DB::raw("'' as professeur_nom_complet"));
        }

        if ($hasSecretaireColumn) {
            $query->leftJoin('secretaires', 'reclamations.id_secretaire', '=', 'secretaires.id_secretaire')
                ->leftJoin('users as sec_user', 'secretaires.id_secretaire', '=', 'sec_user.id')
                ->addSelect(
                    'reclamations.id_secretaire',
                    DB::raw("CONCAT(COALESCE(sec_user.prenom, ''), ' ', COALESCE(sec_user.nom, '')) as secretaire_nom_complet")
                );
        } else {
            $query->addSelect(DB::raw('NULL as id_secretaire'), DB::raw("'' as secretaire_nom_complet"));
        }

        if ($hasCibleColumn) {
            $query->addSelect('reclamations.cible');
        } else {
            $query->addSelect(DB::raw("'parent' as cible"));
        }

        $reclamations = $query->get()->map(function ($rec) {
                $cible = trim((string) ($rec->cible ?? 'parent'));
                $cibleLabel = 'Parent';

                if ($cible === 'directeur') {
                    $cibleLabel = trim((string) ($rec->professeur_nom_complet ?? '')) ?: 'Professeur';
                } elseif ($cible === 'secretaire') {
                    $cibleLabel = trim((string) ($rec->secretaire_nom_complet ?? '')) ?: 'Secretaire';
                } else {
                    $studentName = trim((string) ($rec->etudiant_nom_complet ?? ''));
                    $parentName = trim((string) ($rec->parent_nom_complet ?? ''));
                    $cibleLabel = $studentName !== '' ? $studentName : ($parentName !== '' ? $parentName : 'Parent');
                }

                return [
                    'id_reclamation' => $rec->id_reclamation,
                    'statut' => $rec->statut ?: 'Nouveau',
                    'date_reclamation' => $rec->date_soumission ?? $rec->created_at,
                    'id_parent' => $rec->id_parent,
                    'id_etudiant' => $rec->id_etudiant,
                    'id_professeur' => $rec->id_professeur,
                    'id_secretaire' => $rec->id_secretaire,
                    'cible' => $cible,
                    'cible_label' => $cibleLabel,
                    'sujet' => $rec->sujet,
                    'description' => $rec->message,
                ];
            });

        return response()->json($reclamations);
    }

    public function storeReclamation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sujet' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'cible' => 'required|string|in:parent,directeur,secretaire',
            'etudiant_nom' => 'required_if:cible,parent|nullable|string|max:255',
            'professeur_nom' => 'required_if:cible,directeur|nullable|string|max:255',
            'secretaire_id' => 'required_if:cible,secretaire|nullable|integer|exists:secretaires,id_secretaire',
        ]);

        $hasProfesseurColumn = Schema::hasColumn('reclamations', 'id_professeur');
        $hasSecretaireColumn = Schema::hasColumn('reclamations', 'id_secretaire');
        $hasCibleColumn = Schema::hasColumn('reclamations', 'cible');

        $cible = trim((string) ($validated['cible'] ?? 'parent'));
        $parentId = null;
        $etudiantId = null;
        $professeurId = null;
        $secretaireId = null;
        $cibleLabel = null;

        if ($cible === 'parent') {
            $studentName = trim((string) ($validated['etudiant_nom'] ?? ''));

            $student = DB::table('etudiants')
                ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
                ->select(
                    'etudiants.id_etudiant',
                    'etudiants.id_parent',
                    'users.nom',
                    'users.prenom'
                )
                ->where(function ($query) use ($studentName) {
                    $needle = mb_strtolower($studentName);
                    $query->whereRaw("LOWER(CONCAT(users.prenom, ' ', users.nom)) LIKE ?", ["%{$needle}%"])
                        ->orWhereRaw("LOWER(CONCAT(users.nom, ' ', users.prenom)) LIKE ?", ["%{$needle}%"]);
                })
                ->first();

            if (! $student || ! $student->id_parent) {
                return response()->json([
                    'message' => 'Aucun etudiant lie a un parent n a ete trouve avec ce nom.',
                ], 422);
            }

            $etudiantId = (int) $student->id_etudiant;
            $parentId = (int) $student->id_parent;
            $cibleLabel = trim((string) (($student->prenom ?? '') . ' ' . ($student->nom ?? '')));
        }

        if ($cible === 'directeur') {
            $profName = trim((string) ($validated['professeur_nom'] ?? ''));
            $prof = DB::table('professeurs')
                ->join('users', 'professeurs.id_professeur', '=', 'users.id')
                ->select('professeurs.id_professeur', 'users.nom', 'users.prenom')
                ->where(function ($query) use ($profName) {
                    $needle = mb_strtolower($profName);
                    $query->whereRaw("LOWER(CONCAT(users.prenom, ' ', users.nom)) LIKE ?", ["%{$needle}%"])
                        ->orWhereRaw("LOWER(CONCAT(users.nom, ' ', users.prenom)) LIKE ?", ["%{$needle}%"]);
                })
                ->first();

            if (! $prof) {
                return response()->json([
                    'message' => 'Aucun professeur trouve avec ce nom.',
                ], 422);
            }

            $professeurId = (int) $prof->id_professeur;
            $cibleLabel = trim((string) (($prof->prenom ?? '') . ' ' . ($prof->nom ?? '')));
        }

        if ($cible === 'secretaire') {
            $secretaire = Secretaire::with('user')->find((int) $validated['secretaire_id']);

            if (! $secretaire) {
                return response()->json([
                    'message' => 'Secretaire introuvable.',
                ], 422);
            }

            $secretaireId = (int) $secretaire->id_secretaire;
            $cibleLabel = trim((string) (($secretaire->user->prenom ?? '') . ' ' . ($secretaire->user->nom ?? '')));
        }

        // Compatibilite schema legacy: id_parent est parfois non-nullable.
        if (! $parentId) {
            $parentId = DB::table('parents')->value('id_parent');
        }

        if (! $parentId) {
            return response()->json([
                'message' => 'Aucun parent disponible pour rattacher la reclamation.'
            ], 422);
        }

        $payload = [
            'sujet' => $validated['sujet'],
            'message' => $validated['description'],
            'date_soumission' => now(),
            'date_envoi' => now(),
            'statut' => 'Nouveau',
            'id_parent' => $parentId,
        ];

        if ($etudiantId) {
            $payload['id_etudiant'] = $etudiantId;
        }

        if ($hasProfesseurColumn) {
            $payload['id_professeur'] = $professeurId;
        }

        if ($hasSecretaireColumn) {
            $payload['id_secretaire'] = $secretaireId;
        }

        if ($hasCibleColumn) {
            $payload['cible'] = $cible;
        } else {
            $prefix = '[CIBLE:' . $cible . ($cibleLabel ? ':' . $cibleLabel : '') . '] ';
            $payload['message'] = $prefix . $payload['message'];
        }

        $reclamation = Reclamation::create($payload);

        return response()->json([
            'message' => 'Reclamation ajoutee avec succes.',
            'reclamation' => [
                'id_reclamation' => $reclamation->id_reclamation,
                'statut' => $reclamation->statut,
                'date_reclamation' => $reclamation->date_soumission,
                'id_parent' => $reclamation->id_parent,
                'id_etudiant' => $reclamation->id_etudiant,
                'id_professeur' => $reclamation->id_professeur ?? null,
                'id_secretaire' => $reclamation->id_secretaire ?? null,
                'cible' => $reclamation->cible ?? $cible,
                'cible_label' => $cibleLabel,
                'sujet' => $reclamation->sujet,
                'description' => $reclamation->message,
            ],
        ], 201);
    }

    public function updateReclamation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'sujet' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
        ]);

        $reclamation = Reclamation::where('id_reclamation', $id)->first();

        if (! $reclamation) {
            return response()->json([
                'message' => 'Reclamation introuvable.'
            ], 404);
        }

        $reclamation->sujet = $validated['sujet'];
        $reclamation->message = $validated['description'];
        $reclamation->save();

        return response()->json([
            'message' => 'Reclamation modifiee avec succes.',
            'reclamation' => [
                'id_reclamation' => $reclamation->id_reclamation,
                'statut' => $reclamation->statut,
                'date_reclamation' => $reclamation->date_soumission,
                'id_parent' => $reclamation->id_parent,
                'sujet' => $reclamation->sujet,
                'description' => $reclamation->message,
            ],
        ]);
    }

    public function deleteReclamation(int $id): JsonResponse
    {
        $reclamation = Reclamation::where('id_reclamation', $id)->first();

        if (! $reclamation) {
            return response()->json([
                'message' => 'Reclamation introuvable.'
            ], 404);
        }

        $reclamation->delete();

        return response()->json([
            'message' => 'Reclamation supprimee avec succes.'
        ]);
    }

    public function getNotesOverview(Request $request): JsonResponse
    {
        $evaluationTypeOptions = $this->getEvaluationFilterOptions();

        $classes = DB::table('classes')
            ->orderBy('niveau')
            ->orderBy('nom')
            ->get(['id_classe as id', 'nom', 'niveau'])
            ->map(function ($classe) {
                return [
                    'id' => (int) $classe->id,
                    'nom' => (string) $classe->nom,
                    'niveau' => (string) $classe->niveau,
                    'label' => trim((string) $classe->nom . ' - ' . (string) $classe->niveau),
                ];
            })
            ->values();

        if ($classes->isEmpty()) {
            return response()->json([
                'filters' => [
                    'classes' => [],
                    'matieres' => [],
                    'evaluationTypes' => $evaluationTypeOptions,
                    'periods' => [
                        ['value' => 'all', 'label' => 'Toutes periodes'],
                        ['value' => 'trimestre_1', 'label' => 'Trimestre 1'],
                        ['value' => 'trimestre_2', 'label' => 'Trimestre 2'],
                        ['value' => 'trimestre_3', 'label' => 'Trimestre 3'],
                        ['value' => 'semestre_1', 'label' => 'Semestre 1'],
                        ['value' => 'semestre_2', 'label' => 'Semestre 2'],
                    ],
                    'selectedClassId' => 0,
                    'selectedMatiereId' => 0,
                    'selectedEvaluationType' => 'Tous',
                    'selectedPeriod' => 'all',
                ],
                'columns' => [],
                'students' => [],
                'hasAnyNote' => false,
            ]);
        }

        $requestedClassId = (int) $request->query('class_id', 0);
        $selectedClassId = $classes->contains('id', $requestedClassId)
            ? $requestedClassId
            : (int) ($classes->first()['id'] ?? 0);

        $matieres = DB::table('enseigner')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_classe', $selectedClassId)
            ->distinct()
            ->orderBy('matieres.nom')
            ->get(['matieres.id_matiere as id', 'matieres.nom', 'matieres.coefficient'])
            ->map(function ($matiere) {
                return [
                    'id' => (int) $matiere->id,
                    'nom' => (string) $matiere->nom,
                    'coefficient' => max(1.0, (float) ($matiere->coefficient ?? 1)),
                ];
            })
            ->values();

        if ($matieres->isEmpty()) {
            $matieres = DB::table('matieres')
                ->orderBy('nom')
                ->get(['id_matiere as id', 'nom', 'coefficient'])
                ->map(function ($matiere) {
                    return [
                        'id' => (int) $matiere->id,
                        'nom' => (string) $matiere->nom,
                        'coefficient' => max(1.0, (float) ($matiere->coefficient ?? 1)),
                    ];
                })
                ->values();
        }

        $requestedMatiereId = (int) $request->query('matiere_id', 0);
        $selectedMatiereId = $matieres->contains('id', $requestedMatiereId)
            ? $requestedMatiereId
            : 0;

        $selectedEvaluationType = $this->normalizeRequestedEvaluationType((string) $request->query('evaluation_type', 'Tous'));
        $selectedPeriod = $this->normalizeRequestedPeriod((string) $request->query('period', 'all'));
        $columnDefinitions = $this->getColumnDefinitionsForEvaluationType($selectedEvaluationType);

        $evaluationTypeToColumn = [];
        foreach ($columnDefinitions as $definition) {
            foreach ($definition['types'] as $typeLabel) {
                $evaluationTypeToColumn[$typeLabel] = $definition['key'];
            }
        }

        $responseColumns = collect($columnDefinitions)
            ->map(function (array $definition) {
                return [
                    'key' => $definition['key'],
                    'label' => $definition['label'],
                    'evaluationType' => $definition['group'],
                ];
            })
            ->values();

        $studentsBase = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->where('etudiants.id_classe', $selectedClassId)
            ->orderBy('users.nom')
            ->orderBy('users.prenom')
            ->get([
                'etudiants.id_etudiant as id',
                'users.nom',
                'users.prenom',
            ])
            ->map(function ($row) {
                $firstName = (string) ($row->prenom ?? '');
                $lastName = (string) ($row->nom ?? '');

                return [
                    'id' => (int) $row->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => trim($firstName . ' ' . $lastName),
                ];
            })
            ->values();

        if ($studentsBase->isEmpty()) {
            return response()->json([
                'filters' => [
                    'classes' => $classes,
                    'matieres' => $matieres,
                    'evaluationTypes' => $evaluationTypeOptions,
                    'periods' => [
                        ['value' => 'all', 'label' => 'Toutes periodes'],
                        ['value' => 'trimestre_1', 'label' => 'Trimestre 1'],
                        ['value' => 'trimestre_2', 'label' => 'Trimestre 2'],
                        ['value' => 'trimestre_3', 'label' => 'Trimestre 3'],
                        ['value' => 'semestre_1', 'label' => 'Semestre 1'],
                        ['value' => 'semestre_2', 'label' => 'Semestre 2'],
                    ],
                    'selectedClassId' => $selectedClassId,
                    'selectedMatiereId' => $selectedMatiereId,
                    'selectedEvaluationType' => $selectedEvaluationType,
                    'selectedPeriod' => $selectedPeriod,
                ],
                'columns' => $responseColumns,
                'students' => [],
                'hasAnyNote' => false,
            ]);
        }

        $studentIds = $studentsBase->pluck('id')->values();

        $hasTypeColumn = Schema::hasColumn('notes', 'type_evaluation');
        $hasPeriodColumn = Schema::hasColumn('notes', 'periode');
        $hasStatusColumn = Schema::hasColumn('notes', 'statut_absence');

        $noteColumns = [
            'notes.id_note',
            'notes.id_etudiant',
            'notes.id_matiere',
            'notes.valeur',
            'notes.appreciation',
            'notes.created_at',
            'matieres.nom as matiere_nom',
            'matieres.coefficient as matiere_coefficient',
        ];

        if ($hasTypeColumn) {
            $noteColumns[] = 'notes.type_evaluation';
        }

        if ($hasPeriodColumn) {
            $noteColumns[] = 'notes.periode';
        }

        if ($hasStatusColumn) {
            $noteColumns[] = 'notes.statut_absence';
        }

        $noteRows = DB::table('notes')
            ->join('matieres', 'notes.id_matiere', '=', 'matieres.id_matiere')
            ->whereIn('notes.id_etudiant', $studentIds->all())
            ->when($selectedMatiereId > 0, function ($query) use ($selectedMatiereId) {
                $query->where('notes.id_matiere', $selectedMatiereId);
            })
            ->orderBy('notes.created_at')
            ->orderBy('notes.id_note')
            ->get($noteColumns);

        $notesByStudentAndColumn = [];

        foreach ($noteRows as $row) {
            $evaluationType = $this->normalizeStoredEvaluationType(
                $hasTypeColumn ? (string) ($row->type_evaluation ?? '') : null,
                (string) ($row->appreciation ?? '')
            );

            $columnKey = $evaluationTypeToColumn[$evaluationType] ?? null;
            if ($columnKey === null) {
                continue;
            }

            $periodMeta = $this->resolvePeriodMeta(
                $hasPeriodColumn ? (string) ($row->periode ?? '') : null,
                isset($row->created_at) ? (string) $row->created_at : null
            );

            if (! $this->periodMatches($selectedPeriod, $periodMeta)) {
                continue;
            }

            $specialStatus = $this->resolveSpecialStatus(
                $hasStatusColumn ? (string) ($row->statut_absence ?? '') : null,
                (string) ($row->appreciation ?? '')
            );

            $numericValue = $row->valeur !== null ? (float) $row->valeur : null;
            $coefficient = max(1.0, (float) ($row->matiere_coefficient ?? 1));

            $studentId = (int) $row->id_etudiant;
            if (! isset($notesByStudentAndColumn[$studentId])) {
                $notesByStudentAndColumn[$studentId] = [];
            }

            // Latest row for the same student/column wins.
            $notesByStudentAndColumn[$studentId][$columnKey] = [
                'noteId' => (int) $row->id_note,
                'numericValue' => $numericValue,
                'displayValue' => $this->formatDisplayNote($numericValue, $specialStatus),
                'status' => $this->resolveVisualStatus($numericValue, $specialStatus),
                'specialStatus' => $specialStatus,
                'coefficient' => $coefficient,
                'matiereId' => (int) $row->id_matiere,
                'matiereNom' => (string) ($row->matiere_nom ?? ''),
                'evaluationType' => $evaluationType,
                'periodLabel' => $periodMeta['label'],
                'periodValue' => $periodMeta['value'],
                'trimester' => $periodMeta['trimester'],
                'semester' => $periodMeta['semester'],
                'date' => isset($row->created_at) ? (string) $row->created_at : '',
            ];
        }

        $students = $studentsBase->map(function ($student) use ($notesByStudentAndColumn, $columnDefinitions) {
            $studentId = (int) $student['id'];
            $studentColumns = $notesByStudentAndColumn[$studentId] ?? [];

            $cells = [];
            $details = [];
            $weightedSum = 0.0;
            $totalCoefficient = 0.0;

            foreach ($columnDefinitions as $definition) {
                $columnKey = $definition['key'];
                $noteLine = $studentColumns[$columnKey] ?? null;

                if (! $noteLine) {
                    continue;
                }

                $cells[$columnKey] = [
                    'displayValue' => $noteLine['displayValue'],
                    'numericValue' => $noteLine['numericValue'],
                    'status' => $noteLine['status'],
                    'coefficient' => $noteLine['coefficient'],
                    'evaluationType' => $definition['group'],
                    'periodLabel' => $noteLine['periodLabel'],
                    'date' => $noteLine['date'],
                ];

                $details[] = [
                    'label' => $definition['label'],
                    'value' => $noteLine['displayValue'],
                    'numericValue' => $noteLine['numericValue'],
                    'status' => $noteLine['status'],
                    'coefficient' => $noteLine['coefficient'],
                    'evaluationType' => $definition['group'],
                    'periodLabel' => $noteLine['periodLabel'],
                    'date' => $noteLine['date'],
                ];

                if ($noteLine['numericValue'] !== null && ! in_array($noteLine['specialStatus'], ['ABS', 'AJ'], true)) {
                    $weightedSum += ((float) $noteLine['numericValue']) * ((float) $noteLine['coefficient']);
                    $totalCoefficient += (float) $noteLine['coefficient'];
                }
            }

            usort($details, function ($a, $b) {
                $dateCompare = strcmp((string) ($a['date'] ?? ''), (string) ($b['date'] ?? ''));
                if ($dateCompare !== 0) {
                    return $dateCompare;
                }

                return strcmp((string) ($a['label'] ?? ''), (string) ($b['label'] ?? ''));
            });

            $average = $totalCoefficient > 0
                ? round($weightedSum / $totalCoefficient, 2)
                : null;

            return [
                'id' => $studentId,
                'firstName' => (string) ($student['firstName'] ?? ''),
                'lastName' => (string) ($student['lastName'] ?? ''),
                'fullName' => (string) ($student['fullName'] ?? ''),
                'cells' => $cells,
                'details' => $details,
                'average' => $average,
                'averageStatus' => $average === null
                    ? 'empty'
                    : ($average >= 10 ? 'success' : 'danger'),
                'appreciation' => $this->getAverageAppreciation($average),
                'notesCount' => count($details),
            ];
        })->values();

        $periods = [
            ['value' => 'all', 'label' => 'Toutes periodes'],
            ['value' => 'trimestre_1', 'label' => 'Trimestre 1'],
            ['value' => 'trimestre_2', 'label' => 'Trimestre 2'],
            ['value' => 'trimestre_3', 'label' => 'Trimestre 3'],
            ['value' => 'semestre_1', 'label' => 'Semestre 1'],
            ['value' => 'semestre_2', 'label' => 'Semestre 2'],
        ];

        $hasAnyNote = $students->contains(function (array $student) {
            return (int) ($student['notesCount'] ?? 0) > 0;
        });

        return response()->json([
            'filters' => [
                'classes' => $classes,
                'matieres' => $matieres,
                'evaluationTypes' => $evaluationTypeOptions,
                'periods' => $periods,
                'selectedClassId' => $selectedClassId,
                'selectedMatiereId' => $selectedMatiereId,
                'selectedEvaluationType' => $selectedEvaluationType,
                'selectedPeriod' => $selectedPeriod,
            ],
            'columns' => $responseColumns,
            'students' => $students,
            'hasAnyNote' => $hasAnyNote,
        ]);
    }

    private function normalizeRequestedEvaluationType(string $value): string
    {
        $normalized = mb_strtolower(trim($value));
        $normalized = str_replace(
            ['ô', 'é', 'è', 'ê', 'à', 'â', 'î', 'ï', 'ù', 'û', 'ç', '-', '_'],
            ['o', 'e', 'e', 'e', 'a', 'a', 'i', 'i', 'u', 'u', 'c', ' ', ' '],
            $normalized
        );
        $normalized = preg_replace('/\s+/', ' ', (string) $normalized);
        $normalized = trim((string) $normalized);

        if ($normalized === '' || in_array($normalized, ['tous', 'tout', 'all'], true)) {
            return 'Tous';
        }

        if (str_contains($normalized, 'tp') || str_contains($normalized, 'participation')) {
            return 'TP / Participation';
        }

        if (str_contains($normalized, 'projet') || str_contains($normalized, 'expose')) {
            return 'Projet / Exposé';
        }

        return 'Contrôle';
    }

    private function normalizeStoredEvaluationType(?string $value, string $appreciation = ''): string
    {
        $candidate = trim((string) ($value ?? ''));
        if ($candidate === '') {
            $candidate = trim($appreciation);
        }

        $normalized = mb_strtolower($candidate);
        $normalized = str_replace(
            ['ô', 'é', 'è', 'ê', 'à', 'â', 'î', 'ï', 'ù', 'û', 'ç', '-', '_'],
            ['o', 'e', 'e', 'e', 'a', 'a', 'i', 'i', 'u', 'u', 'c', ' ', ' '],
            $normalized
        );
        $normalized = preg_replace('/\s+/', ' ', (string) $normalized);
        $normalized = trim((string) $normalized);

        if (str_contains($normalized, 'controle 4')) {
            return 'Contrôle 4';
        }

        if (str_contains($normalized, 'controle 3')) {
            return 'Contrôle 3';
        }

        if (str_contains($normalized, 'controle 2')) {
            return 'Contrôle 2';
        }

        if (str_contains($normalized, 'tp') || str_contains($normalized, 'participation')) {
            return 'TP / Participation';
        }

        if (str_contains($normalized, 'projet') || str_contains($normalized, 'expose')) {
            return 'Projet / Exposé';
        }

        return 'Contrôle 1';
    }

    private function getColumnDefinitionsForEvaluationType(string $selectedEvaluationType): array
    {
        $controleColumns = [
            ['key' => 'controle_1', 'label' => 'Contrôle 1', 'group' => 'Contrôle', 'types' => ['Contrôle 1']],
            ['key' => 'controle_2', 'label' => 'Contrôle 2', 'group' => 'Contrôle', 'types' => ['Contrôle 2']],
            ['key' => 'controle_3', 'label' => 'Contrôle 3', 'group' => 'Contrôle', 'types' => ['Contrôle 3']],
            ['key' => 'controle_4', 'label' => 'Contrôle 4', 'group' => 'Contrôle', 'types' => ['Contrôle 4']],
        ];

        $tpColumn = [
            ['key' => 'tp_participation', 'label' => 'TP / Participation', 'group' => 'TP / Participation', 'types' => ['TP / Participation']],
        ];

        $projetColumn = [
            ['key' => 'projet_expose', 'label' => 'Projet / Exposé', 'group' => 'Projet / Exposé', 'types' => ['Projet / Exposé']],
        ];

        if ($selectedEvaluationType === 'Contrôle') {
            return $controleColumns;
        }

        if ($selectedEvaluationType === 'TP / Participation') {
            return $tpColumn;
        }

        if ($selectedEvaluationType === 'Projet / Exposé') {
            return $projetColumn;
        }

        return array_merge($controleColumns, $tpColumn, $projetColumn);
    }

    private function getEvaluationFilterOptions(): array
    {
        return ['Tous', 'Contrôle', 'TP / Participation', 'Projet / Exposé'];
    }

    private function normalizeRequestedPeriod(string $value): string
    {
        $normalized = mb_strtolower(trim($value));
        $normalized = str_replace([' ', '-'], '_', $normalized);

        $aliases = [
            'all' => 'all',
            'tous' => 'all',
            'toutes' => 'all',
            'trimestre_1' => 'trimestre_1',
            'trimestre1' => 'trimestre_1',
            't1' => 'trimestre_1',
            'trimestre_2' => 'trimestre_2',
            'trimestre2' => 'trimestre_2',
            't2' => 'trimestre_2',
            'trimestre_3' => 'trimestre_3',
            'trimestre3' => 'trimestre_3',
            't3' => 'trimestre_3',
            'semestre_1' => 'semestre_1',
            'semestre1' => 'semestre_1',
            's1' => 'semestre_1',
            'semestre_2' => 'semestre_2',
            'semestre2' => 'semestre_2',
            's2' => 'semestre_2',
        ];

        return $aliases[$normalized] ?? 'all';
    }

    private function resolvePeriodMeta(?string $rawPeriod, ?string $createdAt): array
    {
        $normalized = $this->normalizeRequestedPeriod((string) ($rawPeriod ?? ''));

        if ($normalized !== 'all') {
            $semester = in_array($normalized, ['semestre_1', 'semestre_2'], true)
                ? $normalized
                : ($normalized === 'trimestre_3' ? 'semestre_2' : 'semestre_1');

            $trimester = in_array($normalized, ['trimestre_1', 'trimestre_2', 'trimestre_3'], true)
                ? $normalized
                : ($normalized === 'semestre_2' ? 'trimestre_3' : 'trimestre_1');

            return [
                'value' => $normalized,
                'label' => $this->periodLabelFromValue($normalized),
                'trimester' => $trimester,
                'semester' => $semester,
            ];
        }

        $timestamp = $createdAt ? strtotime($createdAt) : false;
        $month = $timestamp ? (int) date('n', $timestamp) : (int) date('n');

        if ($month >= 9 && $month <= 11) {
            return [
                'value' => 'trimestre_1',
                'label' => 'Trimestre 1',
                'trimester' => 'trimestre_1',
                'semester' => 'semestre_1',
            ];
        }

        if ($month === 12 || $month <= 2) {
            return [
                'value' => 'trimestre_2',
                'label' => 'Trimestre 2',
                'trimester' => 'trimestre_2',
                'semester' => 'semestre_1',
            ];
        }

        return [
            'value' => 'trimestre_3',
            'label' => 'Trimestre 3',
            'trimester' => 'trimestre_3',
            'semester' => 'semestre_2',
        ];
    }

    private function periodMatches(string $selectedPeriod, array $periodMeta): bool
    {
        if ($selectedPeriod === 'all') {
            return true;
        }

        if (str_starts_with($selectedPeriod, 'trimestre')) {
            return (string) ($periodMeta['trimester'] ?? '') === $selectedPeriod;
        }

        if (str_starts_with($selectedPeriod, 'semestre')) {
            return (string) ($periodMeta['semester'] ?? '') === $selectedPeriod;
        }

        return true;
    }

    private function periodLabelFromValue(string $periodValue): string
    {
        return match ($periodValue) {
            'trimestre_1' => 'Trimestre 1',
            'trimestre_2' => 'Trimestre 2',
            'trimestre_3' => 'Trimestre 3',
            'semestre_1' => 'Semestre 1',
            'semestre_2' => 'Semestre 2',
            default => 'Toutes periodes',
        };
    }

    private function resolveSpecialStatus(?string $statusValue, string $appreciation = ''): ?string
    {
        $explicit = strtoupper(trim((string) ($statusValue ?? '')));
        if (in_array($explicit, ['ABS', 'AJ'], true)) {
            return $explicit;
        }

        $fromAppreciation = strtoupper(trim($appreciation));
        if ($fromAppreciation === 'ABS' || preg_match('/\bABS\b/u', $fromAppreciation) === 1) {
            return 'ABS';
        }

        if ($fromAppreciation === 'AJ' || preg_match('/\bAJ\b/u', $fromAppreciation) === 1) {
            return 'AJ';
        }

        return null;
    }

    private function resolveVisualStatus(?float $numericValue, ?string $specialStatus): string
    {
        if ($specialStatus === 'ABS') {
            return 'abs';
        }

        if ($specialStatus === 'AJ') {
            return 'aj';
        }

        if ($numericValue === null) {
            return 'empty';
        }

        return $numericValue >= 10 ? 'success' : 'danger';
    }

    private function formatDisplayNote(?float $numericValue, ?string $specialStatus): string
    {
        if ($specialStatus === 'ABS' || $specialStatus === 'AJ') {
            return $specialStatus;
        }

        if ($numericValue === null) {
            return '';
        }

        $formatted = number_format($numericValue, 2, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted;
    }

    private function getAverageAppreciation(?float $average): string
    {
        if ($average === null) {
            return '-';
        }

        if ($average >= 18) {
            return 'Excellent';
        }

        if ($average >= 16) {
            return 'Tres bien';
        }

        if ($average >= 14) {
            return 'Bien';
        }

        if ($average >= 12) {
            return 'Assez bien';
        }

        if ($average >= 10) {
            return 'Passable';
        }

        return 'Insuffisant';
    }

    public function getProfile(\Illuminate\Http\Request $request): JsonResponse
    {
        $user = $request->user()->load('directeur');
        return response()->json([
            'nom' => $user->name,
            'email' => $user->email,
            'telephone' => $user->directeur ? $user->directeur->telephone : '',
            'etablissement' => 'Lycée Excellence',
            'adresse' => 'Quartier Administratif, Rabat'
        ]);
    }

    public function updateProfile(\Illuminate\Http\Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'telephone' => 'nullable|string|max:20'
        ]);

        // Update User
        $user->name = $request->nom;
        $user->email = $request->email;
        $user->save();

        // Update Directeur details
        if ($user->directeur) {
            $user->directeur->telephone = $request->telephone;
            $user->directeur->save();
        } else {
            // Create directeur profile if missing
            \App\Models\Directeur::create([
                'id_directeur' => $user->id,
                'telephone' => $request->telephone
            ]);
            $user->load('directeur');
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'profile' => [
                'nom' => $user->name,
                'email' => $user->email,
                'telephone' => $user->directeur ? $user->directeur->telephone : '',
                'etablissement' => 'Lycée Excellence',
                'adresse' => 'Quartier Administratif, Rabat'
            ]
        ]);
    }

    public function updatePassword(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'actuel' => 'required|string',
            'nouveau' => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->actuel, $user->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect'], 400);
        }

        $user->password = \Illuminate\Support\Facades\Hash::make($request->nouveau);
        $user->save();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès']);
    }
}