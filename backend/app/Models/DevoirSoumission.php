<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevoirSoumission extends Model
{
    use HasFactory;

    protected $table = 'devoir_soumissions';
    protected $primaryKey = 'id_soumission';

    protected $fillable = [
        'id_devoir',
        'id_etudiant',
        'fichier_path',
        'commentaire',
        'date_soumission',
        'statut',
    ];

    protected $casts = [
        'date_soumission' => 'datetime',
    ];

    public function devoir(): BelongsTo
    {
        return $this->belongsTo(Devoir::class, 'id_devoir', 'id_devoir');
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'id_etudiant', 'id_etudiant');
    }
}
