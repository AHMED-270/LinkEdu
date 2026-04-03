<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('professeurs', function (Blueprint $table) {
            if (!Schema::hasColumn('professeurs', 'matieres_enseignement')) {
                $table->json('matieres_enseignement')->nullable()->after('matiere_enseignement');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professeurs', function (Blueprint $table) {
            if (Schema::hasColumn('professeurs', 'matieres_enseignement')) {
                $table->dropColumn('matieres_enseignement');
            }
        });
    }
};
