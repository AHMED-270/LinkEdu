<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProfessorController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'professeur') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->ignore($user->id)->where(fn ($query) => $query->where('role', 'professeur'))
            ],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user,
        ]);
    }

    public function getDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);

        $totalStudents = DB::table('etudiants')
            ->whereIn('id_classe', $classIds)
            ->count();

        $activeAssignments = DB::table('devoirs')
            ->where('id_professeur', $user->id)
            ->whereDate('date_limite', '>=', now()->toDateString())
            ->count();

        $sharedResources = DB::table('ressources')
            ->where('id_professeur', $user->id)
            ->count();

        $classSummaries = DB::table('classes')
            ->leftJoin('etudiants', 'classes.id_classe', '=', 'etudiants.id_classe')
            ->select(
                'classes.id_classe',
                'classes.nom',
                'classes.niveau',
                DB::raw('COUNT(etudiants.id_etudiant) as total_eleves')
            )
            ->whereIn('classes.id_classe', $classIds)
            ->groupBy('classes.id_classe', 'classes.nom', 'classes.niveau')
            ->orderBy('classes.niveau')
            ->orderBy('classes.nom')
            ->get()
            ->map(function ($row) use ($user) {
                $devoirCount = DB::table('devoirs')
                    ->where('id_professeur', $user->id)
                    ->where('id_classe', $row->id_classe)
                    ->count();

                return [
                    'id' => (int) $row->id_classe,
                    'name' => trim($row->nom . ' - ' . $row->niveau),
                    'total' => (int) $row->total_eleves,
                    'devoirs' => $devoirCount,
                    'progress' => min(100, (int) round($devoirCount * 8)),
                ];
            })
            ->values();

        $todaySchedule = DB::table('emploi_du_temps')
            ->join('classes', 'emploi_du_temps.id_classe', '=', 'classes.id_classe')
            ->join('matieres', 'emploi_du_temps.id_matiere', '=', 'matieres.id_matiere')
            ->where('emploi_du_temps.id_professeur', $user->id)
            ->orderBy('emploi_du_temps.jour')
            ->orderBy('emploi_du_temps.heure_debut')
            ->get([
                'emploi_du_temps.id_edt',
                'emploi_du_temps.jour',
                'emploi_du_temps.heure_debut',
                'emploi_du_temps.heure_fin',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'matieres.nom as matiere_nom',
            ]);

        return response()->json([
            'stats' => [
                'total_eleves' => (int) $totalStudents,
                'total_classes' => (int) $classIds->count(),
                'devoirs_actifs' => (int) $activeAssignments,
                'ressources_partagees' => (int) $sharedResources,
            ],
            'classes' => $classSummaries,
            'schedule' => $todaySchedule,
        ]);
    }

    public function getDevoirsEtRessources(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);

        $classes = DB::table('classes')
            ->whereIn('id_classe', $classIds)
            ->orderBy('niveau')
            ->orderBy('nom')
            ->get(['id_classe as id', 'nom', 'niveau']);

        $matiereIds = DB::table('enseigner')
            ->where('id_professeur', $user->id)
            ->pluck('id_matiere')
            ->unique();

        $matieres = DB::table('matieres')
            ->whereIn('id_matiere', $matiereIds)
            ->orderBy('nom')
            ->get(['id_matiere as id', 'nom']);

        $devoirs = DB::table('devoirs')
            ->join('classes', 'devoirs.id_classe', '=', 'classes.id_classe')
            ->join('matieres', 'devoirs.id_matiere', '=', 'matieres.id_matiere')
            ->where('devoirs.id_professeur', $user->id)
            ->orderByDesc('devoirs.created_at')
            ->get([
                'devoirs.id_devoir as id',
                'devoirs.titre as title',
                'devoirs.description',
                'devoirs.date_limite',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'matieres.nom as matiere_nom',
                'devoirs.created_at',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => $row->title,
                'type' => 'Devoir',
                'class' => trim($row->classe_nom . ' - ' . $row->classe_niveau),
                'matiere' => $row->matiere_nom,
                'published_at' => optional($row->created_at)->toDateTimeString(),
                'deadline' => $row->date_limite,
            ]);

        $ressources = DB::table('ressources')
            ->where('id_professeur', $user->id)
            ->orderByDesc('created_at')
            ->get(['id_ressource as id', 'fichier', 'type_ressource', 'created_at'])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => $row->fichier,
                'type' => 'Ressource',
                'class' => 'Toutes',
                'matiere' => $row->type_ressource,
                'published_at' => optional($row->created_at)->toDateTimeString(),
                'deadline' => null,
            ]);

        return response()->json([
            'classes' => $classes,
            'matieres' => $matieres,
            'publications' => $devoirs->concat($ressources)->sortByDesc('published_at')->values(),
            'stats' => [
                'active_assignments' => (int) DB::table('devoirs')->where('id_professeur', $user->id)->whereDate('date_limite', '>=', now()->toDateString())->count(),
                'shared_resources' => (int) DB::table('ressources')->where('id_professeur', $user->id)->count(),
            ],
        ]);
    }

    public function publishDevoir(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date',
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'required|integer|exists:matieres,id_matiere',
        ]);

        $canTeach = DB::table('enseigner')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $validated['classId'])
            ->where('id_matiere', $validated['matiereId'])
            ->exists();

        if (! $canTeach) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe/matiere.'], 403);
        }

        $id = DB::table('devoirs')->insertGetId([
            'titre' => $validated['title'],
            'description' => $validated['description'],
            'date_limite' => $validated['deadline'],
            'id_professeur' => $user->id,
            'id_classe' => $validated['classId'],
            'id_matiere' => $validated['matiereId'],
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_devoir');

        return response()->json([
            'message' => 'Devoir publie avec succes.',
            'devoir' => ['id_devoir' => $id],
        ], 201);
    }
    
    public function publishRessource(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'file' => 'nullable|file|max:25600', // 25MB max
        ]);

        $filename = $validated['title'];
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('ressources_professeurs', 'public');
            $filename = $path;
        } else {
            $filename = Str::slug($validated['title']) . '.txt';
        }

        $id = DB::table('ressources')->insertGetId([
            'fichier' => $filename,
            'type_ressource' => $validated['type'],
            'id_professeur' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_ressource');

        return response()->json([
            'message' => 'Ressource publiee avec succes.',
            'ressource' => [
                'id_ressource' => $id,
                'fichier' => $filename,
            ],
        ], 201);
    }

    /**
     * Get Students by Class
     */
    public function getStudents(Request $request, $class_id = null): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'professeur') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $assignedClassIds = DB::table('classe_professeur_assignments')
            ->where('id_professeur', $user->id)
            ->pluck('id_classe');

        if ($assignedClassIds->isEmpty()) {
            return response()->json([
                'classes' => [],
                'students' => [],
            ]);
        }

        if ($class_id !== null && ! $assignedClassIds->contains((int) $class_id)) {
            return response()->json(['message' => 'Unauthorized class access'], 403);
        }

        $classIdsToUse = $class_id !== null
            ? collect([(int) $class_id])
            : $assignedClassIds;

        $classes = DB::table('classes')
            ->leftJoin('etudiants', 'classes.id_classe', '=', 'etudiants.id_classe')
            ->select(
                'classes.id_classe',
                'classes.nom',
                'classes.niveau',
                DB::raw('COUNT(DISTINCT etudiants.id_etudiant) as students_count')
            )
            ->whereIn('classes.id_classe', $classIdsToUse)
            ->groupBy('classes.id_classe', 'classes.nom', 'classes.niveau')
            ->orderBy('classes.niveau')
            ->orderBy('classes.nom')
            ->get()
            ->map(function ($classe) {
                return [
                    'id' => (int) $classe->id_classe,
                    'nom' => $classe->nom,
                    'niveau' => $classe->niveau,
                    'label' => trim($classe->nom . ' - ' . $classe->niveau),
                    'students_count' => (int) $classe->students_count,
                ];
            })
            ->values();

        $students = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->join('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->leftJoin('parents', 'etudiants.id_parent', '=', 'parents.id_parent')
            ->select(
                'users.id',
                'users.name',
                'users.nom',
                'users.prenom',
                'users.email',
                'classes.id_classe',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'etudiants.matricule',
                'parents.telephone as parent_phone'
            )
            ->whereIn('etudiants.id_classe', $classIdsToUse)
            ->orderBy('classes.niveau')
            ->orderBy('classes.nom')
            ->orderBy('users.name')
            ->get()
            ->map(function ($student) {
                $firstName = $student->prenom ?: $student->name;
                $lastName = $student->nom ?: '';

                return [
                    'id' => (int) $student->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'classId' => (int) $student->id_classe,
                    'class' => trim($student->classe_nom . ' - ' . $student->classe_niveau),
                    'avatar' => null,
                    'email' => $student->email,
                    'phone' => $student->parent_phone,
                    'rank' => null,
                    'average' => null,
                    'matricule' => $student->matricule,
                ];
            })
            ->values();

        return response()->json([
            'classes' => $classes,
            'students' => $students,
        ]);
    }

    public function getStudentAbsences(Request $request, int $student_id): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'professeur') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $assignedClassIds = $this->getAssignedClassIds((int) $user->id);

        $student = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->join('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->where('etudiants.id_etudiant', $student_id)
            ->first([
                'users.id',
                'users.nom',
                'users.prenom',
                'etudiants.matricule',
                'etudiants.id_classe',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
            ]);

        if (! $student) {
            return response()->json(['message' => 'Eleve introuvable.'], 404);
        }

        if (! $assignedClassIds->contains((int) $student->id_classe)) {
            return response()->json(['message' => 'Unauthorized student access'], 403);
        }

        $matieres = DB::table('enseigner')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_professeur', $user->id)
            ->where('enseigner.id_classe', $student->id_classe)
            ->distinct()
            ->orderBy('matieres.nom')
            ->get(['matieres.id_matiere as id', 'matieres.nom']);

        $requestedMatiereId = (int) $request->query('matiere_id', 0);
        $selectedMatiereId = $requestedMatiereId > 0 && $matieres->contains('id', $requestedMatiereId)
            ? $requestedMatiereId
            : 0;

        $scheduleMap = [];
        $scheduleRows = DB::table('emploi_du_temps')
            ->join('matieres', 'emploi_du_temps.id_matiere', '=', 'matieres.id_matiere')
            ->where('emploi_du_temps.id_professeur', $user->id)
            ->where('emploi_du_temps.id_classe', $student->id_classe)
            ->get([
                'emploi_du_temps.jour',
                'emploi_du_temps.heure_debut',
                'emploi_du_temps.heure_fin',
                'matieres.id_matiere as matiere_id',
                'matieres.nom as matiere_nom',
            ]);

        foreach ($scheduleRows as $row) {
            $key = (string) $row->jour . '|' . substr((string) $row->heure_debut, 0, 8);
            if (! isset($scheduleMap[$key])) {
                $scheduleMap[$key] = [
                    'matiere_id' => (int) $row->matiere_id,
                    'matiere_nom' => $row->matiere_nom,
                    'seance_label' => substr((string) $row->heure_debut, 0, 5) . ' - ' . substr((string) $row->heure_fin, 0, 5),
                ];
            }
        }

        $absenceRows = DB::table('absences')
            ->where('id_professeur', $user->id)
            ->where('id_etudiant', $student_id)
            ->orderByDesc('date_abs')
            ->orderByDesc('heure_seance')
            ->get([
                'id_absence',
                'date_abs',
                'heure_seance',
                'motif',
            ]);

        $absences = $absenceRows
            ->map(function ($row) use ($scheduleMap) {
                $date = (string) $row->date_abs;
                $jour = $this->toFrenchWeekday($date);
                $heureSeance = $row->heure_seance ? substr((string) $row->heure_seance, 0, 8) : null;
                $mapKey = $heureSeance ? ($jour . '|' . $heureSeance) : null;
                $slot = $mapKey ? ($scheduleMap[$mapKey] ?? null) : null;

                return [
                    'id' => (int) $row->id_absence,
                    'date' => $date,
                    'jour' => $jour,
                    'seance' => $row->heure_seance ? substr((string) $row->heure_seance, 0, 5) : null,
                    'seanceLabel' => $slot['seance_label'] ?? ($row->heure_seance ? substr((string) $row->heure_seance, 0, 5) : 'N/A'),
                    'matiereId' => $slot['matiere_id'] ?? null,
                    'matiere' => $slot['matiere_nom'] ?? 'Matiere non determinee',
                    'motif' => $row->motif ?: 'Absence non justifiee',
                ];
            })
            ->filter(function ($row) use ($selectedMatiereId) {
                return $selectedMatiereId === 0 || (int) ($row['matiereId'] ?? 0) === $selectedMatiereId;
            })
            ->values();

        return response()->json([
            'student' => [
                'id' => (int) $student->id,
                'firstName' => $student->prenom,
                'lastName' => $student->nom,
                'matricule' => $student->matricule,
                'class' => trim($student->classe_nom . ' - ' . $student->classe_niveau),
            ],
            'matieres' => $matieres,
            'selectedMatiereId' => $selectedMatiereId,
            'absences' => $absences,
        ]);
    }

    /**
     * Announcements
     */
    public function getAnnouncements(Request $request): JsonResponse
    {
        $annonces = DB::table('annonces')
            ->orderByDesc('date_publication')
            ->get([
                'id_annonce as id',
                'titre as title',
                'contenu as content',
                'date_publication as date',
                'type',
                'auteur'
            ])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'title' => $row->title,
                    'content' => $row->content,
                    'author' => $row->auteur,
                    'type' => $row->type,
                    'date' => $row->date,
                    'read' => false,
                ];
            })
            ->values();

        return response()->json(['announcements' => $annonces]);
    }

    public function publishAnnouncement(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:5000',
        ]);

        $id = DB::table('annonces')->insertGetId([
            'titre' => $validated['title'],
            'contenu' => $validated['content'],
            'date_publication' => now(),
            'type' => 'Professeur',
            'auteur' => trim(($user->prenom ?? '') . ' ' . ($user->nom ?? 'Professeur')),
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_annonce');

        return response()->json([
            'message' => 'Annonce publiee avec succes.',
            'announcement' => ['id_annonce' => $id],
        ], 201);
    }

    public function getSchedule(Request $request): JsonResponse
    {
        $user = $request->user();

        $schedule = DB::table('emploi_du_temps')
            ->join('classes', 'emploi_du_temps.id_classe', '=', 'classes.id_classe')
            ->join('matieres', 'emploi_du_temps.id_matiere', '=', 'matieres.id_matiere')
            ->where('emploi_du_temps.id_professeur', $user->id)
            ->orderBy('emploi_du_temps.jour')
            ->orderBy('emploi_du_temps.heure_debut')
            ->get([
                'emploi_du_temps.id_edt',
                'emploi_du_temps.jour',
                'emploi_du_temps.heure_debut',
                'emploi_du_temps.heure_fin',
                'classes.id_classe',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'matieres.nom as matiere_nom',
            ]);

        return response()->json(['schedule' => $schedule]);
    }

    public function getNotes(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);

        $classes = DB::table('classes')->whereIn('id_classe', $classIds)->get(['id_classe as id', 'nom', 'niveau']);

        if ($classes->isEmpty()) {
            return response()->json([
                'classes' => [],
                'matieres' => [],
                'selectedClassId' => 0,
                'selectedMatiereId' => 0,
                'students' => [],
            ]);
        }

        $requestedClassId = (int) $request->query('class_id', 0);
        $classId = $requestedClassId > 0 && $classIds->contains($requestedClassId)
            ? $requestedClassId
            : (int) ($classes->first()->id ?? 0);

        $matieres = DB::table('enseigner')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_professeur', $user->id)
            ->where('enseigner.id_classe', $classId)
            ->distinct()
            ->orderBy('matieres.nom')
            ->get(['matieres.id_matiere as id', 'matieres.nom']);

        $requestedMatiereId = (int) $request->query('matiere_id', 0);
        $matiereId = $requestedMatiereId > 0 && $matieres->contains('id', $requestedMatiereId)
            ? $requestedMatiereId
            : (int) ($matieres->first()->id ?? 0);

        $notesSub = DB::table('notes')
            ->select('id_etudiant', DB::raw('MAX(id_note) as last_note_id'))
            ->where('id_professeur', $user->id)
            ->groupBy('id_etudiant');

        if ($matiereId > 0) {
            $notesSub->where('id_matiere', $matiereId);
        } else {
            $notesSub->whereRaw('1 = 0');
        }

        $students = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->leftJoinSub($notesSub, 'last_notes', function ($join) {
                $join->on('last_notes.id_etudiant', '=', 'etudiants.id_etudiant');
            })
            ->leftJoin('notes', 'notes.id_note', '=', 'last_notes.last_note_id')
            ->where('etudiants.id_classe', $classId)
            ->orderBy('users.nom')
            ->orderBy('users.prenom')
            ->get([
                'users.id',
                'users.nom',
                'users.prenom',
                'etudiants.matricule',
                'notes.id_note as note_id',
                'notes.valeur as note',
                'notes.appreciation',
            ])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'firstName' => $row->prenom,
                    'lastName' => $row->nom,
                    'matricule' => $row->matricule,
                    'noteId' => $row->note_id ? (int) $row->note_id : null,
                    'note' => $row->note !== null ? (string) $row->note : '',
                    'appreciation' => $row->appreciation,
                    'avatar' => null,
                ];
            })
            ->values();

        return response()->json([
            'classes' => $classes,
            'matieres' => $matieres,
            'selectedClassId' => $classId,
            'selectedMatiereId' => $matiereId,
            'students' => $students,
        ]);
    }

    public function saveNotes(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'required|integer|exists:matieres,id_matiere',
            'notes' => 'required|array|min:1',
            'notes.*.studentId' => 'required|integer|exists:users,id',
            'notes.*.noteId' => 'nullable|integer|exists:notes,id_note',
            'notes.*.note' => 'nullable|numeric|min:0|max:20',
            'notes.*.appreciation' => 'nullable|string|max:1000',
        ]);

        $canTeach = DB::table('enseigner')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $validated['classId'])
            ->where('id_matiere', $validated['matiereId'])
            ->exists();

        if (! $canTeach) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe/matiere.'], 403);
        }

        foreach ($validated['notes'] as $line) {
            $noteId = $line['noteId'] ?? null;

            if ($line['note'] === null || $line['note'] === '') {
                if ($noteId) {
                    DB::table('notes')
                        ->where('id_note', $noteId)
                        ->where('id_professeur', $user->id)
                        ->delete();
                }
                continue;
            }

            $isInClass = DB::table('etudiants')
                ->where('id_etudiant', $line['studentId'])
                ->where('id_classe', $validated['classId'])
                ->exists();

            if (! $isInClass) {
                continue;
            }

            if ($noteId) {
                $updated = DB::table('notes')
                    ->where('id_note', $noteId)
                    ->where('id_professeur', $user->id)
                    ->where('id_etudiant', $line['studentId'])
                    ->where('id_matiere', $validated['matiereId'])
                    ->update([
                        'valeur' => $line['note'],
                        'appreciation' => $line['appreciation'] ?? null,
                        'updated_at' => now(),
                    ]);

                if ($updated) {
                    continue;
                }
            }

            DB::table('notes')->insert([
                'valeur' => $line['note'],
                'appreciation' => $line['appreciation'] ?? null,
                'id_etudiant' => $line['studentId'],
                'id_matiere' => $validated['matiereId'],
                'id_professeur' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Notes enregistrees avec succes.']);
    }

    public function getAttendance(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);
        $classes = DB::table('classes')->whereIn('id_classe', $classIds)->get(['id_classe as id', 'nom', 'niveau']);

        if ($classes->isEmpty()) {
            return response()->json([
                'classes' => [],
                'matieres' => [],
                'seances' => [],
                'selectedClassId' => 0,
                'selectedMatiereId' => 0,
                'selectedSeanceStart' => null,
                'selectedDate' => (string) ($request->query('date') ?: now()->toDateString()),
                'students' => [],
            ]);
        }

        $requestedClassId = (int) $request->query('class_id', 0);
        $classId = $requestedClassId > 0 && $classIds->contains($requestedClassId)
            ? $requestedClassId
            : (int) ($classes->first()->id ?? 0);

        $matieres = DB::table('enseigner')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_professeur', $user->id)
            ->where('enseigner.id_classe', $classId)
            ->distinct()
            ->orderBy('matieres.nom')
            ->get(['matieres.id_matiere as id', 'matieres.nom']);

        $requestedMatiereId = (int) $request->query('matiere_id', 0);
        $matiereId = $requestedMatiereId > 0 && $matieres->contains('id', $requestedMatiereId)
            ? $requestedMatiereId
            : (int) ($matieres->first()->id ?? 0);

        $date = (string) ($request->query('date') ?: now()->toDateString());
        $dayName = $this->toFrenchWeekday($date);

        $seances = DB::table('emploi_du_temps')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $classId)
            ->where('jour', $dayName)
            ->when($matiereId > 0, function ($query) use ($matiereId) {
                $query->where('id_matiere', $matiereId);
            })
            ->orderBy('heure_debut')
            ->get(['heure_debut', 'heure_fin'])
            ->map(function ($row) {
                return [
                    'value' => $row->heure_debut,
                    'label' => substr((string) $row->heure_debut, 0, 5) . ' - ' . substr((string) $row->heure_fin, 0, 5),
                ];
            })
            ->unique('value')
            ->values();

        if ($seances->isEmpty()) {
            $seances = DB::table('emploi_du_temps')
                ->where('id_professeur', $user->id)
                ->where('id_classe', $classId)
                ->when($matiereId > 0, function ($query) use ($matiereId) {
                    $query->where('id_matiere', $matiereId);
                })
                ->orderBy('jour')
                ->orderBy('heure_debut')
                ->get(['heure_debut', 'heure_fin'])
                ->map(function ($row) {
                    return [
                        'value' => $row->heure_debut,
                        'label' => substr((string) $row->heure_debut, 0, 5) . ' - ' . substr((string) $row->heure_fin, 0, 5),
                    ];
                })
                ->unique('value')
                ->values();
        }

        $requestedSeanceStart = (string) $request->query('seance_start', '');
        $selectedSeanceStart = $seances->contains(function ($seance) use ($requestedSeanceStart) {
            return ($seance['value'] ?? null) === $requestedSeanceStart;
        })
            ? $requestedSeanceStart
            : ($seances->first()['value'] ?? null);

        $absenceIds = DB::table('absences')
            ->where('id_professeur', $user->id)
            ->whereDate('date_abs', $date)
            ->when($selectedSeanceStart, function ($query) use ($selectedSeanceStart) {
                $query->where('heure_seance', $selectedSeanceStart);
            })
            ->pluck('id_etudiant')
            ->flip();

        $students = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->where('etudiants.id_classe', $classId)
            ->orderBy('users.nom')
            ->orderBy('users.prenom')
            ->get([
                'users.id',
                'users.nom',
                'users.prenom',
                'etudiants.matricule',
            ])
            ->map(function ($row) use ($absenceIds) {
                return [
                    'id' => (int) $row->id,
                    'firstName' => $row->prenom,
                    'lastName' => $row->nom,
                    'matricule' => $row->matricule,
                    'status' => $absenceIds->has($row->id) ? 'absent' : 'present',
                    'avatar' => null,
                ];
            })
            ->values();

        return response()->json([
            'classes' => $classes,
            'matieres' => $matieres,
            'seances' => $seances,
            'selectedClassId' => $classId,
            'selectedMatiereId' => $matiereId,
            'selectedSeanceStart' => $selectedSeanceStart,
            'selectedDate' => $date,
            'students' => $students,
        ]);
    }

    public function saveAttendance(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'required|integer|exists:matieres,id_matiere',
            'date' => 'required|date',
            'seanceStart' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'statuses' => 'required|array|min:1',
            'statuses.*.studentId' => 'required|integer|exists:users,id',
            'statuses.*.status' => 'required|in:present,absent',
            'statuses.*.motif' => 'nullable|string|max:255',
        ]);

        $canTeach = DB::table('enseigner')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $validated['classId'])
            ->where('id_matiere', $validated['matiereId'])
            ->exists();

        if (! $canTeach) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe/matiere.'], 403);
        }

        $seanceStart = strlen($validated['seanceStart']) === 5
            ? $validated['seanceStart'] . ':00'
            : $validated['seanceStart'];

        foreach ($validated['statuses'] as $line) {
            if ($line['status'] === 'absent') {
                DB::table('absences')->updateOrInsert(
                    [
                        'date_abs' => $validated['date'],
                        'heure_seance' => $seanceStart,
                        'id_etudiant' => $line['studentId'],
                        'id_professeur' => $user->id,
                    ],
                    [
                        'motif' => $line['motif'] ?? 'Absence non justifiee',
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            } else {
                DB::table('absences')
                    ->where('id_etudiant', $line['studentId'])
                    ->where('id_professeur', $user->id)
                    ->whereDate('date_abs', $validated['date'])
                    ->where('heure_seance', $seanceStart)
                    ->delete();
            }
        }

        return response()->json(['message' => 'Feuille d appel enregistree avec succes.']);
    }

    public function getProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);

        $rows = DB::table('classes')
            ->whereIn('id_classe', $classIds)
            ->orderBy('niveau')
            ->orderBy('nom')
            ->get(['id_classe', 'nom', 'niveau'])
            ->map(function ($classRow) use ($user) {
                $subjects = DB::table('enseigner')
                    ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
                    ->where('enseigner.id_professeur', $user->id)
                    ->where('enseigner.id_classe', $classRow->id_classe)
                    ->get(['matieres.nom']);

                $devoirCount = DB::table('devoirs')
                    ->where('id_professeur', $user->id)
                    ->where('id_classe', $classRow->id_classe)
                    ->count();

                return [
                    'id' => (int) $classRow->id_classe,
                    'name' => trim($classRow->nom . ' - ' . $classRow->niveau),
                    'matiere' => $subjects->pluck('nom')->join(', '),
                    'progress' => min(100, (int) round($devoirCount * 8)),
                    'totalChap' => 12,
                    'completedChap' => min(12, $devoirCount),
                    'current' => 'Suivi automatique base sur devoirs publies',
                    'nextDate' => now()->addDays(2)->format('Y-m-d'),
                ];
            })
            ->values();

        return response()->json(['progress' => $rows]);
    }

    public function updateProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'required|integer|exists:matieres,id_matiere',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:3000',
        ]);

        $canTeach = DB::table('enseigner')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $validated['classId'])
            ->where('id_matiere', $validated['matiereId'])
            ->exists();

        if (! $canTeach) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe/matiere.'], 403);
        }

        DB::table('lecons')->insert([
            'titre' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'id_matiere' => $validated['matiereId'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Avancement mis a jour avec succes.']);
    }

    public function getComplaints(Request $request): JsonResponse
    {
        $user = $request->user();

        $complaints = DB::table('complaints')
            ->where('id_professeur', $user->id)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'subject',
                'category',
                'message',
                'status',
                'created_at',
            ])
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'subject' => $row->subject,
                    'category' => $row->category,
                    'message' => $row->message,
                    'status' => $row->status,
                    'date' => optional($row->created_at)->toDateTimeString(),
                ];
            })
            ->values();

        return response()->json(['complaints' => $complaints]);
    }

    public function submitComplaint(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|string',
            'message' => 'required|string',
        ]);

        $id = DB::table('complaints')->insertGetId([
            'id_professeur' => $user->id,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'status' => 'en_attente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Reclamation enregistree avec succes.',
            'complaint' => ['id' => $id],
        ], 201);
    }

    private function getAssignedClassIds(int $professorId)
    {
        $fromAssignments = DB::table('classe_professeur_assignments')
            ->where('id_professeur', $professorId)
            ->pluck('id_classe');

        if ($fromAssignments->isNotEmpty()) {
            return $fromAssignments->unique()->values();
        }

        return DB::table('classes')
            ->where('id_professeur', $professorId)
            ->pluck('id_classe')
            ->unique()
            ->values();
    }

    private function toFrenchWeekday(string $date): string
    {
        $days = [
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
            7 => 'Dimanche',
        ];

        $index = Carbon::parse($date)->dayOfWeekIso;
        return $days[$index] ?? 'Lundi';
    }
}
