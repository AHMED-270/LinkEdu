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
        Schema::table('reclamations', function (Blueprint $table) {
            if (! Schema::hasColumn('reclamations', 'id_etudiant')) {
                $table->unsignedBigInteger('id_etudiant')->nullable()->after('id_parent');
                $table->index('id_etudiant');
                $table->foreign('id_etudiant')
                    ->references('id_etudiant')
                    ->on('etudiants')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('reclamations', 'date_envoi')) {
                $table->dateTime('date_envoi')->nullable()->after('date_soumission');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reclamations', function (Blueprint $table) {
            if (Schema::hasColumn('reclamations', 'id_etudiant')) {
                $table->dropForeign(['id_etudiant']);
                $table->dropIndex(['id_etudiant']);
                $table->dropColumn('id_etudiant');
            }

            if (Schema::hasColumn('reclamations', 'date_envoi')) {
                $table->dropColumn('date_envoi');
            }
        });
    }
};
