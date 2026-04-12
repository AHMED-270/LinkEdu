<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfessorController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\AdminDashboardController;
<<<<<<<<< Temporary merge branch 1
use App\Http\Controllers\DirecteurLoginController;
use App\Http\Controllers\DirecteurController;
use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\EmploiDuTempsController;
use App\Http\Controllers\StudentParentController;
=========
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\SecretaireController;
>>>>>>>>> Temporary merge branch 2

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

// Unified login endpoint used by frontend LoginCard.
Route::post('/login', [AuthController::class, 'login']);

// Auth Check (Frontend check)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

<<<<<<<<< Temporary merge branch 1
Route::post('/login', [AuthController::class, 'login']);
=========
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
});
>>>>>>>>> Temporary merge branch 2

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
    Route::post('/ressources', [ProfessorController::class, 'publishRessource']);

    // Ã‰lÃ¨ves, Appel et Notes
    Route::get('/classes/{class_id}/eleves', [ProfessorController::class, 'getStudents']);
    Route::get('/eleves', [ProfessorController::class, 'getStudents']); // All classes
    Route::get('/eleves/{student_id}/absences', [ProfessorController::class, 'getStudentAbsences']);

    // Annonces
    Route::get('/annonces', [ProfessorController::class, 'getAnnouncements']);
    Route::post('/annonces', [ProfessorController::class, 'publishAnnouncement']);

    // Notes
    Route::get('/notes', [ProfessorController::class, 'getNotes']);
    Route::post('/notes', [ProfessorController::class, 'saveNotes']);

    // Appel
    Route::get('/appel', [ProfessorController::class, 'getAttendance']);
    Route::post('/appel', [ProfessorController::class, 'saveAttendance']);

    // Avancement
    Route::get('/avancement', [ProfessorController::class, 'getProgress']);
    Route::post('/avancement', [ProfessorController::class, 'updateProgress']);

    // RÃ©clamations
    Route::get('/reclamations', [ProfessorController::class, 'getComplaints']);
    Route::post('/reclamations', [ProfessorController::class, 'submitComplaint']);
});

<<<<<<<<< Temporary merge branch 1
// Student Module Routes
Route::middleware(['auth:sanctum', 'role:etudiant'])->prefix('etudiant')->group(function () {
    Route::get('/dashboard', [StudentParentController::class, 'studentDashboard']);
    Route::get('/notes', [StudentParentController::class, 'studentNotes']);
    Route::get('/devoirs', [StudentParentController::class, 'studentAssignments']);
    Route::post('/devoirs/{devoirId}/soumettre', [StudentParentController::class, 'submitStudentAssignment']);
    Route::get('/emploi-du-temps', [StudentParentController::class, 'studentSchedule']);
    Route::get('/annonces', [StudentParentController::class, 'studentAnnouncements']);
    Route::get('/lecons', [StudentParentController::class, 'studentLessons']);
    Route::get('/ressources', [StudentParentController::class, 'studentResources']);
});

// Parent Module Routes
Route::middleware(['auth:sanctum', 'role:parent'])->prefix('parent')->group(function () {
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
=========
// Secretaire Module Routes
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
    Route::get('/classes', [SecretaireController::class, 'listClasses']);
    Route::post('/classes', [SecretaireController::class, 'createClasse']);
    Route::put('/classes/{id}', [SecretaireController::class, 'updateClasse']);
    Route::delete('/classes/{id}', [SecretaireController::class, 'deleteClasse']);

    // Absences
    Route::get('/absences', [SecretaireController::class, 'listAbsences']);
    Route::post('/absences', [SecretaireController::class, 'createAbsence']);
    Route::put('/absences/{id}', [SecretaireController::class, 'updateAbsence']);
    Route::delete('/absences/{id}', [SecretaireController::class, 'deleteAbsence']);

    // Annonces
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
    Route::get('/parents', [SecretaireController::class, 'listParents']);
>>>>>>>>> Temporary merge branch 2
});
