<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;    
use Illuminate\Validation\ValidationException;

class AdminLoginController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "email" => ["required", "email"],
            "password" => ["required", "string"],
        ]);

        $user = User::where("email", $validated["email"])->first();

        if (! $user || ! Hash::check($validated["password"], $user->password)) {
            throw ValidationException::withMessages([
                "email" => ["Les identifiants ne correspondent pas à nos enregistrements."],
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

        return response()->json([
            "message" => "Connexion réussie",
            "user" => $user,
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
        $user = $request->user();
        if ($user && method_exists($user, "currentAccessToken")) {
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            }
        }

        return response()->json(["message" => "Déconnexion réussie"]);
    }
}
