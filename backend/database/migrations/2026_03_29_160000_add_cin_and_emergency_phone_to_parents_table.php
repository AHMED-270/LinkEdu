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
        Schema::table('parents', function (Blueprint $table) {
            if (! Schema::hasColumn('parents', 'cin')) {
                $table->string('cin', 30)->nullable()->after('telephone');
            }

            if (! Schema::hasColumn('parents', 'urgence_phone')) {
                $table->string('urgence_phone', 30)->nullable()->after('cin');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            if (Schema::hasColumn('parents', 'urgence_phone')) {
                $table->dropColumn('urgence_phone');
            }

            if (Schema::hasColumn('parents', 'cin')) {
                $table->dropColumn('cin');
            }
        });
    }
};
