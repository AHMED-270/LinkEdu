<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Absence extends Model
{
    use HasFactory;

    protected $table = 'absences';
    protected $primaryKey = 'id_absence';

    protected $fillable = [
        'date_abs',
        'motif',
        'id_etudiant',
        'id_professeur',
    ];

    protected $casts = [
        'date_abs' => 'date',
    ];

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'id_etudiant', 'id_etudiant');
    }

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'id_professeur', 'id_professeur');
    }
}
