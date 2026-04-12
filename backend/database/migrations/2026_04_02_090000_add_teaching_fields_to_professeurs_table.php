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
            if (!Schema::hasColumn('professeurs', 'matiere_enseignement')) {
                $table->string('matiere_enseignement', 255)->nullable()->after('telephone');
            }

            if (!Schema::hasColumn('professeurs', 'niveau_enseignement')) {
                $table->string('niveau_enseignement', 50)->nullable()->after('matiere_enseignement');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professeurs', function (Blueprint $table) {
            if (Schema::hasColumn('professeurs', 'niveau_enseignement')) {
                $table->dropColumn('niveau_enseignement');
            }

            if (Schema::hasColumn('professeurs', 'matiere_enseignement')) {
                $table->dropColumn('matiere_enseignement');
            }
        });
    }
};
