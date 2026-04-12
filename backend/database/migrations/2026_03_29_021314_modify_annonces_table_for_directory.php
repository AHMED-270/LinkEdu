<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            if (Schema::hasColumn('annonces', 'id_professeur')) {
                // Ignore foreign key drop error for sqlite just in case
                try {
                    $table->dropForeign(['id_professeur']);
                } catch (\Exception $e) {}
                $table->dropColumn('id_professeur');
            }
            
            $table->string('type')->default('Info');
            $table->string('auteur')->default('Direction');
        });
    }

    public function down(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->dropColumn('auteur');
            $table->unsignedBigInteger('id_professeur')->nullable();
        });
    }
};
