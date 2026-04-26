# Seeders de Rôles - Documentation

## Vue d'ensemble

Le seeder `RolesSeeder` crée des utilisateurs de test pour chaque rôle du système. Cela facilite le développement, les tests et la démonstration du système LinkEdu.

## Rôles et Comptes de Test

### 1. Directeur
- **Email:** `directeur@linkedu.com`
- **Mot de passe:** `Directeur@2026`
- **Rôle:** `directeur`
- **Description:** Accès administrateur complet à l'école

### 2. Comptable
- **Email:** `comptable@linkedu.com`
- **Mot de passe:** `Comptable@2026`
- **Rôle:** `comptable`
- **Description:** Gestion des paiements et des finances

### 3. Secrétaire
- **Email:** `secretaire@linkedu.com`
- **Mot de passe:** `Secretaire@2026`
- **Rôle:** `secretaire`
- **Description:** Gestion administrative et inscription des étudiants

### 4. Professeur
- **Email:** `professeur@linkedu.com`
- **Mot de passe:** `Prof@2026`
- **Rôle:** `professeur`
- **Description:** Création de contenu, notation et communication avec les étudiants

### 5. Parent
- **Email:** `parent@linkedu.com`
- **Mot de passe:** `Parent@2026`
- **Rôle:** `parent`
- **Description:** Suivi des progrès et communication avec l'école

### 6. Étudiant
- **Email:** `etudiant@linkedu.com`
- **Mot de passe:** `Etudiant@2026`
- **Rôle:** `etudiant`
- **Description:** Accès au contenu pédagogique et aux notes

## Utilisation des Seeders

### Exécuter tous les seeders
```bash
php artisan db:seed
```

### Exécuter uniquement le seeder RolesSeeder
```bash
php artisan db:seed --class=RolesSeeder
```

### Réinitialiser la base de données et exécuter les seeders
```bash
php artisan migrate:fresh --seed
```

### Réinitialiser sans seeders
```bash
php artisan migrate:fresh
```

## Modification des Seeders

Si vous avez besoin de modifier les utilisateurs de test:

1. Éditez [RolesSeeder.php](RolesSeeder.php)
2. Changez les emails, noms, mots de passe ou rôles selon vos besoins
3. Exécutez `php artisan db:seed --class=RolesSeeder`

## Sécurité en Production

⚠️ **Important:** Les seeders de test ne doivent **JAMAIS** être exécutés en production. 

Pour éviter cela:
- Les seeders ne s'exécutent que avec `php artisan db:seed`
- En production, utilisez migrations uniquement sans seeders
- Utilisez des variables d'environnement pour contrôler l'environnement

## Structure des Seeders

Le projet LinkEdu utilise plusieurs seeders:

| Seeder | Description | Comptes créés |
|--------|-------------|---------------|
| `RolesSeeder` | Utilisateurs de test pour chaque rôle | 6 utilisateurs |
| `MultipleComptablesSeeder` | Comptables supplémentaires | Plusieurs |
| `MultipleStudentsParentSeeder` | Étudiants et parents | Plusieurs |
| `ProfesseursSeeder` | Professeurs supplémentaires | Plusieurs |
| `SecretairesSeeder` | Secrétaires supplémentaires | Plusieurs |
| `ComptablesSeeder` | Comptables uniquement | 1-2 |
| `EtudiantsSeeder` | Étudiants uniquement | 1-2 |
| `ParentSeeder` | Parents uniquement | 1-2 |

Vous pouvez les combiner ou les exécuter individuellement selon vos besoins.

## Résolution de Problèmes

### "Call to undefined method RolesSeeder"
- Assurez-vous que le fichier `RolesSeeder.php` existe dans `database/seeders/`
- Vérifiez que le namespace est correct: `Database\Seeders`

### Les utilisateurs existent déjà
- Le seeder utilise `firstOrCreate`, donc il ne duplifiera pas les utilisateurs
- Pour forcer la recréation, utilisez `migrate:fresh --seed`

### Erreurs de création d'utilisateurs
- Vérifiez que la table `users` existe: `php artisan migrate`
- Vérifiez que tous les champs requis sont fournis
- Consultez les logs: `storage/logs/laravel.log`
