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
use Illuminate\Support\Facades\Schema;

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
            'role' => 'required|string|in:etudiant,parent,secretaire,admin,directeur,professeur',
            'id_classe' => 'required_if:role,etudiant|nullable|integer|exists:classes,id_classe',
            'id_parent' => 'required_if:role,etudiant|nullable|integer|exists:parents,id_parent',
            'telephone' => 'required_if:role,parent,directeur,professeur|string|max:30'
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
            ]);

            if ($validated['role'] === 'etudiant') {
                Etudiant::create([
                    'id_etudiant' => $user->id,
                    'matricule' => 'MAT-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    'id_classe' => $validated['id_classe'],
                    'id_parent' => $validated['id_parent'],
                ]);
            }

            if ($validated['role'] === 'parent') {
                ParentEleve::create([
                    'id_parent' => $user->id,
                    'telephone' => $validated['telephone'] ?? null,
                ]);
            }

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

            return response()->json([
                'message' => 'Utilisateur créé avec succès !',
                'user' => $user
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
        
        $usersQuery = User::select('users.id', 'users.name', 'users.email', 'users.role', 'users.created_at', 'etudiants.id_classe')
            ->leftJoin('etudiants', 'users.id', '=', 'etudiants.id_etudiant')
            ->leftJoin('parents as own_parent', 'users.id', '=', 'own_parent.id_parent')
            ->leftJoin('parents as linked_parent', 'etudiants.id_parent', '=', 'linked_parent.id_parent')
            ->leftJoin('professeurs as own_professeur', 'users.id', '=', 'own_professeur.id_professeur');

        if (Schema::hasColumn('directeurs', 'telephone')) {
            $usersQuery = $usersQuery
                ->leftJoin('directeurs as own_directeur', 'users.id', '=', 'own_directeur.id_directeur')
                ->addSelect('etudiants.id_parent', DB::raw('COALESCE(linked_parent.telephone, own_parent.telephone, own_directeur.telephone, own_professeur.telephone) as telephone'));
        } else {
            $usersQuery = $usersQuery
                ->addSelect('etudiants.id_parent', DB::raw('COALESCE(linked_parent.telephone, own_parent.telephone, own_professeur.telephone) as telephone'));
        }

        $users = $usersQuery
            ->orderBy('users.created_at', 'desc')
            ->get();

        return response()->json($users);
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
                DB::raw('COUNT(DISTINCT etudiants.id_etudiant) as students_count'),
                DB::raw('COUNT(DISTINCT professeur_user.id) as professeurs_count'),
                DB::raw("GROUP_CONCAT(DISTINCT professeur_user.name ORDER BY professeur_user.id SEPARATOR '||') as professeurs_names"),
                DB::raw("GROUP_CONCAT(DISTINCT professeur_user.id ORDER BY professeur_user.id SEPARATOR ',') as professeurs_ids"),
                DB::raw("GROUP_CONCAT(DISTINCT COALESCE(professeur_data.telephone, '') ORDER BY professeur_user.id SEPARATOR '||') as professeurs_telephones"),
                DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.id ORDER BY etudiant_user.id SEPARATOR ',') as etudiants_ids"),
                DB::raw("GROUP_CONCAT(DISTINCT etudiant_user.name ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_names"),
                DB::raw("GROUP_CONCAT(DISTINCT COALESCE(etudiants.matricule, '') ORDER BY etudiant_user.id SEPARATOR '||') as etudiants_matricules")
            )
            ->groupBy('classes.id_classe', 'classes.nom', 'classes.niveau')
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

            unset($classe->professeurs_telephones, $classe->etudiants_ids, $classe->etudiants_names, $classe->etudiants_matricules);

            return $classe;
        });

        return response()->json($classes);
    }

    public function createClass(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'niveau' => 'required|string|max:255',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
        ]);

        $classe = null;

        DB::transaction(function () use (&$classe, $validated) {
            $classe = Classe::create([
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
                'id_professeur' => null,
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
            'niveau' => 'required|string|max:255',
            'professeur_ids' => 'required|array|min:1',
            'professeur_ids.*' => 'integer|exists:professeurs,id_professeur',
        ]);

        $classe = Classe::findOrFail($id);

        DB::transaction(function () use ($classe, $validated) {
            $classe->update([
                'nom' => $validated['nom'],
                'niveau' => $validated['niveau'],
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
