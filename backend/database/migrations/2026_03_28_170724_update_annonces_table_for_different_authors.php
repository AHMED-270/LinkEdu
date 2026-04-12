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
        Schema::table('annonces', function (Blueprint $table) {
            $table->dropForeign(['id_professeur']);
            $table->dropColumn('id_professeur');
            $table->unsignedBigInteger('id_user')->after('date_publication');
            $table->foreign('id_user')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            $table->dropForeign(['id_user']);
            $table->dropColumn('id_user');
            $table->unsignedBigInteger('id_professeur');
            $table->foreign('id_professeur')->references('id_professeur')->on('professeurs')->cascadeOnDelete();
        });
    }
};
