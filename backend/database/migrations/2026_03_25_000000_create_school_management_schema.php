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
        Schema::table('users', function (Blueprint $table) {
            $table->string('nom')->nullable()->after('id');
            $table->string('prenom')->nullable()->after('nom');
            $table->string('role')->nullable()->after('email');
        });

        Schema::create('professeurs', function (Blueprint $table) {
            $table->unsignedBigInteger('id_professeur')->primary();
            $table->string('specialite');
            $table->timestamps();

            $table->foreign('id_professeur')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::create('secretaires', function (Blueprint $table) {
            $table->unsignedBigInteger('id_secretaire')->primary();
            $table->string('departement');
            $table->timestamps();

            $table->foreign('id_secretaire')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::create('directeurs', function (Blueprint $table) {
            $table->unsignedBigInteger('id_directeur')->primary();
            $table->string('mandat')->nullable();
            $table->timestamps();

            $table->foreign('id_directeur')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::create('admin_ecoles', function (Blueprint $table) {
            $table->unsignedBigInteger('id_admin')->primary();
            $table->string('permissions')->nullable();
            $table->timestamps();

            $table->foreign('id_admin')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::create('parents', function (Blueprint $table) {
            $table->unsignedBigInteger('id_parent')->primary();
            $table->string('telephone')->nullable();
            $table->timestamps();

            $table->foreign('id_parent')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id('id_classe');
            $table->string('nom');
            $table->string('niveau');
            $table->timestamps();
        });

        Schema::create('matieres', function (Blueprint $table) {
            $table->id('id_matiere');
            $table->string('nom');
            $table->integer('coefficient')->default(1);
            $table->timestamps();
        });

        Schema::create('etudiants', function (Blueprint $table) {
            $table->unsignedBigInteger('id_etudiant')->primary();
            $table->string('matricule')->unique();
            $table->unsignedBigInteger('id_classe')->nullable();
            $table->unsignedBigInteger('id_parent')->nullable();
            $table->timestamps();

            $table->foreign('id_etudiant')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->foreign('id_classe')
                ->references('id_classe')
                ->on('classes')
                ->nullOnDelete();
            $table->foreign('id_parent')
                ->references('id_parent')
                ->on('parents')
                ->nullOnDelete();
        });

        Schema::create('lecons', function (Blueprint $table) {
            $table->id('id_lecon');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('id_matiere');
            $table->timestamps();

            $table->foreign('id_matiere')
                ->references('id_matiere')
                ->on('matieres')
                ->cascadeOnDelete();
        });

        Schema::create('enseigner', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_professeur');
            $table->unsignedBigInteger('id_classe');
            $table->unsignedBigInteger('id_matiere');
            $table->timestamps();

            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
            $table->foreign('id_classe')
                ->references('id_classe')
                ->on('classes')
                ->cascadeOnDelete();
            $table->foreign('id_matiere')
                ->references('id_matiere')
                ->on('matieres')
                ->cascadeOnDelete();

            $table->unique(['id_professeur', 'id_classe', 'id_matiere'], 'uniq_enseigner_assignment');
        });

        Schema::create('emploi_du_temps', function (Blueprint $table) {
            $table->id('id_edt');
            $table->string('jour');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->unsignedBigInteger('id_classe');
            $table->unsignedBigInteger('id_matiere');
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_classe')
                ->references('id_classe')
                ->on('classes')
                ->cascadeOnDelete();
            $table->foreign('id_matiere')
                ->references('id_matiere')
                ->on('matieres')
                ->cascadeOnDelete();
            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
        });

        Schema::create('annonces', function (Blueprint $table) {
            $table->id('id_annonce');
            $table->string('titre');
            $table->text('contenu');
            $table->dateTime('date_publication')->nullable();
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
        });

        Schema::create('ressources', function (Blueprint $table) {
            $table->id('id_ressource');
            $table->string('fichier');
            $table->string('type_ressource');
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
        });

        Schema::create('devoirs', function (Blueprint $table) {
            $table->id('id_devoir');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->date('date_limite');
            $table->unsignedBigInteger('id_professeur');
            $table->unsignedBigInteger('id_classe');
            $table->unsignedBigInteger('id_matiere');
            $table->timestamps();

            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
            $table->foreign('id_classe')
                ->references('id_classe')
                ->on('classes')
                ->cascadeOnDelete();
            $table->foreign('id_matiere')
                ->references('id_matiere')
                ->on('matieres')
                ->cascadeOnDelete();
        });

        Schema::create('absences', function (Blueprint $table) {
            $table->id('id_absence');
            $table->date('date_abs');
            $table->text('motif')->nullable();
            $table->unsignedBigInteger('id_etudiant');
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_etudiant')
                ->references('id_etudiant')
                ->on('etudiants')
                ->cascadeOnDelete();
            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
        });

        Schema::create('notes', function (Blueprint $table) {
            $table->id('id_note');
            $table->float('valeur');
            $table->text('appreciation')->nullable();
            $table->unsignedBigInteger('id_etudiant');
            $table->unsignedBigInteger('id_matiere');
            $table->unsignedBigInteger('id_professeur');
            $table->timestamps();

            $table->foreign('id_etudiant')
                ->references('id_etudiant')
                ->on('etudiants')
                ->cascadeOnDelete();
            $table->foreign('id_matiere')
                ->references('id_matiere')
                ->on('matieres')
                ->cascadeOnDelete();
            $table->foreign('id_professeur')
                ->references('id_professeur')
                ->on('professeurs')
                ->cascadeOnDelete();
        });

        Schema::create('reclamations', function (Blueprint $table) {
            $table->id('id_reclamation');
            $table->string('sujet');
            $table->text('message');
            $table->dateTime('date_soumission');
            $table->string('statut')->default('en_attente');
            $table->unsignedBigInteger('id_parent');
            $table->timestamps();

            $table->foreign('id_parent')
                ->references('id_parent')
                ->on('parents')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reclamations');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('absences');
        Schema::dropIfExists('devoirs');
        Schema::dropIfExists('ressources');
        Schema::dropIfExists('annonces');
        Schema::dropIfExists('emploi_du_temps');
        Schema::dropIfExists('enseigner');
        Schema::dropIfExists('lecons');
        Schema::dropIfExists('etudiants');
        Schema::dropIfExists('matieres');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('admin_ecoles');
        Schema::dropIfExists('directeurs');
        Schema::dropIfExists('secretaires');
        Schema::dropIfExists('professeurs');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nom', 'prenom', 'role']);
        });
    }
};
