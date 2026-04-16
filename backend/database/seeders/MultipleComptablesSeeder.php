<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MultipleComptablesSeeder extends Seeder
{
    /**
     * Seed multiple demo comptable accounts with example credentials.
     */
    public function run(): void
    {
        $comptablesData = [
            [
                'email' => 'comptable1@linkedu.com',
                'nom' => 'Bennani',
                'prenom' => 'Ibrahim',
                'password' => 'Comptable@2026',
                'telephone' => '0612345701',
            ],
            [
                'email' => 'comptable2@linkedu.com',
                'nom' => 'Alaoui',
                'prenom' => 'Hana',
                'password' => 'Comptable@2026',
                'telephone' => '0612345702',
            ],
            [
                'email' => 'comptable3@linkedu.com',
                'nom' => 'Kasimi',
                'prenom' => 'Omar',
                'password' => 'Comptable@2026',
                'telephone' => '0612345703',
            ],
            [
                'email' => 'comptable4@linkedu.com',
                'nom' => 'Saidi',
                'prenom' => 'Noor',
                'password' => 'Comptable@2026',
                'telephone' => '0612345704',
            ],
            [
                'email' => 'comptable5@linkedu.com',
                'nom' => 'Idrissi',
                'prenom' => 'Zahra',
                'password' => 'Comptable@2026',
                'telephone' => '0612345705',
            ],
        ];

        // Create each comptable account
        foreach ($comptablesData as $data) {
            // Create or update comptable user
            $comptableUser = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['prenom'] . ' ' . $data['nom'],
                    'nom' => $data['nom'],
                    'prenom' => $data['prenom'],
                    'password' => Hash::make($data['password']),
                    'role' => 'comptable',
                    'account_status' => 'active',
                ]
            );
        }

        echo "✓ 5 comptable demo accounts created successfully!\n";
    }
}
