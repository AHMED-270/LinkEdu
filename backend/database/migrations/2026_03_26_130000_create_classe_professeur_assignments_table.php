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
        Schema::create('classe_professeur_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_classe');
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_classe')
                ->references('id_classe')
                ->on('classes')
                ->cascadeOnDelete();

            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();

            $table->unique(['id_classe', 'id_professeur'], 'uniq_classe_prof_assignment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classe_professeur_assignments');
    }
};
