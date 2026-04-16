<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $indexes = Schema::getIndexes('users');
        $hasEmailUnique = false;
        foreach ($indexes as $index) {
            if ($index['name'] === 'users_email_unique') {
                $hasEmailUnique = true;
            }
        }

        Schema::table('users', function (Blueprint $table) use ($hasEmailUnique) {
            if ($hasEmailUnique) {
                $table->dropUnique('users_email_unique');
            }
            // Fallback for older MySQL versions with 1000 bytes limitation
            // But if it already exists, don't recreate it
        });
        
        $hasEmailRoleUnique = false;
        foreach ($indexes as $index) {
            if ($index['name'] === 'users_email_role_unique') {
                $hasEmailRoleUnique = true;
            }
        }

        $driver = DB::getDriverName();
        
        if (!$hasEmailRoleUnique) {
            Schema::table('users', function (Blueprint $table) use ($driver) {
                // Prefix-length indexes are MySQL-specific and break sqlite tests.
                if ($driver === 'mysql') {
                    $table->unique([DB::raw('email(191)'), DB::raw('role(50)')], 'users_email_role_unique');
                    return;
                }

                $table->unique(['email', 'role'], 'users_email_role_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_role_unique');
            $table->unique('email');
        });
    }
};
