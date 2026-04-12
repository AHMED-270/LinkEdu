<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ressource extends Model
{
    use HasFactory;

    protected $table = 'ressources';
    protected $primaryKey = 'id_ressource';

    protected $fillable = [
        'fichier',
        'type_ressource',
        'id_professeur',
        'id_classe',
        'id_matiere',
    ];

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'id_professeur', 'id_professeur');
    }
}
