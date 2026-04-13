<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Etudiant;
use App\Models\ParentEleve;
use App\Models\Directeur;
use App\Models\Professeur;
use App\Models\Classe;
use App\Models\Matiere;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminDashboardController extends Controller
{
    public function getStats(Request $request)
    {
        if (!$request->user() || !in_array($request->user()->role, ['admin', 'directeur'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $currentDate = Carbon::now();
        $currentYear = $currentDate->year;
        $isAfterSchoolStart = $currentDate->month >= 9;
        $startYear = $isAfterSchoolStart ? $currentYear : $currentYear - 1;
        $endYear = $startYear + 1;

        $totalStudents = Etudiant::count();
        $totalClasses = Classe::count();
        $totalProfesseurs = User::where('role', 'professeur')->count();
        $totalMatieres = Matiere::count();
        $anneeScolaireActuelle = $startYear . '-' . $endYear;

        return response()->json([
            'totalStudents' => $totalStudents,
            'totalClasses' => $totalClasses,
            'totalProfesseurs' => $totalProfesseurs,
            'totalMatieres' => $totalMatieres,
            'anneeScolaireActuelle' => $anneeScolaireActuelle
        ]);
    }

    public function createUser(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasProfesseurNiveau = Schema::hasColumn('professeurs', 'niveau_enseignement');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->where(fn ($query) => $query->where('role', $request->input('role')))
            ],
            'role' => 'required|string|in:secretaire,directeur,professeur',
            'telephone' => 'nullable|string|max:30',
            'matiere_enseignement' => 'nullable|string|max:255',
            'matieres_enseignement' => 'nullable|array',
            'matieres_enseignement.*' => 'string|max:255',
            'niveau_enseignement' => ['required_if:role,professeur', 'string', Rule::in(['maternelle', 'primaire', 'college', 'lycee'])],
        ]);

        try {
            DB::beginTransaction();

            [$prenom, $nom] = $this->splitFullName((string) $validated['name']);
            $generatedPassword = $this->generateRandomPassword(12);

            $hasUserAccountStatus = Schema::hasColumn('users', 'account_status');
            $hasUserActivatedAt = Schema::hasColumn('users', 'activated_at');

            $userPayload = [
                'name' => $validated['name'],
                'prenom' => $prenom,
                'nom' => $nom,
                'email' => $validated['email'],
                'password' => bcrypt($generatedPassword),
                'role' => $validated['role'],
            ];

            if ($hasUserAccountStatus) {
                $userPayload['account_status'] = 'active';
            }

            if ($hasUserActivatedAt) {
                $userPayload['activated_at'] = now();
            }

            $user = User::create($userPayload);

            if ($validated['role'] === 'directeur') {
                Directeur::create([
                    'id_directeur' => $user->id,
                    'telephone' => $validated['telephone'] ?? null,
                ]);
            }

            if ($validated['role'] === 'professeur') {
                $teachingSubjects = $this->buildTeachingSubjects($validated);

                $hasProfesseurMatiere = Schema::hasColumn('professeurs', 'matiere_enseignement');
                $hasProfesseurMatieres = Schema::hasColumn('professeurs', 'matieres_enseignement');
                $hasProfesseurNiveau = Schema::hasColumn('professeurs', 'niveau_enseignement');

                $professeurPayload = [
                    'id_professeur' => $user->id,
                    'specialite' => $teachingSubjects[0] ?? 'Non definie',
                    'telephone' => $validated['telephone'] ?? null,
                ];

                if ($hasProfesseurMatiere) {
                    $professeurPayload['matiere_enseignement'] = $teachingSubjects[0] ?? null;
                }

                if ($hasProfesseurMatieres) {
                    $professeurPayload['matieres_enseignement'] = $teachingSubjects;
                }

                if ($hasProfesseurNiveau) {
                    $professeurPayload['niveau_enseignement'] = $validated['niveau_enseignement'] ?? null;
                }

                Professeur::create($professeurPayload);
            }

            DB::commit();

            $mailWarnings = [];
            try {
                if (! $user->email) {
                    throw new \RuntimeException('Email cadre manquant.');
                }

                $roleLabel = match ($validated['role']) {
                    'secretaire' => 'Secretaire',
                    'professeur' => 'Professeur',
                    'directeur' => 'Directeur',
                    default => ucfirst((string) $validated['role']),
                };

                $mailHtml = $this->buildAccountCreationEmailHtml([
                    'role_label' => $roleLabel,
                    'name' => (string) ($user->name ?? ''),
                    'nom' => (string) ($user->nom ?? ''),
                    'prenom' => (string) ($user->prenom ?? ''),
                    'email' => (string) ($user->email ?? ''),
                    'password' => $generatedPassword,
                    'login_url' => $this->resolveFrontendLoginUrl(),
                ]);

                Mail::send([], [], function ($message) use ($user, $roleLabel, $mailHtml) {
                    $message->to($user->email)
                        ->subject("Identifiants {$roleLabel} - LinkEdu")
                        ->from(config('mail.from.address'), config('mail.from.name'));

                    $message->html($mailHtml);
                });
            } catch (\Throwable $e) {
                $mailWarnings[] = 'Email cadre non envoye: ' . $e->getMessage();
            }

            return response()->json([
                'message' => 'Utilisateur créé avec succès !',
                'user' => $user,
                'warnings' => $mailWarnings,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
        }
    }

    public function updateUser(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $hasProfesseurNiveau = Schema::hasColumn('professeurs', 'niveau_enseignement');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->ignore($id)->where(fn ($query) => $query->where('role', $request->input('role')))
            ],
            'role' => 'required|string|in:etudiant,parent,secretaire,admin,directeur,professeur',
            'password' => 'nullable|string|min:6',
            'id_classe' => 'required_if:role,etudiant|nullable|integer|exists:classes,id_classe',
            'id_parent' => 'required_if:role,etudiant|nullable|integer|exists:parents,id_parent',
            'telephone' => 'nullable|string|max:30',
            'matiere_enseignement' => 'nullable|string|max:255',
            'matieres_enseignement' => 'nullable|array',
            'matieres_enseignement.*' => 'string|max:255',
            'niveau_enseignement' => ['required_if:role,professeur', 'string', Rule::in(['maternelle', 'primaire', 'college', 'lycee'])],
        ]);

        try {
            DB::beginTransaction();

            [$prenom, $nom] = $this->splitFullName((string) $validated['name']);

            $user->name = $validated['name'];
            $user->prenom = $prenom;
            $user->nom = $nom;
            $user->email = $validated['email'];
            $user->role = $validated['role'];
            if (!empty($validated['password'])) {
                $user->password = bcrypt($validated['password']);
            }
            $user->save();

            if ($validated['role'] === 'etudiant') {
                $etudiant = Etudiant::where('id_etudiant', $user->id)->first();
                if ($etudiant) {
                    $etudiant->id_classe = $validated['id_classe'];
                    $etudiant->id_parent = $validated['id_parent'];
                    $etudiant->save();
                } else {
                    Etudiant::create([
                        'id_etudiant' => $user->id,
                        'matricule' => 'MAT-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                        'id_classe' => $validated['id_classe'],
                        'id_parent' => $validated['id_parent'],
                    ]);
                }
            } else {
                Etudiant::where('id_etudiant', $user->id)->delete();
            }

            if ($validated['role'] === 'parent') {
                $parentEleve = ParentEleve::where('id_parent', $user->id)->first();
                if ($parentEleve) {
                    $parentEleve->telephone = $validated['telephone'] ?? null;
                    $parentEleve->save();
                } else {
                    ParentEleve::create([
                        'id_parent' => $user->id,
                        'telephone' => $validated['telephone'] ?? null,
                    ]);
                }
            } else {
                ParentEleve::where('id_parent', $user->id)->delete();
            }

            if ($validated['role'] === 'directeur') {
                $directeur = Directeur::where('id_directeur', $user->id)->first();
                if ($directeur) {
                    $directeur->telephone = $validated['telephone'] ?? null;
                    $directeur->save();
                } else {
                    Directeur::create([
                        'id_directeur' => $user->id,
                        'telephone' => $validated['telephone'] ?? null,
                    ]);
                }
            } else {
                Directeur::where('id_directeur', $user->id)->delete();
            }

            if ($validated['role'] === 'professeur') {
                $teachingSubjects = $this->buildTeachingSubjects($validated);
                if (empty($teachingSubjects)) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Veuillez selectionner au moins une matiere pour le professeur.',
                    ], 422);
                }

                $professeur = Professeur::where('id_professeur', $user->id)->first();
                if ($professeur) {
                    $professeur->specialite = $teachingSubjects[0] ?? $professeur->specialite;
                    $professeur->telephone = $validated['telephone'] ?? null;
                    $professeur->matiere_enseignement = $teachingSubjects[0] ?? null;
                    $professeur->matieres_enseignement = $teachingSubjects;
                    $professeur->niveau_enseignement = $validated['niveau_enseignement'] ?? null;
                    $professeur->save();
                } else {
                    Professeur::create(array_merge([
                        'id_professeur' => $user->id,
                    ], $professeurPayload));
                }
            } else {
                Professeur::where('id_professeur', $user->id)->delete();
            }

            DB::commit();

            return response()->json([
                'message' => 'Utilisateur mis à jour avec succès !',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()], 500);
        }
    }

    public function deleteUser(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            DB::beginTransaction();
            DB::table('classe_professeur_assignments')->where('id_professeur', $id)->delete();
            Professeur::where('id_professeur', $id)->delete();
            Etudiant::where('id_etudiant', $id)->delete();
            User::destroy($id);
            DB::commit();

            return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la suppression: ' . $e->getMessage()], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->ignore($user->id)->where(fn ($query) => $query->where('role', $user->role))
            ],
            'password' => 'nullable|string|min:6',
        ]);

        try {
            $user->name = $validated['name'];
            $user->email = $validated['email'];

            if (!empty($validated['password'])) {
                $user->password = bcrypt($validated['password']);
            }

            $user->save();

            return response()->json([
                'message' => 'Profil mis à jour avec succès.',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()], 500);
        }
    }

    public function getUsers(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasUserAccountStatus = Schema::hasColumn('users', 'account_status');
        $hasUserActivatedAt = Schema::hasColumn('users', 'activated_at');
        $hasProfesseurMatiere = Schema::hasColumn('professeurs', 'matiere_enseignement');
        $hasProfesseurMatieres = Schema::hasColumn('professeurs', 'matieres_enseignement');
        $hasProfesseurNiveau = Schema::hasColumn('professeurs', 'niveau_enseignement');

        $userSelect = [
            'users.id',
            'users.name',
            'users.nom',
            'users.prenom',
            'users.email',
            'users.role',
            'users.created_at',
            'etudiants.id_classe',
            'etudiants.id_parent',
            DB::raw("TRIM(CONCAT(COALESCE(classes.nom, ''), CASE WHEN classes.niveau IS NOT NULL AND classes.niveau <> '' THEN CONCAT(' - ', classes.niveau) ELSE '' END)) as classe"),
            'parent_user.email as parent_email',
        ];

        $userSelect[] = $hasProfesseurMatiere
            ? 'own_professeur.matiere_enseignement'
            : DB::raw('NULL as matiere_enseignement');

        $userSelect[] = $hasProfesseurMatieres
            ? 'own_professeur.matieres_enseignement'
            : DB::raw('NULL as matieres_enseignement');

        $userSelect[] = $hasProfesseurNiveau
            ? 'own_professeur.niveau_enseignement'
            : DB::raw('NULL as niveau_enseignement');

        $userSelect[] = $hasUserAccountStatus
            ? 'users.account_status'
            : DB::raw("'active' as account_status");

        $userSelect[] = $hasUserActivatedAt
            ? 'users.activated_at'
            : DB::raw('NULL as activated_at');
        
        $usersQuery = User::select($userSelect)
            ->leftJoin('etudiants', 'users.id', '=', 'etudiants.id_etudiant')
            ->leftJoin('classes', 'etudiants.id_classe', '=', 'classes.id_classe')
            ->leftJoin('parents as own_parent', 'users.id', '=', 'own_parent.id_parent')
            ->leftJoin('parents as linked_parent', 'etudiants.id_parent', '=', 'linked_parent.id_parent')
            ->leftJoin('users as parent_user', 'linked_parent.id_parent', '=', 'parent_user.id')
            ->leftJoin('professeurs as own_professeur', 'users.id', '=', 'own_professeur.id_professeur');

        if (Schema::hasColumn('directeurs', 'telephone')) {
            $usersQuery = $usersQuery
                ->leftJoin('directeurs as own_directeur', 'users.id', '=', 'own_directeur.id_directeur')
                ->addSelect(DB::raw('COALESCE(linked_parent.telephone, own_parent.telephone, own_directeur.telephone, own_professeur.telephone) as telephone'));
        } else {
            $usersQuery = $usersQuery
                ->addSelect(DB::raw('COALESCE(linked_parent.telephone, own_parent.telephone, own_professeur.telephone) as telephone'));
        }

        $users = $usersQuery
            ->orderBy('users.created_at', 'desc')
            ->get();

        $users = $users->map(function ($user) {
            $subjects = $this->normalizeTeachingSubjects($user->matieres_enseignement, $user->matiere_enseignement);
            $user->matieres_enseignement = $subjects;
            if (!empty($subjects) && empty($user->matiere_enseignement)) {
                $user->matiere_enseignement = $subjects[0];
            }

            return $user;
        });

        return response()->json($users);
    }

    public function activateUser(Request $request, int $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->role !== 'etudiant') {
            return response()->json([
                'message' => 'Seul un compte étudiant peut être activé depuis ce flux.',
            ], 422);
        }

        $student = Etudiant::with(['user', 'parentEleve.user'])->find($user->id);
        if (! $student) {
            return response()->json(['message' => 'Profil etudiant introuvable.'], 404);
        }

        $studentUser = $student->user;
        $parentUser = $student->parentEleve?->user;

        if (! $studentUser || ! $parentUser) {
            return response()->json([
                'message' => 'Etudiant ou parent associe introuvable. Verifiez l inscription.',
            ], 422);
        }

        $studentPassword = $this->buildStudentPassword($studentUser->prenom ?: $studentUser->nom ?: $studentUser->name, $student->date_naissance);
        $parentCinRaw = (string) ($student->parentEleve?->cin ?? '');
        $parentPassword = Str::of($parentCinRaw)
            ->upper()
            ->replaceMatches('/\s+/', '')
            ->value();

        $hasUserAccountStatus = Schema::hasColumn('users', 'account_status');
        $hasUserActivatedAt = Schema::hasColumn('users', 'activated_at');

        if ($parentPassword === '') {
            $parentPassword = $this->generateRandomPassword(12);
        }

        DB::transaction(function () use ($studentUser, $parentUser, $studentPassword, $parentPassword, $hasUserAccountStatus, $hasUserActivatedAt) {
            $studentUpdatePayload = [
                'password' => Hash::make($studentPassword),
            ];

            $parentUpdatePayload = [
                'password' => Hash::make($parentPassword),
            ];

            if ($hasUserAccountStatus) {
                $studentUpdatePayload['account_status'] = 'active';
                $parentUpdatePayload['account_status'] = 'active';
            }

            if ($hasUserActivatedAt) {
                $studentUpdatePayload['activated_at'] = now();
                $parentUpdatePayload['activated_at'] = now();
            }

            $studentUser->update($studentUpdatePayload);
            $parentUser->update($parentUpdatePayload);
        });

        $studentFullName = trim(($studentUser->prenom ?? '') . ' ' . ($studentUser->nom ?? ''));
        $parentFullName = trim(($parentUser->prenom ?? '') . ' ' . ($parentUser->nom ?? ''));

        $mailWarnings = [];

        try {
            if (! $studentUser->email) {
                throw new \RuntimeException('Email eleve manquant.');
            }

            $studentMailBody = "Bonjour {$studentFullName},\n\n"
                . "Votre compte LinkEdu a été activé.\n"
                . "Email: {$studentUser->email}\n"
                . "Mot de passe: {$studentPassword}\n\n"
                . "Lien de connexion: " . (config('app.frontend_url') ?: 'http://localhost:5173') . "/login\n\n";

            Mail::raw(
                $studentMailBody,
                function ($message) use ($studentUser) {
                    $message->to($studentUser->email)
                        ->subject('Activation compte - LinkEdu')
                        ->from(config('mail.from.address'), config('mail.from.name'));
                }
            );
        } catch (\Throwable $e) {
            $mailWarnings[] = 'Email non envoyé: ' . $e->getMessage();
        }

        try {
            if (! $parentUser->email) {
                throw new \RuntimeException('Email parent manquant.');
            }

            $parentMailBody = "Bonjour {$parentFullName},\n\n"
                . "Votre compte LinkEdu a été activé.\n"
                . "Email: {$parentUser->email}\n"
                . "Mot de passe: {$parentPassword}\n\n"
                . "Lien de connexion: " . (config('app.frontend_url') ?: 'http://localhost:5173') . "/login\n\n";

            Mail::raw(
                $parentMailBody,
                function ($message) use ($parentUser) {
                    $message->to($parentUser->email)
                        ->subject('Activation compte - LinkEdu')
                        ->from(config('mail.from.address'), config('mail.from.name'));
                }
            );
        } catch (\Throwable $e) {
            $mailWarnings[] = 'Email non envoyé: ' . $e->getMessage();
        }

        return response()->json([
            'message' => 'Compte activé avec succès. Les identifiants ont été préparés.',
            'warnings' => $mailWarnings,
        ]);
    }

    public function deactivateUser(Request $request, int $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->role !== 'etudiant') {
            return response()->json([
                'message' => 'Seul un compte étudiant peut être désactivé depuis ce flux.',
            ], 422);
        }

        $student = Etudiant::with(['user', 'parentEleve.user'])->find($user->id);
        if (! $student) {
            return response()->json(['message' => 'Profil étudiant introuvable.'], 404);
        }

        $studentUser = $student->user;
        $parentUser = $student->parentEleve?->user;

        if (! $studentUser || ! $parentUser) {
            return response()->json([
                'message' => 'Étudiant ou parent associé introuvable. Vérifiez l\'inscription.',
            ], 422);
        }

        $hasUserAccountStatus = Schema::hasColumn('users', 'account_status');
        $hasUserActivatedAt = Schema::hasColumn('users', 'activated_at');

        DB::transaction(function () use ($studentUser, $parentUser, $hasUserAccountStatus, $hasUserActivatedAt) {
            $studentUpdatePayload = [];
            $parentUpdatePayload = [];

            if ($hasUserAccountStatus) {
                $studentUpdatePayload['account_status'] = 'pending_activation';
                $parentUpdatePayload['account_status'] = 'pending_activation';
            }

            if ($hasUserActivatedAt) {
                $studentUpdatePayload['activated_at'] = null;
                $parentUpdatePayload['activated_at'] = null;
            }

            if (!empty($studentUpdatePayload)) {
                $studentUser->update($studentUpdatePayload);
            }

            if (!empty($parentUpdatePayload)) {
                $parentUser->update($parentUpdatePayload);
            }
        });

        return response()->json([
            'message' => 'Compte désactivé avec succès.',
        ]);
    }

    private function buildStudentPassword(?string $sourceName, ?string $dateNaissance): string
    {
        $namePart = Str::of((string) $sourceName)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]/', '')
            ->value();

        if ($namePart === '') {
            $namePart = 'eleve';
        }

        if (! $dateNaissance) {
            return $namePart . $this->generateRandomPassword(4);
        }

        try {
            $datePart = Carbon::parse($dateNaissance)->format('dmY');
        } catch (\Throwable $e) {
            $datePart = $this->generateRandomPassword(8);
        }

        return $namePart . $datePart;
    }

    private function buildTeachingSubjects(array $validated): array
    {
        $subjects = collect($validated['matieres_enseignement'] ?? [])
            ->map(fn ($subject) => trim((string) $subject))
            ->filter()
            ->unique()
            ->values();

        if ($subjects->isEmpty() && !empty($validated['matiere_enseignement'])) {
            $subjects = collect([(string) $validated['matiere_enseignement']])
                ->map(fn ($subject) => trim($subject))
                ->filter()
                ->unique()
                ->values();
        }

        return $subjects->all();
    }

    private function normalizeTeachingSubjects(mixed $rawSubjects, mixed $fallbackSubject = null): array
    {
        $subjects = [];

        if (is_string($rawSubjects) && trim($rawSubjects) !== '') {
            $decoded = json_decode($rawSubjects, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $subjects = $decoded;
            }
        } elseif (is_array($rawSubjects)) {
            $subjects = $rawSubjects;
        }

        if (empty($subjects) && is_string($fallbackSubject) && trim($fallbackSubject) !== '') {
            $subjects = [$fallbackSubject];
        }

        return collect($subjects)
            ->map(fn ($subject) => trim((string) $subject))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

        private function splitFullName(string $fullName): array
        {
                $clean = trim(preg_replace('/\s+/', ' ', $fullName) ?? '');
                if ($clean === '') {
                        return ['', ''];
                }

                $parts = preg_split('/\s+/', $clean) ?: [];
                $prenom = (string) ($parts[0] ?? '');
                $nom = trim(implode(' ', array_slice($parts, 1)));

                if ($nom === '') {
                        $nom = $prenom;
                }

                return [$prenom, $nom];
        }

        private function resolveFrontendLoginUrl(): string
        {
                $frontend = rtrim((string) (env('FRONTEND_URL') ?: 'http://localhost:5173'), '/');

                return $frontend . '/login';
        }

        private function buildAccountCreationEmailHtml(array $data): string
        {
                $roleLabel = e((string) ($data['role_label'] ?? 'Utilisateur'));
                $name = e((string) ($data['name'] ?? ''));
                $nom = e((string) ($data['nom'] ?? ''));
                $prenom = e((string) ($data['prenom'] ?? ''));
                $email = e((string) ($data['email'] ?? ''));
                $password = e((string) ($data['password'] ?? ''));
                $loginUrl = e((string) ($data['login_url'] ?? $this->resolveFrontendLoginUrl()));

                return "
<div style=\"margin:0;padding:24px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">
    <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden;\">
        <div style=\"background:#0f172a;color:#ffffff;padding:18px 24px;\">
            <h1 style=\"margin:0;font-size:20px;line-height:1.3;\">Bienvenue sur LinkEdu</h1>
            <p style=\"margin:6px 0 0 0;font-size:14px;opacity:0.9;\">Creation de compte {$roleLabel}</p>
        </div>

        <div style=\"padding:22px 24px;\">
            <p style=\"margin:0 0 14px 0;font-size:14px;\">Bonjour {$name},</p>
            <p style=\"margin:0 0 16px 0;font-size:14px;line-height:1.6;\">
                Votre compte a ete cree avec succes. Voici vos informations de connexion.
            </p>

            <table style=\"width:100%;border-collapse:collapse;font-size:14px;\">
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;width:34%;\">Nom</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">{$nom}</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Prenom</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">{$prenom}</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Email de connexion</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">{$email}</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Mot de passe temporaire</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;font-family:Consolas,Monaco,monospace;font-size:15px;\">{$password}</td>
                </tr>
            </table>

            <p style=\"margin:16px 0 0 0;padding:12px;border:1px solid #f5d8a8;background:#fff8eb;border-radius:8px;font-size:13px;line-height:1.5;\">
                Important: veuillez modifier votre mot de passe lors de votre premiere connexion pour securiser votre compte.
            </p>

            <p style=\"margin:18px 0 0 0;font-size:14px;\">
                Lien de connexion: <a href=\"{$loginUrl}\" style=\"color:#0b63f6;text-decoration:none;\">{$loginUrl}</a>
            </p>
        </div>
    </div>
</div>";
        }

    private function generateRandomPassword(int $length = 12): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $result = '';
        $max = strlen($alphabet) - 1;

        for ($i = 0; $i < $length; $i++) {
            $result .= $alphabet[random_int(0, $max)];
        }

        return $result;
    }

    public function getClasses(Request $request)
    {
        if (!$request->user() || !in_array($request->user()->role, ['admin', 'directeur'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasClassFiliere = Schema::hasColumn('classes', 'filiere');
        $hasClassPricing = Schema::hasColumn('classes', 'pricing');

        $classSelect = [
            'classes.id_classe',
            'classes.nom',
            'classes.niveau',
            DB::raw('COUNT(DISTINCT etudiants.id_etudiant) as students_count'),
            DB::raw('COUNT(DISTINCT professeur_user.id) as professeurs_count'),
            DB::raw("GROUP_CONCAT(DISTINCT professeur_user.name ORDER BY professeur_user.id SEPARATOR '||') as professeurs_names"),
            DB::raw("GROUP_CONCAT(DISTINCT professeur_user.id ORDER BY professeur_user.id SEPARATOR ',') as professeurs_ids"),
            DB::raw("GROUP_CONCAT(DISTINCT COALESCE(professeur_data.telephone, '') ORDER BY professeur_user.id SEPARATOR '||') as professeurs_telephones"),
            DB::raw("GROUP_CONCAT(DISTINCT CONCAT(COALESCE(ens.id_professeur, ''), ':', COALESCE(ens.id_matiere, '')) ORDER BY ens.id_professeur, ens.id_matiere SEPARATOR ',') as professeur_matiere_pairs"),
            DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.id ORDER BY etudiant_user.id SEPARATOR ',') as etudiants_ids"),
            DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.name ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_names"),
            DB::raw("GROUP_CONCAT(DISTINCT COALESCE(etudiants.matricule, '') ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_matricules"),
        ];

        $classSelect[] = $hasClassFiliere
            ? 'classes.filiere'
            : DB::raw("'' as filiere");

        $classSelect[] = $hasClassPricing
            ? 'classes.pricing'
            : DB::raw('0 as pricing');

        $classesGroupBy = [
            'classes.id_classe',
            'classes.nom',
            'classes.niveau',
        ];

        if ($hasClassFiliere) {
            $classesGroupBy[] = 'classes.filiere';
        }

        if ($hasClassPricing) {
            $classesGroupBy[] = 'classes.pricing';
        }

        $classes = DB::table('classes')
            ->leftJoin('etudiants', 'classes.id_classe', '=', 'etudiants.id_classe')
            ->leftJoin('users as etudiant_user', 'etudiants.id_etudiant', '=', 'etudiant_user.id')
            ->leftJoin('classe_professeur_assignments as cpa', 'classes.id_classe', '=', 'cpa.id_classe')
            ->leftJoin('enseigner as ens', function ($join) {
                $join->on('classes.id_classe', '=', 'ens.id_classe')
                    ->on('cpa.id_professeur', '=', 'ens.id_professeur');
            })
            ->leftJoin('users as professeur_user', function ($join) {
                $join->on('cpa.id_professeur', '=', 'professeur_user.id')
                    ->where('professeur_user.role', '=', 'professeur');
            })
            ->leftJoin('professeurs as professeur_data', 'cpa.id_professeur', '=', 'professeur_data.id_professeur')
            ->select($classSelect)
            ->groupBy(...$classesGroupBy)
            ->orderBy('classes.niveau')
            ->get();

        $classes = $classes->map(function ($classe) {
            $names = $classe->professeurs_names
                ? array_values(array_filter(explode('||', $classe->professeurs_names)))
                : [];

            $ids = $classe->professeurs_ids
                ? array_values(array_map('intval', array_filter(explode(',', $classe->professeurs_ids))))
                : [];

            $telephones = $classe->professeurs_telephones
                ? array_values(explode('||', $classe->professeurs_telephones))
                : [];

            $professeursDetails = [];
            foreach ($ids as $index => $idProfesseur) {
                $professeursDetails[] = [
                    'id' => $idProfesseur,
                    'name' => $names[$index] ?? null,
                    'telephone' => !empty($telephones[$index]) ? $telephones[$index] : null,
                ];
            }

            $professeurMatieres = [];
            if (!empty($classe->professeur_matiere_pairs)) {
                foreach (explode(',', $classe->professeur_matiere_pairs) as $pair) {
                    [$idProfesseur, $idMatiere] = array_pad(explode(':', $pair, 2), 2, null);
                    $idProfesseur = (int) $idProfesseur;
                    $idMatiere = (int) $idMatiere;

                    if ($idProfesseur <= 0 || $idMatiere <= 0) {
                        continue;
                    }

                    if (!array_key_exists($idProfesseur, $professeurMatieres)) {
                        $professeurMatieres[$idProfesseur] = [];
                    }

                    if (!in_array($idMatiere, $professeurMatieres[$idProfesseur], true)) {
                        $professeurMatieres[$idProfesseur][] = $idMatiere;
                    }
                }
            }

            $etudiantIds = $classe->etudiants_ids
                ? array_values(array_map('intval', array_filter(explode(',', $classe->etudiants_ids))))
                : [];

            $etudiantNames = $classe->etudiants_names
                ? array_values(array_filter(explode('||', $classe->etudiants_names)))
                : [];

            $etudiantMatricules = $classe->etudiants_matricules
                ? array_values(explode('||', $classe->etudiants_matricules))
                : [];

            $effectifDetails = [];
            foreach ($etudiantIds as $index => $idEtudiant) {
                $effectifDetails[] = [
                    'id' => $idEtudiant,
                    'name' => $etudiantNames[$index] ?? null,
                    'matricule' => !empty($etudiantMatricules[$index]) ? $etudiantMatricules[$index] : null,
                ];
            }

            $classe->professeurs_names = $names;
            $classe->professeurs_ids = $ids;
            $classe->professeurs_details = $professeursDetails;
            $classe->professeur_matieres = $professeurMatieres;
            $classe->effectif_details = $effectifDetails;
            $classe->pricing = (float) ($classe->pricing ?? 0);

            unset($classe->professeurs_telephones, $classe->professeur_matiere_pairs, $classe->etudiants_ids, $classe->etudiants_names, $classe->etudiants_matricules);

            return $classe;
        });

        return response()->json($classes);
    }

    public function getClassOptions(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'niveaux' => array_values(config('school_options.niveaux', [])),
            'filieres_by_niveau' => config('school_options.filieres_by_niveau', []),
            'pricing_by_niveau_filiere' => config('school_options.pricing_by_niveau_filiere', []),
            'matieres_by_niveau_filiere' => config('school_options.matieres_by_niveau_filiere', []),
        ]);
    }

    public function createClass(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasClassFiliere = Schema::hasColumn('classes', 'filiere');
        $hasClassPricing = Schema::hasColumn('classes', 'pricing');

        $validationRules = [
            'nom' => 'required|string|max:255',
            'niveau' => ['required', 'string', Rule::in(array_column(config('school_options.niveaux', []), 'code'))],
            'filiere' => 'required|string|max:255',
            'pricing' => 'required|numeric|min:0',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
            'professeur_matieres' => 'nullable|array',
            'professeur_matieres.*' => 'array',
            'professeur_matieres.*.*' => 'integer|exists:matieres,id_matiere',
        ];

        if ($hasClassFiliere) {
            $validationRules['filiere'] = 'nullable|string|max:255';
        }

        if ($hasClassPricing) {
            $validationRules['pricing'] = 'nullable|numeric|min:0';
        }

        $validated = $request->validate($validationRules);

        $filiere = null;
        if ($hasClassFiliere) {
            $filiere = trim((string) ($validated['filiere'] ?? ''));
            if ($filiere === '') {
                $filiere = 'general';
            }
        }

        $pricing = null;
        if ($hasClassPricing) {
            $pricing = array_key_exists('pricing', $validated)
                ? (float) $validated['pricing']
                : null;

            if ($pricing === null) {
                $pricing = $this->resolveAutomaticPricing(
                    $validated['niveau'],
                    (string) ($filiere ?? '')
                ) ?? 0.0;
            }
        }

        $allowedFilieres = config('school_options.filieres_by_niveau.' . $validated['niveau'], []);
        if ($hasClassFiliere && is_array($allowedFilieres) && !empty($allowedFilieres) && !in_array($filiere, $allowedFilieres, true)) {
            return response()->json([
                'message' => 'La filiere selectionnee est invalide pour ce niveau.',
            ], 422);
        }

        $classe = null;

        DB::transaction(function () use (&$classe, $validated, $hasClassFiliere, $hasClassPricing, $filiere, $pricing) {
            $classPayload = [
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
            ];

            if ($hasClassFiliere) {
                $classPayload['filiere'] = $filiere;
            }

            if ($hasClassPricing) {
                $classPayload['pricing'] = $pricing;
            }

            $classe = Classe::create($classPayload);

            $now = now();
            $rows = collect($validated['professeur_ids'] ?? [])
                ->unique()
                ->values()
                ->map(fn ($idProfesseur) => [
                    'id_classe' => $classe->id_classe,
                    'id_professeur' => $idProfesseur,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            if (!empty($rows)) {
                DB::table('classe_professeur_assignments')->insert($rows);
            }

            // Insert professor-matière assignments in the enseigner table
            if (!empty($validated['professeur_matieres'])) {
                $enseignerRows = [];
                foreach ($validated['professeur_matieres'] as $profIdStr => $matiereIds) {
                    $profId = (int) $profIdStr;
                    foreach ($matiereIds as $matId) {
                        $enseignerRows[] = [
                            'id_professeur' => $profId,
                            'id_classe' => $classe->id_classe,
                            'id_matiere' => $matId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (!empty($enseignerRows)) {
                    DB::table('enseigner')->insertOrIgnore($enseignerRows);
                }
            }
        });

        return response()->json([
            'message' => 'Classe créée avec succès !',
            'classe' => $classe
        ], 201);
    }

    public function updateClass(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasClassFiliere = Schema::hasColumn('classes', 'filiere');
        $hasClassPricing = Schema::hasColumn('classes', 'pricing');

        $validationRules = [
            'nom' => 'required|string|max:255',
            'niveau' => ['required', 'string', Rule::in(array_column(config('school_options.niveaux', []), 'code'))],
            'filiere' => 'required|string|max:255',
            'pricing' => 'required|numeric|min:0',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
            'professeur_matieres' => 'nullable|array',
            'professeur_matieres.*' => 'array',
            'professeur_matieres.*.*' => 'integer|exists:matieres,id_matiere',
        ];

        if ($hasClassFiliere) {
            $validationRules['filiere'] = 'nullable|string|max:255';
        }

        if ($hasClassPricing) {
            $validationRules['pricing'] = 'nullable|numeric|min:0';
        }

        $validated = $request->validate($validationRules);

        $filiere = null;
        if ($hasClassFiliere) {
            $filiere = trim((string) ($validated['filiere'] ?? ''));
            if ($filiere === '') {
                $filiere = 'general';
            }
        }

        $pricing = null;
        if ($hasClassPricing) {
            $pricing = array_key_exists('pricing', $validated)
                ? (float) $validated['pricing']
                : null;

            if ($pricing === null) {
                $pricing = $this->resolveAutomaticPricing(
                    $validated['niveau'],
                    (string) ($filiere ?? '')
                ) ?? 0.0;
            }
        }

        $allowedFilieres = config('school_options.filieres_by_niveau.' . $validated['niveau'], []);
        if ($hasClassFiliere && is_array($allowedFilieres) && !empty($allowedFilieres) && !in_array($filiere, $allowedFilieres, true)) {
            return response()->json([
                'message' => 'La filiere selectionnee est invalide pour ce niveau.',
            ], 422);
        }

        $classe = Classe::findOrFail($id);

        DB::transaction(function () use ($classe, $validated, $hasClassFiliere, $hasClassPricing, $filiere, $pricing) {
            $classPayload = [
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
            ];

            if ($hasClassFiliere) {
                $classPayload['filiere'] = $filiere;
            }

            if ($hasClassPricing) {
                $classPayload['pricing'] = $pricing;
            }

            $classe->update($classPayload);

            DB::table('classe_professeur_assignments')
                ->where('id_classe', $classe->id_classe)
                ->delete();

            $now = now();
            $rows = collect($validated['professeur_ids'] ?? [])
                ->unique()
                ->values()
                ->map(fn ($idProfesseur) => [
                    'id_classe' => $classe->id_classe,
                    'id_professeur' => $idProfesseur,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            if (!empty($rows)) {
                DB::table('classe_professeur_assignments')->insert($rows);
            }

            // Delete existing enseigner records for this class
            DB::table('enseigner')
                ->where('id_classe', $classe->id_classe)
                ->delete();

            // Insert updated professor-matière assignments
            if (!empty($validated['professeur_matieres'])) {
                $enseignerRows = [];
                foreach ($validated['professeur_matieres'] as $profIdStr => $matiereIds) {
                    $profId = (int) $profIdStr;
                    foreach ($matiereIds as $matId) {
                        $enseignerRows[] = [
                            'id_professeur' => $profId,
                            'id_classe' => $classe->id_classe,
                            'id_matiere' => $matId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (!empty($enseignerRows)) {
                    DB::table('enseigner')->insert($enseignerRows);
                }
            }
        });

        return response()->json([
            'message' => 'Classe mise à jour avec succès !',
            'classe' => $classe,
        ]);
    }

    public function deleteClass(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $classe = Classe::findOrFail($id);
        $classe->delete();

        return response()->json([
            'message' => 'Classe supprimée avec succès.',
        ]);
    }

    public function getMatieres(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $matieresQuery = Matiere::query();

        if (Schema::hasColumn('matieres', 'niveau')) {
            $matieresQuery->orderBy('niveau');
        }

        $matieres = $matieresQuery->orderBy('nom')->get();

        return response()->json($matieres);
    }

    public function createMatiere(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hasMatiereNiveau = Schema::hasColumn('matieres', 'niveau');
        $hasLyceeNiveauCode = Schema::hasColumn('matieres', 'lycee_niveau_code');
        $hasLyceeFiliere = Schema::hasColumn('matieres', 'lycee_filiere');

        $validationRules = [
            'nom' => 'required|string|max:255',
            'coefficient' => 'required|integer|min:0|max:10',
        ];

        if ($hasMatiereNiveau) {
            $validationRules['niveau'] = ['required', 'string', Rule::in(['maternelle', 'primaire', 'college', 'lycee', 'general'])];
            $validationRules['coefficients_by_level'] = 'nullable|array';
            $validationRules['coefficients_by_niveau_code'] = 'nullable|array';
            $validationRules['coefficients_by_niveau_code.*'] = 'nullable|integer|min:0|max:10';
        }

        if ($hasLyceeNiveauCode) {
            $validationRules['lycee_niveau_code'] = ['nullable', 'string', Rule::in(['tc', '1bac', '2bac'])];
        }

        if ($hasLyceeFiliere) {
            $validationRules['lycee_filiere'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($validationRules);

        if ($hasMatiereNiveau) {
            $validated = $this->normalizeMatierePayload($validated, true);
        }

        $existingQuery = Matiere::where('nom', $validated['nom']);
        if ($hasMatiereNiveau) {
            $existingQuery->where('niveau', $validated['niveau']);

            if (($validated['niveau'] ?? null) === 'lycee') {
                if ($hasLyceeNiveauCode) {
                    $existingQuery->where('lycee_niveau_code', $validated['lycee_niveau_code'] ?? null);
                }
                if ($hasLyceeFiliere) {
                    $existingQuery->where('lycee_filiere', $validated['lycee_filiere'] ?? null);
                }
            }
        }

        $existing = $existingQuery->first();
        if ($existing) {
            return response()->json(['message' => 'Cette matiere existe deja pour ce niveau.'], 422);
        }

        $matiere = Matiere::create($validated);

        return response()->json([
            'message' => 'Matiere creee avec succes !',
            'matiere' => $matiere,
        ], 201);
    }

    public function updateMatiere(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $matiere = Matiere::findOrFail($id);

        $hasMatiereNiveau = Schema::hasColumn('matieres', 'niveau');
        $hasLyceeNiveauCode = Schema::hasColumn('matieres', 'lycee_niveau_code');
        $hasLyceeFiliere = Schema::hasColumn('matieres', 'lycee_filiere');

        $validationRules = [
            'nom' => 'required|string|max:255',
            'coefficient' => 'required|integer|min:0|max:10',
        ];

        if ($hasMatiereNiveau) {
            $validationRules['niveau'] = ['required', 'string', Rule::in(['maternelle', 'primaire', 'college', 'lycee', 'general'])];
            $validationRules['coefficients_by_level'] = 'nullable|array';
            $validationRules['coefficients_by_niveau_code'] = 'nullable|array';
            $validationRules['coefficients_by_niveau_code.*'] = 'nullable|integer|min:0|max:10';
        }

        if ($hasLyceeNiveauCode) {
            $validationRules['lycee_niveau_code'] = ['nullable', 'string', Rule::in(['tc', '1bac', '2bac'])];
        }

        if ($hasLyceeFiliere) {
            $validationRules['lycee_filiere'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($validationRules);

        if ($hasMatiereNiveau) {
            $validated = $this->normalizeMatierePayload($validated, false);
        }

        $existingQuery = Matiere::where('nom', $validated['nom'])
            ->where('id_matiere', '!=', $matiere->id_matiere);

        if ($hasMatiereNiveau) {
            $existingQuery->where('niveau', $validated['niveau']);

            if (($validated['niveau'] ?? null) === 'lycee') {
                if ($hasLyceeNiveauCode) {
                    $existingQuery->where('lycee_niveau_code', $validated['lycee_niveau_code'] ?? null);
                }
                if ($hasLyceeFiliere) {
                    $existingQuery->where('lycee_filiere', $validated['lycee_filiere'] ?? null);
                }
            }
        }

        $existing = $existingQuery->first();
            
        if ($existing) {
            return response()->json(['message' => 'Cette matiere existe deja pour ce niveau.'], 422);
        }

        $matiere->update($validated);

        return response()->json([
            'message' => 'Matiere mise a jour avec succes !',
            'matiere' => $matiere,
        ]);
    }

    public function deleteMatiere(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $matiere = Matiere::findOrFail($id);
        $matiere->delete();

        return response()->json([
            'message' => 'Matiere supprimee avec succes.',
        ]);
    }

    private function normalizeMatierePayload(array $validated, bool $isCreate): array
    {
        $isGeneral = ($validated['niveau'] ?? '') === 'general';

        if ($isGeneral) {
            $requiredGeneralCodes = ['ms', 'mm', 'gs', '1ap', '2ap', '3ap', '4ap', '5ap', '6ap', '1ac', '2ac', '3ac', 'tc', '1bac', '2bac'];
            $sourceByCode = is_array($validated['coefficients_by_niveau_code'] ?? null)
                ? $validated['coefficients_by_niveau_code']
                : [];

            // Backward compatibility: convert old coefficients_by_level payload to the new general code format.
            if (empty($sourceByCode) && is_array($validated['coefficients_by_level'] ?? null)) {
                $legacyByLevel = $validated['coefficients_by_level'];
                $sourceByCode = [
                    'ms' => $legacyByLevel['maternelle'] ?? null,
                    'mm' => $legacyByLevel['maternelle'] ?? null,
                    'gs' => $legacyByLevel['maternelle'] ?? null,
                    '1ap' => $legacyByLevel['primaire'] ?? null,
                    '2ap' => $legacyByLevel['primaire'] ?? null,
                    '3ap' => $legacyByLevel['primaire'] ?? null,
                    '4ap' => $legacyByLevel['primaire'] ?? null,
                    '5ap' => $legacyByLevel['primaire'] ?? null,
                    '6ap' => $legacyByLevel['primaire'] ?? null,
                    '1ac' => $legacyByLevel['college'] ?? null,
                    '2ac' => $legacyByLevel['college'] ?? null,
                    '3ac' => $legacyByLevel['college'] ?? null,
                    'tc' => $legacyByLevel['lycee'] ?? null,
                    '1bac' => $legacyByLevel['lycee'] ?? null,
                    '2bac' => $legacyByLevel['lycee'] ?? null,
                ];
            }

            $normalizedByCode = [];
            foreach ($requiredGeneralCodes as $code) {
                if (!array_key_exists($code, $sourceByCode)) {
                    abort(response()->json([
                        'message' => "Le coefficient {$code} est obligatoire pour une matiere generale.",
                    ], 422));
                }

                $value = $sourceByCode[$code];
                if ($value === null || $value === '') {
                    abort(response()->json([
                        'message' => "Le coefficient {$code} est obligatoire pour une matiere generale.",
                    ], 422));
                }

                $normalizedByCode[$code] = (int) $value;
            }

            $validated['coefficients_by_level'] = null;
            $validated['coefficients_by_niveau_code'] = $normalizedByCode;
            $validated['lycee_niveau_code'] = null;
            $validated['lycee_filiere'] = null;
            $validated['coefficient'] = (int) ($normalizedByCode['1ac'] ?? ($isCreate ? 1 : ($validated['coefficient'] ?? 1)));

            return $validated;
        }

        $validated['coefficients_by_level'] = null;

        $niveau = (string) ($validated['niveau'] ?? '');
        $niveauCodes = $this->getNiveauCodesForMatiereLevel($niveau);

        if (empty($niveauCodes)) {
            $validated['coefficients_by_niveau_code'] = null;
            $validated['lycee_niveau_code'] = null;
            $validated['lycee_filiere'] = null;
            return $validated;
        }

        $fallbackCoefficient = (int) ($validated['coefficient'] ?? 1);
        $source = $validated['coefficients_by_niveau_code'] ?? [];
        $normalizedByCode = [];

        foreach ($niveauCodes as $code) {
            $rawValue = $source[$code] ?? $fallbackCoefficient;
            if ($rawValue === null || $rawValue === '') {
                abort(response()->json([
                    'message' => "Le coefficient du niveau {$code} est obligatoire.",
                ], 422));
            }

            $normalizedByCode[$code] = (int) $rawValue;
        }

        if ($niveau === 'lycee') {
            $lyceeNiveauCode = (string) ($validated['lycee_niveau_code'] ?? '');
            $lyceeFiliere = trim((string) ($validated['lycee_filiere'] ?? ''));

            if (!in_array($lyceeNiveauCode, ['tc', '1bac', '2bac'], true)) {
                abort(response()->json([
                    'message' => 'Le choix du palier lycee (TC, 1BAC ou 2BAC) est obligatoire.',
                ], 422));
            }

            if ($lyceeFiliere === '') {
                abort(response()->json([
                    'message' => 'La filiere lycee est obligatoire.',
                ], 422));
            }

            $allowedFilieres = config('school_options.filieres_by_niveau.' . $lyceeNiveauCode, []);
            if (!in_array($lyceeFiliere, $allowedFilieres, true)) {
                abort(response()->json([
                    'message' => 'La filiere selectionnee est invalide pour le palier lycee choisi.',
                ], 422));
            }

            $validated['lycee_niveau_code'] = $lyceeNiveauCode;
            $validated['lycee_filiere'] = $lyceeFiliere;
        } else {
            $validated['lycee_niveau_code'] = null;
            $validated['lycee_filiere'] = null;
        }

        $validated['coefficients_by_niveau_code'] = $normalizedByCode;
        $validated['coefficient'] = (int) ($normalizedByCode[$niveauCodes[0]] ?? $fallbackCoefficient);

        return $validated;
    }

    private function getNiveauCodesForMatiereLevel(string $niveau): array
    {
        return match ($niveau) {
            'maternelle' => ['ms', 'mm', 'gs'],
            'primaire' => ['1ap', '2ap', '3ap', '4ap', '5ap', '6ap'],
            'college' => ['1ac', '2ac', '3ac'],
            'lycee' => ['tc', '1bac', '2bac'],
            default => [],
        };
    }

    private function resolveAutomaticPricing(string $niveau, string $filiere): ?float
    {
        $filieresByNiveau = config('school_options.filieres_by_niveau', []);
        $allowedFilieres = $filieresByNiveau[$niveau] ?? [];

        if (!in_array($filiere, $allowedFilieres, true)) {
            return null;
        }

        $pricingByNiveauFiliere = config('school_options.pricing_by_niveau_filiere', []);
        if (!array_key_exists($niveau, $pricingByNiveauFiliere)) {
            return null;
        }

        if (!array_key_exists($filiere, $pricingByNiveauFiliere[$niveau])) {
            return null;
        }

        return (float) $pricingByNiveauFiliere[$niveau][$filiere];
    }

    public function generateReport(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|string',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        // Simulating report generation
        return response()->json([
            'message' => 'Rapport généré avec succès.',
            'report_url' => '/downloads/reports/dummy-report-' . time() . '.pdf'
        ]);
    }
}
