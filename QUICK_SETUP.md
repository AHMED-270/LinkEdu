# 🔧 Setup Rapide - LinkEdu Production

## Erreur: "Les identifiants ne correspondent pas à nos enregistrements"

**Cause:** La base de données ne contient pas les comptes de test.

**Solution:** Appelez l'endpoint de seeding:

```bash
curl -X POST https://backendlinkededu-main-oied8k.free.laravel.cloud/api/setup/seed \
  -H "Content-Type: application/json" \
  -d '{}'
```

## ✅ Après le seeding

Vous pouvez utiliser ces identifiants:

| Rôle | Email | Mot de passe |
|------|-------|---|
| Parent | parent1@linkedu.com | Parent@2026 |
| Parent | parent2@linkedu.com | Parent@2026 |
| Étudiant | etudiant1@linkedu.com | Etudiant@2026 |
| Étudiant | etudiant2@linkedu.com | Etudiant@2026 |
| Comptable | comptable1@linkedu.com | Comptable@2026 |
| Comptable | comptable2@linkedu.com | Comptable@2026 |
| Professeur | professeur@linkedu.com | Professeur@2026 |

---

## Réinitialiser la base de données complète

Pour réinitialiser entièrement la base de données en production:

```bash
# Accédez à la console Laravel Cloud
# Exécutez:
php artisan migrate:fresh --seed --force
```

---

## Variables d'environnement essentielles

### Frontend (Vercel)
```
VITE_API_URL=https://backendlinkededu-main-oied8k.free.laravel.cloud
```

### Backend (Laravel Cloud)
```
APP_URL=https://backendlinkededu-main-oied8k.free.laravel.cloud
FRONTEND_URL=https://link-edu.vercel.app
SANCTUM_STATEFUL_DOMAINS=link-edu.vercel.app
```

---

## API Setup Endpoint

**URL:** `POST /api/setup/seed`  
**Dev:** Pas de token requis  
**Production:** Peut nécessiter un header `X-Setup-Token`

**Request:**
```json
{}
```

**Response (Success):**
```json
{
  "message": "Database seeded successfully",
  "credentials": {
    "parents": "parent1-5@linkedu.com / Parent@2026",
    "comptables": "comptable1-5@linkedu.com / Comptable@2026",
    "professors": "professeur@linkedu.com / Professeur@2026"
  }
}
```

**Response (Error):**
```json
{
  "message": "Seeding failed",
  "error": "Error description"
}
```
