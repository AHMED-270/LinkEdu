<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MoroccanSchoolSeeder extends Seeder
{
    /**
     * Moroccan school seeder with realistic data
     */
    public function run(): void
    {
        $now = now();

        $niveaux = config('school_options.niveaux', []);
        $filieresByNiveau = config('school_options.filieres_by_niveau', []);
        $pricingByNiveauFiliere = config('school_options.pricing_by_niveau_filiere', []);
        $matieres = config('school_options.matieres', []);

        // ========== INSERT SUBJECTS ==========
        foreach ($matieres as $matiere) {
            DB::table('matieres')->updateOrInsert(
                ['nom' => $matiere['nom']],
                [
                    'nom' => $matiere['nom'],
                    'coefficient' => $matiere['coefficient'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // ========== CREATE/UPDATE CLASSES WITH AUTOMATIC PRICING ==========
        $classConfigs = [];
        foreach ($niveaux as $niveauConfig) {
            $niveauCode = (string) ($niveauConfig['code'] ?? '');
            if ($niveauCode === '') {
                continue;
            }

            $allowedFilieres = $filieresByNiveau[$niveauCode] ?? ['General'];
            foreach (array_values($allowedFilieres) as $index => $filiere) {
                $pricing = $pricingByNiveauFiliere[$niveauCode][$filiere] ?? null;
                if ($pricing === null) {
                    continue;
                }

                $classConfigs[] = [
                    'nom' => $this->buildClassName($niveauCode, (string) $filiere, $index),
                    'niveau' => $niveauCode,
                    'filiere' => (string) $filiere,
                    'pricing' => (float) $pricing,
                ];
            }
        }

        foreach ($classConfigs as $classConfig) {
            DB::table('classes')->updateOrInsert(
                ['nom' => $classConfig['nom']],
                [
                    'nom' => $classConfig['nom'],
                    'niveau' => $classConfig['niveau'],
                    'filiere' => $classConfig['filiere'],
                    'pricing' => $classConfig['pricing'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // ========== CREATE MOROCCAN USERS & STAFF ==========
        $moroccanNames = [
            'admins' => [
                ['nom' => 'Bennani', 'prenom' => 'Mohammed'],
                ['nom' => 'Alaoui', 'prenom' => 'Fatima'],
            ],
            'directeurs' => [
                ['nom' => 'Fassi', 'prenom' => 'Ahmed'],
            ],
            'secretaires' => [
                ['nom' => 'Boutaleb', 'prenom' => 'Aïcha'],
                ['nom' => 'El Harami', 'prenom' => 'Sara'],
            ],
            'professeurs' => [
                ['nom' => 'Qassimi', 'prenom' => 'Ibrahim', 'specialite' => 'Mathématiques'],
                ['nom' => 'Benjelloun', 'prenom' => 'Laila', 'specialite' => 'Sciences Physiques'],
                ['nom' => 'Idrissi', 'prenom' => 'Khalid', 'specialite' => 'Langue Arabe'],
                ['nom' => 'Tazi', 'prenom' => 'Yasmine', 'specialite' => 'Langue Française'],
                ['nom' => 'Mansouri', 'prenom' => 'Hassan', 'specialite' => 'Histoire Géographie'],
                ['nom' => 'Bennani', 'prenom' => 'Zainab', 'specialite' => 'Biologie'],
                ['nom' => 'Chakri', 'prenom' => 'Jamal', 'specialite' => 'Sciences Naturelles'],
                ['nom' => 'Mesbah', 'prenom' => 'Leila', 'specialite' => 'Philosophie'],
            ],
        ];

        // Create Admin users
        foreach ($moroccanNames['admins'] as $admin) {
            $email = strtolower($admin['prenom']) . '.' . strtolower($admin['nom']) . '@ecole.ma';
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($admin['prenom'] . ' ' . $admin['nom']),
                    'nom' => $admin['nom'],
                    'prenom' => $admin['prenom'],
                    'password' => Hash::make('Admin@2026'),
                    'role' => 'admin',
                    'account_status' => 'active',
                ]
            );
        }

        // Create Directeur
        foreach ($moroccanNames['directeurs'] as $dir) {
            $email = strtolower($dir['prenom']) . '.' . strtolower($dir['nom']) . '@ecole.ma';
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($dir['prenom'] . ' ' . $dir['nom']),
                    'nom' => $dir['nom'],
                    'prenom' => $dir['prenom'],
                    'password' => Hash::make('Dir@2026'),
                    'role' => 'directeur',
                    'account_status' => 'active',
                ]
            );
        }

        // Create Secrétaires
        foreach ($moroccanNames['secretaires'] as $secr) {
            $email = strtolower($secr['prenom']) . '.' . strtolower($secr['nom']) . '@ecole.ma';
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($secr['prenom'] . ' ' . $secr['nom']),
                    'nom' => $secr['nom'],
                    'prenom' => $secr['prenom'],
                    'password' => Hash::make('Secr@2026'),
                    'role' => 'secretaire',
                    'account_status' => 'active',
                ]
            );
        }

        // Create Professeurs
        foreach ($moroccanNames['professeurs'] as $prof) {
            $email = strtolower($prof['prenom']) . '.' . strtolower($prof['nom']) . '@ecole.ma';
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($prof['prenom'] . ' ' . $prof['nom']),
                    'nom' => $prof['nom'],
                    'prenom' => $prof['prenom'],
                    'password' => Hash::make('Prof@2026'),
                    'role' => 'professeur',
                    'account_status' => 'active',
                ]
            );

            // Create professeur record
            DB::table('professeurs')->updateOrInsert(
                ['id_professeur' => $user->id],
                [
                    'id_professeur' => $user->id,
                    'specialite' => $prof['specialite'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $this->command->info('✅ Moroccan school data seeded successfully!');
        $this->command->info('  - Classes: ' . count($classConfigs));
        $this->command->info('  - Subjects: ' . count($matieres));
        $this->command->info('  - Levels: ' . count($niveaux));
        $this->command->info('  - Streams: ' . collect($filieresByNiveau)->flatten()->unique()->count());
    }

    private function buildClassName(string $niveauCode, string $filiere, int $index): string
    {
        $niveauToken = strtoupper($niveauCode);
        if ($filiere === 'General') {
            return $niveauToken . '-A';
        }

        $filiereToken = strtoupper(Str::substr(Str::slug($filiere, ''), 0, 4));
        if ($filiereToken === '') {
            $filiereToken = 'FIL';
        }

        return $niveauToken . '-' . $filiereToken . '-' . ($index + 1);
    }
}
