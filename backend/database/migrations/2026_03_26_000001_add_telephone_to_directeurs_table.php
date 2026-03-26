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
        Schema::table('directeurs', function (Blueprint $table) {
            if (!Schema::hasColumn('directeurs', 'telephone')) {
                $table->string('telephone', 30)->nullable()->after('mandat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('directeurs', function (Blueprint $table) {
            if (Schema::hasColumn('directeurs', 'telephone')) {
                $table->dropColumn('telephone');
            }
        });
    }
};
