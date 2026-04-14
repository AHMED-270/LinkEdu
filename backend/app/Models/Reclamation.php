<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Professeur;
use App\Models\Secretaire;

class Reclamation extends Model
{
    use HasFactory;

    protected $table = 'reclamations';
    protected $primaryKey = 'id_reclamation';

    protected $fillable = [
        'sujet',
        'message',
        'date_soumission',
        'date_envoi',
        'statut',
        'cible',
        'id_parent',
        'id_etudiant',
        'id_professeur',
        'id_secretaire',
    ];

    protected $casts = [
        'date_soumission' => 'datetime',
        'date_envoi' => 'datetime',
    ];

    public function parentEleve(): BelongsTo
    {
        return $this->belongsTo(ParentEleve::class, 'id_parent', 'id_parent');
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'id_etudiant', 'id_etudiant');
    }

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'id_professeur', 'id_professeur');
    }

    public function secretaire(): BelongsTo
    {
        return $this->belongsTo(Secretaire::class, 'id_secretaire', 'id_secretaire');
    }
}
