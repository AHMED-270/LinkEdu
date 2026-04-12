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
    }

    public function logout(Request $request): JsonResponse
    {
        // Déconnexion basée sur la session pour la SPA
        Auth::guard("web")->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        // Toujours invalider le token si trouvé
        if (method_exists($request->user(), "currentAccessToken")) {
            $request->user()?->currentAccessToken()?->delete();
        }

        return response()->json(["message" => "Déconnexion réussie"]);
    }
}

