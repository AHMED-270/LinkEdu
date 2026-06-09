<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "email" => ["required", "email"],
            "password" => ["required", "string"],
        ]);

        $normalizedEmail = mb_strtolower(trim((string) $validated["email"]));

        // Rechercher l'utilisateur avec email insensible à la casse
        // Un même email peut exister sur plusieurs roles, on vérifie le mot de passe
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

        // Vérifier que le compte est actif
        if (($user->account_status ?? 'active') !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Compte en attente d activation par l administration.'],
            ]);
        }

        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = $user->createToken("web-token")->plainTextToken;

        return response()->json([
            "message" => "Connexion réussie",
            "user" => $user,
            "token" => $token
        ]);
    }
}

