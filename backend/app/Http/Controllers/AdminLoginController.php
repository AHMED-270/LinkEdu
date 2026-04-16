<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;    
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AdminLoginController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        try {
            \Log::info('Login attempt:', [
                'email' => $request->input('email'),
                'method' => $request->method(),
                'headers' => $request->headers->all(),
                'body' => $request->getContent(),
                'all_input' => $request->all(),
            ]);

            $validated = $request->validate([
                "email" => ["required", "email"],
                "password" => ["required", "string"],
            ]);

            $normalizedEmail = mb_strtolower(trim((string) $validated["email"]));

            // Un meme email peut exister sur plusieurs roles (professeur/parent/directeur).
            // On selectionne le compte dont le mot de passe correspond.
            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
                ->orderByDesc('id')
                ->get()
                ->first(function (User $candidate) use ($validated) {
                    return Hash::check($validated["password"], (string) $candidate->password);
                });

            if (! $user) {
                throw ValidationException::withMessages([
                    "email" => ["Les identifiants ne correspondent pas à nos enregistrements."],
                ]);
            }

            if (($user->account_status ?? 'active') !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['Compte en attente d activation par l administration.'],
                ]);
            }

            // Au lieu de tokens, on connecte toujours l'utilisateur pour l'application SPA (React via Sanctum)
            Auth::login($user);

            // Si la requête vient du frontend SPA et que la session est disponible
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            // Créer un token au cas où une app mobile en aurait besoin
            $token = $user->createToken("web-token")->plainTextToken;

            $profilePhotoUrl = $user->profile_photo_path
                ? Storage::disk('public')->url($user->profile_photo_path)
                : null;

            return response()->json([
                "message" => "Connexion réussie",
                "user" => array_merge($user->toArray(), [
                    'profilePhoto' => $profilePhotoUrl,
                    'profile_photo_url' => $profilePhotoUrl,
                ]),
                "token" => $token
            ], 200);
        } catch (ValidationException $e) {
            \Log::error('Login validation error:', $e->errors());
            return response()->json([
                "message" => "Erreur de validation",
                "errors" => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage() . ' ' . $e->getTraceAsString());
            return response()->json([
                "message" => "Erreur lors de la connexion",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            // Get the user before logging out
            $user = $request->user();

            // Déconnexion basée sur la session pour la SPA
            Auth::guard("web")->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            // Invalider le token si l'utilisateur existait et avait une méthode le permettant
            if ($user && method_exists($user, "currentAccessToken")) {
                try {
                    $user->currentAccessToken()?->delete();
                } catch (\Exception $e) {
                    // Log silently if token deletion fails
                }
            }

            return response()->json(["message" => "Déconnexion réussie"], 200);
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Logout error: ' . $e->getMessage());
            
            // Still return success to avoid blocking the logout process
            return response()->json([
                "message" => "Déconnexion réussie",
                "warning" => "Logout completed with minor issues"
            ], 200);
        }
    }
}

