<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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

        return response()->json([
            'message' => 'La modification du nom et de l email est desactivee. Utilisez uniquement le changement de mot de passe.',
        ], 422);
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

        $currentDate = Carbon::now();
        $currentYear = $currentDate->year;
        $isAfterSchoolStart = $currentDate->month >= 9;
        $startYear = $isAfterSchoolStart ? $currentYear : $currentYear - 1;
        $endYear = $startYear + 1;
        $academicYear = $startYear . '-' . $endYear;

        return response()->json([
            'stats' => [
                'total_eleves' => (int) $totalStudents,
                'total_classes' => (int) $classIds->count(),
                'devoirs_actifs' => (int) $activeAssignments,
                'ressources_partagees' => (int) $sharedResources,
                'academic_year' => $academicYear,
            ],
            'classes' => $classSummaries,
            'schedule' => $todaySchedule,
            'academic_year' => $academicYear,
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

        $matieresByClassRows = DB::table('enseigner')
            ->join('matieres', 'enseigner.id_matiere', '=', 'matieres.id_matiere')
            ->where('enseigner.id_professeur', $user->id)
            ->whereIn('enseigner.id_classe', $classIds)
            ->orderBy('matieres.nom')
            ->get([
                'enseigner.id_classe',
                'matieres.id_matiere as id',
                'matieres.nom',
            ]);

        $matieresByClass = $matieresByClassRows
            ->groupBy('id_classe')
            ->map(function ($rows) {
                return $rows
                    ->map(fn ($row) => ['id' => (int) $row->id, 'nom' => $row->nom])
                    ->unique('id')
                    ->values();
            })
            ->mapWithKeys(fn ($rows, $classId) => [(string) $classId => $rows]);

        $matieres = $matieresByClassRows
            ->map(fn ($row) => ['id' => (int) $row->id, 'nom' => $row->nom])
            ->unique('id')
            ->values();

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
                'devoirs.id_classe',
                'devoirs.id_matiere',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'matieres.nom as matiere_nom',
                'devoirs.created_at',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => $row->title,
                'description' => $row->description,
                'type' => 'Devoir',
                'class' => trim($row->classe_nom . ' - ' . $row->classe_niveau),
                'classId' => (int) $row->id_classe,
                'matiere' => $row->matiere_nom,
                'matiereId' => (int) $row->id_matiere,
                'published_at' => optional($row->created_at)->toDateTimeString(),
                'deadline' => $row->date_limite,
            ]);

        $hasResourceClassColumn = Schema::hasColumn('ressources', 'id_classe');
        $hasResourceMatiereColumn = Schema::hasColumn('ressources', 'id_matiere');
        $hasResourceTitleColumn = Schema::hasColumn('ressources', 'titre');
        $hasResourceDescriptionColumn = Schema::hasColumn('ressources', 'description');

        $ressourcesQuery = DB::table('ressources')
            ->where('ressources.id_professeur', $user->id)
            ->orderByDesc('ressources.created_at');

        if ($hasResourceClassColumn) {
            $ressourcesQuery->leftJoin('classes', 'ressources.id_classe', '=', 'classes.id_classe');
        }

        if ($hasResourceMatiereColumn) {
            $ressourcesQuery->leftJoin('matieres', 'ressources.id_matiere', '=', 'matieres.id_matiere');
        }

        $resourceSelect = [
            'ressources.id_ressource as id',
            'ressources.fichier',
            'ressources.type_ressource',
            'ressources.created_at',
        ];

        if ($hasResourceTitleColumn) {
            $resourceSelect[] = 'ressources.titre as title';
        }

        if ($hasResourceDescriptionColumn) {
            $resourceSelect[] = 'ressources.description';
        }

        if ($hasResourceClassColumn) {
            $resourceSelect[] = 'ressources.id_classe';
            $resourceSelect[] = 'classes.nom as classe_nom';
            $resourceSelect[] = 'classes.niveau as classe_niveau';
        }

        if ($hasResourceMatiereColumn) {
            $resourceSelect[] = 'ressources.id_matiere';
            $resourceSelect[] = 'matieres.nom as matiere_nom';
        }

        $ressources = $ressourcesQuery
              ->get($resourceSelect)
              ->map(function ($row) use ($hasResourceTitleColumn, $hasResourceDescriptionColumn) {
                $classLabel = 'Toutes';
                if (isset($row->id_classe) && (int) $row->id_classe > 0) {
                    $classLabel = trim(((string) ($row->classe_nom ?? 'Classe')) . ' - ' . ((string) ($row->classe_niveau ?? '')));
                }

                $resolvedTitle = 'Ressource sans titre';
                if ($hasResourceTitleColumn && isset($row->title) && trim((string) $row->title) !== '') {
                    $resolvedTitle = trim((string) $row->title);
                }

                $resolvedDescription = '';
                if ($hasResourceDescriptionColumn && isset($row->description)) {
                    $resolvedDescription = (string) $row->description;
                }

                return [
                    'id' => (int) $row->id,
                    'title' => $resolvedTitle,
                    'description' => $resolvedDescription,
                    'type' => 'Ressource',
                    'class' => $classLabel,
                    'classId' => isset($row->id_classe) ? (int) $row->id_classe : null,
                    'matiere' => $row->matiere_nom ?? '-',
                    'matiereId' => isset($row->id_matiere) ? (int) $row->id_matiere : null,
                    'resource_type' => $row->type_ressource,
                    'published_at' => optional($row->created_at)->toDateTimeString(),
                    'deadline' => null,
                ];
            });

        return response()->json([
            'classes' => $classes,
            'matieres' => $matieres,
            'matieres_by_class' => $matieresByClass,
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
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
        ]);

        $classId = (int) $validated['classId'];
        if (! $this->isAssignedToClass((int) $user->id, $classId)) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe.'], 403);
        }

        [$matiereId, $matiereError] = $this->resolveTeachingMatiereId(
            (int) $user->id,
            $classId,
            isset($validated['matiereId']) ? (int) $validated['matiereId'] : null
        );

        if ($matiereError !== null || $matiereId === null) {
            return response()->json(['message' => $matiereError ?? 'Selection de matiere invalide.'], 422);
        }

        $id = DB::table('devoirs')->insertGetId([
            'titre' => $validated['title'],
            'description' => $validated['description'],
            'date_limite' => $validated['deadline'],
            'id_professeur' => $user->id,
            'id_classe' => $classId,
            'id_matiere' => $matiereId,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_devoir');

        return response()->json([
            'message' => 'Devoir publie avec succes.',
            'devoir' => ['id_devoir' => $id],
        ], 201);
    }

    public function updateDevoir(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date',
            'classId' => 'nullable|integer|exists:classes,id_classe',
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
        ]);

        $devoir = DB::table('devoirs')->where('id_devoir', $id)->first();
        if (!$devoir || $devoir->id_professeur != $user->id) {
            return response()->json(['message' => 'Devoir introuvable.'], 404);
        }

        $updateData = [
            'titre' => $validated['title'],
            'description' => $validated['description'],
            'date_limite' => $validated['deadline'],
            'updated_at' => now(),
        ];

        if (isset($validated['classId'])) {
            $updateData['id_classe'] = $validated['classId'];
        }
        if (isset($validated['matiereId'])) {
            $updateData['id_matiere'] = $validated['matiereId'];
        }

        DB::table('devoirs')->where('id_devoir', $id)->update($updateData);

        return response()->json(['message' => 'Devoir mis a jour avec succes.']);
    }

    public function deleteDevoir(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $devoir = DB::table('devoirs')->where('id_devoir', $id)->first();
        if (!$devoir || $devoir->id_professeur != $user->id) {
            return response()->json(['message' => 'Devoir introuvable.'], 404);
        }

        DB::table('devoir_soumissions')->where('id_devoir', $id)->delete();
        DB::table('devoirs')->where('id_devoir', $id)->delete();

        return response()->json(['message' => 'Devoir supprime avec succes.']);
    }

    public function getDevoirSoumissions(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $devoir = DB::table('devoirs')->where('id_devoir', $id)->first();
        if (!$devoir || $devoir->id_professeur != $user->id) {
            return response()->json(['message' => 'Devoir introuvable.'], 404);
        }

        $soumissions = DB::table('devoir_soumissions')
            ->join('users', 'devoir_soumissions.id_etudiant', '=', 'users.id')
            ->where('devoir_soumissions.id_devoir', $id)
            ->select('devoir_soumissions.*', 'users.name as etudiant_nom', 'users.email')
            ->get()
            ->map(function($s) use ($devoir) {
                // Check if $s->date_soumission is after $devoir->date_limite
                $status_retard = false;
                if ($s->date_soumission && $devoir->date_limite) {
                    $status_retard = strtotime($s->date_soumission) > strtotime($devoir->date_limite . ' 23:59:59');
                }
                return [
                    'id_soumission' => $s->id_soumission,
                    'etudiant_nom' => $s->etudiant_nom,
                    'date_soumission' => date('Y-m-d H:i', strtotime($s->date_soumission)),
                    'statut' => $s->statut ?: 'soumis', // 'soumis', 'bien_recu'
                    'en_retard' => $status_retard,
                    'fichier_path' => $s->fichier_path
                ];
            });

        return response()->json(['soumissions' => $soumissions, 'devoir' => $devoir]);
    }

    public function markSoumissionReceived(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $soumission = DB::table('devoir_soumissions')
            ->join('devoirs', 'devoir_soumissions.id_devoir', '=', 'devoirs.id_devoir')
            ->where('devoir_soumissions.id_soumission', $id)
            ->select('devoir_soumissions.*', 'devoirs.id_professeur')
            ->first();

        if (!$soumission || $soumission->id_professeur != $user->id) {
            return response()->json(['message' => 'Soumission introuvable.'], 404);
        }

        DB::table('devoir_soumissions')->where('id_soumission', $id)->update([
            'statut' => 'bien_recu',
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Soumission marquee comme bien recue.']);
    }

    public function publishRessource(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/.*\S.*/'],
            'description' => ['required', 'string', 'regex:/.*\S.*/'],
            'type' => 'required|string|max:100',
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
            'file' => 'nullable|file|max:25600', // 25MB max
        ]);

        $validated['title'] = trim((string) $validated['title']);
        $validated['description'] = trim((string) $validated['description']);

        $classId = (int) $validated['classId'];
        if (! $this->isAssignedToClass((int) $user->id, $classId)) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe.'], 403);
        }

        [$matiereId, $matiereError] = $this->resolveTeachingMatiereId(
            (int) $user->id,
            $classId,
            isset($validated['matiereId']) ? (int) $validated['matiereId'] : null
        );

        if ($matiereError !== null || $matiereId === null) {
            return response()->json(['message' => $matiereError ?? 'Selection de matiere invalide.'], 422);
        }

        $filename = $validated['title'];
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('ressources_professeurs', 'public');
            $filename = $path;
        } else {
            $filename = Str::slug($validated['title']) . '.txt';
        }

        $resourcePayload = [
            'fichier' => $filename,
            'type_ressource' => $validated['type'],
            'id_professeur' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('ressources', 'titre')) {
            $resourcePayload['titre'] = $validated['title'];
        }

        if (Schema::hasColumn('ressources', 'description')) {
            $resourcePayload['description'] = $validated['description'];
        }

        if (Schema::hasColumn('ressources', 'id_classe')) {
            $resourcePayload['id_classe'] = $classId;
        }

        if (Schema::hasColumn('ressources', 'id_matiere')) {
            $resourcePayload['id_matiere'] = $matiereId;
        }

        $id = DB::table('ressources')->insertGetId($resourcePayload, 'id_ressource');

        return response()->json([
            'message' => 'Ressource publiee avec succes.',
            'ressource' => [
                'id_ressource' => $id,
                'fichier' => $filename,
            ],
        ], 201);
    }

    public function updateRessource(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/.*\S.*/'],
            'description' => ['required', 'string', 'regex:/.*\S.*/'],
            'type' => 'required|string|max:100',
            'file' => 'nullable|file|max:25600', // 25MB max
            'classId' => 'nullable|integer|exists:classes,id_classe',
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
        ]);

        $validated['title'] = trim((string) $validated['title']);
        $validated['description'] = trim((string) $validated['description']);

        $ressource = DB::table('ressources')->where('id_ressource', $id)->first();
        if (!$ressource || $ressource->id_professeur != $user->id) {
            return response()->json(['message' => 'Ressource introuvable.'], 404);
        }

        $filename = $ressource->fichier;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('ressources_professeurs', 'public');
            $filename = $path;
        }

        $updateData = [
            'fichier' => $filename,
            'type_ressource' => $validated['type'],
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('ressources', 'titre')) {
            $updateData['titre'] = $validated['title'];
        }

        if (Schema::hasColumn('ressources', 'description')) {
            $updateData['description'] = $validated['description'];
        }

        if (isset($validated['classId']) && Schema::hasColumn('ressources', 'id_classe')) {
            $updateData['id_classe'] = $validated['classId'];
        }
        if (isset($validated['matiereId']) && Schema::hasColumn('ressources', 'id_matiere')) {
            $updateData['id_matiere'] = $validated['matiereId'];
        }

        DB::table('ressources')->where('id_ressource', $id)->update($updateData);

        return response()->json(['message' => 'Ressource mise a jour avec succes.']);
    }

    public function deleteRessource(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $ressource = DB::table('ressources')->where('id_ressource', $id)->first();
        if (!$ressource || $ressource->id_professeur != $user->id) {
            return response()->json(['message' => 'Ressource introuvable.'], 404);
        }

        DB::table('ressources')->where('id_ressource', $id)->delete();
        return response()->json(['message' => 'Ressource supprimee avec succes.']);
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

        $assignedClassIds = $this->getAssignedClassIds((int) $user->id);

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
            ->leftJoin('absences', function ($join) use ($user) {
                $join->on('absences.id_etudiant', '=', 'etudiants.id_etudiant')
                    ->where('absences.id_professeur', '=', $user->id);
            })
            ->select(
                'classes.id_classe',
                'classes.nom',
                'classes.niveau',
                DB::raw('COUNT(DISTINCT etudiants.id_etudiant) as students_count'),
                DB::raw('COUNT(absences.id_absence) as absences_count')
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
                    'absences_count' => (int) $classe->absences_count,
                ];
            })
            ->values();

        $absenceByStudentSubQuery = DB::table('absences')
            ->select('id_etudiant', DB::raw('COUNT(*) as absences_count'))
            ->where('id_professeur', $user->id)
            ->groupBy('id_etudiant');

        $students = DB::table('etudiants')
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->join('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->leftJoin('parents', 'etudiants.id_parent', '=', 'parents.id_parent')
            ->leftJoinSub($absenceByStudentSubQuery, 'student_absences', function ($join) {
                $join->on('student_absences.id_etudiant', '=', 'etudiants.id_etudiant');
            })
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
                'parents.telephone as parent_phone',
                DB::raw('COALESCE(student_absences.absences_count, 0) as absences_count')
            )
            ->whereIn('etudiants.id_classe', $classIdsToUse)
            ->orderBy('classes.niveau')
            ->orderBy('classes.nom')
            ->orderBy('users.nom')
            ->orderBy('users.prenom')
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
                    'absenceCount' => (int) $student->absences_count,
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
        $hasTargetColumn = Schema::hasColumn('annonces', 'cible');
        $hasPhotoColumn = Schema::hasColumn('annonces', 'photo_path');

        $query = DB::table('annonces')
            ->orderByDesc('date_publication')
            ->orderByDesc('created_at');

        if ($hasTargetColumn) {
            $query->where(function ($targetQuery) {
                $targetQuery
                    ->whereNull('cible')
                    ->orWhere('cible', '')
                    ->orWhereRaw('LOWER(cible) = ?', ['tous'])
                    ->orWhereRaw('LOWER(cible) = ?', ['professeurs'])
                    ->orWhereRaw('LOWER(cible) = ?', ['professeur']);
            });
        }

        $columns = [
            'id_annonce as id',
            'titre as title',
            'contenu as content',
            'date_publication as date',
            'type',
            'auteur',
        ];

        if ($hasTargetColumn) {
            $columns[] = 'cible';
        }

        if ($hasPhotoColumn) {
            $columns[] = 'photo_path';
        }

        $annonces = $query
            ->get($columns)
            ->map(function ($row) use ($hasTargetColumn, $hasPhotoColumn) {
                $photoUrl = $hasPhotoColumn && !empty($row->photo_path)
                    ? asset('storage/' . ltrim((string) $row->photo_path, '/'))
                    : null;

                return [
                    'id' => (int) $row->id,
                    'title' => $row->title,
                    'content' => $row->content,
                    'author' => $row->auteur,
                    'type' => $row->type,
                    'date' => $row->date,
                    'target' => $hasTargetColumn ? ($row->cible ?: 'Tous') : 'Tous',
                    'photoUrl' => $photoUrl,
                    'attachmentUrl' => $photoUrl,
                    'hasAttachment' => (bool) $photoUrl,
                    'read' => false,
                ];
            })
            ->values();

        return response()->json(['announcements' => $annonces]);
    }

    public function publishAnnouncement(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Les professeurs peuvent uniquement consulter et telecharger les annonces.',
        ], 403);
    }

    public function getSchedule(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'professeur') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $classIds = DB::table('emploi_du_temps')
            ->where('id_professeur', $user->id)
            ->pluck('id_classe')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($classIds->isEmpty()) {
            return response()->json([
                'classes' => [],
                'selectedClassId' => 0,
                'schedule' => [],
            ]);
        }

        $classRows = DB::table('classes')
            ->whereIn('id_classe', $classIds)
            ->orderBy('niveau')
            ->orderBy('nom')
            ->get(['id_classe', 'nom', 'niveau']);

        $requestedClassId = (int) $request->query('class_id', 0);
        $showAllClasses = $requestedClassId === 0;
        $selectedClassId = $requestedClassId > 0 && $classIds->contains($requestedClassId)
            ? $requestedClassId
            : 0;

        $classes = $classRows
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id_classe,
                    'nom' => $row->nom,
                    'niveau' => $row->niveau,
                    'label' => trim($row->nom . ' - ' . $row->niveau),
                ];
            })
            ->values();

        $schedule = DB::table('emploi_du_temps')
            ->join('classes', 'emploi_du_temps.id_classe', '=', 'classes.id_classe')
            ->join('matieres', 'emploi_du_temps.id_matiere', '=', 'matieres.id_matiere')
            ->where('emploi_du_temps.id_professeur', $user->id)
            ->where('emploi_du_temps.id_classe', $selectedClassId)
            ->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('enseigner')
                    ->whereColumn('enseigner.id_classe', 'emploi_du_temps.id_classe')
                    ->whereColumn('enseigner.id_matiere', 'emploi_du_temps.id_matiere')
                    ->where('enseigner.id_professeur', $user->id);
            })
            ->orderBy('emploi_du_temps.jour')
            ->orderBy('emploi_du_temps.heure_debut');

        if ($selectedClassId > 0) {
            $scheduleQuery->where('emploi_du_temps.id_classe', $selectedClassId);
        }

        $schedule = $scheduleQuery->get([
                'emploi_du_temps.id_edt',
                'emploi_du_temps.jour',
                'emploi_du_temps.heure_debut',
                'emploi_du_temps.heure_fin',
                'classes.id_classe',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'matieres.nom as matiere_nom',
            ]);

        return response()->json([
            'classes' => $classes,
            'selectedClassId' => $selectedClassId,
            'schedule' => $schedule,
        ]);
    }

    public function getNotes(Request $request): JsonResponse
    {
        $user = $request->user();
        $classIds = $this->getAssignedClassIds((int) $user->id);
        $evaluationType = $this->normalizeEvaluationTypeLabel((string) $request->query('evaluation_type', 'Contrôle 1'));
        $semestre = (string) $request->query('semestre', '1');
        $hasEvaluationTypeColumn = Schema::hasColumn('notes', 'type_evaluation');
        $hasSemestreColumn = Schema::hasColumn('notes', 'semestre');

        $classes = DB::table('classes')->whereIn('id_classe', $classIds)->get(['id_classe as id', 'nom', 'niveau']);

        if ($classes->isEmpty()) {
            return response()->json([
                'classes' => [],
                'matieres' => [],
                'showMatiereField' => false,
                'selectedClassId' => 0,
                'selectedMatiereId' => 0,
                'selectedEvaluationType' => $evaluationType,
                'selectedSemestre' => $semestre,
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

        if ($hasEvaluationTypeColumn) {
            $notesSub->where(function ($query) use ($evaluationType) {
                $query->where('type_evaluation', $evaluationType);

                if ($this->isDefaultEvaluationType($evaluationType)) {
                    $query->orWhereNull('type_evaluation');
                }
            });
        }

        if ($hasSemestreColumn) {
            $notesSub->where('semestre', $semestre);
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
            'showMatiereField' => $matieres->count() > 1,
            'selectedClassId' => $classId,
            'selectedMatiereId' => $matiereId,
            'selectedEvaluationType' => $evaluationType,
            'selectedSemestre' => $semestre,
            'students' => $students,
        ]);
    }

    public function saveNotes(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
            'evaluationType' => 'required|string|max:120',
            'notes' => 'required|array|min:1',
            'notes.*.studentId' => 'required|integer|exists:users,id',
            'notes.*.noteId' => 'nullable|integer|exists:notes,id_note',
            'notes.*.note' => 'nullable|numeric|min:0|max:20',
            'notes.*.appreciation' => 'nullable|string|max:1000',
            'semestre' => 'nullable|string|max:50',
        ]);

        $evaluationType = $this->normalizeEvaluationTypeLabel((string) ($validated['evaluationType'] ?? 'Contrôle 1'));
        $semestre = (string) ($validated['semestre'] ?? '1');
        $hasEvaluationTypeColumn = Schema::hasColumn('notes', 'type_evaluation');
        $hasSemestreColumn = Schema::hasColumn('notes', 'semestre');

        $classId = (int) $validated['classId'];
        if (! $this->isAssignedToClass((int) $user->id, $classId)) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe.'], 403);
        }

        [$matiereId, $matiereError] = $this->resolveTeachingMatiereId(
            (int) $user->id,
            $classId,
            isset($validated['matiereId']) ? (int) $validated['matiereId'] : null
        );

        if ($matiereError !== null || $matiereId === null) {
            return response()->json(['message' => $matiereError ?? 'Selection de matiere invalide.'], 422);
        }

        foreach ($validated['notes'] as $line) {
            $noteId = $line['noteId'] ?? null;

            if ($line['note'] === null || $line['note'] === '') {
                if ($noteId) {
                    DB::table('notes')
                        ->where('id_note', $noteId)
                        ->where('id_professeur', $user->id)
                        ->delete();
                } elseif ($hasEvaluationTypeColumn) {
                    $deleteQuery = DB::table('notes')
                        ->where('id_professeur', $user->id)
                        ->where('id_etudiant', $line['studentId'])
                        ->where('id_matiere', $matiereId);

                    $deleteQuery->where(function ($query) use ($evaluationType) {
                        $query->where('type_evaluation', $evaluationType);

                        if ($this->isDefaultEvaluationType($evaluationType)) {
                            $query->orWhereNull('type_evaluation');
                        }
                    });

                    if ($hasSemestreColumn) {
                        $deleteQuery->where('semestre', $semestre);
                    }

                    $deleteQuery->delete();
                }
                continue;
            }

            $isInClass = DB::table('etudiants')
                ->where('id_etudiant', $line['studentId'])
                ->where('id_classe', $classId)
                ->exists();

            if (! $isInClass) {
                continue;
            }

            if ($noteId) {
                $updatePayload = [
                    'valeur' => $line['note'],
                    'appreciation' => $line['appreciation'] ?? null,
                    'updated_at' => now(),
                ];

                if ($hasEvaluationTypeColumn) {
                    $updatePayload['type_evaluation'] = $evaluationType;
                }
                if ($hasSemestreColumn) {
                    $updatePayload['semestre'] = $semestre;
                }

                $updated = DB::table('notes')
                    ->where('id_note', $noteId)
                    ->where('id_professeur', $user->id)
                    ->where('id_etudiant', $line['studentId'])
                    ->where('id_matiere', $matiereId)
                    ->update($updatePayload);

                if ($updated) {
                    continue;
                }
            }

            if ($hasEvaluationTypeColumn) {
                $existingByType = DB::table('notes')
                    ->where('id_professeur', $user->id)
                    ->where('id_etudiant', $line['studentId'])
                    ->where('id_matiere', $matiereId)
                    ->where(function ($query) use ($evaluationType) {
                        $query->where('type_evaluation', $evaluationType);

                        if ($this->isDefaultEvaluationType($evaluationType)) {
                            $query->orWhereNull('type_evaluation');
                        }
                    })
                    ->when($hasSemestreColumn, function($q) use ($semestre) {
                        $q->where('semestre', $semestre);
                    })
                    ->orderByDesc('id_note')
                    ->first(['id_note']);

                if ($existingByType) {
                    DB::table('notes')
                        ->where('id_note', $existingByType->id_note)
                        ->update([
                            'valeur' => $line['note'],
                            'appreciation' => $line['appreciation'] ?? null,
                            'type_evaluation' => $evaluationType,
                            'semestre' => $hasSemestreColumn ? $semestre : '1',
                            'updated_at' => now(),
                        ]);

                    continue;
                }
            }

            $insertPayload = [
                'valeur' => $line['note'],
                'appreciation' => $line['appreciation'] ?? null,
                'id_etudiant' => $line['studentId'],
                'id_matiere' => $matiereId,
                'id_professeur' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if ($hasEvaluationTypeColumn) {
                $insertPayload['type_evaluation'] = $evaluationType;
            }
            if ($hasSemestreColumn) {
                $insertPayload['semestre'] = $semestre;
            }

            DB::table('notes')->insert($insertPayload);
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
                'showMatiereField' => false,
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

        $seance1Start = $seances->get(0)['value'] ?? null;
        $seance2Start = $seances->get(1)['value'] ?? null;

        $absencesByStudent = DB::table('absences')
            ->where('id_professeur', $user->id)
            ->whereDate('date_abs', $date)
            ->when($seance1Start || $seance2Start, function ($query) use ($seance1Start, $seance2Start) {
                $seancesToFilter = collect([$seance1Start, $seance2Start])->filter()->values()->all();
                if (! empty($seancesToFilter)) {
                    $query->whereIn('heure_seance', $seancesToFilter);
                }
            })
            ->get(['id_etudiant', 'heure_seance'])
            ->groupBy('id_etudiant')
            ->map(function ($rows) {
                return $rows->pluck('heure_seance')->map(function ($value) {
                    return strlen((string) $value) === 5 ? $value . ':00' : (string) $value;
                });
            });

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
            ->map(function ($row) use ($absencesByStudent, $seance1Start, $seance2Start) {
                $studentSeances = $absencesByStudent->get($row->id, collect());
                $normalizedSeance1 = $seance1Start ? (strlen((string) $seance1Start) === 5 ? $seance1Start . ':00' : (string) $seance1Start) : null;
                $normalizedSeance2 = $seance2Start ? (strlen((string) $seance2Start) === 5 ? $seance2Start . ':00' : (string) $seance2Start) : null;
                $isSeance1Absent = $normalizedSeance1 ? $studentSeances->contains($normalizedSeance1) : false;
                $isSeance2Absent = $normalizedSeance2 ? $studentSeances->contains($normalizedSeance2) : false;

                return [
                    'id' => (int) $row->id,
                    'firstName' => $row->prenom,
                    'lastName' => $row->nom,
                    'matricule' => $row->matricule,
                    'status' => ($isSeance1Absent || $isSeance2Absent) ? 'absent' : 'present',
                    'seance1Absent' => $isSeance1Absent,
                    'seance2Absent' => $isSeance2Absent,
                    'avatar' => null,
                ];
            })
            ->values();

        return response()->json([
            'classes' => $classes,
            'matieres' => $matieres,
            'showMatiereField' => $matieres->count() > 1,
            'seances' => $seances,
            'selectedClassId' => $classId,
            'selectedMatiereId' => $matiereId,
            'selectedSeanceStart' => $seance1Start,
            'selectedDate' => $date,
            'students' => $students,
        ]);
    }

    public function saveAttendance(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'classId' => 'required|integer|exists:classes,id_classe',
            'matiereId' => 'nullable|integer|exists:matieres,id_matiere',
            'date' => 'required|date',
            'seanceStart' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'statuses' => 'required|array|min:1',
            'statuses.*.studentId' => 'required|integer|exists:users,id',
            'statuses.*.status' => 'required|in:present,absent',
            'statuses.*.seance1' => 'nullable|boolean',
            'statuses.*.seance2' => 'nullable|boolean',
            'statuses.*.motif' => 'nullable|string|max:255',
        ]);

        $classId = (int) $validated['classId'];
        if (! $this->isAssignedToClass((int) $user->id, $classId)) {
            return response()->json(['message' => 'Vous n etes pas assigne a cette classe.'], 403);
        }

        [$matiereId, $matiereError] = $this->resolveTeachingMatiereId(
            (int) $user->id,
            $classId,
            isset($validated['matiereId']) ? (int) $validated['matiereId'] : null
        );

        if ($matiereError !== null || $matiereId === null) {
            return response()->json(['message' => $matiereError ?? 'Selection de matiere invalide.'], 422);
        }

        $dayName = $this->toFrenchWeekday((string) $validated['date']);
        $seances = DB::table('emploi_du_temps')
            ->where('id_professeur', $user->id)
            ->where('id_classe', $classId)
            ->where('jour', $dayName)
            ->when($matiereId > 0, function ($query) use ($matiereId) {
                $query->where('id_matiere', $matiereId);
            })
            ->orderBy('heure_debut')
            ->get(['heure_debut'])
            ->pluck('heure_debut')
            ->map(function ($value) {
                return strlen((string) $value) === 5 ? $value . ':00' : (string) $value;
            })
            ->unique()
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
                ->get(['heure_debut'])
                ->pluck('heure_debut')
                ->map(function ($value) {
                    return strlen((string) $value) === 5 ? $value . ':00' : (string) $value;
                })
                ->unique()
                ->values();
        }

        $seance1Start = $seances->get(0);
        $seance2Start = $seances->get(1);
        $legacySeanceStart = isset($validated['seanceStart']) && $validated['seanceStart'] !== null
            ? (strlen($validated['seanceStart']) === 5 ? $validated['seanceStart'] . ':00' : $validated['seanceStart'])
            : null;

        foreach ($validated['statuses'] as $line) {
            $hasPerSeanceFlags = array_key_exists('seance1', $line) || array_key_exists('seance2', $line);

            if ($hasPerSeanceFlags) {
                $seanceFlags = [
                    ['start' => $seance1Start, 'absent' => (bool) ($line['seance1'] ?? false)],
                    ['start' => $seance2Start, 'absent' => (bool) ($line['seance2'] ?? false)],
                ];

                foreach ($seanceFlags as $entry) {
                    if (! $entry['start']) {
                        continue;
                    }

                    if ($entry['absent']) {
                        DB::table('absences')->updateOrInsert(
                            [
                                'date_abs' => $validated['date'],
                                'heure_seance' => $entry['start'],
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
                            ->where('heure_seance', $entry['start'])
                            ->delete();
                    }
                }

                continue;
            }

            if (! $legacySeanceStart) {
                continue;
            }

            if ($line['status'] === 'absent') {
                DB::table('absences')->updateOrInsert(
                    [
                        'date_abs' => $validated['date'],
                        'heure_seance' => $legacySeanceStart,
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
                    ->where('heure_seance', $legacySeanceStart)
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
                'cible',
                'status',
                'created_at',
            ])
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'subject' => $row->subject,
                    'category' => $row->category,
                    'message' => $row->message,
                    'cible' => $row->cible ?? 'directeur',
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
            'cible' => 'required|string|in:directeur,secretaire,les_deux',
        ]);

        $id = DB::table('complaints')->insertGetId([
            'id_professeur' => $user->id,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'cible' => $validated['cible'],
            'status' => 'en_attente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Reclamation enregistree avec succes.',
            'complaint' => ['id' => $id],
        ], 201);
    }

    private function isAssignedToClass(int $professorId, int $classId): bool
    {
        $fromAssignments = DB::table('classe_professeur_assignments')
            ->where('id_professeur', $professorId)
            ->where('id_classe', $classId)
            ->exists();

        if ($fromAssignments) {
            return true;
        }

        return DB::table('enseigner')
            ->where('id_professeur', $professorId)
            ->where('id_classe', $classId)
            ->exists();
    }

    private function resolveTeachingMatiereId(int $professorId, int $classId, ?int $requestedMatiereId): array
    {
        $assignedMatiereIds = DB::table('enseigner')
            ->where('id_professeur', $professorId)
            ->where('id_classe', $classId)
            ->pluck('id_matiere')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($assignedMatiereIds->isEmpty()) {
            return [null, 'Aucune matiere assignee a cette classe pour ce professeur.'];
        }

        if ($requestedMatiereId !== null && $requestedMatiereId > 0) {
            if ($assignedMatiereIds->contains($requestedMatiereId)) {
                return [$requestedMatiereId, null];
            }

            return [null, 'La matiere selectionnee ne correspond pas a cette classe.'];
        }

        if ($assignedMatiereIds->count() === 1) {
            return [(int) $assignedMatiereIds->first(), null];
        }

        return [null, 'Veuillez selectionner une matiere pour cette classe.'];
    }

    private function normalizeEvaluationTypeLabel(string $value): string
    {
        $normalized = mb_strtolower(trim($value));
        $normalized = str_replace(
            ['ô', 'é', 'è', 'ê', 'à', 'â', 'î', 'ï', 'ù', 'û', 'ç', '/', '-'],
            ['o', 'e', 'e', 'e', 'a', 'a', 'i', 'i', 'u', 'u', 'c', ' ', ' '],
            $normalized
        );
        $normalized = preg_replace('/\s+/', ' ', $normalized ?? '');
        $normalized = trim((string) $normalized);

        if (str_contains($normalized, 'controle 2')) {
            return 'Contrôle 2';
        }

        if (str_contains($normalized, 'controle 3')) {
            return 'Contrôle 3';
        }

        if (str_contains($normalized, 'controle 4')) {
            return 'Contrôle 4';
        }

        if (str_contains($normalized, 'tp') || str_contains($normalized, 'participation')) {
            return 'TP / Participation';
        }

        if (str_contains($normalized, 'projet') || str_contains($normalized, 'expose')) {
            return 'Projet / Exposé';
        }

        return 'Contrôle 1';
    }

    private function isDefaultEvaluationType(string $evaluationType): bool
    {
        return $this->normalizeEvaluationTypeLabel($evaluationType) === 'Contrôle 1';
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
