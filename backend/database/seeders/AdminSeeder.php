<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Creer le premier utilisateur admin.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@linkedu.com'],
            [
                'name'     => 'Admin LinkEdu',
                'nom'      => 'Admin',
                'prenom'   => 'LinkEdu',
                'password' => Hash::make('Admin@2026'),
                'role'     => 'admin',
            ]
        );

        DB::table('admin_ecoles')->updateOrInsert(
            ['id_admin' => $admin->id],
            [
                'permissions' => 'all',
                'created_at'  => now(),
                'updated_at'  => now(),
            ]
        );
    }
}
