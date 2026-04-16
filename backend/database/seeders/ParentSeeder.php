<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ParentSeeder extends Seeder
{
    public function run(): void
    {
        $parents = [
            [
                'email'   => 'parent1@linkedu.com',
                'name'    => 'Karim Parent',
                'nom'     => 'Karim',
                'prenom'  => 'Parent',
                'password' => Hash::make('Parent@2026'),
            ],
            [
                'email'   => 'parent2@linkedu.com',
                'name'    => 'Nadia Parent',
                'nom'     => 'Nadia',
                'prenom'  => 'Parent',
                'password' => Hash::make('Parent@2026'),
            ],
            [
                'email'   => 'parent3@linkedu.com',
                'name'    => 'Samir Parent',
                'nom'     => 'Samir',
                'prenom'  => 'Parent',
                'password' => Hash::make('Parent@2026'),
            ],
        ];

        foreach ($parents as $parent) {
            User::firstOrCreate(
                ['email' => $parent['email']],
                [
                    'name'     => $parent['name'],
                    'nom'      => $parent['nom'],
                    'prenom'   => $parent['prenom'],
                    'password' => $parent['password'],
                    'role'     => 'parent',
                ]
            );
        }
    }
}
