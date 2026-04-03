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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:secretaire,directeur,professeur',
            'telephone' => 'required_if:role,directeur,professeur|string|max:30'
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'account_status' => 'active',
                'activated_at' => now(),
            ]);

            if ($validated['role'] === 'directeur') {
                Directeur::create([
                    'id_directeur' => $user->id,
                    'telephone' => $validated['telephone'] ?? null,
                ]);
            }

            if ($validated['role'] === 'professeur') {
                Professeur::create([
                    'id_professeur' => $user->id,
                    'specialite' => 'Non definie',
                    'telephone' => $validated['telephone'] ?? null,
                ]);
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

                $mailBody = "Bonjour {$user->name},\n\n"
                    . "Votre compte {$roleLabel} LinkEdu a ete cree avec succes.\n"
                    . "Email: {$user->email}\n"
                    . "Mot de passe: {$validated['password']}\n\n"
                    . "Lien de connexion: " . (env('FRONTEND_URL') ?: 'http://localhost:5173') . "/login\n";

                Mail::raw(
                    $mailBody,
                    function ($message) use ($user, $roleLabel) {
                        $message->to($user->email)
                            ->subject("Identifiants {$roleLabel} - LinkEdu")
                            ->from(config('mail.from.address'), config('mail.from.name'));
                    }
                );
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'role' => 'required|string|in:etudiant,parent,secretaire,admin,directeur,professeur',
            'password' => 'nullable|string|min:6',
            'id_classe' => 'required_if:role,etudiant|nullable|integer|exists:classes,id_classe',
            'id_parent' => 'required_if:role,etudiant|nullable|integer|exists:parents,id_parent',
            'telephone' => 'required_if:role,parent,directeur,professeur|string|max:30'
        ]);

        try {
            DB::beginTransaction();

            $user->name = $validated['name'];
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
                $professeur = Professeur::where('id_professeur', $user->id)->first();
                if ($professeur) {
                    $professeur->telephone = $validated['telephone'] ?? null;
                    $professeur->save();
                } else {
                    Professeur::create([
                        'id_professeur' => $user->id,
                        'specialite' => 'Non definie',
                        'telephone' => $validated['telephone'] ?? null,
                    ]);
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
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
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
        
        $usersQuery = User::select(
                'users.id',
                'users.name',
                'users.nom',
                'users.prenom',
                'users.email',
                'users.role',
                'users.created_at',
                'users.account_status',
                'users.activated_at',
                'etudiants.id_classe',
                'etudiants.id_parent',
                DB::raw("TRIM(CONCAT(COALESCE(classes.nom, ''), CASE WHEN classes.niveau IS NOT NULL AND classes.niveau <> '' THEN CONCAT(' - ', classes.niveau) ELSE '' END)) as classe"),
                'parent_user.email as parent_email'
            )
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

        if ($parentPassword === '') {
            $parentPassword = $this->generateRandomPassword(12);
        }

        DB::transaction(function () use ($studentUser, $parentUser, $studentPassword, $parentPassword) {
            $studentUser->update([
                'password' => Hash::make($studentPassword),
                'account_status' => 'active',
                'activated_at' => now(),
            ]);

            $parentUser->update([
                'password' => Hash::make($parentPassword),
                'account_status' => 'active',
                'activated_at' => now(),
            ]);
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

        DB::transaction(function () use ($studentUser, $parentUser) {
            $studentUser->update([
                'account_status' => 'pending_activation',
                'activated_at' => null,
            ]);

            $parentUser->update([
                'account_status' => 'pending_activation',
                'activated_at' => null,
            ]);
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

        $classes = DB::table('classes')
            ->leftJoin('etudiants', 'classes.id_classe', '=', 'etudiants.id_classe')
            ->leftJoin('users as etudiant_user', 'etudiants.id_etudiant', '=', 'etudiant_user.id')
            ->leftJoin('classe_professeur_assignments as cpa', 'classes.id_classe', '=', 'cpa.id_classe')
            ->leftJoin('users as professeur_user', function ($join) {
                $join->on('cpa.id_professeur', '=', 'professeur_user.id')
                    ->where('professeur_user.role', '=', 'professeur');
            })
            ->leftJoin('professeurs as professeur_data', 'cpa.id_professeur', '=', 'professeur_data.id_professeur')
            ->select(
                'classes.id_classe',
                'classes.nom',
                'classes.niveau',
                'classes.filiere',
                'classes.pricing',
                DB::raw('COUNT(DISTINCT etudiants.id_etudiant) as students_count'),
                DB::raw('COUNT(DISTINCT professeur_user.id) as professeurs_count'),
                DB::raw("GROUP_CONCAT(DISTINCT professeur_user.name ORDER BY professeur_user.id SEPARATOR '||') as professeurs_names"),
                DB::raw("GROUP_CONCAT(DISTINCT professeur_user.id ORDER BY professeur_user.id SEPARATOR ',') as professeurs_ids"),
                DB::raw("GROUP_CONCAT(DISTINCT COALESCE(professeur_data.telephone, '') ORDER BY professeur_user.id SEPARATOR '||') as professeurs_telephones"),
                DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.id ORDER BY etudiant_user.id SEPARATOR ',') as etudiants_ids"),
                DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.name ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_names"),
                DB::raw("GROUP_CONCAT(DISTINCT COALESCE(etudiants.matricule, '') ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_matricules")
            )
            ->groupBy('classes.id_classe', 'classes.nom', 'classes.niveau', 'classes.filiere', 'classes.pricing')
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
            $classe->effectif_details = $effectifDetails;
            $classe->pricing = (float) ($classe->pricing ?? 0);

            unset($classe->professeurs_telephones, $classe->etudiants_ids, $classe->etudiants_names, $classe->etudiants_matricules);

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
        ]);
    }

    public function createClass(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'niveau' => ['required', 'string', Rule::in(array_column(config('school_options.niveaux', []), 'code'))],
            'filiere' => 'required|string|max:255',
            'pricing' => 'required|numeric|min:0',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
            'professeur_matieres' => 'nullable|array',
            'professeur_matieres.*' => 'array',
            'professeur_matieres.*.*' => 'integer|exists:matieres,id_matiere',
        ]);

        // Validate filière belongs to this niveau
        $allowedFilieres = config('school_options.filieres_by_niveau.' . $validated['niveau'], []);
        if (!in_array($validated['filiere'], $allowedFilieres, true)) {
            return response()->json([
                'message' => 'La filiere selectionnee est invalide pour ce niveau.',
            ], 422);
        }

        $classe = null;

        DB::transaction(function () use (&$classe, $validated) {
            $classe = Classe::create([
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
                'filiere' => $validated['filiere'],
                'pricing' => $validated['pricing'],
            ]);

            $now = now();
            $rows = collect($validated['professeur_ids'])
                ->unique()
                ->values()
                ->map(fn ($idProfesseur) => [
                    'id_classe' => $classe->id_classe,
                    'id_professeur' => $idProfesseur,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            DB::table('classe_professeur_assignments')->insert($rows);

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

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'niveau' => ['required', 'string', Rule::in(array_column(config('school_options.niveaux', []), 'code'))],
            'filiere' => 'required|string|max:255',
            'pricing' => 'required|numeric|min:0',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
            'professeur_matieres' => 'nullable|array',
            'professeur_matieres.*' => 'array',
            'professeur_matieres.*.*' => 'integer|exists:matieres,id_matiere',
        ]);

        // Validate filière belongs to this niveau
        $allowedFilieres = config('school_options.filieres_by_niveau.' . $validated['niveau'], []);
        if (!in_array($validated['filiere'], $allowedFilieres, true)) {
            return response()->json([
                'message' => 'La filiere selectionnee est invalide pour ce niveau.',
            ], 422);
        }

        $classe = Classe::findOrFail($id);

        DB::transaction(function () use ($classe, $validated) {
            $classe->update([
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
                'filiere' => $validated['filiere'],
                'pricing' => $validated['pricing'],
            ]);

            DB::table('classe_professeur_assignments')
                ->where('id_classe', $classe->id_classe)
                ->delete();

            $now = now();
            $rows = collect($validated['professeur_ids'])
                ->unique()
                ->values()
                ->map(fn ($idProfesseur) => [
                    'id_classe' => $classe->id_classe,
                    'id_professeur' => $idProfesseur,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            DB::table('classe_professeur_assignments')->insert($rows);

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

        $matieres = Matiere::orderBy('nom')->get();

        return response()->json($matieres);
    }

    public function createMatiere(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:matieres,nom',
            'coefficient' => 'required|integer|min:1|max:10',
        ]);

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

        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:matieres,nom,' . $matiere->id_matiere . ',id_matiere',
            'coefficient' => 'required|integer|min:1|max:10',
        ]);

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
