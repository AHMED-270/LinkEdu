<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Absence;
use App\Models\Devoir;
use App\Models\DevoirSoumission;
use App\Models\Demande;
use App\Models\EmploiDuTemps;
use App\Models\Etudiant;
use App\Models\Lecon;
use App\Models\Note;
use App\Models\ParentEleve;
use App\Models\Reclamation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class StudentParentController extends Controller
{
    private const PARENT_REQUEST_TYPES = [
        'Attestation de scolarite',
        'Certificat de depart',
        'Recu de paiement',
        'Liste de fournitures',
    ];

    public function studentDashboard(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student) {
            return response()->json(['message' => 'Profil etudiant introuvable.'], 404);
        }

        $classId = $student->id_classe;

        $upcomingAssignments = Devoir::query()
            ->where('id_classe', $classId)
            ->whereDate('date_limite', '>=', now()->toDateString())
            ->count();

        $recentAnnouncements = $this->studentAnnouncementsQuery($classId, 'etudiants')
            ->orderByDesc('date_publication')
            ->limit(5)
            ->get()
            ->map(fn (Annonce $annonce) => $this->formatAnnouncement($annonce))
            ->values();

        $average = Note::query()
            ->where('id_etudiant', $student->id_etudiant)
            ->avg('valeur');

        $absenceCount = Absence::query()
            ->where('id_etudiant', $student->id_etudiant)
            ->count();

        $currentDate = now();
        $isAfterSchoolStart = $currentDate->month >= 9;
        $startYear = $isAfterSchoolStart ? $currentDate->year : $currentDate->year - 1;
        $academicYear = $startYear . '-' . ($startYear + 1);

        return response()->json([
            'student' => [
                'id' => $student->id_etudiant,
                'matricule' => $student->matricule,
                'classe_id' => $student->id_classe,
                'classe_nom' => $student->classe?->nom,
                'classe_niveau' => $student->classe?->niveau,
                'academic_year' => $academicYear,
            ],
            'stats' => [
                'moyenne_generale' => $average ? round((float) $average, 2) : null,
                'nombre_absences' => $absenceCount,
                'devoirs_a_venir' => $upcomingAssignments,
                'annonces_recentes' => $recentAnnouncements->count(),
                'academic_year' => $academicYear,
            ],
            'annonces' => $recentAnnouncements,
            'academic_year' => $academicYear,
        ]);
    }

    public function studentNotes(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student) {
            return response()->json(['message' => 'Profil etudiant introuvable.'], 404);
        }

        $notes = Note::query()
            ->with(['matiere:id_matiere,nom,coefficient', 'professeur.user:id,name,nom,prenom'])
            ->where('id_etudiant', $student->id_etudiant)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Note $note) {
                return [
                    'id_note' => $note->id_note,
                    'valeur' => $note->valeur,
                    'appreciation' => $note->appreciation,
                    'matiere' => $note->matiere?->nom,
                    'coefficient' => $note->matiere?->coefficient,
                    'semestre' => $note->semestre ?? '1',
                    'type_evaluation' => $note->type_evaluation,
                    'professeur' => trim(($note->professeur?->user?->prenom ?? '') . ' ' . ($note->professeur?->user?->nom ?? '')),
                    'date' => optional($note->created_at)->toDateString(),
                ];
            })
            ->values();

        return response()->json(['notes' => $notes]);
    }

    public function studentAssignments(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student || ! $student->id_classe) {
            return response()->json(['devoirs' => []]);
        }

        $submissions = DevoirSoumission::query()
            ->where('id_etudiant', $student->id_etudiant)
            ->get()
            ->keyBy('id_devoir');

        $devoirs = Devoir::query()
            ->with(['matiere:id_matiere,nom', 'professeur.user:id,name,nom,prenom'])
            ->where('id_classe', $student->id_classe)
            ->orderBy('date_limite')
            ->get()
            ->map(function (Devoir $devoir) use ($submissions) {
                $submission = $submissions->get($devoir->id_devoir);
                $deadline = $devoir->date_limite ? (string) $devoir->date_limite : null;
                $teacherName = trim(($devoir->professeur?->user?->prenom ?? '') . ' ' . ($devoir->professeur?->user?->nom ?? ''));

                return [
                    'id_devoir' => $devoir->id_devoir,
                    'titre' => $devoir->titre,
                    'description' => $devoir->description,
                    'matiere' => $devoir->matiere?->nom,
                    'professeur' => $teacherName !== '' ? $teacherName : null,
                    'date_limite' => $deadline,
                    'is_overdue' => $devoir->date_limite && now()->format('Y-m-d') >= (string) $devoir->date_limite,
                    'soumission' => $submission ? [
                        'id_soumission' => $submission->id_soumission,
                        'date_soumission' => $submission->date_soumission ? $submission->date_soumission->format('Y-m-d H:i:s') : null,
                        'statut' => $submission->statut,
                        'fichier_url' => $submission->fichier_path ? asset('storage/' . $submission->fichier_path) : null,
                        'commentaire' => $submission->commentaire,
                    ] : null,
                ];
            })
            ->values();

        return response()->json(['devoirs' => $devoirs]);
    }

    public function submitStudentAssignment(Request $request, int $devoirId): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student) {
            return response()->json(['message' => 'Profil etudiant introuvable.'], 404);
        }

        $devoir = Devoir::query()->find($devoirId);

        if (! $devoir || (int) $devoir->id_classe !== (int) $student->id_classe) {
            return response()->json(['message' => 'Devoir introuvable pour cet etudiant.'], 404);
        }

        if ($devoir->date_limite && now()->format('Y-m-d') >= (string) $devoir->date_limite) {
            return response()->json(['message' => 'La date limite est atteinte.'], 422);
        }

        $validated = $request->validate([
            'fichier' => ['required', 'file', 'max:25600'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ]);

        $storedPath = $validated['fichier']->store('devoirs_soumis', 'public');

        $submission = DevoirSoumission::query()->updateOrCreate(
            [
                'id_devoir' => $devoir->id_devoir,
                'id_etudiant' => $student->id_etudiant,
            ],
            [
                'fichier_path' => $storedPath,
                'commentaire' => $validated['commentaire'] ?? null,
                'date_soumission' => now(),
                'statut' => 'soumis',
            ]
        );

        return response()->json([
            'message' => 'Soumission enregistree avec succes.',
            'soumission' => [
                'id_soumission' => $submission->id_soumission,
                'id_devoir' => $submission->id_devoir,
                'date_soumission' => $submission->date_soumission ? $submission->date_soumission->format('Y-m-d H:i:s') : null,
                'statut' => $submission->statut,
                'fichier_url' => asset('storage/' . $submission->fichier_path),
            ],
        ], 201);
    }

    public function studentSchedule(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student || ! $student->id_classe) {
            return response()->json(['emploi_du_temps' => []]);
        }

        $entries = EmploiDuTemps::query()
            ->with(['matiere:id_matiere,nom', 'professeur.user:id,name,nom,prenom'])
            ->where('id_classe', $student->id_classe)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get()
            ->map(function (EmploiDuTemps $row) {
                return [
                    'id_edt' => $row->id_edt,
                    'jour' => $row->jour,
                    'heure_debut' => $row->heure_debut,
                    'heure_fin' => $row->heure_fin,
                    'matiere' => $row->matiere?->nom,
                    'professeur' => trim(($row->professeur?->user?->prenom ?? '') . ' ' . ($row->professeur?->user?->nom ?? '')),
                ];
            })
            ->values();

        return response()->json(['emploi_du_temps' => $entries]);
    }

    public function studentAnnouncements(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student) {
            return response()->json(['annonces' => []]);
        }

        $annonces = $this->studentAnnouncementsQuery($student->id_classe, 'etudiants')
            ->orderByDesc('date_publication')
            ->limit(30)
            ->get()
            ->map(fn (Annonce $annonce) => $this->formatAnnouncement($annonce))
            ->values();

        return response()->json(['annonces' => $annonces]);
    }

    public function studentLessons(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student || ! $student->id_classe) {
            return response()->json(['lecons' => []]);
        }

        $matiereIds = DB::table('enseigner')
            ->where('id_classe', $student->id_classe)
            ->pluck('id_matiere')
            ->unique();

        $lecons = Lecon::query()
            ->with('matiere:id_matiere,nom')
            ->whereIn('id_matiere', $matiereIds)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Lecon $lecon) {
                return [
                    'id_lecon' => $lecon->id_lecon,
                    'titre' => $lecon->titre,
                    'description' => $lecon->description,
                    'matiere' => $lecon->matiere?->nom,
                ];
            })
            ->values();

        return response()->json(['lecons' => $lecons]);
    }

    public function studentResources(Request $request): JsonResponse
    {
        $student = $this->getAuthenticatedStudent($request);

        if (! $student || ! $student->id_classe) {
            return response()->json(['ressources' => []]);
        }

        $teachingRows = DB::table('enseigner')
            ->where('id_classe', $student->id_classe)
            ->get(['id_professeur', 'id_matiere']);

        $professorIds = $teachingRows
            ->pluck('id_professeur')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $matiereIds = $teachingRows
            ->pluck('id_matiere')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $hasResourceTitleColumn = Schema::hasColumn('ressources', 'titre');
        $hasResourceDescriptionColumn = Schema::hasColumn('ressources', 'description');
        $hasResourceMatiereColumn = Schema::hasColumn('ressources', 'id_matiere');
        $hasResourceClassColumn = Schema::hasColumn('ressources', 'id_classe');

        $resourceQuery = DB::table('ressources')
            ->leftJoin('professeurs', 'ressources.id_professeur', '=', 'professeurs.id_professeur')
            ->leftJoin('users as prof_user', 'professeurs.id_professeur', '=', 'prof_user.id')
            ->orderByDesc('ressources.created_at');

        if ($hasResourceMatiereColumn) {
            $resourceQuery->leftJoin('matieres', 'ressources.id_matiere', '=', 'matieres.id_matiere');
        }

        if ($hasResourceClassColumn) {
            // Strict visibility: a resource is visible only to students of its target class.
            $resourceQuery->where('ressources.id_classe', (int) $student->id_classe);
        } elseif ($hasResourceMatiereColumn && $matiereIds->isNotEmpty()) {
            // Legacy fallback when class column is missing.
            $resourceQuery->whereIn('ressources.id_matiere', $matiereIds);

            if ($professorIds->isNotEmpty()) {
                $resourceQuery->whereIn('ressources.id_professeur', $professorIds);
            }
        } elseif ($professorIds->isNotEmpty()) {
            $resourceQuery->whereIn('ressources.id_professeur', $professorIds);
        } else {
            return response()->json(['ressources' => []]);
        }

        $resourceSelect = [
            'ressources.id_ressource',
            'ressources.fichier',
            'ressources.type_ressource',
            'ressources.created_at',
            'prof_user.nom as professeur_nom',
            'prof_user.prenom as professeur_prenom',
        ];

        if ($hasResourceTitleColumn) {
            $resourceSelect[] = 'ressources.titre';
        }

        if ($hasResourceDescriptionColumn) {
            $resourceSelect[] = 'ressources.description';
        }

        if ($hasResourceMatiereColumn) {
            $resourceSelect[] = 'matieres.nom as matiere_nom';
        }

        $resources = $resourceQuery
            ->get($resourceSelect)
            ->map(function ($resource) use ($hasResourceTitleColumn, $hasResourceDescriptionColumn) {
                $teacherName = trim(((string) ($resource->professeur_prenom ?? '')) . ' ' . ((string) ($resource->professeur_nom ?? '')));
                $resourceTitle = '';

                if ($hasResourceTitleColumn && isset($resource->titre) && trim((string) $resource->titre) !== '') {
                    $resourceTitle = trim((string) $resource->titre);
                }

                if ($resourceTitle === '') {
                    $rawFilename = basename((string) ($resource->fichier ?? ''));
                    $resourceTitle = $rawFilename !== '' ? $rawFilename : 'Ressource sans titre';
                }

                $filePath = (string) ($resource->fichier ?? '');
                $fileUrl = '';
                if ($filePath !== '') {
                    $fileUrl = str_starts_with($filePath, 'http://') || str_starts_with($filePath, 'https://')
                        ? $filePath
                        : asset('storage/' . ltrim($filePath, '/'));
                }

                return [
                    'id_ressource' => $resource->id_ressource,
                    'titre' => $resourceTitle,
                    'fichier' => $resource->fichier,
                    'fichier_url' => $fileUrl,
                    'type_ressource' => $resource->type_ressource,
                    'description' => $hasResourceDescriptionColumn ? (string) ($resource->description ?? '') : '',
                    'matiere' => $resource->matiere_nom ?? null,
                    'professeur' => $teacherName !== '' ? $teacherName : null,
                    'date' => isset($resource->created_at) && $resource->created_at
                        ? substr((string) $resource->created_at, 0, 10)
                        : null,
                ];
            })
            ->values();

        return response()->json(['ressources' => $resources]);
    }

    public function parentDashboard(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['message' => 'Profil parent introuvable.'], 404);
        }

        $childIdParam = $request->query('child_id');

        $childrenQuery = Etudiant::query()
            ->with(['user:id,name,nom,prenom,email', 'classe:id_classe,nom,niveau'])
            ->where('id_parent', $parent->id_parent);

        if ($childIdParam) {
            $childrenQuery->where('id_etudiant', $childIdParam);
        }

        $children = $childrenQuery->get();
        $childIds = $children->pluck('id_etudiant');
        $classIds = $children->pluck('id_classe')->filter()->unique();

        // Get today's schedule for all relevant classes
        $today = now()->timezone('Africa/Casablanca')->locale('fr')->dayName;
        $todayStr = ucfirst(strtolower((string)$today));

        $schedules = EmploiDuTemps::query()
            ->with(['matiere:id_matiere,nom', 'professeur.user:id,name,nom,prenom'])
            ->whereIn('id_classe', $classIds)
            ->where('jour', $todayStr)
            ->orderBy('heure_debut')
            ->get()
            ->groupBy('id_classe');

        $notesAverage = Note::query()
            ->whereIn('id_etudiant', $childIds)
            ->avg('valeur');

        $complaintQuery = Reclamation::query()
            ->where('id_parent', $parent->id_parent)
            ->where('statut', 'en_attente');
            
        // Note: Reclamations might not be child-specific depending on your schema. 
        // If they are, you'd filter by child_id here.

        $pendingComplaints = $complaintQuery->count();

        $absences = Absence::query()->whereIn('id_etudiant', $childIds)->count();

        $annonces = DB::table('annonces')
            ->orderByDesc('date_publication')
            ->limit(5)
            ->get();

        $reclamations = DB::table('reclamations')
            ->where('id_parent', $parent->id_parent)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        $currentDate = now();
        $isAfterSchoolStart = $currentDate->month >= 9;
        $startYear = $isAfterSchoolStart ? $currentDate->year : $currentDate->year - 1;
        $academicYear = $startYear . '-' . ($startYear + 1);

        return response()->json([
            'annonces' => $annonces,
            'reclamations' => $reclamations,
            'academic_year' => $academicYear,
            'stats' => [
                'nombre_enfants' => $children->count(),
                'moyenne_generale' => $notesAverage ? round((float) $notesAverage, 2) : null,
                'nombre_absences' => $absences,
                'reclamations_en_attente' => $pendingComplaints,
                'academic_year' => $academicYear,
            ],
            'enfants' => $children->map(function (Etudiant $child) use ($schedules) {
                $childSchedule = $schedules->get($child->id_classe) ?? collect();
                return [
                    'id_etudiant' => $child->id_etudiant,
                    'nom_complet' => trim(($child->user?->prenom ?? '') . ' ' . ($child->user?->nom ?? '')),
                    'matricule' => $child->matricule,
                    'id_classe' => $child->id_classe,
                    'classe_nom' => $child->classe?->nom,
                    'today_sessions' => $childSchedule->map(function ($s) {
                        return [
                            'heure_debut' => $s->heure_debut,
                            'heure_fin' => $s->heure_fin,
                            'matiere' => $s->matiere?->nom,
                            'professeur' => trim(($s->professeur?->user?->prenom ?? '') . ' ' . ($s->professeur?->user?->nom ?? '')),
                        ];
                    }),
                ];
            })->values(),
        ]);
    }

    public function parentChildren(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['enfants' => []]);
        }

        $children = Etudiant::query()
            ->with(['user:id,name,nom,prenom,email', 'classe:id_classe,nom,niveau'])
            ->where('id_parent', $parent->id_parent)
            ->orderBy('id_etudiant')
            ->get()
            ->map(function (Etudiant $child) {
                return [
                    'id_etudiant' => $child->id_etudiant,
                    'nom_complet' => trim(($child->user?->prenom ?? '') . ' ' . ($child->user?->nom ?? '')),
                    'email' => $child->user?->email,
                    'matricule' => $child->matricule,
                    'classe' => $child->classe ? trim($child->classe->nom . ' - ' . $child->classe->niveau) : null,
                    'id_classe' => $child->id_classe,
                ];
            })
            ->values();

        return response()->json(['enfants' => $children]);
    }

    public function parentNotes(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $notes = Note::query()
            ->with(['matiere:id_matiere,nom'])
            ->where('id_etudiant', $child->id_etudiant)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Note $note) => [
                'id_note' => $note->id_note,
                'valeur' => $note->valeur,
                'appreciation' => $note->appreciation,
                'semestre' => $note->semestre ?? '1',
                'type_evaluation' => $note->type_evaluation,
                'matiere' => $note->matiere?->nom,
                'date' => optional($note->created_at)->toDateString(),
            ])
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'notes' => $notes,
        ]);
    }

    public function parentAssignments(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $submissions = DevoirSoumission::query()
            ->where('id_etudiant', $child->id_etudiant)
            ->get()
            ->keyBy('id_devoir');

        $devoirs = Devoir::query()
            ->with('matiere:id_matiere,nom')
            ->where('id_classe', $child->id_classe)
            ->orderBy('date_limite')
            ->get()
            ->map(function (Devoir $devoir) use ($submissions) {
                $submission = $submissions->get($devoir->id_devoir);

                return [
                    'id_devoir' => $devoir->id_devoir,
                    'titre' => $devoir->titre,
                    'description' => $devoir->description,
                    'matiere' => $devoir->matiere?->nom,
                    'date_limite' => $devoir->date_limite ? (string) $devoir->date_limite : null,
                    'soumis' => (bool) $submission,
                    'statut_soumission' => $submission?->statut,
                    'date_soumission' => optional($submission?->date_soumission)->toDateTimeString(),
                ];
            })
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'devoirs' => $devoirs,
        ]);
    }

    public function parentAbsences(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $absences = Absence::query()
            ->with('professeur.user:id,name,nom,prenom')
            ->where('id_etudiant', $child->id_etudiant)
            ->orderByDesc('date_abs')
            ->get()
            ->map(function (Absence $absence) {
                return [
                    'id_absence' => $absence->id_absence,
                    'date_abs' => $absence->date_abs ? (string) $absence->date_abs : null,
                    'motif' => $absence->motif,
                    'professeur' => trim(($absence->professeur?->user?->prenom ?? '') . ' ' . ($absence->professeur?->user?->nom ?? '')),
                ];
            })
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'absences' => $absences,
        ]);
    }

    public function parentSchedule(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $schedule = EmploiDuTemps::query()
            ->with(['matiere:id_matiere,nom', 'professeur.user:id,name,nom,prenom'])
            ->where('id_classe', $child->id_classe)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get()
            ->map(function (EmploiDuTemps $row) {
                return [
                    'id_edt' => $row->id_edt,
                    'jour' => $row->jour,
                    'heure_debut' => $row->heure_debut,
                    'heure_fin' => $row->heure_fin,
                    'matiere' => $row->matiere?->nom,
                    'professeur' => trim(($row->professeur?->user?->prenom ?? '') . ' ' . ($row->professeur?->user?->nom ?? '')),
                ];
            })
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'emploi_du_temps' => $schedule,
        ]);
    }

    public function parentAnnouncements(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $annonces = $this->studentAnnouncementsQuery($child->id_classe, 'parents')
            ->orderByDesc('date_publication')
            ->limit(30)
            ->get()
            ->map(fn (Annonce $annonce) => $this->formatAnnouncement($annonce))
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'annonces' => $annonces,
        ]);
    }

    public function parentResources(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $teachingRows = DB::table('enseigner')
            ->where('id_classe', $child->id_classe)
            ->get(['id_professeur', 'id_matiere']);

        $professorIds = $teachingRows
            ->pluck('id_professeur')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $matiereIds = $teachingRows
            ->pluck('id_matiere')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $hasResourceTitleColumn = Schema::hasColumn('ressources', 'titre');
        $hasResourceDescriptionColumn = Schema::hasColumn('ressources', 'description');
        $hasResourceMatiereColumn = Schema::hasColumn('ressources', 'id_matiere');
        $hasResourceClassColumn = Schema::hasColumn('ressources', 'id_classe');

        $resourceQuery = DB::table('ressources')
            ->leftJoin('professeurs', 'ressources.id_professeur', '=', 'professeurs.id_professeur')
            ->leftJoin('users as prof_user', 'professeurs.id_professeur', '=', 'prof_user.id')
            ->orderByDesc('ressources.created_at');

        if ($hasResourceMatiereColumn) {
            $resourceQuery->leftJoin('matieres', 'ressources.id_matiere', '=', 'matieres.id_matiere');
        }

        if ($hasResourceClassColumn) {
            // Strict visibility: a resource is visible only to parents of students in the target class.
            $resourceQuery->where('ressources.id_classe', (int) $child->id_classe);
        } elseif ($hasResourceMatiereColumn && $matiereIds->isNotEmpty()) {
            // Legacy fallback when class column is missing.
            $resourceQuery->whereIn('ressources.id_matiere', $matiereIds);

            if ($professorIds->isNotEmpty()) {
                $resourceQuery->whereIn('ressources.id_professeur', $professorIds);
            }
        } elseif ($professorIds->isNotEmpty()) {
            $resourceQuery->whereIn('ressources.id_professeur', $professorIds);
        } else {
            return response()->json([
                'id_etudiant' => $child->id_etudiant,
                'ressources' => [],
            ]);
        }

        $resourceSelect = [
            'ressources.id_ressource',
            'ressources.fichier',
            'ressources.type_ressource',
            'ressources.created_at',
            'prof_user.nom as professeur_nom',
            'prof_user.prenom as professeur_prenom',
        ];

        if ($hasResourceTitleColumn) {
            $resourceSelect[] = 'ressources.titre';
        }

        if ($hasResourceDescriptionColumn) {
            $resourceSelect[] = 'ressources.description';
        }

        if ($hasResourceMatiereColumn) {
            $resourceSelect[] = 'matieres.nom as matiere_nom';
        }

        $resources = $resourceQuery
            ->get($resourceSelect)
            ->map(function ($resource) use ($hasResourceTitleColumn, $hasResourceDescriptionColumn) {
                $teacherName = trim(((string) ($resource->professeur_prenom ?? '')) . ' ' . ((string) ($resource->professeur_nom ?? '')));
                $resourceTitle = '';

                if ($hasResourceTitleColumn && isset($resource->titre) && trim((string) $resource->titre) !== '') {
                    $resourceTitle = trim((string) $resource->titre);
                }

                if ($resourceTitle === '') {
                    $rawFilename = basename((string) ($resource->fichier ?? ''));
                    $resourceTitle = $rawFilename !== '' ? $rawFilename : 'Ressource sans titre';
                }

                $filePath = (string) ($resource->fichier ?? '');
                $fileUrl = '';
                if ($filePath !== '') {
                    $fileUrl = str_starts_with($filePath, 'http://') || str_starts_with($filePath, 'https://')
                        ? $filePath
                        : asset('storage/' . ltrim($filePath, '/'));
                }

                return [
                    'id_ressource' => $resource->id_ressource,
                    'titre' => $resourceTitle,
                    'fichier' => $resource->fichier,
                    'fichier_url' => $fileUrl,
                    'type_ressource' => $resource->type_ressource,
                    'description' => $hasResourceDescriptionColumn ? (string) ($resource->description ?? '') : '',
                    'matiere' => $resource->matiere_nom ?? null,
                    'professeur' => $teacherName !== '' ? $teacherName : null,
                    'date' => isset($resource->created_at) && $resource->created_at
                        ? substr((string) $resource->created_at, 0, 10)
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'ressources' => $resources
        ]);
    }

    public function parentProfessors(Request $request): JsonResponse
    {
        [$child, $error] = $this->resolveParentChild($request);

        if ($error) {
            return $error;
        }

        $professors = DB::table('enseigner')
            ->join('professeurs', 'enseigner.id_professeur', '=', 'professeurs.id_professeur')
            ->join('users', 'professeurs.id_professeur', '=', 'users.id')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_classe', $child->id_classe)
            ->select(
                'users.id',
                'users.nom',
                'users.prenom',
                'users.email',
                'matieres.nom as matiere'
            )
            ->orderBy('users.nom')
            ->get();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'professeurs' => $professors,
        ]);
    }

    public function parentComplaints(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['reclamations' => []]);
        }

        $complaints = DB::table('reclamations')
            ->leftJoin('etudiants', 'reclamations.id_etudiant', '=', 'etudiants.id_etudiant')
            ->leftJoin('users as etu_user', 'etudiants.id_etudiant', '=', 'etu_user.id')
            ->leftJoin('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->where('reclamations.id_parent', $parent->id_parent)
            ->orderByDesc('reclamations.date_soumission')
            ->get([
                'reclamations.id_reclamation',
                'reclamations.id_parent',
                'reclamations.id_etudiant',
                'reclamations.sujet',
                'reclamations.message',
                'reclamations.statut',
                'reclamations.date_soumission',
                'reclamations.created_at',
                DB::raw("CONCAT(COALESCE(etu_user.prenom, ''), ' ', COALESCE(etu_user.nom, '')) as eleve_nom_complet"),
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
            ])
            ->map(function ($row) {
                $className = trim((string) ($row->classe_nom ?? ''));
                $classLevel = trim((string) ($row->classe_niveau ?? ''));

                return [
                    'id_reclamation' => $row->id_reclamation,
                    'id_parent' => $row->id_parent,
                    'id_etudiant' => $row->id_etudiant,
                    'sujet' => $row->sujet,
                    'message' => $row->message,
                    'statut' => $row->statut,
                    'date_soumission' => $row->date_soumission,
                    'eleve_nom' => trim((string) ($row->eleve_nom_complet ?? '')),
                    'classe' => trim($className . ($classLevel !== '' ? (' - ' . $classLevel) : '')),
                ];
            })
            ->values();

        return response()->json(['reclamations' => $complaints]);
    }

    public function submitParentComplaint(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['message' => 'Profil parent introuvable.'], 404);
        }

        $validated = $request->validate([
            'sujet' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:3000'],
            'id_etudiant' => ['nullable', 'integer'],
            'child_id' => ['nullable', 'integer'],
        ]);

        $requestedChildId = (int) ($validated['id_etudiant'] ?? $validated['child_id'] ?? 0);
        $childQuery = Etudiant::query()->where('id_parent', $parent->id_parent);

        if ($requestedChildId > 0) {
            $childQuery->where('id_etudiant', $requestedChildId);
        }

        $child = $childQuery->first();

        if ($requestedChildId > 0 && ! $child) {
            return response()->json(['message' => 'Eleve introuvable pour ce parent.'], 422);
        }

        $payload = [
            'id_parent' => $parent->id_parent,
            'sujet' => trim((string) $validated['sujet']),
            'message' => trim((string) $validated['message']),
            'date_soumission' => now(),
            'statut' => 'en_attente',
        ];

        if ($child) {
            $payload['id_etudiant'] = $child->id_etudiant;
        }

        if (Schema::hasColumn('reclamations', 'cible')) {
            $payload['cible'] = 'secretaire';
        }

        $complaint = Reclamation::query()->create($payload);

        return response()->json([
            'message' => 'Reclamation envoyee avec succes.',
            'reclamation' => $complaint,
            'eleve' => [
                'id_etudiant' => $child->id_etudiant ?? null,
                'nom_complet' => trim((string) ($child?->user?->prenom ?? '') . ' ' . (string) ($child?->user?->nom ?? '')),
                'classe' => $child?->classe ? trim($child->classe->nom . ' - ' . $child->classe->niveau) : null,
            ],
        ], 201);
    }

    public function parentDemandes(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['demandes' => []]);
        }

        $demandes = DB::table('demandes')
            ->leftJoin('etudiants', 'demandes.id_etudiant', '=', 'etudiants.id_etudiant')
            ->leftJoin('users as etu_user', 'etudiants.id_etudiant', '=', 'etu_user.id')
            ->leftJoin('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->where('demandes.id_parent', $parent->id_parent)
            ->orderByDesc('demandes.date_demande')
            ->get([
                'demandes.id_demande',
                'demandes.id_parent',
                'demandes.id_etudiant',
                'demandes.type_demande',
                'demandes.message',
                'demandes.statut',
                'demandes.date_demande',
                DB::raw("CONCAT(COALESCE(etu_user.prenom, ''), ' ', COALESCE(etu_user.nom, '')) as eleve_nom_complet"),
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
            ])
            ->map(function ($row) {
                $className = trim((string) ($row->classe_nom ?? ''));
                $classLevel = trim((string) ($row->classe_niveau ?? ''));

                return [
                    'id_demande' => $row->id_demande,
                    'id_parent' => $row->id_parent,
                    'id_etudiant' => $row->id_etudiant,
                    'type_demande' => $row->type_demande,
                    'message' => $row->message,
                    'statut' => $row->statut,
                    'date_demande' => $row->date_demande,
                    'eleve_nom' => trim((string) ($row->eleve_nom_complet ?? '')),
                    'classe' => trim($className . ($classLevel !== '' ? (' - ' . $classLevel) : '')),
                ];
            })
            ->values();

        return response()->json(['demandes' => $demandes]);
    }

    public function submitParentDemande(Request $request): JsonResponse
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return response()->json(['message' => 'Profil parent introuvable.'], 404);
        }

        $validated = $request->validate([
            'type_demande' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:3000'],
            'id_etudiant' => ['nullable', 'integer'],
            'child_id' => ['nullable', 'integer'],
        ]);

        $typeDemande = trim((string) $validated['type_demande']);

        if (! in_array($typeDemande, self::PARENT_REQUEST_TYPES, true)) {
            return response()->json(['message' => 'Type de demande invalide.'], 422);
        }

        $requestedChildId = (int) ($validated['id_etudiant'] ?? $validated['child_id'] ?? 0);
        $childQuery = Etudiant::query()
            ->with('classe:id_classe,nom,niveau')
            ->where('id_parent', $parent->id_parent);

        if ($requestedChildId > 0) {
            $childQuery->where('id_etudiant', $requestedChildId);
        }

        $child = $childQuery->first();

        if (! $child) {
            return response()->json(['message' => 'Eleve introuvable pour ce parent.'], 422);
        }

        $demande = Demande::query()->create([
            'id_parent' => $parent->id_parent,
            'id_etudiant' => $child->id_etudiant,
            'type_demande' => $typeDemande,
            'message' => trim((string) ($validated['message'] ?? '')),
            'date_demande' => now(),
            'statut' => 'en_attente',
        ]);

        return response()->json([
            'message' => 'Demande envoyee avec succes.',
            'demande' => $demande,
            'eleve' => [
                'id_etudiant' => $child->id_etudiant,
                'nom_complet' => trim((string) ($child->user?->prenom ?? '') . ' ' . (string) ($child->user?->nom ?? '')),
                'classe' => $child->classe ? trim($child->classe->nom . ' - ' . $child->classe->niveau) : null,
            ],
        ], 201);
    }

    private function getAuthenticatedStudent(Request $request): ?Etudiant
    {
        return Etudiant::query()
            ->with('classe:id_classe,nom,niveau')
            ->where('id_etudiant', $request->user()?->id)
            ->first();
    }

    private function getAuthenticatedParent(Request $request): ?ParentEleve
    {
        return ParentEleve::query()
            ->where('id_parent', $request->user()?->id)
            ->first();
    }

    private function resolveParentChild(Request $request): array
    {
        $parent = $this->getAuthenticatedParent($request);

        if (! $parent) {
            return [null, response()->json(['message' => 'Profil parent introuvable.'], 404)];
        }

        $requestedChildId = $request->query('child_id');

        $query = Etudiant::query()->where('id_parent', $parent->id_parent);

        if ($requestedChildId) {
            $query->where('id_etudiant', (int) $requestedChildId);
        }

        $child = $query->first();

        if (! $child) {
            return [null, response()->json(['message' => 'Enfant introuvable pour ce parent.'], 404)];
        }

        return [$child, null];
    }

    private function studentAnnouncementsQuery(?int $classId, ?string $audience = null)
    {
        $hasTargetColumn = Schema::hasColumn('annonces', 'cible');
        $hasPhotoColumn = Schema::hasColumn('annonces', 'photo_path');

        $query = \App\Models\Annonce::query()
            ->select('id_annonce', 'titre', 'contenu', 'date_publication', 'type', 'auteur');

        if ($hasTargetColumn) {
            $query->addSelect('cible');

            if ($audience) {
                $audienceAliases = match (strtolower($audience)) {
                    'etudiants' => ['etudiants', 'etudiant', 'eleves', 'eleve'],
                    'parents' => ['parents', 'parent'],
                    'professeurs' => ['professeurs', 'professeur'],
                    default => [strtolower($audience)],
                };

                $query->where(function ($targetQuery) use ($audienceAliases) {
                    $targetQuery
                        ->whereNull('cible')
                        ->orWhere('cible', '')
                        ->orWhereRaw('LOWER(cible) = ?', ['tous']);

                    foreach ($audienceAliases as $alias) {
                        $targetQuery->orWhereRaw('LOWER(cible) = ?', [$alias]);
                    }
                });
            }
        }

        if ($hasPhotoColumn) {
            $query->addSelect('photo_path');
        }

        return $query;
    }

    private function formatAnnouncement(Annonce $annonce): array
    {
        $photoPath = $annonce->photo_path ?? null;
        $photoUrl = $photoPath ? Storage::disk('public')->url($photoPath) : null;

        return [
            'id_annonce' => $annonce->id_annonce,
            'titre' => $annonce->titre,
            'contenu' => $annonce->contenu,
            'date_publication' => optional($annonce->date_publication)->toDateTimeString(),
            'type' => $annonce->type,
            'auteur' => $annonce->auteur,
            'cible' => $annonce->cible ?? 'Tous',
            'photo_url' => $photoUrl,
            'attachment_url' => $photoUrl,
            'has_attachment' => (bool) $photoUrl,
        ];
    }
}
