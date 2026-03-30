<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
<<<<<<< HEAD
            AdminSeeder::class,
=======
            ComprehensiveSchoolSeeder::class,
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
        ]);
    }
}
