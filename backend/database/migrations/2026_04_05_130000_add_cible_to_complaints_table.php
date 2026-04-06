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
        if (!Schema::hasColumn('complaints', 'cible')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->string('cible')->default('directeur')->after('message');
            });
        }

        // Ensure legacy rows have a target.
        DB::table('complaints')
            ->whereNull('cible')
            ->orWhere('cible', '')
            ->update(['cible' => 'directeur']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('complaints', 'cible')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->dropColumn('cible');
            });
        }
    }
};
