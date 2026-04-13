<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedU - Réinitialisation de mot de passe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(170deg, #0c4ea2 0%, #0a3f86 100%);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(170deg, #0c4ea2 0%, #0a3f86 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .content h2 {
            color: #0c4ea2;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .password-box {
            background: #f0f4f8;
            border: 2px solid #0c4ea2;
            border-radius: 6px;
            padding: 20px;
            margin: 30px 0;
        }
        .password-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .password-value {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #0c4ea2;
            font-family: 'Courier New', monospace;
        }
        .instructions {
            background: #fafafa;
            padding: 20px;
            border-left: 4px solid #0c4ea2;
            margin-top: 30px;
            text-align: left;
        }
        .instructions h3 {
            color: #0c4ea2;
            margin-top: 0;
            font-size: 16px;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            color: #666;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-top: 20px;
            text-align: left;
        }
        .warning h4 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .warning ul {
            margin: 0;
            padding-left: 20px;
        }
        .warning li {
            color: #856404;
            font-size: 13px;
            margin-bottom: 5px;
        }
        .button {
            display: inline-block;
            background: #0c4ea2;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #ddd;
        }
        .footer p {
            margin: 0;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LinkedU</h1>
        </div>

        <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour <strong>{{ $user->name }}</strong>,</p>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte LinkedU.</p>

            <div class="password-box">
                <div class="password-label">Votre mot de passe temporaire :</div>
                <div class="password-value">{{ $temporaryPassword }}</div>
            </div>

            <div class="instructions">
                <h3>📋 Instructions :</h3>
                <ol>
                    <li>Connectez-vous avec ce mot de passe temporaire</li>
                    <li>Allez dans les <strong>Paramètres</strong> ou <strong>Profil</strong></li>
                    <li>Changez immédiatement votre mot de passe pour un mot de passe sécurisé</li>
                </ol>
            </div>

            <div class="warning">
                <h4>🔒 Sécurité :</h4>
                <ul>
                    <li>Ne partagez ce mot de passe avec personne</li>
                    <li>Supprimez cet email après l'avoir noté</li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement l'administrateur</li>
                </ul>
            </div>

            <a href="http://localhost:5173/login" class="button">Se connecter à LinkedU</a>
        </div>

        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Ne répondez pas directement à ce message.</p>
            <p>© 2026 LinkedU. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
