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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id('id_paiement');
            $table->unsignedBigInteger('id_etudiant');
            $table->unsignedTinyInteger('mois');
            $table->unsignedInteger('annee');
            $table->decimal('montant', 10, 2)->default(0);
            $table->enum('type', ['mensuel', 'annuel'])->default('mensuel');
            $table->enum('statut', ['paye', 'non_paye'])->default('non_paye');
            $table->date('date_paiement')->nullable();
            $table->timestamps();

            $table->unique(['id_etudiant', 'mois', 'annee'], 'paiements_unique_student_month_year');
            $table->index(['annee', 'mois'], 'paiements_annee_mois_index');

            $table->foreign('id_etudiant')
                ->references('id_etudiant')
                ->on('etudiants')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
