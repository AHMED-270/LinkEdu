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
        Schema::table('matieres', function (Blueprint $table) {
            $table->json('coefficients_by_niveau_code')->nullable()->after('coefficients_by_level');
            $table->string('lycee_niveau_code', 20)->nullable()->after('coefficients_by_niveau_code');
            $table->string('lycee_filiere')->nullable()->after('lycee_niveau_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropColumn(['coefficients_by_niveau_code', 'lycee_niveau_code', 'lycee_filiere']);
        });
    }
};
