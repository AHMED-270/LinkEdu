<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Demande extends Model
{
    use HasFactory;

    protected $table = 'demandes';
    protected $primaryKey = 'id_demande';

    protected $fillable = [
        'type_demande',
        'message',
        'statut',
        'date_demande',
        'id_parent',
        'id_etudiant',
    ];

    protected $casts = [
        'date_demande' => 'datetime',
    ];

    public function parentEleve(): BelongsTo
    {
        return $this->belongsTo(ParentEleve::class, 'id_parent', 'id_parent');
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'id_etudiant', 'id_etudiant');
    }
}
