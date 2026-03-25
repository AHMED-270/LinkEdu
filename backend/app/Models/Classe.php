<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';
    protected $primaryKey = 'id_classe';

    protected $fillable = [
        'nom',
        'niveau',
    ];

    public function etudiants(): HasMany
    {
        return $this->hasMany(Etudiant::class, 'id_classe', 'id_classe');
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'id_classe', 'id_classe');
    }

    public function devoirs(): HasMany
    {
        return $this->hasMany(Devoir::class, 'id_classe', 'id_classe');
    }

    public function enseignements(): HasMany
    {
        return $this->hasMany(Enseigner::class, 'id_classe', 'id_classe');
    }

    public function professeurs(): BelongsToMany
    {
        return $this->belongsToMany(Professeur::class, 'enseigner', 'id_classe', 'id_professeur')
            ->using(Enseigner::class)
            ->withPivot('id_matiere')
            ->withTimestamps();
    }

    public function matieres(): BelongsToMany
    {
        return $this->belongsToMany(Matiere::class, 'enseigner', 'id_classe', 'id_matiere')
            ->using(Enseigner::class)
            ->withPivot('id_professeur')
            ->withTimestamps();
    }
}
