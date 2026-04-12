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
        'date_publication',
=========
        'cible',
        'date_publication',
        'id_user',
        'photo_path',
>>>>>>>>> Temporary merge branch 2
    ];

    protected $casts = [
        'date_publication' => 'datetime',
    ];
<<<<<<<<< Temporary merge branch 1
=========

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }
>>>>>>>>> Temporary merge branch 2
}
