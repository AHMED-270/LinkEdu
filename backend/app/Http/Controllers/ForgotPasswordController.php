<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\ForgotPasswordMail;

class ForgotPasswordController extends Controller
{
    /**
     * Handle forgot password request and send temporary password to email
     */
    public function forgotPassword(Request $request)
    {
        try {
            // Validate email
            $request->validate([
                'email' => ['required', 'email'],
            ]);

            // Find user by email
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Cet email n\'existe pas dans le système.',
                    'success' => false,
                ], 404);
            }

            // Generate temporary password (12 characters)
            $temporaryPassword = Str::random(12);

            // Hash and update password
            $user->password = bcrypt($temporaryPassword);
            $user->save();

            // Send email with temporary password
            try {
                Mail::to($user->email)->send(new ForgotPasswordMail($user, $temporaryPassword));
            } catch (\Exception $e) {
                // Email sending failed but password was changed
                \Log::error('Email sending failed for forgot password: ' . $e->getMessage());
                
                return response()->json([
                    'message' => 'Erreur d\'envoi d\'email. Veuillez contacter l\'administrateur.',
                    'success' => false,
                ], 500);
            }

            return response()->json([
                'message' => 'Un mot de passe temporaire a été envoyé à votre email.',
                'success' => true,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Email invalide.',
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Forgot password error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Une erreur est survenue. Veuillez réessayer.',
                'success' => false,
            ], 500);
        }
    }
}
