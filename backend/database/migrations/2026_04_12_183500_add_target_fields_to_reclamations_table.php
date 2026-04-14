<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('reclamations')) {
            return;
        }

        Schema::table('reclamations', function (Blueprint $table) {
            if (Schema::hasColumn('reclamations', 'id_parent')) {
                // Keep legacy compatibility while allowing non-parent targets.
                $table->unsignedBigInteger('id_parent')->nullable()->change();
            }

            if (! Schema::hasColumn('reclamations', 'cible')) {
                $table->string('cible')->nullable()->after('statut');
                $table->index('cible');
            }

            if (! Schema::hasColumn('reclamations', 'id_professeur')) {
                $table->unsignedBigInteger('id_professeur')->nullable()->after('id_etudiant');
                $table->index('id_professeur');
                $table->foreign('id_professeur')
                    ->references('id_professeur')
                    ->on('professeurs')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('reclamations', 'id_secretaire')) {
                $table->unsignedBigInteger('id_secretaire')->nullable()->after('id_professeur');
                $table->index('id_secretaire');
                $table->foreign('id_secretaire')
                    ->references('id_secretaire')
                    ->on('secretaires')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('reclamations')) {
            return;
        }

        Schema::table('reclamations', function (Blueprint $table) {
            if (Schema::hasColumn('reclamations', 'id_secretaire')) {
                $table->dropForeign(['id_secretaire']);
                $table->dropIndex(['id_secretaire']);
                $table->dropColumn('id_secretaire');
            }

            if (Schema::hasColumn('reclamations', 'id_professeur')) {
                $table->dropForeign(['id_professeur']);
                $table->dropIndex(['id_professeur']);
                $table->dropColumn('id_professeur');
            }

            if (Schema::hasColumn('reclamations', 'cible')) {
                $table->dropIndex(['cible']);
                $table->dropColumn('cible');
            }

            if (Schema::hasColumn('reclamations', 'id_parent')) {
                $table->unsignedBigInteger('id_parent')->nullable(false)->change();
            }
        });
    }
};
