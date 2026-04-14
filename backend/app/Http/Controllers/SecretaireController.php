<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Annonce;
use App\Models\Classe;
use App\Models\Etudiant;
use App\Models\ParentEleve;
use App\Models\Professeur;
use App\Models\Reclamation;
use App\Models\Secretaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SecretaireController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'etudiants' => Etudiant::count(),
                'classes' => Classe::count(),
                'absences_aujourdhui' => Absence::whereDate('date_abs', now()->toDateString())->count(),
                'reclamations_en_attente' => Reclamation::where('statut', 'en_attente')->count(),
            ],
        ]);
    }

    public function listStudents(Request $request): JsonResponse
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
                'classe' => $etudiant->classe ? trim($etudiant->classe->nom . ' - ' . $etudiant->classe->niveau) : null,
                'account_status' => $etudiant->user->account_status ?? 'active',
                'parent_nom' => $etudiant->parentEleve->user->nom ?? '',
                'parent_prenom' => $etudiant->parentEleve->user->prenom ?? '',
                'parent_email' => $etudiant->parentEleve->user->email ?? '',
                'parent_phone' => $etudiant->parentEleve->telephone ?? '',
                'parent_cin' => $etudiant->parentEleve->cin ?? '',
                'parent_urgence_phone' => $etudiant->parentEleve->urgence_phone ?? '',
                'country_code' => $etudiant->parentEleve->country_code ?? '+212',
            ];
        });

        return response()->json([
            'students' => $students,
        ]);
    }

    public function createStudent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'date_naissance' => ['required', 'date'],
            'genre' => ['required', 'in:M,F,A'],
            'email' => ['nullable', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->where(fn ($query) => $query->where('role', 'etudiant'))],
            'adresse' => ['required', 'string', 'max:500'],
            'id_classe' => ['nullable', 'integer', 'exists:classes,id_classe'],
            'parent_nom' => ['required', 'string', 'max:255'],
            'parent_prenom' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'parent_phone' => ['required', 'string', 'max:20'],
            'parent_cin' => ['required', 'string', 'max:30'],
            'parent_urgence_phone' => ['nullable', 'string', 'max:30'],
            'country_code' => ['required', 'string', 'max:5'],
        ]);

        $student = $this->persistStudentFromValidated($validated);

        return response()->json([
            'message' => 'Etudiant cree avec succes.',
            'student' => $student,
        ], 201);
    }

    public function importStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'students' => ['required', 'array', 'min:1'],
        ]);

        $rules = [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'date_naissance' => ['required', 'date'],
            'genre' => ['required', 'in:M,F,A'],
            'email' => ['nullable', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->where(fn ($query) => $query->where('role', 'etudiant'))],
            'adresse' => ['required', 'string', 'max:500'],
            'id_classe' => ['nullable', 'integer', 'exists:classes,id_classe'],
            'parent_nom' => ['required', 'string', 'max:255'],
            'parent_prenom' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'parent_phone' => ['required', 'string', 'max:20'],
            'parent_cin' => ['required', 'string', 'max:30'],
            'parent_urgence_phone' => ['nullable', 'string', 'max:30'],
            'country_code' => ['required', 'string', 'max:5'],
        ];

        $imported = 0;
        $errors = [];

        foreach ($validated['students'] as $index => $row) {
            $payload = is_array($row) ? $row : [];
            if (!array_key_exists('country_code', $payload) || !$payload['country_code']) {
                $payload['country_code'] = '+212';
            }

            $validator = Validator::make($payload, $rules);
            if ($validator->fails()) {
                $errors[] = [
                    'ligne' => $index + 1,
                    'errors' => $validator->errors()->toArray(),
                ];
                continue;
            }

            try {
                $this->persistStudentFromValidated($validator->validated());
                $imported++;
            } catch (\Throwable $e) {
                $errors[] = [
                    'ligne' => $index + 1,
                    'errors' => ['general' => [$e->getMessage()]],
                ];
            }
        }

        return response()->json([
            'message' => "Import termine: {$imported} eleve(s) importe(s).",
            'imported' => $imported,
            'failed' => count($errors),
            'errors' => $errors,
        ], $imported > 0 ? 200 : 422);
    }

    private function persistStudentFromValidated(array $validated): User
    {
        return DB::transaction(function () use ($validated) {
            $fallbackParentEmail = 'parent_' . preg_replace('/\D+/', '', (string) $validated['parent_phone']) . '@linkedu.local';
            $parentEmail = $validated['parent_email'] ?? $fallbackParentEmail;
            
            $studentEmail = $validated['email'];
            if (!$studentEmail) {
                $studentEmail = $this->buildStudentEmailFromParent(
                    $parentEmail,
                    $validated['nom'],
                    $validated['prenom']
                );
            }

            $parentUser = User::firstOrCreate(
                ['email' => $parentEmail, 'role' => 'parent_eleve'],
                [
                    'name' => trim($validated['parent_prenom'] . ' ' . $validated['parent_nom']),
                    'nom' => $validated['parent_nom'],
                    'prenom' => $validated['parent_prenom'],
                    'password' => Hash::make('Parent@2026'),
                    'account_status' => 'pending_activation',
                ]
            );

            $parentUser->update([
                'name' => trim($validated['parent_prenom'] . ' ' . $validated['parent_nom']),
                'nom' => $validated['parent_nom'],
                'prenom' => $validated['parent_prenom'],
            ]);

            $parentEleve = ParentEleve::firstOrCreate(
                ['id_parent' => $parentUser->id],
                [
                    'telephone' => $validated['parent_phone'],
                    'cin' => $validated['parent_cin'],
                    'urgence_phone' => $validated['parent_urgence_phone'],
                    'country_code' => $validated['country_code'] ?? '+212',
                ]
            );

            $user = User::create([
                'name' => trim($validated['prenom'] . ' ' . $validated['nom']),
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $studentEmail,
                'password' => Hash::make('Etudiant@2026'),
                'role' => 'etudiant',
                'account_status' => 'pending_activation',
            ]);

            Etudiant::create([
                'id_etudiant' => $user->id,
                'matricule' => 'STU-' . now()->format('YmdHis') . Str::random(3),
                'id_classe' => $validated['id_classe'] ?? null,
                'id_parent' => $parentEleve->id_parent,
                'date_naissance' => $validated['date_naissance'],
                'genre' => $validated['genre'],
                'adresse' => $validated['adresse'],
            ]);

            return $user;
        });
    }

    public function updateStudent(Request $request, int $id): JsonResponse
    {
        $etudiant = Etudiant::with('user', 'parentEleve.user')->findOrFail($id);

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'date_naissance' => ['required', 'date'],
            'genre' => ['required', 'in:M,F,A'],
            'email' => ['nullable', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($etudiant->id_etudiant)->where(fn ($query) => $query->where('role', 'etudiant'))],
            'adresse' => ['required', 'string', 'max:500'],
            'id_classe' => ['nullable', 'integer', 'exists:classes,id_classe'],
            'parent_nom' => ['required', 'string', 'max:255'],
            'parent_prenom' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'parent_phone' => ['required', 'string', 'max:20'],
            'parent_cin' => ['required', 'string', 'max:30'],
            'parent_urgence_phone' => ['nullable', 'string', 'max:30'],
            'country_code' => ['required', 'string', 'max:5'],
        ]);

        DB::transaction(function () use ($etudiant, $validated) {
            // Update parent logic if necessary
            $fallbackParentEmail = $etudiant->parentEleve?->user?->email
                ?? ('parent_' . preg_replace('/\D+/', '', (string) $validated['parent_phone']) . '@linkedu.local');
            $parentEmail = $validated['parent_email'] ?? $fallbackParentEmail;
            $studentEmail = $validated['email']
                ?? $etudiant->user->email
                ?? $this->buildStudentEmailFromParent($parentEmail, $validated['nom'], $validated['prenom']);

            $parentUser = User::firstOrCreate(
                ['email' => $parentEmail, 'role' => 'parent_eleve'],
                [
                    'name' => trim($validated['parent_prenom'] . ' ' . $validated['parent_nom']),
                    'nom' => $validated['parent_nom'],
                    'prenom' => $validated['parent_prenom'],
                    'password' => Hash::make('Parent@2026'),
                    'account_status' => 'pending_activation',
                ]
            );

            $parentUser->update([
                'name' => trim($validated['parent_prenom'] . ' ' . $validated['parent_nom']),
                'nom' => $validated['parent_nom'],
                'prenom' => $validated['parent_prenom'],
            ]);

            $parentEleve = ParentEleve::updateOrCreate(
                ['id_parent' => $parentUser->id],
                [
                    'telephone' => $validated['parent_phone'],
                    'cin' => $validated['parent_cin'],
                    'urgence_phone' => $validated['parent_urgence_phone'],
                    'country_code' => $validated['country_code'] ?? '+212',
                ]
            );

            $etudiant->update([
                'id_classe' => $validated['id_classe'] ?? null,
                'id_parent' => $parentEleve->id_parent,
                'date_naissance' => $validated['date_naissance'],
                'genre' => $validated['genre'],
                'adresse' => $validated['adresse'],
            ]);

            $etudiant->user->update([
                'name' => trim($validated['prenom'] . ' ' . $validated['nom']),
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $studentEmail,
            ]);
        });

        return response()->json(['message' => 'Etudiant mis a jour avec succes.']);
    }

    public function deleteStudent(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Etudiant supprime avec succes.']);
    }

    private function buildStudentEmailFromParent(string $parentEmail, string $nom, string $prenom): string
    {
        $baseAlias = Str::of($prenom . '.' . $nom)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9.]/', '')
            ->trim('.')
            ->value();

        if ($baseAlias === '') {
            $baseAlias = 'eleve';
        }

        $domain = 'linkedu.local';
        $prefix = $baseAlias;

        if (Str::contains($parentEmail, '@')) {
            [$local, $dom] = explode('@', $parentEmail, 2);
            $domain = $dom;
            $prefix = $local . '+eleve.' . $baseAlias;
        }

        $studentEmail = $prefix . '@' . $domain;

        // Try to add a numeric suffix if already exists
        $i = 1;
        while (User::where('email', $studentEmail)->exists()) {
            $studentEmail = $prefix . $i . '@' . $domain;
            $i++;
        }

        return $studentEmail;
    }

    public function listClasses(): JsonResponse
    {
        $classes = DB::table('classes')
            ->leftJoin('etudiants', 'classes.id_classe', '=', 'etudiants.id_classe')
            ->select(
                'classes.id_classe',
                'classes.nom',
                'classes.niveau',
                DB::raw('COUNT(etudiants.id_etudiant) as total_etudiants')
            )
            ->groupBy('classes.id_classe', 'classes.nom', 'classes.niveau')
            ->orderBy('classes.niveau')
            ->orderBy('classes.nom')
            ->get();

        return response()->json(['classes' => $classes]);
    }

    public function createClasse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'niveau' => ['required', 'string', 'max:255'],
        ]);

        $classe = Classe::create($validated);

        return response()->json([
            'message' => 'Classe creee avec succes.',
            'classe' => $classe,
        ], 201);
    }

    public function updateClasse(Request $request, int $id): JsonResponse
    {
        $classe = Classe::findOrFail($id);
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'niveau' => ['required', 'string', 'max:255'],
        ]);

        $classe->update($validated);

        return response()->json(['message' => 'Classe mise a jour avec succes.']);
    }

    public function deleteClasse(int $id): JsonResponse
    {
        $classe = Classe::findOrFail($id);
        $classe->delete();

        return response()->json(['message' => 'Classe supprimee avec succes.']);
    }

    public function listAbsences(Request $request): JsonResponse
    {
        $query = DB::table('absences')
            ->join('etudiants', 'absences.id_etudiant', '=', 'etudiants.id_etudiant')
            ->join('users as etu_users', 'etudiants.id_etudiant', '=', 'etu_users.id')
            ->leftJoin('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->join('professeurs', 'absences.id_professeur', '=', 'professeurs.id_professeur')
            ->join('users as prof_users', 'professeurs.id_professeur', '=', 'prof_users.id')
            ->select(
                'absences.id_absence',
                'absences.date_abs',
                'absences.motif',
                'absences.id_etudiant',
                'absences.id_professeur',
                'etu_users.nom as etu_nom',
                'etu_users.prenom as etu_prenom',
                'classes.nom as classe_nom',
                'classes.niveau as classe_niveau',
                'prof_users.nom as prof_nom',
                'prof_users.prenom as prof_prenom'
            )
            ->orderByDesc('absences.date_abs');

        if ($request->filled('id_classe')) {
            $query->where('classes.id_classe', (int) $request->query('id_classe'));
        }

        return response()->json(['absences' => $query->get()]);
    }

    public function createAbsence(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_abs' => ['required', 'date'],
            'motif' => ['nullable', 'string'],
            'id_etudiant' => ['required', 'integer', 'exists:etudiants,id_etudiant'],
            'id_professeur' => ['nullable', 'integer', 'exists:professeurs,id_professeur'],
        ]);

        $profId = $validated['id_professeur'] ?? Professeur::query()->value('id_professeur');
        if (! $profId) {
            return response()->json([
                'message' => 'Aucun professeur disponible pour rattacher cette absence.',
            ], 422);
        }

        $absence = Absence::create([
            'date_abs' => $validated['date_abs'],
            'motif' => $validated['motif'] ?? null,
            'id_etudiant' => $validated['id_etudiant'],
            'id_professeur' => $profId,
        ]);

        return response()->json([
            'message' => 'Absence ajoutee avec succes.',
            'absence' => $absence,
        ], 201);
    }

    public function updateAbsence(Request $request, int $id): JsonResponse
    {
        $absence = Absence::findOrFail($id);

        $validated = $request->validate([
            'date_abs' => ['required', 'date'],
            'motif' => ['nullable', 'string'],
            'id_professeur' => ['nullable', 'integer', 'exists:professeurs,id_professeur'],
        ]);

        $absence->update([
            'date_abs' => $validated['date_abs'],
            'motif' => $validated['motif'] ?? null,
            'id_professeur' => $validated['id_professeur'] ?? $absence->id_professeur,
        ]);

        return response()->json(['message' => 'Absence mise a jour avec succes.']);
    }

    public function deleteAbsence(int $id): JsonResponse
    {
        $absence = Absence::findOrFail($id);
        $absence->delete();

        return response()->json(['message' => 'Absence supprimee avec succes.']);
    }

    public function listAnnonces(): JsonResponse
    {
        $annonces = DB::table('annonces')
            ->join('users', 'annonces.id_user', '=', 'users.id')
            ->select(
                'annonces.id_annonce',
                'annonces.titre',
                'annonces.contenu',
                'annonces.cible',
                'annonces.date_publication',
                'annonces.created_at',
                'annonces.photo_path',
                'users.nom as auteur_nom',
                'users.prenom as auteur_prenom'
            )
            ->orderByDesc('annonces.created_at')
            ->get()
            ->map(function ($annonce) {
                $annonce->photo_url = $annonce->photo_path
                    ? Storage::disk('public')->url($annonce->photo_path)
                    : null;
                return $annonce;
            });

        return response()->json(['annonces' => $annonces]);
    }

    public function createAnnonce(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'titre' => ['required', 'string', 'max:255'],
                'contenu' => ['required', 'string'],
                'cible' => ['nullable', 'string'],
                'statut' => ['nullable', 'string'],
                'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);

            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Utilisateur non authentifié'], 401);
            }

            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('annonces', 'public');
            }

            $annonce = Annonce::create([
                'titre' => $validated['titre'],
                'contenu' => $validated['contenu'],
                'cible' => $validated['cible'] ?? 'Tous',
                'date_publication' => now(),
                'id_user' => $user->id,
                'photo_path' => $photoPath,
            ]);

            $annonce->photo_url = $annonce->photo_path
                ? Storage::disk('public')->url($annonce->photo_path)
                : null;

            return response()->json([
                'message' => 'Annonce publiee avec succes.',
                'annonce' => $annonce,
                'author' => $user->nom . ' ' . $user->prenom
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateAnnonce(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'cible' => ['nullable', 'string'],
            'statut' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $annonce = Annonce::findOrFail($id);
        $updateData = [
            'titre' => $validated['titre'],
            'contenu' => $validated['contenu'],
            'cible' => $validated['cible'] ?? 'Tous',
        ];

        if ($request->hasFile('photo')) {
            if ($annonce->photo_path && Storage::disk('public')->exists($annonce->photo_path)) {
                Storage::disk('public')->delete($annonce->photo_path);
            }
            $updateData['photo_path'] = $request->file('photo')->store('annonces', 'public');
        }

        $annonce->update($updateData);
        $annonce->photo_url = $annonce->photo_path
            ? Storage::disk('public')->url($annonce->photo_path)
            : null;

        return response()->json([
            'message' => 'Annonce mise a jour avec succes.',
            'annonce' => $annonce,
        ]);
    }

    public function deleteAnnonce(int $id): JsonResponse
    {
        $annonce = Annonce::findOrFail($id);
        if ($annonce->photo_path && Storage::disk('public')->exists($annonce->photo_path)) {
            Storage::disk('public')->delete($annonce->photo_path);
        }
        $annonce->delete();

        return response()->json(['message' => 'Annonce supprimee avec succes.']);
    }

    public function listReclamations(): JsonResponse
    {
        $hasProfesseurColumn = Schema::hasColumn('reclamations', 'id_professeur');
        $hasSecretaireColumn = Schema::hasColumn('reclamations', 'id_secretaire');
        $hasCibleColumn = Schema::hasColumn('reclamations', 'cible');

        $query = DB::table('reclamations')
            ->leftJoin('parents', 'reclamations.id_parent', '=', 'parents.id_parent')
            ->leftJoin('users as parent_user', 'parents.id_parent', '=', 'parent_user.id')
            ->leftJoin('etudiants', 'reclamations.id_etudiant', '=', 'etudiants.id_etudiant')
            ->leftJoin('users as etu_user', 'etudiants.id_etudiant', '=', 'etu_user.id')
            ->select(
                'reclamations.id_reclamation',
                'reclamations.sujet',
                'reclamations.message',
                'reclamations.statut',
                'reclamations.date_soumission',
                'reclamations.id_parent',
                'reclamations.id_etudiant',
                DB::raw("CONCAT(COALESCE(parent_user.prenom, ''), ' ', COALESCE(parent_user.nom, '')) as parent_nom_complet"),
                DB::raw('parent_user.email as parent_email'),
                DB::raw("CONCAT(COALESCE(etu_user.prenom, ''), ' ', COALESCE(etu_user.nom, '')) as etudiant_nom_complet")
            );

        if ($hasProfesseurColumn) {
            $query->leftJoin('professeurs', 'reclamations.id_professeur', '=', 'professeurs.id_professeur')
                ->leftJoin('users as prof_user', 'professeurs.id_professeur', '=', 'prof_user.id')
                ->addSelect(
                    'reclamations.id_professeur',
                    DB::raw("CONCAT(COALESCE(prof_user.prenom, ''), ' ', COALESCE(prof_user.nom, '')) as professeur_nom_complet"),
                    DB::raw('prof_user.email as professeur_email')
                );
        } else {
            $query->addSelect(
                DB::raw('NULL as id_professeur'),
                DB::raw("'' as professeur_nom_complet"),
                DB::raw("'' as professeur_email")
            );
        }

        if ($hasSecretaireColumn) {
            $query->leftJoin('secretaires', 'reclamations.id_secretaire', '=', 'secretaires.id_secretaire')
                ->leftJoin('users as sec_user', 'secretaires.id_secretaire', '=', 'sec_user.id')
                ->addSelect(
                    'reclamations.id_secretaire',
                    DB::raw("CONCAT(COALESCE(sec_user.prenom, ''), ' ', COALESCE(sec_user.nom, '')) as secretaire_nom_complet"),
                    DB::raw('sec_user.email as secretaire_email')
                );
        } else {
            $query->addSelect(
                DB::raw('NULL as id_secretaire'),
                DB::raw("'' as secretaire_nom_complet"),
                DB::raw("'' as secretaire_email")
            );
        }

        if ($hasCibleColumn) {
            $query->addSelect('reclamations.cible');
        } else {
            $query->addSelect(DB::raw("'parent' as cible"));
        }

        $reclamations = $query
            ->orderByDesc('reclamations.date_soumission')
            ->get()
            ->map(function ($rec) {
                $cible = mb_strtolower(trim((string) ($rec->cible ?? 'parent')));
                if ($cible === 'directeur') {
                    $cible = 'professeur';
                }

                $cibleLabel = 'Parent';
                $destinataireEmail = trim((string) ($rec->parent_email ?? ''));

                if ($cible === 'professeur') {
                    $cibleLabel = trim((string) ($rec->professeur_nom_complet ?? '')) ?: 'Professeur';
                    $destinataireEmail = trim((string) ($rec->professeur_email ?? ''));
                } elseif ($cible === 'secretaire') {
                    $cibleLabel = trim((string) ($rec->secretaire_nom_complet ?? '')) ?: 'Secretaire';
                    $destinataireEmail = trim((string) ($rec->secretaire_email ?? ''));
                } else {
                    $studentName = trim((string) ($rec->etudiant_nom_complet ?? ''));
                    $parentName = trim((string) ($rec->parent_nom_complet ?? ''));
                    $cibleLabel = $studentName !== '' ? $studentName : ($parentName !== '' ? $parentName : 'Parent');
                }

                return [
                    'id_reclamation' => $rec->id_reclamation,
                    'sujet' => $rec->sujet,
                    'message' => $rec->message,
                    'statut' => $rec->statut,
                    'date_soumission' => $rec->date_soumission,
                    'id_parent' => $rec->id_parent,
                    'id_etudiant' => $rec->id_etudiant,
                    'id_professeur' => $rec->id_professeur,
                    'id_secretaire' => $rec->id_secretaire,
                    'cible' => $cible,
                    'cible_label' => $cibleLabel,
                    'destinataire_email' => $destinataireEmail,
                    'parent_nom' => trim((string) ($rec->parent_nom_complet ?? '')),
                    'parent_prenom' => '',
                    'parent_email' => $rec->parent_email,
                ];
            })
            ->values();

        return response()->json(['reclamations' => $reclamations]);
    }

    public function listProfesseurs(): JsonResponse
    {
        $professeurs = Professeur::with('user')
            ->get()
            ->map(function ($professeur) {
                return [
                    'id_professeur' => $professeur->id_professeur,
                    'nom' => $professeur->user->nom ?? '',
                    'prenom' => $professeur->user->prenom ?? '',
                    'email' => $professeur->user->email ?? '',
                ];
            })
            ->values();

        return response()->json(['professeurs' => $professeurs]);
    }

    public function listSecretaires(): JsonResponse
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

    public function updateReclamationStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => ['required', 'in:en_attente,en_cours,resolue,rejetee'],
        ]);

        $reclamation = Reclamation::findOrFail($id);
        $reclamation->update(['statut' => $validated['statut']]);

        return response()->json(['message' => 'Statut de reclamation mis a jour avec succes.']);
    }

    public function updateReclamation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'sujet' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $reclamation = Reclamation::findOrFail($id);
        $reclamation->update([
            'sujet' => $validated['sujet'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Reclamation mise a jour avec succes.',
            'reclamation' => $reclamation,
        ]);
    }

    public function deleteReclamation(int $id): JsonResponse
    {
        $reclamation = Reclamation::findOrFail($id);
        $reclamation->delete();

        return response()->json(['message' => 'Reclamation supprimee avec succes.']);
    }

    public function listParents(): JsonResponse
    {
        $parents = ParentEleve::with('user')
            ->get()
            ->map(function ($p) {
                return [
                    'id_parent' => $p->id_parent,
                    'nom' => $p->user->nom ?? '',
                    'prenom' => $p->user->prenom ?? '',
                    'email' => $p->user->email ?? '',
                    'telephone' => $p->telephone,
                ];
            });

        return response()->json(['parents' => $parents]);
    }

    public function createReclamation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cible' => ['nullable', 'string', 'in:parent,professeur,secretaire,directeur'],
            'id_etudiant' => ['nullable', 'integer', 'exists:etudiants,id_etudiant'],
            'id_parent' => ['nullable', 'integer', 'exists:parents,id_parent'],
            'id_professeur' => ['nullable', 'integer', 'exists:professeurs,id_professeur'],
            'id_secretaire' => ['nullable', 'integer', 'exists:secretaires,id_secretaire'],
            'sujet' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $hasProfesseurColumn = Schema::hasColumn('reclamations', 'id_professeur');
        $hasSecretaireColumn = Schema::hasColumn('reclamations', 'id_secretaire');
        $hasCibleColumn = Schema::hasColumn('reclamations', 'cible');

        $cible = mb_strtolower(trim((string) ($validated['cible'] ?? 'parent')));
        if ($cible === 'directeur') {
            $cible = 'professeur';
        }

        $idParent = $validated['id_parent'] ?? null;
        $idEtudiant = $validated['id_etudiant'] ?? null;
        $idProfesseur = $validated['id_professeur'] ?? null;
        $idSecretaire = $validated['id_secretaire'] ?? null;
        $cibleLabel = null;

        if ($cible === 'parent') {
            if (! $idParent && ! empty($idEtudiant)) {
                $etudiant = Etudiant::find($idEtudiant);
                if (! $etudiant || ! $etudiant->id_parent) {
                    return response()->json([
                        'message' => 'Aucun parent lie a cet etudiant.',
                    ], 422);
                }
                $idParent = $etudiant->id_parent;
                $idEtudiant = $etudiant->id_etudiant;
            }

            if (! $idParent) {
                return response()->json([
                    'message' => 'Selectionnez un eleve valide pour cibler un parent.',
                ], 422);
            }

            $studentName = DB::table('etudiants')
                ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
                ->where('etudiants.id_etudiant', $idEtudiant)
                ->value(DB::raw("CONCAT(COALESCE(users.prenom, ''), ' ', COALESCE(users.nom, ''))"));

            $cibleLabel = trim((string) $studentName);
        }

        if ($cible === 'professeur') {
            if (! $idProfesseur) {
                return response()->json([
                    'message' => 'Selectionnez un professeur cible.',
                ], 422);
            }

            $profName = DB::table('professeurs')
                ->join('users', 'professeurs.id_professeur', '=', 'users.id')
                ->where('professeurs.id_professeur', $idProfesseur)
                ->value(DB::raw("CONCAT(COALESCE(users.prenom, ''), ' ', COALESCE(users.nom, ''))"));

            $cibleLabel = trim((string) $profName);
        }

        if ($cible === 'secretaire') {
            if (! $idSecretaire) {
                return response()->json([
                    'message' => 'Selectionnez une secretaire ciblee.',
                ], 422);
            }

            $secName = DB::table('secretaires')
                ->join('users', 'secretaires.id_secretaire', '=', 'users.id')
                ->where('secretaires.id_secretaire', $idSecretaire)
                ->value(DB::raw("CONCAT(COALESCE(users.prenom, ''), ' ', COALESCE(users.nom, ''))"));

            $cibleLabel = trim((string) $secName);
        }

        // Compatibilite schema legacy: id_parent peut rester obligatoire.
        if (! $idParent) {
            $idParent = DB::table('parents')->value('id_parent');
        }

        if (! $idParent) {
            return response()->json([
                'message' => 'Aucun parent disponible pour l enregistrement de la reclamation.',
            ], 422);
        }

        $payload = [
            'id_parent' => $idParent,
            'sujet' => $validated['sujet'],
            'message' => $validated['message'],
            'statut' => 'en_attente',
            'date_soumission' => now(),
            'date_envoi' => now(),
        ];

        if ($idEtudiant) {
            $payload['id_etudiant'] = $idEtudiant;
        }

        if ($hasProfesseurColumn) {
            $payload['id_professeur'] = $cible === 'professeur' ? $idProfesseur : null;
        }

        if ($hasSecretaireColumn) {
            $payload['id_secretaire'] = $cible === 'secretaire' ? $idSecretaire : null;
        }

        if ($hasCibleColumn) {
            $payload['cible'] = $cible;
        } else {
            $prefix = '[CIBLE:' . $cible . ($cibleLabel ? ':' . $cibleLabel : '') . '] ';
            $payload['message'] = $prefix . $payload['message'];
        }

        $reclamation = Reclamation::create($payload);

        $targetMessage = match ($cible) {
            'professeur' => 'Reclamation envoyee au professeur avec succes.',
            'secretaire' => 'Reclamation envoyee a la secretaire avec succes.',
            default => 'Reclamation envoyee au parent avec succes.',
        };

        return response()->json([
            'message' => $targetMessage,
            'reclamation' => [
                'id_reclamation' => $reclamation->id_reclamation,
                'sujet' => $reclamation->sujet,
                'message' => $reclamation->message,
                'statut' => $reclamation->statut,
                'date_soumission' => $reclamation->date_soumission,
                'id_parent' => $reclamation->id_parent,
                'id_etudiant' => $reclamation->id_etudiant,
                'id_professeur' => $reclamation->id_professeur ?? null,
                'id_secretaire' => $reclamation->id_secretaire ?? null,
                'cible' => $reclamation->cible ?? $cible,
                'cible_label' => $cibleLabel,
            ],
        ], 201);
    }
}


