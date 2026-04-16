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
            // Check if column exists before performing operations
            if (Schema::hasColumn('annonces', 'id_professeur')) {
                if ($this->foreignKeyExists('annonces', 'annonces_id_professeur_foreign')) {
                    $table->dropForeign(['id_professeur']);
                }
                $table->dropColumn('id_professeur');
            }
            if (!Schema::hasColumn('annonces', 'id_user')) {
                $table->unsignedBigInteger('id_user')->after('date_publication')->nullable();
                $table->foreign('id_user')->references('id')->on('users')->cascadeOnDelete();
            }
        });
    }

    private function foreignKeyExists($table, $keyName): bool
    {
        $keyName = strtolower($keyName);
        $conn = Schema::connection(null)->getConnection();
        $tables = $conn->select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = ? AND CONSTRAINT_NAME = ?", [$table, $keyName]);
        return !empty($tables);
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
