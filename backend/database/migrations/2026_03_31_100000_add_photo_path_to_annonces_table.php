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
            if (!Schema::hasColumn('annonces', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('contenu');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            if (Schema::hasColumn('annonces', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
        });
    }
};
