<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            if (! Schema::hasColumn('absences', 'est_justifiee')) {
                $table->boolean('est_justifiee')->default(false)->after('motif');
            }

            if (! Schema::hasColumn('absences', 'points_sanction')) {
                $table->decimal('points_sanction', 5, 2)->default(0)->after('est_justifiee');
            }
        });
    }

    public function down(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            if (Schema::hasColumn('absences', 'points_sanction')) {
                $table->dropColumn('points_sanction');
            }

            if (Schema::hasColumn('absences', 'est_justifiee')) {
                $table->dropColumn('est_justifiee');
            }
        });
    }
};
