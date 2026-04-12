<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Matiere extends Model
{
    use HasFactory;

    protected $table = 'matieres';
    protected $primaryKey = 'id_matiere';

    protected $fillable = [
        'nom',
        'niveau',
        'coefficient',
        'coefficients_by_level',
        'coefficients_by_niveau_code',
        'lycee_niveau_code',
        'lycee_filiere',
    ];

    protected $casts = [
        'coefficients_by_level' => 'array',
        'coefficients_by_niveau_code' => 'array',
    ];

    public function lecons(): HasMany
    {
        return $this->hasMany(Lecon::class, 'id_matiere', 'id_matiere');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'id_matiere', 'id_matiere');
    }

    public function devoirs(): HasMany
    {
        return $this->hasMany(Devoir::class, 'id_matiere', 'id_matiere');
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'id_matiere', 'id_matiere');
    }

    public function enseignements(): HasMany
    {
        return $this->hasMany(Enseigner::class, 'id_matiere', 'id_matiere');
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'enseigner', 'id_matiere', 'id_classe')
            ->using(Enseigner::class)
            ->withPivot('id_professeur')
            ->withTimestamps();
    }

    public function professeurs(): BelongsToMany
    {
        return $this->belongsToMany(Professeur::class, 'enseigner', 'id_matiere', 'id_professeur')
            ->using(Enseigner::class)
            ->withPivot('id_classe')
            ->withTimestamps();
    }
}
