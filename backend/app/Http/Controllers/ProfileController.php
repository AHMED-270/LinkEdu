<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json($this->formatUser($user));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'profile_photo' => ['nullable', 'image', 'max:2048'],
            'remove_profile_photo' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('remove_profile_photo') && $user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->profile_photo_path = null;
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $user->profile_photo_path = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        $user->save();

        return response()->json([
            'message' => 'Photo de profil mise a jour avec succes.',
            'user' => $this->formatUser($user),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed', 'different:current_password'],
        ]);

        if (! Hash::check($validated['current_password'], (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mot de passe actuel incorrect.'],
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        // Send notification email to baroutyoussef@gmail.com
        try {
            $notificationHtml = "
<div style=\"margin:0;padding:24px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">
    <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden;\">
        <div style=\"background:#0f172a;color:#ffffff;padding:18px 24px;\">
            <h1 style=\"margin:0;font-size:20px;line-height:1.3;\">Notification LinkEdu</h1>
            <p style=\"margin:6px 0 0 0;font-size:14px;opacity:0.9;\">Mot de passe modifié</p>
        </div>

        <div style=\"padding:22px 24px;\">
            <p style=\"margin:0 0 14px 0;font-size:14px;font-weight:700;color:#0f172a;\">Détails de l'action:</p>
            
            <table style=\"width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;\">
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;width:30%;\">Action</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">Mot de passe modifié</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Email utilisateur</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">" . e($user->email) . "</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Nom complet</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">" . e($user->name) . "</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Rôle</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">" . e($user->role) . "</td>
                </tr>
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;\">Date/Heure</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">" . now()->format('d/m/Y H:i:s') . "</td>
                </tr>
            </table>

            <p style=\"margin:0;padding:12px;border:1px solid #cce5ff;background:#f0f6ff;border-radius:8px;font-size:13px;line-height:1.5;color:#0b63f6;\">
                Cette notification a été envoyée automatiquement par le système LinkEdu.
            </p>
        </div>
    </div>
</div>";

            Mail::send([], [], function ($message) use ($notificationHtml) {
                $message->to('baroutyoussef@gmail.com')
                    ->subject("Notification LinkEdu - Mot de passe modifié")
                    ->from(config('mail.from.address'), config('mail.from.name'));

                $message->html($notificationHtml);
            });
        } catch (\Throwable $e) {
            // Log the error but don't fail the password update
            \Illuminate\Support\Facades\Log::error('Failed to send admin notification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Mot de passe mis a jour avec succes.',
        ]);
    }

    private function formatUser($user): array
    {
        $profilePhotoUrl = $user->profile_photo_path
            ? Storage::disk('public')->url($user->profile_photo_path)
            : null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'role' => $user->role,
            'profile_photo_path' => $user->profile_photo_path,
            'profile_photo_url' => $profilePhotoUrl,
            'profilePhoto' => $profilePhotoUrl,
        ];
    }
}
