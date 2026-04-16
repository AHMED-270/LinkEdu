<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Reinitialisation du mot de passe - {{ $appName }}</title>
</head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#14274e;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef3f8;padding:28px 14px;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="max-width:620px;width:100%;">
                <tr>
                    <td style="padding:0 0 14px 0;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#14274e,#40a1d8);border-radius:22px;overflow:hidden;box-shadow:0 20px 45px rgba(20,39,78,0.28);">
                            <tr>
                                <td style="padding:28px 30px 24px 30px;">
                                    <div style="font-size:12px;letter-spacing:1.6px;font-weight:700;text-transform:uppercase;color:#c9e7fb;">{{ strtoupper($appName) }}</div>
                                    <h1 style="margin:10px 0 8px 0;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">Reinitialisation du mot de passe</h1>
                                    <p style="margin:0;font-size:14px;line-height:1.6;color:#e9f6ff;">Un lien securise vient d'etre demande pour votre compte.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="padding:0;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #d9e8f4;border-radius:22px;box-shadow:0 14px 30px rgba(15,34,62,0.08);">
                            <tr>
                                <td style="padding:28px 30px 26px 30px;">
                                    <p style="margin:0 0 14px 0;font-size:15px;color:#334155;line-height:1.65;">
                                        Bonjour <strong style="color:#14274e;">{{ $displayName }}</strong>,
                                    </p>
                                    <p style="margin:0 0 18px 0;font-size:15px;color:#334155;line-height:1.65;">
                                        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans <strong>{{ $expireMinutes }} minutes</strong>.
                                    </p>

                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
                                        <tr>
                                            <td>
                                                <a href="{{ $resetUrl }}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:linear-gradient(90deg,#14274e,#40a1d8);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.2px;">Reinitialiser mon mot de passe</a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;line-height:1.6;">
                                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:
                                    </p>
                                    <p style="margin:0;padding:12px 14px;background:#f8fbff;border:1px solid #deecf8;border-radius:12px;word-break:break-all;font-size:12px;color:#1e3a5f;line-height:1.6;">
                                        {{ $resetUrl }}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="padding:14px 6px 0 6px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                            Si vous n'avez pas demande cette reinitialisation, vous pouvez ignorer cet email en toute securite.
                        </p>
                        <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">{{ $appName }} - Support securite</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
