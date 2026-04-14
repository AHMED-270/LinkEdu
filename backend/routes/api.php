<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfessorController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EmploiDuTempsController;

use App\Http\Controllers\SecretaireController;
<<<<<<< HEAD
use App\Http\Controllers\DirecteurController;
use App\Http\Controllers\StudentParentController;
=======
use App\Http\Controllers\StudentParentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
>>>>>>> 98d0485 (feat: implement secretary dashboard, payment seeders, and routing updates)

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here where you can is register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

Route::any('/health', function (Request $request) {
    return response()->json([
        'status' => 'ok',
        'service' => 'LinkEdu API',
        'method' => $request->method(),
        'received' => $request->all(),
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Auth Check (Frontend check)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
});

// Admin routes
Route::post('/login', [AdminLoginController::class, 'login']);
Route::post('/logout', [AdminLoginController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/admin/login', [AdminLoginController::class, 'login']);
Route::post('/admin/logout', [AdminLoginController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'role:admin,directeur'])->group(function () {
    Route::get('/admin/dashboard-stats', [AdminDashboardController::class, 'getStats']);
    Route::get('/admin/classes', [AdminDashboardController::class, 'getClasses']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::put('/admin/profile', [AdminDashboardController::class, 'updateProfile']);
    Route::get('/admin/users', [AdminDashboardController::class, 'getUsers']);
    Route::post('/admin/users', [AdminDashboardController::class, 'createUser']);
    Route::put('/admin/users/{id}', [AdminDashboardController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminDashboardController::class, 'deleteUser']);
    Route::post('/admin/users/{id}/activate', [AdminDashboardController::class, 'activateUser']);
    Route::post('/admin/users/{id}/deactivate', [AdminDashboardController::class, 'deactivateUser']);
    Route::get('/admin/class-options', [AdminDashboardController::class, 'getClassOptions']);
    Route::post('/admin/classes', [AdminDashboardController::class, 'createClass']);
    Route::put('/admin/classes/{id}', [AdminDashboardController::class, 'updateClass']);
    Route::delete('/admin/classes/{id}', [AdminDashboardController::class, 'deleteClass']);
    Route::get('/admin/matieres', [AdminDashboardController::class, 'getMatieres']);
    Route::post('/admin/matieres', [AdminDashboardController::class, 'createMatiere']);
    Route::put('/admin/matieres/{id}', [AdminDashboardController::class, 'updateMatiere']);
    Route::delete('/admin/matieres/{id}', [AdminDashboardController::class, 'deleteMatiere']);
    Route::post('/admin/reports/generate', [AdminDashboardController::class, 'generateReport']);
});

// Professor Module Routes (RBAC protected)
Route::middleware(['auth:sanctum', 'role:professeur'])->prefix('professeur')->group(function () {
    Route::put('/profile', [ProfessorController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [ProfessorController::class, 'getDashboard']);
    Route::get('/emploi-du-temps', [ProfessorController::class, 'getSchedule']);

    // Devoirs et Ressources
    Route::get('/publications', [ProfessorController::class, 'getDevoirsEtRessources']);
    Route::post('/devoirs', [ProfessorController::class, 'publishDevoir']);
    Route::put('/devoirs/{id}', [ProfessorController::class, 'updateDevoir']);
    Route::delete('/devoirs/{id}', [ProfessorController::class, 'deleteDevoir']);
    Route::get('/devoirs/{id}/soumissions', [ProfessorController::class, 'getDevoirSoumissions']);
    Route::put('/soumissions/{id}/received', [ProfessorController::class, 'markSoumissionReceived']);
    Route::post('/ressources', [ProfessorController::class, 'publishRessource']);
    Route::post('/ressources/{id}', [ProfessorController::class, 'updateRessource']);
    Route::delete('/ressources/{id}', [ProfessorController::class, 'deleteRessource']);

    // Élèves, Appel et Notes
    Route::get('/classes/{class_id}/eleves', [ProfessorController::class, 'getStudents']);
    Route::get('/eleves', [ProfessorController::class, 'getStudents']); // All classes
    Route::get('/eleves/{student_id}/absences', [ProfessorController::class, 'getStudentAbsences']);
    Route::get('/notes', [ProfessorController::class, 'getNotes']);
    Route::post('/notes', [ProfessorController::class, 'saveNotes']);
    Route::get('/appel', [ProfessorController::class, 'getAttendance']);
    Route::post('/appel', [ProfessorController::class, 'saveAttendance']);

    // Annonces
    Route::get('/annonces', [ProfessorController::class, 'getAnnouncements']);

    // Réclamations
    Route::get('/reclamations', [ProfessorController::class, 'getComplaints']);
    Route::post('/reclamations', [ProfessorController::class, 'submitComplaint']);
});

// Secretaire Module Routes
<<<<<<< HEAD
=======
Route::middleware(['auth:sanctum', 'role:secretaire,admin,directeur,comptable'])->prefix('secretaire')->group(function () {
    Route::get('/dashboard', [SecretaireController::class, 'dashboard']);

    // Classes (read-only for comptable)
    Route::get('/classes', [SecretaireController::class, 'listClasses']);

    // Paiements
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements', [PaiementController::class, 'store']);
    Route::put('/paiements/{id}', [PaiementController::class, 'update']);
    Route::delete('/paiements/{id}', [PaiementController::class, 'destroy']);
    Route::put('/paiements/{id}/toggle', [PaiementController::class, 'togglePaid']);
});

>>>>>>> 98d0485 (feat: implement secretary dashboard, payment seeders, and routing updates)
Route::middleware(['auth:sanctum', 'role:secretaire,admin,directeur'])->prefix('secretaire')->group(function () {
    Route::get('/dashboard', [SecretaireController::class, 'dashboard']);

    // Students
    Route::get('/students', [SecretaireController::class, 'listStudents']);
    Route::post('/students/import', [SecretaireController::class, 'importStudents']);
    Route::post('/students', [SecretaireController::class, 'createStudent']);
    Route::put('/students/{id}', [SecretaireController::class, 'updateStudent']);
    Route::delete('/students/{id}', [SecretaireController::class, 'deleteStudent']);

    // Paiements
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements', [PaiementController::class, 'store']);
    Route::put('/paiements/{id}', [PaiementController::class, 'update']);
    Route::delete('/paiements/{id}', [PaiementController::class, 'destroy']);
    Route::put('/paiements/{id}/toggle', [PaiementController::class, 'togglePaid']);

    // Classes
    Route::post('/classes', [SecretaireController::class, 'createClasse']);
    Route::put('/classes/{id}', [SecretaireController::class, 'updateClasse']);
    Route::delete('/classes/{id}', [SecretaireController::class, 'deleteClasse']);

    // Absences
    Route::get('/absences', [SecretaireController::class, 'listAbsences']);
    Route::post('/absences', [SecretaireController::class, 'createAbsence']);
    Route::put('/absences/{id}', [SecretaireController::class, 'updateAbsence']);
    Route::delete('/absences/{id}', [SecretaireController::class, 'deleteAbsence']);

    // Announcements
    Route::get('/annonces', [SecretaireController::class, 'listAnnonces']);
    Route::post('/annonces', [SecretaireController::class, 'createAnnonce']);
    Route::post('/annonces/{id}', [SecretaireController::class, 'updateAnnonce']);
    Route::put('/annonces/{id}', [SecretaireController::class, 'updateAnnonce']);
    Route::delete('/annonces/{id}', [SecretaireController::class, 'deleteAnnonce']);

    // Reclamations
    Route::get('/reclamations', [SecretaireController::class, 'listReclamations']);
    Route::post('/reclamations', [SecretaireController::class, 'createReclamation']);
    Route::put('/reclamations/{id}', [SecretaireController::class, 'updateReclamation']);
    Route::delete('/reclamations/{id}', [SecretaireController::class, 'deleteReclamation']);
    Route::put('/reclamations/{id}/status', [SecretaireController::class, 'updateReclamationStatus']);
    Route::get('/demandes', [SecretaireController::class, 'listDemandes']);
    Route::put('/demandes/{id}/status', [SecretaireController::class, 'updateDemandeStatus']);
    Route::get('/parents', [SecretaireController::class, 'listParents']);
    Route::get('/professeurs', [SecretaireController::class, 'listProfesseurs']);
    Route::get('/secretaires', [SecretaireController::class, 'listSecretaires']);
});

Route::middleware(['auth:sanctum', 'role:directeur,admin'])->prefix('emplois')->group(function () {
    Route::get('/lookups', [EmploiDuTempsController::class, 'lookups']);
    Route::get('/', [EmploiDuTempsController::class, 'index']);
    Route::post('/', [EmploiDuTempsController::class, 'store']);
    Route::put('/{id}', [EmploiDuTempsController::class, 'update']);
    Route::delete('/{id}', [EmploiDuTempsController::class, 'destroy']);
});

// Directeur Module Routes
Route::middleware(['auth:sanctum', 'role:directeur'])->prefix('directeur')->group(function () {
    Route::get('/dashboard', [DirecteurController::class, 'dashboard']);

    // Professors list
    Route::get('/professeurs', [DirecteurController::class, 'getProfessors']);

    // Students + absences details
    Route::get('/etudiants', [DirecteurController::class, 'getStudents']);
    Route::get('/etudiants/{id}/absences', [DirecteurController::class, 'getStudentAbsences']);

    // Secretaries list for targeted reclamations
    Route::get('/secretaires', [DirecteurController::class, 'getSecretaires']);

    // Annonces management for directeur
    Route::get('/annonces', [SecretaireController::class, 'listAnnonces']);
    Route::post('/annonces', [SecretaireController::class, 'createAnnonce']);
    Route::put('/annonces/{id}', [SecretaireController::class, 'updateAnnonce']);
    Route::delete('/annonces/{id}', [SecretaireController::class, 'deleteAnnonce']);

    // Reclamations management
    Route::get('/reclamations', [DirecteurController::class, 'getReclamations']);
    Route::post('/reclamations', [DirecteurController::class, 'storeReclamation']);
    Route::put('/reclamations/{id}', [DirecteurController::class, 'updateReclamation']);
    Route::delete('/reclamations/{id}', [DirecteurController::class, 'deleteReclamation']);

    // Notes & examens overview
    Route::get('/notes', [DirecteurController::class, 'getNotesOverview']);

    // Profile
    Route::get('/profile', [DirecteurController::class, 'getProfile']);
    Route::put('/profile', [DirecteurController::class, 'updateProfile']);
    Route::put('/profile/password', [DirecteurController::class, 'updatePassword']);
});

// Student Portal Routes
Route::middleware(['auth:sanctum', 'role:etudiant'])->prefix('etudiant')->group(function () {
    Route::get('/dashboard', [StudentParentController::class, 'studentDashboard']);
    Route::get('/notes', [StudentParentController::class, 'studentNotes']);
    Route::get('/devoirs', [StudentParentController::class, 'studentAssignments']);
    Route::post('/devoirs/{id}/soumettre', [StudentParentController::class, 'submitStudentAssignment']);
    Route::get('/emploi-du-temps', [StudentParentController::class, 'studentSchedule']);
    Route::get('/annonces', [StudentParentController::class, 'studentAnnouncements']);
    Route::get('/lecons', [StudentParentController::class, 'studentLessons']);
    Route::get('/ressources', [StudentParentController::class, 'studentResources']);
});

// Parent Portal Routes
Route::middleware(['auth:sanctum', 'role:parent_eleve'])->prefix('parent')->group(function () {
    Route::get('/dashboard', [StudentParentController::class, 'parentDashboard']);
    Route::get('/enfants', [StudentParentController::class, 'parentChildren']);
    Route::get('/notes', [StudentParentController::class, 'parentNotes']);
    Route::get('/devoirs', [StudentParentController::class, 'parentAssignments']);
    Route::get('/absences', [StudentParentController::class, 'parentAbsences']);
    Route::get('/emploi-du-temps', [StudentParentController::class, 'parentSchedule']);
    Route::get('/annonces', [StudentParentController::class, 'parentAnnouncements']);
    Route::get('/professeurs', [StudentParentController::class, 'parentProfessors']);
    Route::get('/reclamations', [StudentParentController::class, 'parentComplaints']);
    Route::post('/reclamations', [StudentParentController::class, 'submitParentComplaint']);
    Route::get('/demandes', [StudentParentController::class, 'parentDemandes']);
    Route::post('/demandes', [StudentParentController::class, 'submitParentDemande']);
    Route::get('/ressources', [StudentParentController::class, 'parentResources']);
});
