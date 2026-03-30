<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfessorController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\AdminDashboardController;
<<<<<<< HEAD
use App\Http\Controllers\DirecteurLoginController;
use App\Http\Controllers\DirecteurController;
use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\EmploiDuTempsController;
=======
use App\Http\Controllers\StudentParentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124

Route::any('/health', function (Request $request) {
    return response()->json([
        'status' => 'ok',
    ]);
});

<<<<<<< HEAD
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {        
=======
// Auth Check (Frontend check)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
    return $request->user();
});

// Admin routes
Route::post('/admin/login', [AdminLoginController::class, 'login']);
Route::post('/admin/logout', [AdminLoginController::class, 'logout'])->middleware('auth:sanctum');

<<<<<<< HEAD
Route::post('/directeur/login', [DirecteurLoginController::class, 'login']);    
Route::post('/directeur/logout', [DirecteurLoginController::class, 'logout'])->middleware('auth:sanctum', 'role:directeur');

Route::middleware(['auth:sanctum', 'role:directeur'])->group(function () {      
    Route::get('/directeur/dashboard', [DirecteurController::class, 'dashboard']);
    Route::get('/directeur/professeurs', [DirecteurController::class, 'getProfessors']);
    Route::get('/directeur/reclamations', [DirecteurController::class, 'getReclamations']);
    Route::get('/directeur/profile', [DirecteurController::class, 'getProfile']);
    Route::put('/directeur/profile', [DirecteurController::class, 'updateProfile']);
    Route::put('/directeur/password', [DirecteurController::class, 'updatePassword']);
    Route::get('/annonces', [AnnonceController::class, 'index']);
    Route::post('/annonces', [AnnonceController::class, 'store']);
    Route::put('/annonces/{id}', [AnnonceController::class, 'update']);
    Route::delete('/annonces/{id}', [AnnonceController::class, 'destroy']);
    Route::get('/emplois/lookups', [EmploiDuTempsController::class, 'lookups']);
    Route::get('/emplois', [EmploiDuTempsController::class, 'index']);
    Route::post('/emplois', [EmploiDuTempsController::class, 'store']);
    Route::put('/emplois/{id}', [EmploiDuTempsController::class, 'update']);
    Route::delete('/emplois/{id}', [EmploiDuTempsController::class, 'destroy']);     
});

Route::middleware(['auth:sanctum'])->group(function () {
=======
Route::middleware(['auth:sanctum', 'role:admin,directeur'])->group(function () {
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
    Route::get('/admin/dashboard-stats', [AdminDashboardController::class, 'getStats']);
    Route::get('/admin/classes', [AdminDashboardController::class, 'getClasses']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::put('/admin/profile', [AdminDashboardController::class, 'updateProfile']);
    Route::get('/admin/users', [AdminDashboardController::class, 'getUsers']);  
    Route::post('/admin/users', [AdminDashboardController::class, 'createUser']);
    Route::put('/admin/users/{id}', [AdminDashboardController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminDashboardController::class, 'deleteUser']);
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

    // Élèves, Appel et Notes
    Route::get('/classes/{class_id}/eleves', [ProfessorController::class, 'getStudents']);
    Route::get('/eleves', [ProfessorController::class, 'getStudents']); // All classes

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

    // Réclamations
    Route::get('/reclamations', [ProfessorController::class, 'getComplaints']);
    Route::post('/reclamations', [ProfessorController::class, 'submitComplaint']);
});

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
});
