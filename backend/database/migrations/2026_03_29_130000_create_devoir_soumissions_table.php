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
        Schema::create('devoir_soumissions', function (Blueprint $table) {
            $table->id('id_soumission');
            $table->unsignedBigInteger('id_devoir');
            $table->unsignedBigInteger('id_etudiant');
            $table->string('fichier_path');
            $table->text('commentaire')->nullable();
            $table->dateTime('date_soumission');
            $table->string('statut')->default('soumis');
            $table->timestamps();

            $table->foreign('id_devoir')
                ->references('id_devoir')
                ->on('devoirs')
                ->cascadeOnDelete();

            $table->foreign('id_etudiant')
                ->references('id_etudiant')
                ->on('etudiants')
                ->cascadeOnDelete();

            $table->unique(['id_devoir', 'id_etudiant'], 'uniq_devoir_etudiant_soumission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devoir_soumissions');
    }
};
