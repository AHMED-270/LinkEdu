<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Annonce extends Model
{
    use HasFactory;

    protected $table = 'annonces';
    protected $primaryKey = 'id_annonce';

    protected $fillable = [
        'titre',
        'contenu',
        'date_publication',
        'id_professeur',
    ];

    protected $casts = [
        'date_publication' => 'datetime',
    ];

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'id_professeur', 'id_professeur');
    }
}
