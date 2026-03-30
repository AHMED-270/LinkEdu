<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Absence;
use App\Models\Devoir;
use App\Models\DevoirSoumission;
use App\Models\EmploiDuTemps;
use App\Models\Etudiant;
use App\Models\Lecon;
use App\Models\Note;
use App\Models\ParentEleve;
use App\Models\Reclamation;
use App\Models\Ressource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StudentParentController extends Controller
{
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

        $recentAnnouncements = $this->studentAnnouncementsQuery($classId)
            ->orderByDesc('date_publication')
            ->limit(5)
            ->get();

        $average = Note::query()
            ->where('id_etudiant', $student->id_etudiant)
            ->avg('valeur');

        $absenceCount = Absence::query()
            ->where('id_etudiant', $student->id_etudiant)
            ->count();

        return response()->json([
            'student' => [
                'id' => $student->id_etudiant,
                'matricule' => $student->matricule,
                'classe_id' => $student->id_classe,
                'classe_nom' => $student->classe?->nom,
                'classe_niveau' => $student->classe?->niveau,
            ],
            'stats' => [
                'moyenne_generale' => $average ? round((float) $average, 2) : null,
                'nombre_absences' => $absenceCount,
                'devoirs_a_venir' => $upcomingAssignments,
                'annonces_recentes' => $recentAnnouncements->count(),
            ],
            'annonces' => $recentAnnouncements,
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
            ->with(['matiere:id_matiere,nom'])
            ->where('id_classe', $student->id_classe)
            ->orderBy('date_limite')
            ->get()
            ->map(function (Devoir $devoir) use ($submissions) {
                $submission = $submissions->get($devoir->id_devoir);
                $deadline = $devoir->date_limite ? (string) $devoir->date_limite : null;

                return [
                    'id_devoir' => $devoir->id_devoir,
                    'titre' => $devoir->titre,
                    'description' => $devoir->description,
                    'matiere' => $devoir->matiere?->nom,
                    'date_limite' => $deadline,
                    'is_overdue' => $devoir->date_limite && now()->format('Y-m-d') > (string) $devoir->date_limite,
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

        if ($devoir->date_limite && now()->format('Y-m-d') > (string) $devoir->date_limite) {
            return response()->json(['message' => 'La date limite est depassee.'], 422);
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

        $annonces = $this->studentAnnouncementsQuery($student->id_classe)
            ->orderByDesc('date_publication')
            ->limit(30)
            ->get();

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

        $professorIds = DB::table('enseigner')
            ->where('id_classe', $student->id_classe)
            ->pluck('id_professeur')
            ->unique();

        $resources = Ressource::query()
            ->whereIn('id_professeur', $professorIds)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Ressource $resource) {
                return [
                    'id_ressource' => $resource->id_ressource,
                    'fichier' => $resource->fichier,
                    'type_ressource' => $resource->type_ressource,
                    'date' => optional($resource->created_at)->toDateString(),
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

        $children = Etudiant::query()
            ->with('user:id,name,nom,prenom,email')
            ->where('id_parent', $parent->id_parent)
            ->get();

        $childIds = $children->pluck('id_etudiant');

        $notesAverage = Note::query()
            ->whereIn('id_etudiant', $childIds)
            ->avg('valeur');

        $pendingComplaints = Reclamation::query()
            ->where('id_parent', $parent->id_parent)
            ->where('statut', 'en_attente')
            ->count();

        $absences = Absence::query()->whereIn('id_etudiant', $childIds)->count();

        return response()->json([
            'stats' => [
                'nombre_enfants' => $children->count(),
                'moyenne_generale' => $notesAverage ? round((float) $notesAverage, 2) : null,
                'nombre_absences' => $absences,
                'reclamations_en_attente' => $pendingComplaints,
            ],
            'enfants' => $children->map(function (Etudiant $child) {
                return [
                    'id_etudiant' => $child->id_etudiant,
                    'nom_complet' => trim(($child->user?->prenom ?? '') . ' ' . ($child->user?->nom ?? '')),
                    'matricule' => $child->matricule,
                    'id_classe' => $child->id_classe,
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

        $annonces = $this->studentAnnouncementsQuery($child->id_classe)
            ->orderByDesc('date_publication')
            ->limit(30)
            ->get();

        return response()->json([
            'id_etudiant' => $child->id_etudiant,
            'annonces' => $annonces,
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

        $complaints = Reclamation::query()
            ->where('id_parent', $parent->id_parent)
            ->orderByDesc('date_soumission')
            ->get();

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
        ]);

        $complaint = Reclamation::query()->create([
            'id_parent' => $parent->id_parent,
            'sujet' => $validated['sujet'],
            'message' => $validated['message'],
            'date_soumission' => now(),
            'statut' => 'en_attente',
        ]);

        return response()->json([
            'message' => 'Reclamation envoyee avec succes.',
            'reclamation' => $complaint,
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

    private function studentAnnouncementsQuery(?int $classId)
    {
        return \App\Models\Annonce::query()
            ->select('id_annonce', 'titre', 'contenu', 'date_publication', 'type', 'auteur');
    }
}
