<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiements';
    protected $primaryKey = 'id_paiement';

    protected $fillable = [
        'id_etudiant',
        'mois',
        'annee',
        'montant',
        'reste',
        'type',
        'statut',
        'date_paiement',
    ];

    protected $casts = [
        'mois' => 'integer',
        'annee' => 'integer',
        'montant' => 'decimal:2',
        'reste' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'id_etudiant', 'id_etudiant');
    }
}
