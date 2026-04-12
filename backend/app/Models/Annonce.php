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
        'type',
        'auteur',
        'cible',
        'date_publication',
        'id_user',
        'photo_path',
    ];

    protected $casts = [
        'date_publication' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }
}
