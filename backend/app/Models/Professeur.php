<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Professeur extends Model
{
    use HasFactory;

    protected $table = 'professeurs';
    protected $primaryKey = 'id_professeur';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_professeur',
        'specialite',
        'telephone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_professeur', 'id');
    }

    public function annonces(): HasMany
    {
        return $this->hasMany(Annonce::class, 'id_professeur', 'id_professeur');
    }

    public function ressources(): HasMany
    {
        return $this->hasMany(Ressource::class, 'id_professeur', 'id_professeur');
    }

    public function devoirs(): HasMany
    {
        return $this->hasMany(Devoir::class, 'id_professeur', 'id_professeur');
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class, 'id_professeur', 'id_professeur');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'id_professeur', 'id_professeur');
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'id_professeur', 'id_professeur');
    }

    public function enseignements(): HasMany
    {
        return $this->hasMany(Enseigner::class, 'id_professeur', 'id_professeur');
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'enseigner', 'id_professeur', 'id_classe')
            ->using(Enseigner::class)
            ->withPivot('id_matiere')
            ->withTimestamps();
    }

    public function matieres(): BelongsToMany
    {
        return $this->belongsToMany(Matiere::class, 'enseigner', 'id_professeur', 'id_matiere')
            ->using(Enseigner::class)
            ->withPivot('id_classe')
            ->withTimestamps();
    }
}