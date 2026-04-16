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
            ComprehensiveSchoolSeeder::class,
            StudentParentDemoSeeder::class,
            MultipleStudentsParentSeeder::class,
            MultipleComptablesSeeder::class,
            SidebarClassesSeeder::class,
            PaiementsDemoSeeder::class,
=======
            GlobalMassarSeeder::class,
>>>>>>> 1a48367a95765259949c0f7902740781c2b2246f
        ]);
    }
}
