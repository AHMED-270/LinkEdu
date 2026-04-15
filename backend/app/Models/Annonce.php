<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    use HasFactory;

    protected $table = 'annonces';
    protected $primaryKey = 'id_annonce';

    protected $fillable = [
        'titre',
        'contenu',
        'cible',
        'statut',
        'id_user',
        'photo_path',
        'type',
        'auteur',
        'date_publication',
    ];

    protected $casts = [
        'date_publication' => 'datetime',
    ];
}
