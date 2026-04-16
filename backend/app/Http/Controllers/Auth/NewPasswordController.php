<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class NewPasswordController extends Controller
{
    /**
     * Handle an incoming new password request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                // Send notification email to baroutyoussef@gmail.com
                try {
                    $notificationHtml = "
<div style=\"margin:0;padding:24px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">
    <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden;\">
        <div style=\"background:#0f172a;color:#ffffff;padding:18px 24px;\">
            <h1 style=\"margin:0;font-size:20px;line-height:1.3;\">Notification LinkEdu</h1>
            <p style=\"margin:6px 0 0 0;font-size:14px;opacity:0.9;\">Mot de passe réinitialisé</p>
        </div>

        <div style=\"padding:22px 24px;\">
            <p style=\"margin:0 0 14px 0;font-size:14px;font-weight:700;color:#0f172a;\">Détails de l'action:</p>
            
            <table style=\"width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;\">
                <tr>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;background:#f8fafc;font-weight:700;width:30%;\">Action</td>
                    <td style=\"padding:10px;border:1px solid #dbe3ef;\">Mot de passe réinitialisé</td>
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
                            ->subject("Notification LinkEdu - Mot de passe réinitialisé")
                            ->from(config('mail.from.address'), config('mail.from.name'));

                        $message->html($notificationHtml);
                    });
                } catch (\Throwable $e) {
                    // Log the error but don't fail the password reset
                    \Illuminate\Support\Facades\Log::error('Failed to send admin notification email: ' . $e->getMessage());
                }
            }
        );

        return $status == Password::PASSWORD_RESET
                    ? response()->json(['status' => __($status)])
                    : response()->json(['email' => [__($status)]], 422);
    }
}
