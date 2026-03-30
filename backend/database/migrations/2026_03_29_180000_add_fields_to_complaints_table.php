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
        Schema::table('complaints', function (Blueprint $table) {
            if (! Schema::hasColumn('complaints', 'id_professeur')) {
                $table->unsignedBigInteger('id_professeur')->nullable()->after('id');
                $table->foreign('id_professeur')
                    ->references('id_professeur')
                    ->on('professeurs')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('complaints', 'subject')) {
                $table->string('subject')->nullable()->after('id_professeur');
            }

            if (! Schema::hasColumn('complaints', 'category')) {
                $table->string('category')->nullable()->after('subject');
            }

            if (! Schema::hasColumn('complaints', 'message')) {
                $table->text('message')->nullable()->after('category');
            }

            if (! Schema::hasColumn('complaints', 'status')) {
                $table->string('status')->default('en_attente')->after('message');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            if (Schema::hasColumn('complaints', 'id_professeur')) {
                $table->dropForeign(['id_professeur']);
            }

            $columns = ['id_professeur', 'subject', 'category', 'message', 'status'];
            $drop = array_values(array_filter($columns, fn (string $column) => Schema::hasColumn('complaints', $column)));

            if (! empty($drop)) {
                $table->dropColumn($drop);
            }
        });
    }
};
