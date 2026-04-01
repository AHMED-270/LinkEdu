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
        if (Schema::hasTable('classes')) {
            Schema::table('classes', function (Blueprint $table) {
                if (!Schema::hasColumn('classes', 'filiere')) {
                    $table->string('filiere')->nullable()->default('General'); // General, Sciences, Lettres, etc.
                }
                if (!Schema::hasColumn('classes', 'pricing')) {
                    $table->decimal('pricing', 8, 2)->nullable()->default(0); // In Moroccan Dirhams
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('classes')) {
            Schema::table('classes', function (Blueprint $table) {
                if (Schema::hasColumn('classes', 'filiere')) {
                    $table->dropColumn('filiere');
                }
                if (Schema::hasColumn('classes', 'pricing')) {
                    $table->dropColumn('pricing');
                }
            });
        }
    }
};
