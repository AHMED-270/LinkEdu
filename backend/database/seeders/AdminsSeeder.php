<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminsSeeder extends Seeder
{
    /**
     * Creer plusieurs comptes administrateur de demo.
     */
    public function run(): void
    {
        $admins = [
            [
                'email' => 'admin@linkedu.com',
                'nom' => 'Admin',
                'prenom' => 'LinkEdu',
                'password' => 'Admin@2026',
            ],
            [
                'email' => 'admin1@linkedu.com',
                'nom' => 'Responsable',
                'prenom' => 'Système',
                'password' => 'Admin@2026',
            ],
            [
                'email' => 'admin2@linkedu.com',
                'nom' => 'Gestionnaire',
                'prenom' => 'École',
                'password' => 'Admin@2026',
            ],
            [
                'email' => 'superadmin@linkedu.com',
                'nom' => 'Super',
                'prenom' => 'Admin',
                'password' => 'SuperAdmin@2026',
            ],
        ];

        foreach ($admins as $adminData) {
            $admin = User::updateOrCreate(
                ['email' => $adminData['email']],
                [
                    'name' => $adminData['prenom'] . ' ' . $adminData['nom'],
                    'nom' => $adminData['nom'],
                    'prenom' => $adminData['prenom'],
                    'password' => Hash::make($adminData['password']),
                    'role' => 'admin',
                    'account_status' => 'active',
                ]
            );

            DB::table('admin_ecoles')->updateOrInsert(
                ['id_admin' => $admin->id],
                [
                    'permissions' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
