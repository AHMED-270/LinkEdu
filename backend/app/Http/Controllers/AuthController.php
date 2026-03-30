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

        $user = User::where("email", $validated["email"])->first();

        if (! $user || ! Hash::check($validated["password"], $user->password)) {
            throw ValidationException::withMessages([
                "email" => ["Les identifiants ne correspondent pas à nos enregistrements."],
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

