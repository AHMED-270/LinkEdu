<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Devoir extends Model
{
    use HasFactory;

    protected $table = 'devoirs';
    protected $primaryKey = 'id_devoir';

    protected $fillable = [
        'titre',
        'description',
        'date_limite',
        'id_professeur',
        'id_classe',
        'id_matiere',
    ];

    protected $casts = [
        'date_limite' => 'date',
    ];

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'id_professeur', 'id_professeur');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'id_classe', 'id_classe');
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class, 'id_matiere', 'id_matiere');
    }
}
