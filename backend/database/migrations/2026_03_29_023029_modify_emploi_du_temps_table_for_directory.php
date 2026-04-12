<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emploi_du_temps', function (Blueprint $table) {
            $table->string('salle')->nullable()->after('heure_fin');
            $table->string('couleur')->nullable()->after('salle');
            $table->string('statut')->nullable()->after('couleur');
        });
    }

    public function down(): void
    {
        Schema::table('emploi_du_temps', function (Blueprint $table) {
            $table->dropColumn(['salle', 'couleur', 'statut']);
        });
    }
};