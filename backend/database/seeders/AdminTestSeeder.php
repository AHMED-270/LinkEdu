<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminTestSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ["email" => "ahmed2006fahimi@gmail.com"],
            [
                "name"     => "Ahmed Fahimi",
                "nom"      => "Fahimi",
                "prenom"   => "Ahmed",
                "password" => Hash::make("password123"),
                "role"     => "admin",
            ]
        );

        DB::table("admin_ecoles")->updateOrInsert(
            ["id_admin" => $admin->id],
            [
                "permissions" => "all",
                "created_at"  => now(),
                "updated_at"  => now(),
            ]
        );
    }
}