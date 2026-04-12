<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('ressources', 'id_classe')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->foreignId('id_classe')
                    ->nullable()
                    ->after('id_professeur')
                    ->constrained('classes', 'id_classe')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('ressources', 'id_matiere')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->foreignId('id_matiere')
                    ->nullable()
                    ->after('id_classe')
                    ->constrained('matieres', 'id_matiere')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ressources', 'id_matiere')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->dropConstrainedForeignId('id_matiere');
            });
        }

        if (Schema::hasColumn('ressources', 'id_classe')) {
            Schema::table('ressources', function (Blueprint $table) {
                $table->dropConstrainedForeignId('id_classe');
            });
        }
    }
};
