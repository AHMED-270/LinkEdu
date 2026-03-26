<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lecon extends Model
{
    use HasFactory;

    protected $table = 'lecons';
    protected $primaryKey = 'id_lecon';

    protected $fillable = [
        'titre',
        'description',
        'id_matiere',
    ];

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class, 'id_matiere', 'id_matiere');
    }
}
