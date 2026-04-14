<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('demandes')) {
            return;
        }

        Schema::create('demandes', function (Blueprint $table) {
            $table->id('id_demande');
            $table->string('type_demande');
            $table->text('message')->nullable();
            $table->string('statut')->default('en_attente');
            $table->dateTime('date_demande');
            $table->unsignedBigInteger('id_parent');
            $table->unsignedBigInteger('id_etudiant')->nullable();
            $table->timestamps();

            $table->index('statut');
            $table->index('date_demande');
            $table->index('id_parent');
            $table->index('id_etudiant');

            $table->foreign('id_parent')
                ->references('id_parent')
                ->on('parents')
                ->cascadeOnDelete();

            $table->foreign('id_etudiant')
                ->references('id_etudiant')
                ->on('etudiants')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};
