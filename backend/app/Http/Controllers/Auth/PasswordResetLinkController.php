<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if (in_array($status, [Password::RESET_LINK_SENT, Password::INVALID_USER], true)) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Si cette adresse e-mail existe dans notre systeme, un lien de reinitialisation vient d etre envoye.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
