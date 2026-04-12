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
        if (!Schema::hasColumn('ressources', 'titre')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->string('titre')->nullable()->after('id_ressource');
            });
        }

        if (!Schema::hasColumn('ressources', 'description')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->text('description')->nullable()->after('titre');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('ressources', 'description')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }

        if (Schema::hasColumn('ressources', 'titre')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->dropColumn('titre');
            });
        }
    }
};
