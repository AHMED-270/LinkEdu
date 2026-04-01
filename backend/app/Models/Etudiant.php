<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Etudiant extends Model
{
    use HasFactory;

    protected $table = 'etudiants';
    protected $primaryKey = 'id_etudiant';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_etudiant',
        'matricule',
        'id_classe',
        'id_parent',
        'date_naissance',
        'genre',
        'adresse',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_etudiant', 'id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'id_classe', 'id_classe');
    }

    public function parentEleve(): BelongsTo
    {
        return $this->belongsTo(ParentEleve::class, 'id_parent', 'id_parent');
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class, 'id_etudiant', 'id_etudiant');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'id_etudiant', 'id_etudiant');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class, 'id_etudiant', 'id_etudiant');
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'id_etudiant', 'id_etudiant');
    }
}
