<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('absences', 'heure_seance')) {
            Schema::table('absences', function (Blueprint $table) {
                $table->time('heure_seance')->nullable()->after('date_abs');
                $table->index(['id_professeur', 'date_abs', 'heure_seance'], 'abs_prof_date_seance_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('absences', 'heure_seance')) {
            Schema::table('absences', function (Blueprint $table) {
                $table->dropIndex('abs_prof_date_seance_idx');
                $table->dropColumn('heure_seance');
            });
        }
    }
};
