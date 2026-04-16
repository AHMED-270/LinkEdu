# Configuration de Vercel pour LinkEdu

## ⚠️ Problème: "Les identifiants ne correspondent pas à nos enregistrements"

Cela signifie que la base de données en production **n'a pas les identifiants de test**. Vous devez exécuter les seeders.

---

## ✅ Solution: Configuration complète

### Option 1: Utiliser l'endpoint de setup (⭐ Recommandé)

L'application inclut un endpoint de seeding qui fonctionne en production:

```bash
curl -X POST https://backendlinkededu-main-oied8k.free.laravel.cloud/api/setup/seed \
  -H "Content-Type: application/json" \
  -d '{}'
```

**En développement:** Fonctionne immédiatement.

**En production:** Requiert un token (`X-Setup-Token` header) pour des raisons de sécurité.
- Contact: Demandez le `SETUP_TOKEN` au responsable du déploiement
- Ou exécutez directement en accédant à la console Laravel Cloud

---

### Option 2: Utiliser Laravel Cloud Console (✓ Plus sûr)

1. Allez sur [Laravel Cloud Dashboard](https://cloud.laravel.com)
2. Sélectionnez **backendlinkededu-main**
3. Cliquez sur **Open Console**
4. Exécutez:
   ```bash
   php artisan migrate:fresh --seed --force
   ```

---

## Identifiants de test après seeding

Une fois les seeders exécutés, utilisez ces identifiants sur **https://link-edu.vercel.app/login**:

### Parents:
```
Email: parent1@linkedu.com
Mot de passe: Parent@2026
```

### Comptables:
```
Email: comptable1@linkedu.com
Mot de passe: Comptable@2026
```

### Professeurs:
```
Email: professeur@linkedu.com
Mot de passe: Professeur@2026
```

---

## Configuration complète de Vercel et Laravel Cloud

### Étape 1: Configurer Vercel (Frontend)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez le projet **link-edu**
3. Allez à **Settings** > **Environment Variables**
4. Ajoutez:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://backendlinkededu-main-oied8k.free.laravel.cloud`
5. Redéployez

### Étape 2: Configurer Laravel Cloud (Backend)

1. Allez sur [Laravel Cloud](https://cloud.laravel.com)
2. Trouvez **backendlinkededu-main**
3. Configurez les variables d'environnement:
   ```
   APP_URL=https://backendlinkededu-main-oied8k.free.laravel.cloud
   FRONTEND_URL=https://link-edu.vercel.app
   SANCTUM_STATEFUL_DOMAINS=link-edu.vercel.app
   ```

### Étape 3: Exécuter les seeders

Utilisez l'endpoint de setup:
```bash
curl -X POST https://backendlinkededu-main-oied8k.free.laravel.cloud/api/setup/seed \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔧 Dépannage

### "Les identifiants ne correspondent pas"
→ Utilisez l'endpoint `/api/setup/seed` pour seeder la base de données

### Erreur lors du seeding
→ Utilisez la console Laravel Cloud directement:
```bash
php artisan migrate:fresh --seed --force
```

### CORS ou erreurs de connexion
→ Vérifiez que toutes les variables d'environnement sont correctement configurées

---

## 📝 Notes

- Les seeders créent automatiquement les comptes de test
- L'endpoint `/api/setup/seed` est disponible en DEV sans authentification
- En PROD, il peut être protégé par un token (configurable dans `.env`)
- Les migrations s'exécutent automatiquement au déploiement

